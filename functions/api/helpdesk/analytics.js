import { requireAuth } from "../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed } from "../../_lib/http.js";
import { getHelpDeskDashboard, helpdeskRequest } from "../../_lib/helpdesk.js";

const STATUSES = ["open", "pending", "onhold", "solved", "closed"];
const PAGE_SIZE = 100;
const MAX_PAGES_PER_DAY_STATUS = 1000;
const DAILY_TABLE = "helpdesk_analytics_daily_v2";
const DAILY_FETCH_TABLE = "helpdesk_analytics_daily_fetches_v2";
const AGENT_FETCH_TABLE = "helpdesk_analytics_agent_fetches_v2";

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

function matchesFilters(agentId, teamIds, filters) {
  if (filters.excludeAgentIds.includes(String(agentId))) return false;
  if (filters.agentIds.length && !filters.agentIds.includes(String(agentId))) return false;
  if (filters.groupIds.length && !teamIds.some((teamId) => filters.groupIds.includes(String(teamId)))) return false;
  return true;
}

function targetAgentIds(agentDirectory, filters) {
  return Array.from(agentDirectory.values())
    .filter((agent) => {
      if (filters.excludeAgentIds.includes(agent.id)) return false;
      if (filters.agentIds.length && !filters.agentIds.includes(agent.id)) return false;
      if (filters.groupIds.length && !agent.teamIDs.some((teamId) => filters.groupIds.includes(String(teamId)))) return false;
      return true;
    })
    .map((agent) => agent.id);
}

async function ensureHelpDeskAnalyticsCache(db) {
  if (!db) throw new Error("Missing DB binding.");
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS helpdesk_analytics_daily (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        handled_tickets INTEGER NOT NULL DEFAULT 0,
        avg_ftr_ms REAL NOT NULL DEFAULT 0,
        avg_resolution_time_ms REAL NOT NULL DEFAULT 0,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, agent_id)
      )`,
    )
    .run();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS ${DAILY_TABLE} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        handled_tickets INTEGER NOT NULL DEFAULT 0,
        avg_ftr_ms REAL NOT NULL DEFAULT 0,
        avg_resolution_time_ms REAL NOT NULL DEFAULT 0,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, agent_id)
      )`,
    )
    .run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_${DAILY_TABLE}_date ON ${DAILY_TABLE}(date)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_${DAILY_TABLE}_agent ON ${DAILY_TABLE}(agent_id)`).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_daily_date ON helpdesk_analytics_daily(date)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_daily_agent ON helpdesk_analytics_daily(agent_id)").run();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS helpdesk_analytics_daily_fetches (
        date TEXT PRIMARY KEY,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    )
    .run();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS ${DAILY_FETCH_TABLE} (
        date TEXT PRIMARY KEY,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    )
    .run();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS helpdesk_analytics_agent_fetches (
        date TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(date, agent_id)
      )`,
    )
    .run();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS ${AGENT_FETCH_TABLE} (
        date TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(date, agent_id)
      )`,
    )
    .run();
}

async function readCachedDay(env, date) {
  const fetchRecord = await env.DB.prepare(`SELECT date FROM ${DAILY_FETCH_TABLE} WHERE date = ?`).bind(date).first();
  const { results } = await env.DB.prepare(
    `SELECT date, agent_id, handled_tickets
     FROM ${DAILY_TABLE}
     WHERE date = ?
     ORDER BY handled_tickets DESC`,
  )
    .bind(date)
    .all();
  if (fetchRecord || results?.length) return results || [];
  return null;
}

async function hasCachedFullDay(env, date) {
  return Boolean(await env.DB.prepare(`SELECT date FROM ${DAILY_FETCH_TABLE} WHERE date = ?`).bind(date).first());
}

async function countCachedAgentDays(env, date, agentIds) {
  if (!agentIds.length) return 0;
  const placeholders = agentIds.map(() => "?").join(", ");
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS count
     FROM ${AGENT_FETCH_TABLE}
     WHERE date = ? AND agent_id IN (${placeholders})`,
  )
    .bind(date, ...agentIds)
    .first();
  return Number(row?.count || 0);
}

async function readCachedAgentDay(env, date, agentId) {
  const fetchRecord = await env.DB.prepare(
    `SELECT date FROM ${AGENT_FETCH_TABLE} WHERE date = ? AND agent_id = ?`,
  )
    .bind(date, agentId)
    .first();
  if (!fetchRecord) return null;

  const { results } = await env.DB.prepare(
    `SELECT date, agent_id, handled_tickets
     FROM ${DAILY_TABLE}
     WHERE date = ? AND agent_id = ?`,
  )
    .bind(date, agentId)
    .all();
  return results || [];
}

