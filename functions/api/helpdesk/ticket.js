import { requireAuth } from "../../_lib/auth.js";
import {
  buildHelpDeskAgentDirectory,
  getHelpDeskDashboard,
  helpdeskRequest,
  normalizeHelpDeskTicketDetail,
  normalizeHelpDeskTicketList,
  normalizeHelpDeskTicketSummary,
} from "../../_lib/helpdesk.js";
import { errorResponse, json, methodNotAllowed, serverErrorResponse } from "../../_lib/http.js";

const REQUESTER_STATUSES = ["open", "pending", "onhold", "solved", "closed"];
const REQUESTER_PAGE_SIZE = 100;
const MAX_REQUESTER_TICKETS = 120;

async function fetchRequesterTicketBatch(env, { status, email }) {
  const params = new URLSearchParams({
    status,
    query: email,
    pageSize: String(REQUESTER_PAGE_SIZE),
    order: "desc",
    sortBy: "createdAt",
    eventsScope: "none",
  });

  return normalizeHelpDeskTicketList(await helpdeskRequest(env, `/tickets?${params.toString()}`));
}

function sameRequester(ticket, email) {
  return `${ticket.requesterEmail || ticket.requester?.email || ""}`.trim().toLowerCase() === email;
}

function uniqueRequesterTickets(tickets, currentTicket) {
  const byId = new Map();
  for (const ticket of [currentTicket, ...tickets]) {
    if (ticket?.id && !byId.has(ticket.id)) {
      byId.set(ticket.id, ticket);
    }
  }

  return Array.from(byId.values())
    .sort((left, right) => (right.createdAt || "").localeCompare(left.createdAt || ""))
    .slice(0, MAX_REQUESTER_TICKETS);
}

async function requesterTickets(env, requesterEmail, currentTicket, agentDirectory) {
  const email = `${requesterEmail || ""}`.trim().toLowerCase();
  if (!email) return [currentTicket];

  const batches = await Promise.all(
    REQUESTER_STATUSES.map((status) => fetchRequesterTicketBatch(env, { status, email })),
  );
  const tickets = batches
    .flat()
    .map((ticket) => normalizeHelpDeskTicketSummary(ticket, agentDirectory))
    .filter((ticket) => sameRequester(ticket, email));

  return uniqueRequesterTickets(tickets, currentTicket);
}

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const auth = await requireAuth(context);
  if (auth.error) return auth.error;

  try {
    const url = new URL(context.request.url);
    const ticketId = `${url.searchParams.get("id") || ""}`.trim();
    if (!ticketId) {
      return errorResponse("Ticket ID is required.", 400);
    }

    const dashboard = await getHelpDeskDashboard(context.env);
    const agentDirectory = buildHelpDeskAgentDirectory(dashboard);
    const rawTicket = await helpdeskRequest(context.env, `/tickets/${encodeURIComponent(ticketId)}`);
    const ticket = normalizeHelpDeskTicketDetail(rawTicket, agentDirectory);
    ticket.requesterTickets = await requesterTickets(
      context.env,
      ticket.requesterEmail,
      normalizeHelpDeskTicketSummary(rawTicket, agentDirectory),
      agentDirectory,
    );

    return json({ ticket });
  } catch (error) {
    return serverErrorResponse(error, "Failed to load HelpDesk ticket.");
  }
}
