import { requireAuth } from "../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed, serverErrorResponse } from "../../_lib/http.js";
import { getLiveChatDashboard, livechatReportsRequest } from "../../_lib/livechat.js";

function isValidDate(value) {
  return value && !Number.isNaN(new Date(value).getTime());
}

function secondsToMs(value) {
  return Number.isFinite(value) ? Math.round(value * 1000) : null;
}

function csatFromCounts(good = 0, bad = 0) {
  const total = Number(good || 0) + Number(bad || 0);
  if (!total) {
    return null;
  }
  return Math.round((Number(good || 0) / total) * 50) / 10;
}

function previousPeriod(from, to) {
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  const durationMs = toMs - fromMs;
  const offset = extractOffset(from);
  return {
    from: formatWithOffset(new Date(fromMs - durationMs), offset),
    to: formatWithOffset(new Date(fromMs), offset),
  };
}

function extractOffset(value) {
  return value.match(/(Z|[+-]\d{2}:\d{2})$/)?.[1] || "Z";
}

function offsetToMinutes(offset) {
  if (offset === "Z") {
    return 0;
  }
  const sign = offset.startsWith("-") ? -1 : 1;
  const [hours, minutes] = offset.slice(1).split(":").map(Number);
  return sign * (hours * 60 + minutes);
}