async function writeCachedDay(env, date, rows) {
  const statements = [
    env.DB.prepare(`DELETE FROM ${DAILY_TABLE} WHERE date = ?`).bind(date),
    ...rows.map((row) =>
      env.DB.prepare(
        `INSERT INTO ${DAILY_TABLE}
          (date, agent_id, handled_tickets, avg_ftr_ms, avg_resolution_time_ms, cached_at)
         VALUES (?, ?, ?, 0, 0, CURRENT_TIMESTAMP)`,
      ).bind(date, row.agent_id, row.handled_tickets),
    ),
    env.DB.prepare(
      `INSERT OR REPLACE INTO ${DAILY_FETCH_TABLE} (date, cached_at) VALUES (?, CURRENT_TIMESTAMP)`,
    ).bind(date),
  ];
  await env.DB.batch(statements);
}

async function writeCachedAgentDay(env, date, agentId, rows) {
  const agentRows = rows.filter((row) => String(row.agent_id) === String(agentId));
  const statements = [
    env.DB.prepare(`DELETE FROM ${DAILY_TABLE} WHERE date = ? AND agent_id = ?`).bind(date, agentId),
    ...agentRows.map((row) =>
      env.DB.prepare(
        `INSERT INTO ${DAILY_TABLE}
          (date, agent_id, handled_tickets, avg_ftr_ms, avg_resolution_time_ms, cached_at)
         VALUES (?, ?, ?, 0, 0, CURRENT_TIMESTAMP)`,
      ).bind(date, row.agent_id, row.handled_tickets),
    ),
    env.DB.prepare(
      `INSERT OR REPLACE INTO ${AGENT_FETCH_TABLE} (date, agent_id, cached_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
    ).bind(date, agentId),
  ];
  await env.DB.batch(statements);
}

function filterCachedRows(rows, filters, agentDirectory = new Map()) {
  return rows.filter((row) => {
    const agentId = String(row.agent_id);
    const agent = agentDirectory.get(agentId) || { teamIDs: [] };
    if (filters.excludeAgentIds.includes(agentId)) return false;
    if (filters.agentIds.length && !filters.agentIds.includes(agentId)) return false;
    if (filters.groupIds.length && !agent.teamIDs.some((teamId) => filters.groupIds.includes(String(teamId)))) return false;
    return true;
  });
}

function eventAuthorAgentId(event) {
  const author = event.author || event.createdBy || {};
  if (typeof author === "string") return author;
  return (
    author.ID ||
    author.id ||
    author.agentID ||
    author.agentId ||
    event.agentID ||
    event.agentId ||
    event.authorID ||
    event.authorId ||
    event.createdByID ||
    event.createdById ||
    ""
  );
}

function eventAuthorType(event) {
  const author = event.author || event.createdBy || {};
  return author.type || event.authorType || event.createdByType || event.author?.role || "";
}

function isPublicMessageEvent(event) {
  const type = event.type || event.eventType || "";
  const hasMessagePayload = Boolean(event.message || event.text || event.content);
  const isMessage = type === "message" || type === "tickets.events.message" || hasMessagePayload;
  return isMessage && !Boolean(event.isPrivate || event.private);
}

async function listTicketsForRange(env, from, to) {
  const ticketsById = new Map();

  for (const status of STATUSES) {
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
        if (!updatedDate || updatedDate < from || updatedDate > to) continue;
        const id = ticket.ID || ticket.id;
        if (id) ticketsById.set(String(id), ticket);
      }

      const lastTicket = tickets[tickets.length - 1];
      const lastId = lastTicket?.ID || lastTicket?.id;
      const lastValue = lastTicket?.updatedAt || lastTicket?.updated_at || lastTicket?.lastMessageAt;
      nextCursor = tickets.length === PAGE_SIZE && lastId && lastValue ? { id: String(lastId), value: lastValue } : null;
      page += 1;
    } while (nextCursor && page < MAX_PAGES_PER_DAY_STATUS);
  }

  return Array.from(ticketsById.values());
}

async function computeDay(env, from, to, filters, timezoneOffsetMinutes) {
  const tickets = await listTicketsForRange(env, from, to);
  const counts = new Map();
  const counted = new Set();

  for (const ticket of tickets) {
    const teamIds = (ticket.teamIDs || ticket.teamIds || []).map(String);
    const shortId = ticket.shortID || ticket.shortId || ticket.ID || ticket.id;
    const events = Array.isArray(ticket.events) ? ticket.events : [];

    for (const event of events) {
      const authorType = eventAuthorType(event);
      const agentId = eventAuthorAgentId(event);
      const value = event.createdAt || event.date || event.timestamp;
      const date = value ? new Date(value) : null;

      if (!isPublicMessageEvent(event) || !agentId || !date || !isValidDate(date)) continue;
      if (authorType && authorType !== "agent") continue;
      if (date < from || date > to) continue;
      if (!matchesFilters(agentId, teamIds, filters)) continue;

      const localDay = dateKey(date, timezoneOffsetMinutes);
      const countKey = `${localDay}|${agentId}|${shortId || ""}`;
      if (counted.has(countKey)) continue;
      counted.add(countKey);

      const rowKey = `${localDay}|${agentId}`;
      if (!counts.has(rowKey)) {
        counts.set(rowKey, { date: localDay, agent_id: String(agentId), handled_tickets: 0 });
      }
      counts.get(rowKey).handled_tickets += 1;
    }
  }

  return Array.from(counts.values());
}

function rowsToResponse(rows, from, to, agentDirectory, cache = {}) {
  const agents = rows
    .map((row) => {
      const profile = agentDirectory.get(String(row.agent_id)) || {};
      return {
        agent_id: String(row.agent_id),
        id: String(row.agent_id),
        name: profile.name || String(row.agent_id),
        email: profile.email || String(row.agent_id),
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
      source: "ticket_public_message_events_by_short_id",
    },
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
    const localDate = dateKey(from, timezoneOffsetMinutes);
    const today = dateKey(new Date(), timezoneOffsetMinutes);
    const fullDayCache = url.searchParams.get("cache_full_day") === "1";
    const shouldImport = url.searchParams.get("import") === "1";
    const importAgentId = url.searchParams.get("import_agent_id") || "";
    const filters = {
      agentIds: splitParam(url.searchParams.get("agents")),
      excludeAgentIds: splitParam(url.searchParams.get("exclude_agents")),
      groupIds: splitParam(url.searchParams.get("groups")),
    };
    if (importAgentId) {
      filters.agentIds = [importAgentId];
      filters.excludeAgentIds = filters.excludeAgentIds.filter((agentId) => agentId !== importAgentId);
    }

    const dashboard = await getHelpDeskDashboard(context.env);
    const agentDirectory = buildAgentDirectory(dashboard);
    const cacheable = fullDayCache && localDate < today;
    const wantedAgentIds = targetAgentIds(agentDirectory, filters);
    const fullDayCached = cacheable && !importAgentId ? await hasCachedFullDay(context.env, localDate) : false;
    const cachedAgentDays =
      cacheable && !importAgentId && !fullDayCached ? await countCachedAgentDays(context.env, localDate, wantedAgentIds) : 0;
    const cachedRows = cacheable
      ? importAgentId
        ? await readCachedAgentDay(context.env, localDate, importAgentId)
        : await readCachedDay(context.env, localDate)
      : null;
    let rows = cachedRows ? filterCachedRows(cachedRows, filters, agentDirectory) : [];
    const cacheMeta = {
      date: localDate,
      agent_id: importAgentId || null,
      checked: cacheable,
      hit: Boolean(cachedRows),
      source: cacheable ? (cachedRows ? "d1" : "helpdesk") : "helpdesk_live",
      cacheable,
      missing: cacheable && !importAgentId && !fullDayCached && cachedAgentDays < wantedAgentIds.length,
      imported_agents: cachedAgentDays,
      expected_agents: cacheable && !importAgentId ? wantedAgentIds.length : null,
    };

    const shouldFetchHelpDesk = shouldImport || localDate === today;

    if (!cachedRows && shouldFetchHelpDesk) {
      rows = await computeDay(context.env, from, to, filters, timezoneOffsetMinutes);
      if (cacheable) {
        if (importAgentId) {
          await writeCachedAgentDay(context.env, localDate, importAgentId, rows);
        } else {
          await writeCachedDay(context.env, localDate, rows);
        }
        cacheMeta.source = "helpdesk_saved";
        cacheMeta.saved = true;
      } else {
        cacheMeta.source = shouldImport ? "helpdesk_import" : "helpdesk_today";
      }
    } else if (!cachedRows) {
      cacheMeta.source = "d1_missing";
      cacheMeta.missing = true;
    }

    return json(rowsToResponse(rows, from, to, agentDirectory, cacheMeta));
  } catch (error) {
    const message = error.message || "HelpDesk analytics failed.";
    const status = message.startsWith("Missing required param") || message.startsWith("Invalid date") ? 400 : 500;
    return errorResponse(message, status);
  }
}
