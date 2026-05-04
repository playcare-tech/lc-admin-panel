import { requireAuth } from "../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed, serverErrorResponse } from "../../_lib/http.js";
import { getHelpDeskDashboard, helpdeskRequest } from "../../_lib/helpdesk.js";

const STATUSES = ["open", "pending", "onhold", "solved", "closed"];
const PAGE_SIZE = 100;
const MAX_PAGES_PER_RANGE = 8;
const DAILY_TABLE = "helpdesk_analytics_daily_v4";
const DETAIL_TABLE = "helpdesk_analytics_handled_tickets_v4";
const DAILY_FETCH_TABLE = "helpdesk_analytics_daily_fetches_v4";

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

function normalizeDateString(value) {
  const date = value ? new Date(value) : null;
  return isValidDate(date) ? date.toISOString() : "";
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

function isPublicAgentMessageEvent(event) {
  return isMessageEvent(event) && !Boolean(event.isPrivate || event.private) && eventAuthorType(event) === "agent";
}

function isPublicIncomingMessageEvent(event) {
  const authorType = eventAuthorType(event);
  return (
    isMessageEvent(event) &&
    !Boolean(event.isPrivate || event.private) &&
    !["agent", "system"].includes(authorType)
  );
}

function eventMessageParts(event) {
  const message = event.message || event.text || event.content || {};
  if (typeof message === "string") return { text: message, html: "" };
  return {
    text: message.text || message.plainText || event.text || "",
    html: message.html || event.richTextHtml || event.html || "",
  };
}

function eventStatusValue(event) {
  const status =
    event.status ||
    event.newStatus ||
    event.value ||
    event.to ||
    event.data?.status ||
    event.payload?.status ||
    event.changes?.status?.to ||
    "";
  if (typeof status === "string") return status.toLowerCase();
  return `${status.value || status.name || status.status || ""}`.toLowerCase();
}

function statusReachedAt(ticket, status) {
  const directFields = {
    solved: [ticket.solvedAt, ticket.solved_at, ticket.solvedDate, ticket.solved_date],
    closed: [ticket.closedAt, ticket.closed_at, ticket.closedDate, ticket.closed_date],
  };
  const direct = (directFields[status] || []).map(normalizeDateString).find(Boolean);
  if (direct) return direct;

  return (ticket.events || [])
    .filter((event) => eventStatusValue(event) === status)
    .map(normalizeEventDate)
    .filter(Boolean)
    .sort((left, right) => left.getTime() - right.getTime())[0]
    ?.toISOString() || "";
}

function ticketLink(ticket, shortId) {
  return (
    ticket.url ||
    ticket.webUrl ||
    ticket.ticketUrl ||
    ticket.ticketURL ||
    ticket.link ||
    `https://app.helpdesk.com/tickets/${encodeURIComponent(shortId)}`
  );
}

function normalizeConversationEvents(ticket, agentDirectory) {
  return (ticket.events || [])
    .map((event) => {
      const date = normalizeEventDate(event);
      const author = authorProfile(event, agentDirectory);
      const authorType = eventAuthorType(event) || "system";
      const message = eventMessageParts(event);
      return {
        date: date ? date.toISOString() : "",
        type: event.type || event.eventType || "",
        author_type: authorType,
        author_id: author.id,
        author_name: author.name || authorType,
        author_email: author.email,
        is_private: Boolean(event.isPrivate || event.private),
        status: eventStatusValue(event),
        text: message.text,
        html: message.html,
      };
    })
    .sort((left, right) => left.date.localeCompare(right.date));
}

async function ensureHelpDeskAnalyticsCache(db) {
  if (!db) throw new Error("Missing DB binding.");

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS ${DAILY_TABLE} (
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
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_${DAILY_TABLE}_date ON ${DAILY_TABLE}(date)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_${DAILY_TABLE}_agent ON ${DAILY_TABLE}(agent_id)`).run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS ${DETAIL_TABLE} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        agent_name TEXT,
        agent_email TEXT,
        ticket_id TEXT,
        short_id TEXT NOT NULL,
        ticket_link TEXT,
        subject TEXT,
        agent_reply_count INTEGER NOT NULL DEFAULT 0,
        incoming_message_count INTEGER NOT NULL DEFAULT 0,
        ticket_created_at TEXT,
        ticket_solved_at TEXT,
        ticket_closed_at TEXT,
        last_public_reply_at TEXT NOT NULL,
        conversation_json TEXT,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, agent_id, short_id)
      )`,
    )
    .run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_${DETAIL_TABLE}_date ON ${DETAIL_TABLE}(date)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_${DETAIL_TABLE}_agent ON ${DETAIL_TABLE}(agent_id)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_${DETAIL_TABLE}_short ON ${DETAIL_TABLE}(short_id)`).run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS ${DAILY_FETCH_TABLE} (
        date TEXT PRIMARY KEY,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    )
    .run();
}

async function readCachedDay(env, date) {
  const fetchRecord = await env.DB.prepare(`SELECT date FROM ${DAILY_FETCH_TABLE} WHERE date = ?`).bind(date).first();
  if (!fetchRecord) return null;
  const { results } = await env.DB.prepare(
    `SELECT date, agent_id, agent_name, agent_email, handled_tickets
     FROM ${DAILY_TABLE}
     WHERE date = ?
     ORDER BY handled_tickets DESC`,
  )
    .bind(date)
    .all();
  return results || [];
}

async function readCachedDetails(env, date) {
  const { results } = await env.DB.prepare(
    `SELECT
      date,
      agent_id,
      agent_name,
      agent_email,
      ticket_id,
      short_id,
      ticket_link,
      subject,
      agent_reply_count,
      incoming_message_count,
      ticket_created_at,
      ticket_solved_at,
      ticket_closed_at,
      last_public_reply_at
     FROM ${DETAIL_TABLE}
     WHERE date = ?
     ORDER BY last_public_reply_at DESC`,
  )
    .bind(date)
    .all();
  return results || [];
}

async function hasCachedDay(env, date) {
  return Boolean(await env.DB.prepare(`SELECT date FROM ${DAILY_FETCH_TABLE} WHERE date = ?`).bind(date).first());
}

async function resetCachedDay(env, date) {
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM ${DETAIL_TABLE} WHERE date = ?`).bind(date),
    env.DB.prepare(`DELETE FROM ${DAILY_TABLE} WHERE date = ?`).bind(date),
    env.DB.prepare(`DELETE FROM ${DAILY_FETCH_TABLE} WHERE date = ?`).bind(date),
  ]);
}