function formatWithOffset(date, offset) {
  if (offset === "Z") {
    return date.toISOString();
  }
  const shifted = new Date(date.getTime() + offsetToMinutes(offset) * 60000);
  const pad = (value) => String(value).padStart(2, "0");
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}T${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())}${offset}`;
}

function buildFilters(from, to, agentIds) {
  return {
    from,
    to,
    ...(agentIds.length ? { agents: { values: agentIds } } : {}),
  };
}

function reportDatePart(value) {
  return `${value}`.slice(0, 10);
}

function datesBetween(from, to) {
  const dates = [];
  const current = new Date(`${reportDatePart(from)}T12:00:00Z`);
  const end = new Date(`${reportDatePart(to)}T12:00:00Z`);

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function dayBounds(date, offset) {
  return {
    from: `${date}T00:00:00${offset}`,
    to: `${date}T23:59:59${offset}`,
  };
}

function agentScope(agentIds) {
  return agentIds.length ? Array.from(new Set(agentIds)).sort().join(",") : "__all__";
}

function todayForOffset(offset) {
  return formatWithOffset(new Date(), offset).slice(0, 10);
}

async function ensureAnalyticsCache(db) {
  if (!db) {
    throw new Error("Missing DB binding.");
  }

  await db.prepare(
    `CREATE TABLE IF NOT EXISTS analytics_agent_daily (
      date TEXT NOT NULL,
      agent_scope TEXT NOT NULL,
      agent_key TEXT NOT NULL,
      agent_id TEXT,
      agent_email TEXT,
      agent_name TEXT,
      chats_count INTEGER NOT NULL DEFAULT 0,
      avg_ftr_ms INTEGER,
      avg_csat REAL,
      rated_good INTEGER NOT NULL DEFAULT 0,
      rated_bad INTEGER NOT NULL DEFAULT 0,
      fetched_at TEXT NOT NULL,
      PRIMARY KEY (date, agent_scope, agent_key)
    )`,
  ).run();

  await db.prepare(
    `CREATE TABLE IF NOT EXISTS analytics_agent_daily_fetches (
      date TEXT NOT NULL,
      agent_scope TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      PRIMARY KEY (date, agent_scope)
    )`,
  ).run();
}

function buildAgentDirectory(livechatDashboard) {
  const byId = new Map();
  const byEmail = new Map();
  const ids = [];
  (livechatDashboard.agents || []).filter(isHumanAnalyticsAgent).forEach((agent) => {
    const normalized = {
      id: String(agent.id),
      email: agent.email || agent.id,
      name: agent.name || agent.email || agent.id,
    };
    byId.set(String(agent.id), normalized);
    ids.push(String(agent.id));
    if (agent.email) {
      byEmail.set(String(agent.email), normalized);
    }
  });
  return { byId, byEmail, ids };
}

function agentFromRecordKey(key, directory) {
  return directory.byId.get(String(key)) || directory.byEmail.get(String(key)) || { id: String(key), email: String(key), name: String(key) };
}

function displayNameFromRecord(record, fallback) {
  return record.full_name || record.name || record.display_name || record.agent_name || fallback;
}

function resolveAgentId(value, directory) {
  return directory.byId.get(String(value))?.id || directory.byEmail.get(String(value))?.id || String(value);
}

function hasEmailLikeIdentifier(value) {
  return `${value || ""}`.includes("@");
}

function isHumanAnalyticsAgent(agent) {
  return hasEmailLikeIdentifier(agent.id) || hasEmailLikeIdentifier(agent.email) || hasEmailLikeIdentifier(agent.record_key);
}

function effectiveAgentIds(includedAgentIds, excludedAgentIds, directory) {
  const excluded = new Set(Array.from(excludedAgentIds).map((value) => resolveAgentId(value, directory)));
  const base = includedAgentIds.length ? includedAgentIds.map((value) => resolveAgentId(value, directory)) : directory.ids;
  const filtered = base.filter((id) => !excluded.has(id));
  return Array.from(new Set(filtered));
}

function normalizeAgentRecords(performanceData, directory, excludedAgentIds) {
  const records = performanceData.records || {};
  return Object.entries(records)
    .map(([recordKey, record]) => {
      const agent = agentFromRecordKey(recordKey, directory);
      const good = Number(record.chats_rated_good || 0);
      const bad = Number(record.chats_rated_bad || 0);
      return {
        id: agent.id,
        record_key: String(recordKey),
        email: agent.email,
        name: displayNameFromRecord(record, agent.name),
        total_tickets: Number(record.chats_count || 0),
        avg_ftr_ms: secondsToMs(record.first_response_time),
        avg_csat: csatFromCounts(good, bad),
        rated_good: good,
        rated_bad: bad,
      };
    })
    .filter(
      (agent) =>
        isHumanAnalyticsAgent(agent) &&
        !excludedAgentIds.has(agent.id) &&
        !excludedAgentIds.has(agent.email) &&
        !excludedAgentIds.has(agent.record_key),
    )
    .sort((left, right) => right.total_tickets - left.total_tickets || left.email.localeCompare(right.email));
}

function normalizeCachedAgentRows(rows) {
  return rows
    .map((row) => ({
      id: row.agent_id || row.agent_key,
      record_key: row.agent_key,
      email: row.agent_email || row.agent_key,
      name: row.agent_name || row.agent_email || row.agent_key,
      total_tickets: Number(row.chats_count || 0),
      avg_ftr_ms: row.avg_ftr_ms === null || row.avg_ftr_ms === undefined ? null : Number(row.avg_ftr_ms),
      avg_csat: row.avg_csat === null || row.avg_csat === undefined ? null : Number(row.avg_csat),
      rated_good: Number(row.rated_good || 0),
      rated_bad: Number(row.rated_bad || 0),
    }))
    .filter(isHumanAnalyticsAgent);
}

function normalizeSummary(agents) {
  const ftrAgents = agents.filter((agent) => agent.avg_ftr_ms !== null && agent.total_tickets > 0);
  const ftrChats = ftrAgents.reduce((sum, agent) => sum + agent.total_tickets, 0);
  const ratedGood = agents.reduce((sum, agent) => sum + agent.rated_good, 0);
  const ratedBad = agents.reduce((sum, agent) => sum + agent.rated_bad, 0);
  const totalTickets = agents.reduce((sum, agent) => sum + agent.total_tickets, 0);
  return {
    total_tickets: totalTickets,
    avg_ftr_ms: ftrChats
      ? Math.round(ftrAgents.reduce((sum, agent) => sum + agent.avg_ftr_ms * agent.total_tickets, 0) / ftrChats)
      : null,
    avg_csat: csatFromCounts(ratedGood, ratedBad),
    active_agents: agents.filter((agent) => agent.total_tickets > 0).length,
  };
}

function normalizeTimeline(totalChatsData, ftrData, ratingsData) {
  const totalRecords = totalChatsData.records || {};
  const ftrRecords = ftrData.records || {};
  const ratingsRecords = ratingsData.records || {};
  const dates = Array.from(
    new Set([...Object.keys(totalRecords), ...Object.keys(ftrRecords), ...Object.keys(ratingsRecords)]),
  ).sort();

  return dates.map((date) => {
    const totalRecord = totalRecords[date] || {};
    const ftrRecord = ftrRecords[date] || {};
    const ratingsRecord = ratingsRecords[date] || {};
    return {
      date,
      tickets: Number(totalRecord.total || 0),
      continuous: Number(totalRecord.continuous || 0),
      first_response_chats: Number(ftrRecord.count || 0),
      avg_ftr_ms: secondsToMs(ftrRecord.first_response_time),
      rated_chats: Number(ratingsRecord.chats || 0),
      avg_csat: csatFromCounts(ratingsRecord.good, ratingsRecord.bad),
      rated_good: Number(ratingsRecord.good || 0),
      rated_bad: Number(ratingsRecord.bad || 0),
    };
  });
}

async function readCachedAgentDay(env, date, scope) {
  const fetchRecord = await env.DB.prepare(
    "SELECT fetched_at FROM analytics_agent_daily_fetches WHERE date = ? AND agent_scope = ?",
  )
    .bind(date, scope)
    .first();

  if (!fetchRecord) {
    return null;
  }

  const { results } = await env.DB.prepare(
    "SELECT * FROM analytics_agent_daily WHERE date = ? AND agent_scope = ? ORDER BY chats_count DESC, agent_email ASC",
  )
    .bind(date, scope)
    .all();

  return normalizeCachedAgentRows(results || []);
}

async function writeCachedAgentDay(env, date, scope, agents) {
  const fetchedAt = new Date().toISOString();
  const statements = [
    env.DB.prepare("DELETE FROM analytics_agent_daily WHERE date = ? AND agent_scope = ?").bind(date, scope),
    ...agents.map((agent) =>
      env.DB.prepare(
      `INSERT OR REPLACE INTO analytics_agent_daily
        (date, agent_scope, agent_key, agent_id, agent_email, agent_name, chats_count, avg_ftr_ms, avg_csat, rated_good, rated_bad, fetched_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        date,
        scope,
        agent.record_key || agent.id || agent.email,
        agent.id || null,
        agent.email || null,
        agent.name || null,
        agent.total_tickets || 0,
        agent.avg_ftr_ms,
        agent.avg_csat,
        agent.rated_good || 0,
        agent.rated_bad || 0,
        fetchedAt,
      ),
    ),
  ];

  statements.push(
    env.DB.prepare(
      "INSERT OR REPLACE INTO analytics_agent_daily_fetches (date, agent_scope, fetched_at) VALUES (?, ?, ?)",
    ).bind(date, scope, fetchedAt),
  );

  if (statements.length) {
    await env.DB.batch(statements);
  }
}

