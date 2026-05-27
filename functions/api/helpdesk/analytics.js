import { requireAuth } from "../../_lib/auth.js";
import { accountIndexName, accountTableName, withAccountContext } from "../../_lib/accounts.js";
import { errorResponse, json, methodNotAllowed, serverErrorResponse } from "../../_lib/http.js";
import { getHelpDeskDashboard, helpdeskRequest } from "../../_lib/helpdesk.js";

const STATUSES = ["open", "pending", "onhold", "solved", "closed"];
const PAGE_SIZE = 25;
const MAX_PAGES_PER_RANGE = 20;
const DAILY_TABLE_BASE = "helpdesk_analytics_daily_v4";
const OBSOLETE_ANALYTICS_TABLES = [
  "helpdesk_analytics_daily",
  "helpdesk_analytics_daily_fetches",
  "helpdesk_analytics_agent_fetches",
  "helpdesk_analytics_daily_v2",
  "helpdesk_analytics_daily_fetches_v2",
  "helpdesk_analytics_agent_fetches_v2",
  "helpdesk_analytics_daily_v3",
  "helpdesk_analytics_handled_tickets_v3",
  "helpdesk_analytics_daily_fetches_v3",
  "helpdesk_analytics_agent_fetches_v3",
  "helpdesk_analytics_agent_fetches_v4",
  "helpdesk_analytics_daily_fetches_v4",
  "helpdesk_analytics_handled_tickets_v4",
];

function isValidDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function parseDateParam(value, name) {
  if (!value) throw new Error(`Missing required param: ${name}`);
  const date = new Date(value);
  if (!isValidDate(date)) throw new Error(`Invalid date format for ${name}`);
  return date;
}

function splitParam(value) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function dateKey(date, timezoneOffsetMinutes = 0) {
  return new Date(date.getTime() - timezoneOffsetMinutes * 60000).toISOString().slice(0, 10);
}

function normalizeTicketList(payload) {
  return Array.isArray(payload) ? payload : payload?.tickets || payload?.data || payload?.items || [];
}

function normalizeTicketId(ticket) {
  return String(ticket.ID || ticket.id || "");
}

function normalizeTicketShortId(ticket) {
  return String(ticket.shortID || ticket.shortId || ticket.short_id || normalizeTicketId(ticket));
}

function normalizeEventDate(event) {
  const value = event.date || event.createdAt || event.timestamp || event.created_at;
  const date = value ? new Date(value) : null;
  return isValidDate(date) ? date : null;
}

function buildAgentDirectory(dashboard) {
  return new Map(
    (dashboard.agents || []).map((agent) => [
      String(agent.id),
      {
        id: String(agent.id),
        email: agent.email || "",
        name: agent.name || agent.email || String(agent.id),
        teamIDs: (agent.teamIDs || agent.teams?.map((team) => team.id) || []).map(String),
      },
    ]),
  );
}

function teamIdsForAgent(agentId, agentDirectory) {
  return (agentDirectory.get(String(agentId))?.teamIDs || []).map(String);
}

function matchesFilters(agentId, filters, agentDirectory) {
  const normalizedAgentId = String(agentId);
  if (filters.excludeAgentIds.includes(normalizedAgentId)) return false;
  if (filters.agentIds.length && !filters.agentIds.includes(normalizedAgentId)) return false;
  if (filters.groupIds.length) {
    const teamIds = teamIdsForAgent(normalizedAgentId, agentDirectory);
    if (!teamIds.some((teamId) => filters.groupIds.includes(String(teamId)))) return false;
  }
  return true;
}

function authorProfile(event, agentDirectory) {
  const author = event.author || event.createdBy || {};
  const id =
    (typeof author === "string" ? author : author.ID || author.id || author.agentID || author.agentId) ||
    event.agentID ||
    event.agentId ||
    event.authorID ||
    event.authorId ||
    event.createdByID ||
    event.createdById ||
    "";
  const agentId = String(id || "");
  const profile = agentDirectory.get(agentId) || {};
  return {
    id: agentId,
    name: author.name || author.fullName || event.agentName || event.authorName || profile.name || agentId,
    email: author.email || event.agentEmail || event.authorEmail || profile.email || "",
  };
}

