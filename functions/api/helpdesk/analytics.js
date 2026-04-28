import { requireAuth } from "../../_lib/auth.js";
import { helpdeskRequest } from "../../_lib/helpdesk.js";

async function getOrComputeDateRange(env, preset, fromOverride, toOverride) {
  const now = new Date();
  let from, to;

  if (fromOverride && toOverride) {
    from = new Date(fromOverride);
    to = new Date(toOverride);
  } else {
    switch (preset) {
      case "today":
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        to = new Date(from.getTime() + 24 * 60 * 60 * 1000 - 1);
        break;
      case "yesterday":
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        from = new Date(to.getTime() - 24 * 60 * 60 * 1000 + 1);
        break;
      case "last_7_days":
        to = new Date(now.getTime() - 1000);
        from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "last_30_days":
        to = new Date(now.getTime() - 1000);
        from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "this_week":
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        from = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate());
        to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
        break;
      case "last_week":
        const endOfLastWeek = new Date(now);
        endOfLastWeek.setDate(now.getDate() - now.getDay() - 1);
        to = new Date(endOfLastWeek.getFullYear(), endOfLastWeek.getMonth(), endOfLastWeek.getDate() + 1, 23, 59, 59);
        from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "this_month":
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case "last_month":
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      default:
        to = new Date(now.getTime() - 1000);
        from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  return { from, to };
}

function getPreviousPeriod(from, to) {
  const duration = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - duration);
  return { from: prevFrom, to: prevTo };
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

async function getValidatedDailyMetrics(env, from, to, agentIds, groupIds) {
  const dailyMetrics = new Map();
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const ticketsResp = await helpdeskRequest(env, `/tickets?page=${page}&include=messages`, { method: "GET" });
    const tickets = Array.isArray(ticketsResp) ? ticketsResp : ticketsResp.tickets || [];

    if (!tickets || tickets.length === 0) {
      hasMore = false;
      break;
    }

    for (const ticket of tickets) {
      const createdAt = new Date(ticket.created_at || ticket.createdAt);
      const resolvedAt = ticket.resolved_at || ticket.resolvedAt ? new Date(ticket.resolved_at || ticket.resolvedAt) : null;

      if (createdAt < from || createdAt > to) continue;

      if (groupIds && groupIds.length > 0) {
        if (!groupIds.includes(String(ticket.group_id || ticket.groupId))) continue;
      }

      const agentReplies = (ticket.messages || []).filter((msg) => {
        const msgDate = new Date(msg.created_at || msg.createdAt);
        return msgDate >= from && msgDate <= to && (msg.author_type === "agent" || msg.authorType === "agent");
      });

      if (agentReplies.length === 0) continue;

      const agentId = ticket.owner_id || ticket.ownerId;
      if (agentIds && agentIds.length > 0) {
        if (!agentIds.includes(String(agentId))) continue;
      }

      const ticketDate = formatDate(createdAt);
      const key = `${ticketDate}|${agentId}`;

      const ftrMs = agentReplies[0]
        ? Math.max(0, new Date(agentReplies[0].created_at || agentReplies[0].createdAt) - createdAt)
        : 0;

      const resolutionMs = resolvedAt
        ? Math.max(0, resolvedAt - createdAt)
        : null;

      if (!dailyMetrics.has(key)) {
        dailyMetrics.set(key, {
          handled_tickets: 0,
          ftr_values: [],
          resolution_values: [],
        });
      }

      const current = dailyMetrics.get(key);
      current.handled_tickets += 1;
      current.ftr_values.push(ftrMs);
      if (resolutionMs !== null) current.resolution_values.push(resolutionMs);
    }

    page += 1;
    if (tickets.length < 50) hasMore = false;
  }

  const result = new Map();
  for (const [key, data] of dailyMetrics.entries()) {
    const [date, agentId] = key.split("|");
    const avgFtr = data.ftr_values.length > 0
      ? data.ftr_values.reduce((a, b) => a + b, 0) / data.ftr_values.length
      : 0;
    const avgResolution = data.resolution_values.length > 0
      ? data.resolution_values.reduce((a, b) => a + b, 0) / data.resolution_values.length
      : 0;

    result.set(key, {
      date,
      agent_id: agentId,
      handled_tickets: data.handled_tickets,
      avg_ftr_ms: Math.round(avgFtr),
      avg_resolution_time_ms: Math.round(avgResolution),
    });
  }

  return result;
}