async function fetchAgentDay(env, date, offset, agentIds, excludedAgentIds, directory) {
  const bounds = dayBounds(date, offset);
  const performanceData = await livechatReportsRequest(env, "/agents/performance", {
    filters: buildFilters(bounds.from, bounds.to, agentIds),
  });
  return normalizeAgentRecords(performanceData, directory, excludedAgentIds);
}

async function getAgentDay(env, date, offset, agentIds, excludedAgentIds, directory) {
  const scope = agentScope(agentIds);
  const shouldRefresh = date === todayForOffset(offset);
  if (!shouldRefresh) {
    const cached = await readCachedAgentDay(env, date, scope);
    if (cached) {
      return cached;
    }
  }

  const agents = await fetchAgentDay(env, date, offset, agentIds, excludedAgentIds, directory);
  await writeCachedAgentDay(env, date, scope, agents);
  return agents;
}

async function fetchAgentDailyMetrics(env, from, to, agentIds, excludedAgentIds, directory) {
  const offset = extractOffset(from);
  const dates = datesBetween(from, to);
  if (dates.length > 31) {
    return [];
  }

  const entries = await Promise.all(
    dates.map(async (date) => ({
      date,
      agents: await getAgentDay(env, date, offset, agentIds, excludedAgentIds, directory),
    })),
  );

  return entries;
}