async function runBatches(db, statements, size = 80) {
  for (let index = 0; index < statements.length; index += size) {
    await db.batch(statements.slice(index, index + size));
  }
}

async function writeCachedDay(env, date, detailRows, { markFetched = true } = {}) {
  await runBatches(
    env.DB,
    detailRows.map((row) =>
      env.DB.prepare(
        `INSERT OR REPLACE INTO ${DETAIL_TABLE}
          (
            date,
            agent_id,
            agent_name,
            agent_email,
            ticket_id,
            short_id,
            ticket_link,
            subject,
            agent_reply_count,
            incoming_message_count,
            ticket_created_at,
            ticket_solved_at,
            ticket_closed_at,
            last_public_reply_at,
            conversation_json,
            cached_at
          )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      ).bind(
        row.date,
        row.agent_id,
        row.agent_name,
        row.agent_email,
        row.ticket_id,
        row.short_id,
        row.ticket_link,
        row.subject,
        row.agent_reply_count,
        row.incoming_message_count,
        row.ticket_created_at,
        row.ticket_solved_at,
        row.ticket_closed_at,
        row.last_public_reply_at,
        row.conversation_json,
      ),
    ),
  );

  await env.DB.batch([
    env.DB.prepare(`DELETE FROM ${DAILY_TABLE} WHERE date = ?`).bind(date),
    env.DB.prepare(
      `INSERT INTO ${DAILY_TABLE}
        (date, agent_id, agent_name, agent_email, handled_tickets, cached_at)
       SELECT
        date,
        agent_id,
        COALESCE(MAX(NULLIF(agent_name, '')), agent_id),
        COALESCE(MAX(NULLIF(agent_email, '')), ''),
        COUNT(*),
        CURRENT_TIMESTAMP
       FROM ${DETAIL_TABLE}
       WHERE date = ?
       GROUP BY date, agent_id`,
    ).bind(date),
    ...(markFetched
      ? [env.DB.prepare(`INSERT OR REPLACE INTO ${DAILY_FETCH_TABLE} (date, cached_at) VALUES (?, CURRENT_TIMESTAMP)`).bind(date)]
      : []),
  ]);

  const { results } = await env.DB.prepare(
    `SELECT date, agent_id, agent_name, agent_email, handled_tickets
     FROM ${DAILY_TABLE}
     WHERE date = ?
     ORDER BY handled_tickets DESC`,
  )
    .bind(date)
    .all();
  return results || [];
}

async function finalizeCachedDay(env, date) {
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM ${DAILY_TABLE} WHERE date = ?`).bind(date),
    env.DB.prepare(
      `INSERT INTO ${DAILY_TABLE}
        (date, agent_id, agent_name, agent_email, handled_tickets, cached_at)
       SELECT
        date,
        agent_id,
        COALESCE(MAX(NULLIF(agent_name, '')), agent_id),
        COALESCE(MAX(NULLIF(agent_email, '')), ''),
        COUNT(*),
        CURRENT_TIMESTAMP
       FROM ${DETAIL_TABLE}
       WHERE date = ?
       GROUP BY date, agent_id`,
    ).bind(date),
    env.DB.prepare(`INSERT OR REPLACE INTO ${DAILY_FETCH_TABLE} (date, cached_at) VALUES (?, CURRENT_TIMESTAMP)`).bind(date),
  ]);
}

