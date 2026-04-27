import { requireAuth } from "../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed } from "../../_lib/http.js";
import { livechatReportsRequest } from "../../_lib/livechat.js";

function isValidDate(value) {
  return value && !Number.isNaN(new Date(value).getTime());
}

function isValidTimezone(value) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function isValidAgentEmail(value) {
  return /^[^\s,@]+@[^\s,@]+\.[^\s,@]+$/.test(value);
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
  return {
    from: new Date(fromMs - durationMs).toISOString(),
    to: new Date(fromMs).toISOString(),
  };
}

function buildFilters(from, to, agentEmails) {
  return {
    from,
    to,
    ...(agentEmails.length ? { agents: { values: agentEmails } } : {}),
  };
}

function normalizeAgentRecords(performanceData) {
  const records = performanceData.records || {};
  return Object.entries(records)
    .map(([email, record]) => {
      const good = Number(record.chats_rated_good || 0);
      const bad = Number(record.chats_rated_bad || 0);
      return {
        email,
        total_tickets: Number(record.chats_count || 0),
        avg_ftr_ms: secondsToMs(record.first_response_time),
        avg_csat: csatFromCounts(good, bad),
        rated_good: good,
        rated_bad: bad,
      };
    })
    .sort((left, right) => right.total_tickets - left.total_tickets || left.email.localeCompare(right.email));
}

function normalizeSummary(performanceData) {
  const summary = performanceData.summary || {};
  return {
    total_tickets: Number(summary.chats_count || 0),
    avg_ftr_ms: secondsToMs(summary.first_response_time),
    avg_csat: csatFromCounts(summary.chats_rated_good, summary.chats_rated_bad),
    active_agents: Object.values(performanceData.records || {}).filter((record) => Number(record.chats_count || 0) > 0).length,
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

async function fetchPeriodData(env, from, to, timezone, agentEmails) {
  const filters = buildFilters(from, to, agentEmails);

  const [performanceData, totalChatsData, ftrData, ratingsData] = await Promise.all([
    livechatReportsRequest(env, "/agents/performance", {
      filters,
      timezone,
    }),
    livechatReportsRequest(env, "/chats/total_chats", {
      filters,
      distribution: "day",
      timezone,
    }),
    livechatReportsRequest(env, "/chats/first_response_time", {
      filters,
      distribution: "day",
      timezone,
    }),
    livechatReportsRequest(env, "/chats/ratings", {
      filters,
      distribution: "day",
      timezone,
    }),
  ]);

  return {
    summary: normalizeSummary(performanceData),
    agents: normalizeAgentRecords(performanceData),
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
  const timezone = url.searchParams.get("timezone") || "";
  const agentEmails = (url.searchParams.get("agents") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!from || !to) {
    return errorResponse("Missing required params: from, to", 400);
  }
  if (!isValidDate(from) || !isValidDate(to)) {
    return errorResponse("Invalid date format for from or to", 400);
  }
  if (new Date(to).getTime() <= new Date(from).getTime()) {
    return errorResponse("The to param must be after from.", 400);
  }
  if (!timezone || !isValidTimezone(timezone)) {
    return errorResponse("Missing or invalid timezone.", 400);
  }
  if (agentEmails.some((email) => !isValidAgentEmail(email))) {
    return errorResponse("Invalid agents filter. Expected comma-separated email addresses.", 400);
  }

  const prev = previousPeriod(from, to);

  try {
    const [current, previous] = await Promise.all([
      fetchPeriodData(context.env, from, to, timezone, agentEmails),
      fetchPeriodData(context.env, prev.from, prev.to, timezone, agentEmails),
    ]);

    return json({
      period: { from, to, timezone },
      previous_period: { ...prev, timezone },
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
