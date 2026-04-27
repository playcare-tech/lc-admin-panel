import { requireAuth } from "../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed } from "../../_lib/http.js";
import { livechatReportsRequest } from "../../_lib/livechat.js";

function ratingsToCSAT(ratings) {
  if (!ratings) return null;
  const total = (ratings.good || 0) + (ratings.bad || 0);
  if (total === 0) return null;
  return Math.round(((ratings.good || 0) / total) * 50) / 10;
}

async function fetchPeriodData(env, from, to, timezone, agentEmails) {
  const agentsFilter = agentEmails.length ? { agents: { values: agentEmails } } : {};
  const baseFilters = { from, to, ...agentsFilter };

  const [perfData, ratingsData] = await Promise.all([
    livechatReportsRequest(env, "/agents/performance", {
      filters: baseFilters,
      distribution: "day",
      timezone,
    }),
    livechatReportsRequest(env, "/chats/ratings", {
      filters: baseFilters,
      distribution: "day",
      timezone,
    }),
  ]);

  const agentMap = {};

  const perfAgents = perfData.agents || {};
  for (const [email, data] of Object.entries(perfAgents)) {
    agentMap[email] = {
      email,
      total_tickets: data.chats_count || 0,
      avg_ftr_ms: (data.first_response_time?.avg || 0) * 1000,
      avg_csat: null,
      days: {},
    };
  }

  const ratingsAgents = ratingsData.agents || {};
  for (const [email, data] of Object.entries(ratingsAgents)) {
    if (!agentMap[email]) {
      agentMap[email] = { email, total_tickets: 0, avg_ftr_ms: 0, avg_csat: null, days: {} };
    }
    agentMap[email].avg_csat = ratingsToCSAT(data.ratings);
  }

  const perfDist = perfData.distribution || {};
  for (const [date, dayData] of Object.entries(perfDist)) {
    const dayAgents = dayData.agents || {};
    for (const [email, data] of Object.entries(dayAgents)) {
      if (!agentMap[email]) {
        agentMap[email] = { email, total_tickets: 0, avg_ftr_ms: 0, avg_csat: null, days: {} };
      }
      agentMap[email].days[date] = {
        date,
        tickets: data.chats_count || 0,
        avg_ftr_ms: (data.first_response_time?.avg || 0) * 1000,
        avg_csat: null,
      };
    }
  }

  const ratingsDist = ratingsData.distribution || {};
  for (const [date, dayData] of Object.entries(ratingsDist)) {
    const dayAgents = dayData.agents || {};
    for (const [email, data] of Object.entries(dayAgents)) {
      if (agentMap[email]?.days[date]) {
        agentMap[email].days[date].avg_csat = ratingsToCSAT(data.ratings);
      }
    }
  }

  const agents = Object.values(agentMap).map((a) => ({
    ...a,
    days: Object.values(a.days).sort((x, y) => x.date.localeCompare(y.date)),
  }));

  const totalTickets = agents.reduce((s, a) => s + a.total_tickets, 0);
  const activeAgents = agents.filter((a) => a.total_tickets > 0).length;
  const csatAgents = agents.filter((a) => a.avg_csat !== null);
  const avgCsat = csatAgents.length
    ? Math.round((csatAgents.reduce((s, a) => s + a.avg_csat, 0) / csatAgents.length) * 10) / 10
    : null;
  const ftrAgents = agents.filter((a) => a.avg_ftr_ms > 0);
  const avgFtrMs = ftrAgents.length
    ? Math.round(ftrAgents.reduce((s, a) => s + a.avg_ftr_ms, 0) / ftrAgents.length)
    : 0;

  return {
    summary: { total_tickets: totalTickets, avg_ftr_ms: avgFtrMs, avg_csat: avgCsat, active_agents: activeAgents },
    agents,
  };
}

export async function onRequest(context) {
  if (context.request.method !== "GET") return methodNotAllowed(["GET"]);

  const auth = await requireAuth(context);
  if (auth.error) return auth.error;

  const url = new URL(context.request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const timezone = url.searchParams.get("timezone") || "UTC";
  const agentsParam = url.searchParams.get("agents") || "";
  const agentEmails = agentsParam ? agentsParam.split(",").map((s) => s.trim()).filter(Boolean) : [];

  if (!from || !to) return errorResponse("Missing required params: from, to", 400);

  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  const durationMs = toMs - fromMs;
  const prevTo = new Date(fromMs - 1).toISOString();
  const prevFrom = new Date(fromMs - durationMs - 1).toISOString();

  try {
    const [current, prev] = await Promise.all([
      fetchPeriodData(context.env, from, to, timezone, agentEmails),
      fetchPeriodData(context.env, prevFrom, prevTo, timezone, agentEmails),
    ]);

    return json({
      period: { from, to },
      summary: { ...current.summary, prev_period: prev.summary },
      agents: current.agents,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