function eventAuthorType(event) {
  const author = event.author || event.createdBy || {};
  return `${author.type || event.authorType || event.createdByType || author.role || ""}`.toLowerCase();
}

function isMessageEvent(event) {
  const type = `${event.type || event.eventType || ""}`.toLowerCase();
  const hasMessagePayload = Boolean(event.message || event.text || event.content || event.richTextHtml || event.richTextObj);
  return type === "message" || type === "tickets.events.message" || hasMessagePayload;
}

function stripHtml(value) {
  return `${value || ""}`.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function eventMessageText(event) {
  const message = event.message || event.content || {};
  if (typeof message === "string") return stripHtml(message);
  return stripHtml(message.text || message.plainText || event.text || message.html || event.richTextHtml || event.html || "");
}

function isPublicAgentMessageEvent(event) {
  return isMessageEvent(event) && !Boolean(event.isPrivate || event.private) && eventAuthorType(event) === "agent" && Boolean(eventMessageText(event));
}

function isConversationTranscriptEvent(event) {
  const text = eventMessageText(event).toLowerCase();
  return text.includes("conversation transcript:") || text.includes("conversation trancript:");
}

function publicMessageEvents(ticket) {
  return (Array.isArray(ticket.events) ? ticket.events : [])
    .filter((event) => isMessageEvent(event) && !Boolean(event.isPrivate || event.private) && eventMessageText(event))
    .sort((left, right) => {
      const leftDate = normalizeEventDate(left)?.getTime() || 0;
      const rightDate = normalizeEventDate(right)?.getTime() || 0;
      return leftDate - rightDate;
    });
}

function analyticsAgentMessageEvents(ticket) {
  return publicMessageEvents(ticket).filter((event) => isPublicAgentMessageEvent(event) && !isConversationTranscriptEvent(event));
}

function dailyTable(env) {
  return accountTableName(env, DAILY_TABLE_BASE);
}

async function ensureHelpDeskAnalyticsCache(env) {
  if (!env?.DB) throw new Error("Missing DB binding.");
  const table = dailyTable(env);

  if (table === DAILY_TABLE_BASE) {
    await env.DB.batch(OBSOLETE_ANALYTICS_TABLES.map((obsoleteTable) => env.DB.prepare(`DROP TABLE IF EXISTS ${obsoleteTable}`)));
  }

  await env.DB
    .prepare(
      `CREATE TABLE IF NOT EXISTS ${table} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        agent_name TEXT,
        agent_email TEXT,
        handled_tickets INTEGER NOT NULL DEFAULT 0,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, agent_id)
      )`,
    )
    .run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${accountIndexName(env, `idx_${DAILY_TABLE_BASE}_date`)} ON ${table}(date)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${accountIndexName(env, `idx_${DAILY_TABLE_BASE}_agent`)} ON ${table}(agent_id)`).run();
}

async function readCachedDay(env, date) {
  const table = dailyTable(env);
  const { results } = await env.DB.prepare(
    `SELECT date, agent_id, agent_name, agent_email, handled_tickets
     FROM ${table}
     WHERE date = ?
     ORDER BY handled_tickets DESC`,
  )
    .bind(date)
    .all();
  return results?.length ? results : null;
}

async function hasCachedDay(env, date) {
  return Boolean(await env.DB.prepare(`SELECT date FROM ${dailyTable(env)} WHERE date = ? LIMIT 1`).bind(date).first());
}

async function resetCachedDay(env, date) {
  await env.DB.prepare(`DELETE FROM ${dailyTable(env)} WHERE date = ?`).bind(date).run();
}

async function runBatches(db, statements, size = 80) {
  if (!statements.length) return;
  for (let index = 0; index < statements.length; index += size) {
    await db.batch(statements.slice(index, index + size));
  }
}

function summarizeDailyRows(date, detailRows) {
  const byAgent = new Map();

  for (const row of detailRows || []) {
    const agentId = String(row.agent_id || "");
    if (!agentId) continue;
    const current = byAgent.get(agentId) || {
      date,
      agent_id: agentId,
      agent_name: row.agent_name || agentId,
      agent_email: row.agent_email || "",
      handled_tickets: 0,
    };
    current.handled_tickets += 1;
    if (!current.agent_name && row.agent_name) current.agent_name = row.agent_name;
    if (!current.agent_email && row.agent_email) current.agent_email = row.agent_email;
    byAgent.set(agentId, current);
  }

  return Array.from(byAgent.values());
}

async function writeCachedDay(env, date, detailRows, { markFetched = true } = {}) {
  const table = dailyTable(env);
  const dailyRows = summarizeDailyRows(date, detailRows);

  if (markFetched) {
    await resetCachedDay(env, date);
  }

  await runBatches(
    env.DB,
    dailyRows.map((row) =>
      env.DB.prepare(
        `INSERT INTO ${table}
          (date, agent_id, agent_name, agent_email, handled_tickets, cached_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(date, agent_id) DO UPDATE SET
          agent_name = COALESCE(NULLIF(excluded.agent_name, ''), ${table}.agent_name),
          agent_email = COALESCE(NULLIF(excluded.agent_email, ''), ${table}.agent_email),
          handled_tickets = ${table}.handled_tickets + excluded.handled_tickets,
          cached_at = CURRENT_TIMESTAMP`,
      ).bind(
        row.date,
        row.agent_id,
        row.agent_name,
        row.agent_email,
        row.handled_tickets,
      ),
    ),
  );

  const { results } = await env.DB.prepare(
    `SELECT date, agent_id, agent_name, agent_email, handled_tickets
     FROM ${table}
     WHERE date = ?
     ORDER BY handled_tickets DESC`,
  )
    .bind(date)
    .all();
  return results || [];
}

async function finalizeCachedDay(env, date) {
  await env.DB.prepare(`UPDATE ${dailyTable(env)} SET cached_at = CURRENT_TIMESTAMP WHERE date = ?`).bind(date).run();
}

function filterRows(rows, filters, agentDirectory = new Map()) {
  return rows.filter((row) => matchesFilters(row.agent_id, filters, agentDirectory));
}

async function listTicketsForRange(env, from, to) {
  const ticketsById = new Map();
  let pageBudget = MAX_PAGES_PER_RANGE;

  for (const status of STATUSES) {
    if (pageBudget <= 0) {
      throw new Error("Too many tickets for this time slice. Retry with a smaller range.");
    }
    let nextCursor = null;
    let page = 0;
    do {
      const params = new URLSearchParams({
        pageSize: String(PAGE_SIZE),
        order: "asc",
        sortBy: "updatedAt",
        status,
        updatedDateFrom: from.toISOString(),
        updatedDateTo: to.toISOString(),
      });
      if (nextCursor) {
        params.set("next.value", nextCursor.value);
        params.set("next.ID", nextCursor.id);
      }

      const payload = await helpdeskRequest(env, `/tickets?${params.toString()}`, { method: "GET" });
      const tickets = normalizeTicketList(payload);

      for (const ticket of tickets) {
        const updatedValue = ticket.updatedAt || ticket.updated_at || ticket.lastMessageAt;
        const updatedDate = updatedValue ? new Date(updatedValue) : null;
        if (!updatedDate || updatedDate < from || updatedDate >= to) continue;
        const id = normalizeTicketId(ticket);
        if (id) ticketsById.set(id, ticket);
      }

      const lastTicket = tickets[tickets.length - 1];
      const lastId = lastTicket ? normalizeTicketId(lastTicket) : "";
      const lastValue = lastTicket?.updatedAt || lastTicket?.updated_at || lastTicket?.lastMessageAt;
      const lastDate = lastValue ? new Date(lastValue) : null;
      const rangeComplete = lastDate && isValidDate(lastDate) && lastDate >= to;
      nextCursor = !rangeComplete && tickets.length === PAGE_SIZE && lastId && lastValue ? { id: lastId, value: lastValue } : null;
      page += 1;
      pageBudget -= 1;
    } while (nextCursor && pageBudget > 0);

    if (nextCursor) {
      throw new Error("Too many tickets for this time slice. Retry with a smaller range.");
    }
  }

  return Array.from(ticketsById.values());
}

async function computeDay(env, from, to, timezoneOffsetMinutes, agentDirectory) {
  const tickets = await listTicketsForRange(env, from, to);
  const handled = [];

  for (const ticket of tickets) {
    const shortId = normalizeTicketShortId(ticket);
    const events = analyticsAgentMessageEvents(ticket);

    for (const event of events) {
      const eventDate = normalizeEventDate(event);
      if (!eventDate || eventDate < from || eventDate >= to) continue;

      const agent = authorProfile(event, agentDirectory);
      if (!agent.id) continue;

      const localDay = dateKey(eventDate, timezoneOffsetMinutes);
      handled.push({
        date: localDay,
        agent_id: agent.id,
        agent_name: agent.name || agent.id,
        agent_email: agent.email || "",
        short_id: shortId,
        event_date: eventDate.toISOString(),
      });
    }
  }

  return handled.sort((left, right) => {
    const agentOrder = left.agent_name.localeCompare(right.agent_name);
    return agentOrder || left.short_id.localeCompare(right.short_id) || left.event_date.localeCompare(right.event_date);
  });
}

function rowsToResponse(rows, from, to, agentDirectory, cache = {}) {
  const agents = rows
    .map((row) => {
      const profile = agentDirectory.get(String(row.agent_id)) || {};
      const agentId = String(row.agent_id);
      return {
        agent_id: agentId,
        id: agentId,
        name: row.agent_name || profile.name || String(row.agent_id),
        email: row.agent_email || profile.email || String(row.agent_id),
        total_tickets: Number(row.handled_tickets || 0),
        days: [{ date: row.date, tickets: Number(row.handled_tickets || 0) }],
      };
    })
    .sort((left, right) => right.total_tickets - left.total_tickets);

  const totalTickets = agents.reduce((sum, agent) => sum + agent.total_tickets, 0);
  const timelineByDate = new Map();
  for (const row of rows) {
    if (!timelineByDate.has(row.date)) timelineByDate.set(row.date, { date: row.date, tickets: 0 });
    timelineByDate.get(row.date).tickets += Number(row.handled_tickets || 0);
  }

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    summary: {
      total_tickets: totalTickets,
      active_agents: agents.filter((agent) => agent.total_tickets > 0).length,
      prev_period: { total_tickets: 0, active_agents: 0 },
    },
    agents,
    timeline: Array.from(timelineByDate.values()).sort((left, right) => left.date.localeCompare(right.date)),
    cache,
    capabilities: {
      per_agent_period_metrics: true,
      per_agent_daily_metrics: true,
      account_daily_timeline: true,
      cached_past_days: true,
      source: "ticket_public_agent_message_events_by_short_id",
    },
  };
}

function splitRangeByLocalDay(from, to, timezoneOffsetMinutes) {
  const ranges = [];
  let cursor = new Date(from);

  while (cursor < to) {
    const localDate = dateKey(cursor, timezoneOffsetMinutes);
    const nextLocalMidnight = new Date(`${localDate}T00:00:00.000Z`);
    nextLocalMidnight.setUTCDate(nextLocalMidnight.getUTCDate() + 1);
    const nextBoundary = new Date(nextLocalMidnight.getTime() + timezoneOffsetMinutes * 60000);
    const rangeTo = new Date(Math.min(nextBoundary.getTime(), to.getTime()));
    ranges.push({ from: cursor, to: rangeTo, date: localDate });
    cursor = rangeTo;
  }

  return ranges;
}

export async function syncHelpDeskAnalyticsWindow(env, { from, to, timezoneOffsetMinutes = 0 } = {}) {
  if (!env?.DB) throw new Error("Missing DB binding.");
  if (!isValidDate(from) || !isValidDate(to) || to <= from) throw new Error("Invalid sync window.");

  await ensureHelpDeskAnalyticsCache(env);
  const dashboard = await getHelpDeskDashboard(env);
  const agentDirectory = buildAgentDirectory(dashboard);
  const affectedDates = new Set();
  let detailRows = 0;

  for (const range of splitRangeByLocalDay(from, to, timezoneOffsetMinutes)) {
    if (!affectedDates.has(range.date)) {
      await resetCachedDay(env, range.date);
    }
    const importedDetails = await computeDay(env, range.from, range.to, timezoneOffsetMinutes, agentDirectory);
    await writeCachedDay(env, range.date, importedDetails, { markFetched: false });
    affectedDates.add(range.date);
    detailRows += importedDetails.length;
  }

  for (const date of affectedDates) {
    await finalizeCachedDay(env, date);
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    dates: Array.from(affectedDates),
    detail_rows: detailRows,
  };
}

export async function onRequest(context) {
  if (context.request.method !== "GET") return methodNotAllowed(["GET"]);

  const auth = await requireAuth(context);
  if (auth.error) return auth.error;
  context = withAccountContext(context);

  try {
    await ensureHelpDeskAnalyticsCache(context.env);

    const url = new URL(context.request.url);
    const from = parseDateParam(url.searchParams.get("from"), "from");
    const to = parseDateParam(url.searchParams.get("to"), "to");
    if (to <= from) return errorResponse("to must be after from", 400);

    const timezoneOffsetMinutes = Number(url.searchParams.get("tz_offset") || 0);
    if (!Number.isFinite(timezoneOffsetMinutes)) return errorResponse("Invalid timezone offset", 400);

    const localDate = dateKey(from, timezoneOffsetMinutes);
    const shouldImport = url.searchParams.get("import") === "1";
    const shouldResetDate = url.searchParams.get("reset_date") === "1";
    const shouldFinalizeDate = url.searchParams.get("finalize_date") === "1";
    const isFullDayCacheWrite = url.searchParams.get("cache_full_day") === "1";
    const filters = {
      agentIds: splitParam(url.searchParams.get("agents")),
      excludeAgentIds: splitParam(url.searchParams.get("exclude_agents")),
      groupIds: splitParam(url.searchParams.get("groups")),
    };

    const dashboard = await getHelpDeskDashboard(context.env);
    const agentDirectory = buildAgentDirectory(dashboard);
    const cachedRows = shouldImport || shouldFinalizeDate ? null : await readCachedDay(context.env, localDate);
    const cacheMeta = {
      date: localDate,
      checked: true,
      hit: Boolean(cachedRows),
      source: cachedRows ? "d1" : "d1_missing",
      missing: !cachedRows,
      saved: false,
    };

    let rows = cachedRows ? filterRows(cachedRows, filters, agentDirectory) : [];

    if (shouldFinalizeDate) {
      await finalizeCachedDay(context.env, localDate);
      const finalizedRows = await readCachedDay(context.env, localDate);
      rows = filterRows(finalizedRows || [], filters, agentDirectory);
      cacheMeta.hit = true;
      cacheMeta.missing = false;
      cacheMeta.saved = true;
      cacheMeta.source = "helpdesk_import_finalized";
    } else if (shouldImport) {
      if (shouldResetDate) await resetCachedDay(context.env, localDate);
      const importedDetails = await computeDay(context.env, from, to, timezoneOffsetMinutes, agentDirectory);
      const summaryRows = await writeCachedDay(context.env, localDate, importedDetails, { markFetched: isFullDayCacheWrite });
      rows = filterRows(summaryRows, filters, agentDirectory);
      cacheMeta.hit = false;
      cacheMeta.missing = !isFullDayCacheWrite;
      cacheMeta.saved = true;
      cacheMeta.source = isFullDayCacheWrite ? "helpdesk_import_saved" : "helpdesk_import_partial_saved";
    } else if (!cachedRows && (await hasCachedDay(context.env, localDate))) {
      cacheMeta.hit = true;
      cacheMeta.missing = false;
      cacheMeta.source = "d1_empty";
    }

    return json(rowsToResponse(rows, from, to, agentDirectory, cacheMeta));
  } catch (error) {
    const message = error.message || "";
    if (/too many requests|rate limit/i.test(message)) {
      console.error("HelpDesk analytics rate limited.", error);
      return errorResponse("HelpDesk analytics is rate limited. Try again later.", 429);
    }

    return serverErrorResponse(error, "Failed to load HelpDesk analytics.");
  }
}