export async function onRequest(context) {
  try {
    await requireAuth(context);

    const url = new URL(context.request.url);
    const preset = url.searchParams.get("preset") || "last_7_days";
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");
    const agentsParam = url.searchParams.get("agents");
    const groupsParam = url.searchParams.get("groups");

    const agentIds = agentsParam ? agentsParam.split(",").map((a) => a.trim()) : [];
    const groupIds = groupsParam ? groupsParam.split(",").map((g) => g.trim()) : [];

    const { from, to } = await getOrComputeDateRange(context.env, preset, fromParam, toParam);
    const { from: prevFrom, to: prevTo } = getPreviousPeriod(from, to);

    const currentMetrics = await getValidatedDailyMetrics(context.env, from, to, agentIds, groupIds);
    const prevMetrics = await getValidatedDailyMetrics(context.env, prevFrom, prevTo, agentIds, groupIds);

    const agentsByEmail = new Map();
    const timeline = new Map();
    let totalTickets = 0;
    let ftrValues = [];
    let resolutionValues = [];
    const uniqueAgents = new Set();

    for (const [, data] of currentMetrics.entries()) {
      const { agent_id, date, handled_tickets, avg_ftr_ms, avg_resolution_time_ms } = data;

      uniqueAgents.add(agent_id);
      totalTickets += handled_tickets;
      ftrValues.push(avg_ftr_ms);
      resolutionValues.push(avg_resolution_time_ms);

      if (!agentsByEmail.has(agent_id)) {
        agentsByEmail.set(agent_id, {
          agent_id,
          total_tickets: 0,
          ftr_values: [],
          resolution_values: [],
        });
      }

      const agent = agentsByEmail.get(agent_id);
      agent.total_tickets += handled_tickets;
      agent.ftr_values.push(avg_ftr_ms);
      agent.resolution_values.push(avg_resolution_time_ms);

      if (!timeline.has(date)) {
        timeline.set(date, { date, tickets: 0, ftr_values: [], resolution_values: [] });
      }
      const dayData = timeline.get(date);
      dayData.tickets += handled_tickets;
      dayData.ftr_values.push(avg_ftr_ms);
      dayData.resolution_values.push(avg_resolution_time_ms);
    }

    const avgFtr = ftrValues.length > 0 ? Math.round(ftrValues.reduce((a, b) => a + b, 0) / ftrValues.length) : 0;
    const avgResolution = resolutionValues.length > 0 ? Math.round(resolutionValues.reduce((a, b) => a + b, 0) / resolutionValues.length) : 0;

    let prevTotalTickets = 0;
    let prevFtrValues = [];
    let prevResolutionValues = [];
    let prevUniqueAgents = new Set();

    for (const [, data] of prevMetrics.entries()) {
      prevTotalTickets += data.handled_tickets;
      prevFtrValues.push(data.avg_ftr_ms);
      prevResolutionValues.push(data.avg_resolution_time_ms);
      prevUniqueAgents.add(data.agent_id);
    }

    const prevAvgFtr = prevFtrValues.length > 0 ? Math.round(prevFtrValues.reduce((a, b) => a + b, 0) / prevFtrValues.length) : 0;
    const prevAvgResolution = prevResolutionValues.length > 0 ? Math.round(prevResolutionValues.reduce((a, b) => a + b, 0) / prevResolutionValues.length) : 0;

    const agents = Array.from(agentsByEmail.values()).map((agent) => ({
      agent_id: agent.agent_id,
      total_tickets: agent.total_tickets,
      avg_ftr_ms: agent.ftr_values.length > 0 ? Math.round(agent.ftr_values.reduce((a, b) => a + b, 0) / agent.ftr_values.length) : 0,
      avg_resolution_time_ms: agent.resolution_values.length > 0 ? Math.round(agent.resolution_values.reduce((a, b) => a + b, 0) / agent.resolution_values.length) : 0,
    }));

    const timelineArray = Array.from(timeline.values()).map((day) => ({
      date: day.date,
      tickets: day.tickets,
      avg_ftr_ms: day.ftr_values.length > 0 ? Math.round(day.ftr_values.reduce((a, b) => a + b, 0) / day.ftr_values.length) : 0,
      avg_resolution_time_ms: day.resolution_values.length > 0 ? Math.round(day.resolution_values.reduce((a, b) => a + b, 0) / day.resolution_values.length) : 0,
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    return new Response(
      JSON.stringify({
        period: { from: from.toISOString(), to: to.toISOString() },
        summary: {
          total_tickets: totalTickets,
          avg_ftr_ms: avgFtr,
          avg_resolution_time_ms: avgResolution,
          active_agents: uniqueAgents.size,
          prev_period: {
            total_tickets: prevTotalTickets,
            avg_ftr_ms: prevAvgFtr,
            avg_resolution_time_ms: prevAvgResolution,
            active_agents: prevUniqueAgents.size,
          },
        },
        agents,
        timeline: timelineArray,
        capabilities: {
          per_agent_period_metrics: true,
          per_agent_daily_metrics: false,
          account_daily_timeline: true,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Analytics error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
