import { requireAuth } from "../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed } from "../../_lib/http.js";
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

function buildAgentDirectory(livechatDashboard) {
  const byId = new Map();
  const byEmail = new Map();
  const ids = [];
  (livechatDashboard.agents || []).forEach((agent) => {
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

function effectiveAgentIds(includedAgentIds, excludedAgentIds, directory) {
  const excluded = new Set(Array.from(excludedAgentIds).map((value) => resolveAgentId(value, directory)));
  const base = includedAgentIds.length ? includedAgentIds.map((value) => resolveAgentId(value, directory)) : directory.ids;
  const filtered = base.filter((id) => !excluded.has(id));

  if (!includedAgentIds.length && !excludedAgentIds.size) {
    return [];
  }
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
    .filter((agent) => !excludedAgentIds.has(agent.id) && !excludedAgentIds.has(agent.email) && !excludedAgentIds.has(agent.record_key))
    .sort((left, right) => right.total_tickets - left.total_tickets || left.email.localeCompare(right.email));
}

function normalizeSummary(agents) {
  const ftrAgents = agents.filter((agent) => agent.avg_ftr_ms !== null && agent.total_tickets > 0);
  const ratedGood = agents.reduce((sum, agent) => sum + agent.rated_good, 0);
  const ratedBad = agents.reduce((sum, agent) => sum + agent.rated_bad, 0);
  const totalTickets = agents.reduce((sum, agent) => sum + agent.total_tickets, 0);
  return {
    total_tickets: totalTickets,
    avg_ftr_ms: ftrAgents.length
      ? Math.round(ftrAgents.reduce((sum, agent) => sum + agent.avg_ftr_ms * agent.total_tickets, 0) / totalTickets)
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

async function fetchPeriodData(env, from, to, agentIds, excludedAgentIds, directory) {
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

  return {
    summary: normalizeSummary(agents),
    agents,
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
    const directory = buildAgentDirectory(await getLiveChatDashboard(context.env));
    const reportAgentIds = effectiveAgentIds(agentIds, excludedAgentIds, directory);
    const [current, previous] = await Promise.all([
      fetchPeriodData(context.env, from, to, reportAgentIds, excludedAgentIds, directory),
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
        per_agent_daily_metrics: false,
        account_daily_timeline: true,
        timeline_tickets_source: "chats/total_chats",
        timeline_ftr_source: "chats/first_response_time",
        timeline_csat_source: "chats/ratings",
      },
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
