import { requireAuth } from "../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed } from "../../_lib/http.js";
import { getHelpDeskDashboard, helpdeskRequest } from "../../_lib/helpdesk.js";

const STATUSES = ["open", "pending", "onhold", "solved", "closed"];
const SILOS = ["tickets", "archive"];
const PAGE_SIZE = 100;
const MAX_PAGES_PER_QUERY = 100;

function isValidDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function parseDateParam(value, name) {
  if (!value) {
    throw new Error(`Missing required param: ${name}`);
  }
  const date = new Date(value);
  if (!isValidDate(date)) {
    throw new Error(`Invalid date format for ${name}`);
  }
  return date;
}

function getPreviousPeriod(from, to) {
  const duration = to.getTime() - from.getTime();
  return {
    from: new Date(from.getTime() - duration),
    to: new Date(from.getTime()),
  };
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function average(values) {
  const usable = values.filter((value) => Number.isFinite(value) && value > 0);
  return usable.length ? Math.round(usable.reduce((sum, value) => sum + value, 0) / usable.length) : 0;
}

function splitParam(value) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function agentMatchesFilters(agentId, teamIds, selectedAgentIds, selectedGroupIds) {
  if (selectedAgentIds.length && !selectedAgentIds.includes(String(agentId))) {
    return false;
  }
  if (selectedGroupIds.length && !teamIds.some((teamId) => selectedGroupIds.includes(String(teamId)))) {
    return false;
  }
  return true;
}

function eventAuthorId(event) {
  return event.author?.ID || event.author?.id || event.authorID || event.authorId || event.createdBy;
}

function isAgentMessage(event) {
  return event?.type === "message" && event.author?.type === "agent" && !event.isPrivate;
}

function firstClientMessageDate(ticket) {
  const clientEvents = (ticket.events || [])
    .filter((event) => event.type === "message" && event.author?.type === "client")
    .map((event) => new Date(event.date || event.createdAt))
    .filter(isValidDate)
    .sort((left, right) => left - right);

  if (clientEvents.length) {
    return clientEvents[0];
  }

  const createdAt = new Date(ticket.createdAt || ticket.created_at);
  return isValidDate(createdAt) ? createdAt : null;
}

function normalizeTicketList(payload) {
  return Array.isArray(payload) ? payload : payload?.tickets || payload?.data || payload?.items || [];
}

async function listTicketsForWindow(env, from, to) {
  const ticketsById = new Map();
  const baseParams = {
    pageSize: String(PAGE_SIZE),
    order: "desc",
    sortBy: "updatedAt",
    updatedDateFrom: from.toISOString(),
    updatedDateTo: to.toISOString(),
  };

  for (const silo of SILOS) {
    for (const status of STATUSES) {
      let nextCursor = null;
      let page = 0;

      do {
        const params = new URLSearchParams({ ...baseParams, silo, status });
        if (nextCursor) {
          params.set("next.value", nextCursor.value);
          params.set("next.ID", nextCursor.id);
        }

        const payload = await helpdeskRequest(env, `/tickets?${params.toString()}`, { method: "GET" });
        const tickets = normalizeTicketList(payload);

        for (const ticket of tickets) {
          const id = ticket.ID || ticket.id;
          if (id) {
            ticketsById.set(String(id), ticket);
          }
        }

        const lastTicket = tickets[tickets.length - 1];
        const lastId = lastTicket?.ID || lastTicket?.id;
        const lastValue = lastTicket?.updatedAt || lastTicket?.updated_at;
        nextCursor = tickets.length === PAGE_SIZE && lastId && lastValue ? { id: String(lastId), value: lastValue } : null;
        page += 1;
      } while (nextCursor && page < MAX_PAGES_PER_QUERY);
    }
  }

  return Array.from(ticketsById.values());
}

function buildAgentDirectory(dashboard) {
  return new Map(
    (dashboard.agents || []).map((agent) => [
      String(agent.id),
      {
        id: String(agent.id),
        email: agent.email || "",
        name: agent.name || agent.email || String(agent.id),
        teams: agent.teams || [],
        teamIDs: (agent.teamIDs || agent.teams?.map((team) => team.id) || []).map(String),
      },
    ]),
  );
}

async function computePeriod(env, from, to, filters, agentDirectory) {
  const tickets = await listTicketsForWindow(env, from, to);
  const dailyByAgent = new Map();

  for (const ticket of tickets) {
    const teamIds = (ticket.teamIDs || ticket.teamIds || []).map(String);
    const firstClientAt = firstClientMessageDate(ticket);

    const agentReplyEvents = (ticket.events || [])
      .filter(isAgentMessage)
      .map((event) => ({ event, date: new Date(event.date || event.createdAt) }))
      .filter(({ date }) => isValidDate(date) && date >= from && date < to)
      .sort((left, right) => left.date - right.date);

    const countedAgents = new Set();
    for (const { event, date } of agentReplyEvents) {
      const agentId = eventAuthorId(event);
      if (!agentId || countedAgents.has(String(agentId))) {
        continue;
      }
      if (!agentMatchesFilters(agentId, teamIds, filters.agentIds, filters.groupIds)) {
        continue;
      }

      countedAgents.add(String(agentId));
      const key = `${dateKey(date)}|${agentId}`;
      if (!dailyByAgent.has(key)) {
        dailyByAgent.set(key, {
          date: dateKey(date),
          agent_id: String(agentId),
          handled_tickets: 0,
          ftr_values: [],
          resolution_values: [],
        });
      }

      const row = dailyByAgent.get(key);
      row.handled_tickets += 1;

      if (firstClientAt && date > firstClientAt) {
        row.ftr_values.push(date.getTime() - firstClientAt.getTime());
      }

      const solvedAt = ticket.solvedAt || ticket.resolvedAt || ticket.closedAt;
      const solvedDate = solvedAt ? new Date(solvedAt) : null;
      if (firstClientAt && isValidDate(solvedDate) && solvedDate > firstClientAt) {
        row.resolution_values.push(solvedDate.getTime() - firstClientAt.getTime());
      }
    }
  }

  const agentsById = new Map();
  const timelineByDate = new Map();
  const summaryFtr = [];
  const summaryResolution = [];
  let totalTickets = 0;

  for (const row of dailyByAgent.values()) {
    const avgFtr = average(row.ftr_values);
    const avgResolution = average(row.resolution_values);
    totalTickets += row.handled_tickets;
    if (avgFtr) summaryFtr.push(avgFtr);
    if (avgResolution) summaryResolution.push(avgResolution);

    if (!agentsById.has(row.agent_id)) {
      const profile = agentDirectory.get(row.agent_id) || {};
      agentsById.set(row.agent_id, {
        agent_id: row.agent_id,
        id: row.agent_id,
        name: profile.name || row.agent_id,
        email: profile.email || row.agent_id,
        total_tickets: 0,
        ftr_values: [],
        resolution_values: [],
        days: [],
      });
    }

    const agent = agentsById.get(row.agent_id);
    agent.total_tickets += row.handled_tickets;
    if (avgFtr) agent.ftr_values.push(avgFtr);
    if (avgResolution) agent.resolution_values.push(avgResolution);
    agent.days.push({
      date: row.date,
      tickets: row.handled_tickets,
      avg_ftr_ms: avgFtr,
      avg_resolution_time_ms: avgResolution,
    });

    if (!timelineByDate.has(row.date)) {
      timelineByDate.set(row.date, { date: row.date, tickets: 0, ftr_values: [], resolution_values: [] });
    }
    const day = timelineByDate.get(row.date);
    day.tickets += row.handled_tickets;
    if (avgFtr) day.ftr_values.push(avgFtr);
    if (avgResolution) day.resolution_values.push(avgResolution);
  }

  const agents = Array.from(agentsById.values())
    .map((agent) => ({
      agent_id: agent.agent_id,
      id: agent.id,
      name: agent.name,
      email: agent.email,
      total_tickets: agent.total_tickets,
      avg_ftr_ms: average(agent.ftr_values),
      avg_resolution_time_ms: average(agent.resolution_values),
      days: agent.days.sort((left, right) => left.date.localeCompare(right.date)),
    }))
    .sort((left, right) => right.total_tickets - left.total_tickets);

  const timeline = Array.from(timelineByDate.values())
    .map((day) => ({
      date: day.date,
      tickets: day.tickets,
      avg_ftr_ms: average(day.ftr_values),
      avg_resolution_time_ms: average(day.resolution_values),
    }))
    .sort((left, right) => left.date.localeCompare(right.date));

  return {
    summary: {
      total_tickets: totalTickets,
      avg_ftr_ms: average(summaryFtr),
      avg_resolution_time_ms: average(summaryResolution),
      active_agents: agents.length,
    },
    agents,
    timeline,
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

  try {
    const url = new URL(context.request.url);
    const from = parseDateParam(url.searchParams.get("from"), "from");
    const to = parseDateParam(url.searchParams.get("to"), "to");

    if (to <= from) {
      return errorResponse("to must be after from", 400);
    }

    const filters = {
      agentIds: splitParam(url.searchParams.get("agents")),
      groupIds: splitParam(url.searchParams.get("groups")),
    };
    const previous = getPreviousPeriod(from, to);
    const dashboard = await getHelpDeskDashboard(context.env);
    const agentDirectory = buildAgentDirectory(dashboard);

    const [current, prev] = await Promise.all([
      computePeriod(context.env, from, to, filters, agentDirectory),
      computePeriod(context.env, previous.from, previous.to, filters, agentDirectory),
    ]);

    return json({
      period: { from: from.toISOString(), to: to.toISOString() },
      summary: { ...current.summary, prev_period: prev.summary },
      agents: current.agents,
      timeline: current.timeline,
      capabilities: {
        per_agent_period_metrics: true,
        per_agent_daily_metrics: true,
        account_daily_timeline: true,
        source: "ticket_events",
      },
    });
  } catch (error) {
    const message = error.message || "HelpDesk analytics failed.";
    const status = message.startsWith("Missing required param") || message.startsWith("Invalid date") ? 400 : 500;
    return errorResponse(message, status);
  }
}