function mergeAgentDailyMetrics(agents, dailyEntries) {
  const byAgentKey = new Map(
    agents.map((agent) => [agent.id || agent.email || agent.record_key, { ...agent, days: [] }]),
  );

  dailyEntries.forEach(({ date, agents: dayAgents }) => {
    dayAgents.forEach((dayAgent) => {
      const key = dayAgent.id || dayAgent.email || dayAgent.record_key;
      const current =
        byAgentKey.get(key) ||
        {
          ...dayAgent,
          total_tickets: 0,
          avg_ftr_ms: null,
          avg_csat: null,
          days: [],
        };

      current.days.push({
        date,
        chats: dayAgent.total_tickets,
        avg_ftr_ms: dayAgent.avg_ftr_ms,
        avg_csat: dayAgent.avg_csat,
      });
      byAgentKey.set(key, current);
    });
  });

  return Array.from(byAgentKey.values()).sort(
    (left, right) => right.total_tickets - left.total_tickets || left.email.localeCompare(right.email),
  );
}

async function fetchPeriodData(env, from, to, agentIds, excludedAgentIds, directory, includeDaily = false) {
  const filters = buildFilters(from, to, agentIds);

  const [performanceData, totalChatsData, ftrData, ratingsData] = await Promise.all([
    livechatReportsRequest(env, "/agents/performance", {
      filters,
    }),
    livechatReportsRequest(env, "/chats/total_chats", {
      filters,
      distribution: "day",
    }),
    livechatReportsRequest(env, "/chats/first_response_time", {
      filters,
      distribution: "day",
    }),
    livechatReportsRequest(env, "/chats/ratings", {
      filters,
      distribution: "day",
    }),
  ]);
  const agents = normalizeAgentRecords(performanceData, directory, excludedAgentIds);
  const dailyEntries = includeDaily
    ? await fetchAgentDailyMetrics(env, from, to, agentIds, excludedAgentIds, directory)
    : [];

  return {
    summary: normalizeSummary(agents),
    agents: includeDaily ? mergeAgentDailyMetrics(agents, dailyEntries) : agents,
    timeline: normalizeTimeline(totalChatsData, ftrData, ratingsData),
  };
}

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const auth = await requireAuth(context);
  if (auth.error) {
    return auth.error;
  }

  const url = new URL(context.request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const agentIds = (url.searchParams.get("agents") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const excludedAgentIds = new Set(
    (url.searchParams.get("exclude_agents") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );

  if (!from || !to) {
    return errorResponse("Missing required params: from, to", 400);
  }
  if (!isValidDate(from) || !isValidDate(to)) {
    return errorResponse("Invalid date format for from or to", 400);
  }
  if (new Date(to).getTime() <= new Date(from).getTime()) {
    return errorResponse("The to param must be after from.", 400);
  }

  const prev = previousPeriod(from, to);

  try {
    await ensureAnalyticsCache(context.env.DB);
    const directory = buildAgentDirectory(await getLiveChatDashboard(context.env));
    const reportAgentIds = effectiveAgentIds(agentIds, excludedAgentIds, directory);
    const [current, previous] = await Promise.all([
      fetchPeriodData(context.env, from, to, reportAgentIds, excludedAgentIds, directory, true),
      fetchPeriodData(context.env, prev.from, prev.to, reportAgentIds, excludedAgentIds, directory),
    ]);

    return json({
      period: { from, to },
      previous_period: prev,
      summary: { ...current.summary, prev_period: previous.summary },
      agents: current.agents,
      timeline: current.timeline,
      capabilities: {
        per_agent_period_metrics: true,
        per_agent_daily_metrics: true,
        account_daily_timeline: true,
        per_agent_daily_source: "agents/performance day-range cache",
        timeline_tickets_source: "chats/total_chats",
        timeline_ftr_source: "chats/first_response_time",
        timeline_csat_source: "chats/ratings",
      },
    });
  } catch (error) {
    return serverErrorResponse(error, "Failed to load LiveChat analytics.");
  }
}