function filterRows(rows, filters, agentDirectory = new Map()) {
  return rows.filter((row) => matchesFilters(row.agent_id, filters, agentDirectory));
}

function detailToResponse(row) {
  return {
    date: row.date,
    agent_id: String(row.agent_id),
    ticket_id: row.ticket_id || "",
    short_id: row.short_id || "",
    ticket_link: row.ticket_link || "",
    subject: row.subject || "",
    agent_reply_count: Number(row.agent_reply_count || 0),
    incoming_message_count: Number(row.incoming_message_count || 0),
    ticket_created_at: row.ticket_created_at || "",
    ticket_solved_at: row.ticket_solved_at || "",
    ticket_closed_at: row.ticket_closed_at || "",
    last_public_reply_at: row.last_public_reply_at || "",
  };
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
  const handled = new Map();

  for (const ticket of tickets) {
    const ticketId = normalizeTicketId(ticket);
    const shortId = normalizeTicketShortId(ticket);
    const events = Array.isArray(ticket.events) ? ticket.events : [];
    const incomingMessageCount = events.filter((event) => {
      const eventDate = normalizeEventDate(event);
      return isPublicIncomingMessageEvent(event) && eventDate && eventDate >= from && eventDate < to;
    }).length;
    const conversationJson = JSON.stringify(normalizeConversationEvents(ticket, agentDirectory));
    const ticketCreatedAt = normalizeDateString(ticket.createdAt || ticket.created_at);
    const ticketSolvedAt = statusReachedAt(ticket, "solved");
    const ticketClosedAt = statusReachedAt(ticket, "closed");
    const baseDetail = {
      ticket_id: ticketId,
      short_id: shortId,
      ticket_link: ticketLink(ticket, shortId),
      subject: ticket.subject || "",
      incoming_message_count: incomingMessageCount,
      ticket_created_at: ticketCreatedAt,
      ticket_solved_at: ticketSolvedAt,
      ticket_closed_at: ticketClosedAt,
      conversation_json: conversationJson,
    };

    for (const event of events) {
      if (!isPublicAgentMessageEvent(event)) continue;

      const eventDate = normalizeEventDate(event);
      if (!eventDate || eventDate < from || eventDate >= to) continue;

      const agent = authorProfile(event, agentDirectory);
      if (!agent.id) continue;

      const localDay = dateKey(eventDate, timezoneOffsetMinutes);
      const countKey = `${localDay}|${agent.id}|${shortId}`;
      const existing = handled.get(countKey);
      const replyAt = eventDate.toISOString();

      if (!existing) {
        handled.set(countKey, {
          ...baseDetail,
          date: localDay,
          agent_id: agent.id,
          agent_name: agent.name || agent.id,
          agent_email: agent.email || "",
          agent_reply_count: 1,
          last_public_reply_at: replyAt,
        });
      } else {
        existing.agent_reply_count += 1;
        if (replyAt > existing.last_public_reply_at) existing.last_public_reply_at = replyAt;
      }
    }
  }

  return Array.from(handled.values()).sort((left, right) => {
    const agentOrder = left.agent_name.localeCompare(right.agent_name);
    return agentOrder || left.short_id.localeCompare(right.short_id);
  });
}

