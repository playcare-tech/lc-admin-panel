import { requireAuth } from "../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed } from "../../_lib/http.js";
import { getHelpDeskDashboard, helpdeskRequest } from "../../_lib/helpdesk.js";

const STATUSES = ["open", "pending", "onhold", "solved", "closed"];
const PAGE_SIZE = 100;
const MAX_PAGES_PER_DAY_STATUS = 1000;

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

function eventDate(event) {
  const date = new Date(event.date || event.createdAt || event.created_at);
  return isValidDate(date) ? date : null;
}

function eventAuthorId(event) {
  return event.author?.ID || event.author?.id || event.authorID || event.authorId || event.createdBy;
}

function isAgentMessage(event) {
  return event?.type === "message" && event.author?.type === "agent" && !event.isPrivate;
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
}

async function readCachedDay(env, date) {
  const fetchRecord = await env.DB.prepare("SELECT date FROM helpdesk_analytics_daily_fetches WHERE date = ?").bind(date).first();
  if (!fetchRecord) return null;

  const { results } = await env.DB.prepare(
    `SELECT date, agent_id, handled_tickets
     FROM helpdesk_analytics_daily
     WHERE date = ?
     ORDER BY handled_tickets DESC`,
  )
    .bind(date)
    .all();
  return results || [];
}

async function writeCachedDay(env, date, rows) {
  const statements = [
    env.DB.prepare("DELETE FROM helpdesk_analytics_daily WHERE date = ?").bind(date),
    ...rows.map((row) =>
      env.DB.prepare(
        `INSERT INTO helpdesk_analytics_daily
          (date, agent_id, handled_tickets, avg_ftr_ms, avg_resolution_time_ms, cached_at)
         VALUES (?, ?, ?, 0, 0, CURRENT_TIMESTAMP)`,
      ).bind(date, row.agent_id, row.handled_tickets),
    ),
    env.DB.prepare(
      "INSERT OR REPLACE INTO helpdesk_analytics_daily_fetches (date, cached_at) VALUES (?, CURRENT_TIMESTAMP)",
    ).bind(date),
  ];
  await env.DB.batch(statements);
}

function filterCachedRows(rows, filters) {
  return rows.filter((row) => {
    const agentId = String(row.agent_id);
    if (filters.excludeAgentIds.includes(agentId)) return false;
    if (filters.agentIds.length && !filters.agentIds.includes(agentId)) return false;
    return true;
  });
}

async function listTicketsForDay(env, from, to) {
  const ticketsById = new Map();

  for (const status of STATUSES) {
    let nextCursor = null;
    let page = 0;

    do {
      const params = new URLSearchParams({
        pageSize: String(PAGE_SIZE),
        order: "desc",
        sortBy: "lastMessageAt",
        status,
        lastMessageFrom: from.toISOString(),
        lastMessageTo: to.toISOString(),
      });
      if (nextCursor) {
        params.set("next.value", nextCursor.value);
        params.set("next.ID", nextCursor.id);
      }

      const payload = await helpdeskRequest(env, `/tickets?${params.toString()}`, { method: "GET" });
      const tickets = normalizeTicketList(payload);

      for (const ticket of tickets) {
        const id = ticket.ID || ticket.id;
        if (id) ticketsById.set(String(id), ticket);
      }

      const lastTicket = tickets[tickets.length - 1];
      const lastId = lastTicket?.ID || lastTicket?.id;
      const lastValue = lastTicket?.lastMessageAt || lastTicket?.updatedAt || lastTicket?.updated_at;
      nextCursor = tickets.length === PAGE_SIZE && lastId && lastValue ? { id: String(lastId), value: lastValue } : null;
      page += 1;
    } while (nextCursor && page < MAX_PAGES_PER_DAY_STATUS);
  }

  return Array.from(ticketsById.values());
}

async function computeDay(env, from, to, filters, timezoneOffsetMinutes) {
  const tickets = await listTicketsForDay(env, from, to);
  const counts = new Map();

  for (const ticket of tickets) {
    const teamIds = (ticket.teamIDs || ticket.teamIds || []).map(String);
    const ticketId = String(ticket.ID || ticket.id || "");
    const counted = new Set();

    for (const event of ticket.events || []) {
      if (!isAgentMessage(event)) continue;
      const date = eventDate(event);
      if (!date || date < from || date >= to) continue;

      const agentId = eventAuthorId(event);
      if (!agentId || !matchesFilters(agentId, teamIds, filters)) continue;

      const localDay = dateKey(date, timezoneOffsetMinutes);
      const countKey = `${localDay}|${agentId}|${ticketId}`;
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
      source: "ticket_events_last_message",
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
    const filters = {
      agentIds: splitParam(url.searchParams.get("agents")),
      excludeAgentIds: splitParam(url.searchParams.get("exclude_agents")),
      groupIds: splitParam(url.searchParams.get("groups")),
    };

    const dashboard = await getHelpDeskDashboard(context.env);
    const agentDirectory = buildAgentDirectory(dashboard);
    const cacheable = fullDayCache && localDate < today && !filters.groupIds.length;
    const cachedRows = cacheable ? await readCachedDay(context.env, localDate) : null;
    let rows = cachedRows ? filterCachedRows(cachedRows, filters) : [];
    const cacheMeta = {
      date: localDate,
      checked: cacheable,
      hit: Boolean(cachedRows),
      source: cacheable ? (cachedRows ? "d1" : "helpdesk") : "helpdesk_live",
      cacheable,
    };

    if (!cachedRows) {
      rows = await computeDay(context.env, from, to, filters, timezoneOffsetMinutes);
      if (cacheable) {
        await writeCachedDay(context.env, localDate, rows);
        cacheMeta.source = "helpdesk_saved";
        cacheMeta.saved = true;
      }
    }

    return json(rowsToResponse(rows, from, to, agentDirectory, cacheMeta));
  } catch (error) {
    const message = error.message || "HelpDesk analytics failed.";
    const status = message.startsWith("Missing required param") || message.startsWith("Invalid date") ? 400 : 500;
    return errorResponse(message, status);
  }
}