function rowsToResponse(rows, detailRows, from, to, agentDirectory, cache = {}) {
  const detailsByAgent = new Map();
  for (const detail of detailRows || []) {
    const key = String(detail.agent_id);
    if (!detailsByAgent.has(key)) detailsByAgent.set(key, []);
    detailsByAgent.get(key).push(detailToResponse(detail));
  }

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
        tickets: detailsByAgent.get(agentId) || [],
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

  await ensureHelpDeskAnalyticsCache(env.DB);
  const dashboard = await getHelpDeskDashboard(env);
  const agentDirectory = buildAgentDirectory(dashboard);
  const affectedDates = new Set();
  let detailRows = 0;

  for (const range of splitRangeByLocalDay(from, to, timezoneOffsetMinutes)) {
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

  try {
    await ensureHelpDeskAnalyticsCache(context.env.DB);

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
    const cachedRows = await readCachedDay(context.env, localDate);
    const cachedDetails = cachedRows ? await readCachedDetails(context.env, localDate) : [];
    const cacheMeta = {
      date: localDate,
      checked: true,
      hit: Boolean(cachedRows),
      source: cachedRows ? "d1" : "d1_missing",
      missing: !cachedRows,
      saved: false,
    };

    let rows = cachedRows ? filterRows(cachedRows, filters, agentDirectory) : [];
    let detailRows = cachedRows ? filterRows(cachedDetails, filters, agentDirectory) : [];

    if (shouldFinalizeDate) {
      await finalizeCachedDay(context.env, localDate);
      const finalizedRows = await readCachedDay(context.env, localDate);
      const finalizedDetails = await readCachedDetails(context.env, localDate);
      rows = filterRows(finalizedRows || [], filters, agentDirectory);
      detailRows = filterRows(finalizedDetails, filters, agentDirectory);
      cacheMeta.hit = true;
      cacheMeta.missing = false;
      cacheMeta.saved = true;
      cacheMeta.source = "helpdesk_import_finalized";
    } else if (shouldImport) {
      if (shouldResetDate) await resetCachedDay(context.env, localDate);
      const importedDetails = await computeDay(context.env, from, to, timezoneOffsetMinutes, agentDirectory);
      const summaryRows = await writeCachedDay(context.env, localDate, importedDetails, { markFetched: isFullDayCacheWrite });
      const savedDetails = await readCachedDetails(context.env, localDate);
      rows = filterRows(summaryRows, filters, agentDirectory);
      detailRows = filterRows(savedDetails, filters, agentDirectory);
      cacheMeta.hit = false;
      cacheMeta.missing = !isFullDayCacheWrite;
      cacheMeta.saved = true;
      cacheMeta.source = isFullDayCacheWrite ? "helpdesk_import_saved" : "helpdesk_import_partial_saved";
    } else if (!cachedRows && (await hasCachedDay(context.env, localDate))) {
      cacheMeta.hit = true;
      cacheMeta.missing = false;
      cacheMeta.source = "d1_empty";
    }

    return json(rowsToResponse(rows, detailRows, from, to, agentDirectory, cacheMeta));
  } catch (error) {
    const message = error.message || "";
    if (/too many requests|rate limit/i.test(message)) {
      console.error("HelpDesk analytics rate limited.", error);
      return errorResponse("HelpDesk analytics is rate limited. Try again later.", 429);
    }

    return serverErrorResponse(error, "Failed to load HelpDesk analytics.");
  }
}
