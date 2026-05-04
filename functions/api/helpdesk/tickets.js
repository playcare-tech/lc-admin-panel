import { requireAuth } from "../../_lib/auth.js";
import {
  buildHelpDeskAgentDirectory,
  getHelpDeskDashboard,
  helpdeskRequest,
  normalizeHelpDeskTicketList,
  normalizeHelpDeskTicketSummary,
} from "../../_lib/helpdesk.js";
import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../../_lib/http.js";
import { writeLog } from "../../_lib/logs.js";

const ACTIVE_STATUSES = ["open", "pending", "onhold"];
const ALL_STATUSES = ["open", "pending", "onhold", "solved", "closed"];
const DEFAULT_PAGE_SIZE = 80;
const MAX_PAGE_SIZE = 100;

function clampPageSize(value) {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed)) return DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.max(10, parsed));
}

function requestedStatuses(value) {
  if (!value || value === "active") return ACTIVE_STATUSES;
  if (value === "all") return ALL_STATUSES;
  if (ALL_STATUSES.includes(value)) return [value];
  return ACTIVE_STATUSES;
}

async function fetchTicketBatch(env, { status, pageSize, sortBy = "lastMessageAt", order = "desc" }) {
  const params = new URLSearchParams({
    status,
    pageSize: String(pageSize),
    order,
    sortBy,
    eventsScope: "none",
  });

  return normalizeHelpDeskTicketList(await helpdeskRequest(env, `/tickets?${params.toString()}`));
}

function uniqueSortedTickets(tickets) {
  const byId = new Map();
  for (const ticket of tickets) {
    if (ticket.id && !byId.has(ticket.id)) {
      byId.set(ticket.id, ticket);
    }
  }

  return Array.from(byId.values()).sort((left, right) => {
    const leftDate = left.lastMessageAt || left.updatedAt || left.createdAt || "";
    const rightDate = right.lastMessageAt || right.updatedAt || right.createdAt || "";
    return rightDate.localeCompare(leftDate);
  });
}

async function listTickets(context) {
  const url = new URL(context.request.url);
  const pageSize = clampPageSize(url.searchParams.get("pageSize"));
  const statuses = requestedStatuses(url.searchParams.get("status"));

  const dashboard = await getHelpDeskDashboard(context.env);
  const agentDirectory = buildHelpDeskAgentDirectory(dashboard);
  const batches = await Promise.all(
    statuses.map((status) => fetchTicketBatch(context.env, { status, pageSize })),
  );
  const tickets = uniqueSortedTickets(
    batches.flat().map((ticket) => normalizeHelpDeskTicketSummary(ticket, agentDirectory)),
  ).slice(0, pageSize);

  return json({
    tickets,
    statuses,
    updatedAt: new Date().toISOString(),
    refreshIntervalSeconds: 15,
  });
}

async function mergeTickets(context, auth) {
  const body = await readJson(context.request);
  const parentTicketId = `${body.parentTicketId || ""}`.trim();
  const childTicketIds = Array.isArray(body.childTicketIds)
    ? body.childTicketIds.map((value) => `${value || ""}`.trim()).filter(Boolean)
    : [];
  const uniqueChildTicketIds = [...new Set(childTicketIds)].filter((ticketId) => ticketId !== parentTicketId);

  if (!parentTicketId) {
    return errorResponse("Parent ticket ID is required.", 400);
  }
  if (!uniqueChildTicketIds.length) {
    return errorResponse("At least one child ticket is required.", 400);
  }

  for (const childTicketId of uniqueChildTicketIds) {
    await helpdeskRequest(context.env, `/tickets/${encodeURIComponent(parentTicketId)}/childTickets`, {
      method: "POST",
      body: { childTicketID: childTicketId },
    });
  }

  await writeLog(context.env, {
    actor: auth.session.user,
    area: "helpdesk",
    action: "merge_tickets",
    target: parentTicketId,
    status: "success",
    details: `Merged ${uniqueChildTicketIds.length} HelpDesk ticket(s).`,
    metadata: {
      parentTicketId,
      childTicketIds: uniqueChildTicketIds,
    },
  });

  return json({
    ok: true,
    parentTicketId,
    mergedTicketIds: uniqueChildTicketIds,
  });
}

export async function onRequest(context) {
  if (!["GET", "POST"].includes(context.request.method)) {
    return methodNotAllowed(["GET", "POST"]);
  }

  const auth = await requireAuth(context);
  if (auth.error) return auth.error;

  try {
    if (context.request.method === "GET") {
      return await listTickets(context);
    }

    return await mergeTickets(context, auth);
  } catch (error) {
    if (context.request.method === "POST") {
      await writeLog(context.env, {
        actor: auth.session.user,
        area: "helpdesk",
        action: "merge_tickets",
        target: "unknown",
        status: "error",
        details: "Failed to merge HelpDesk tickets.",
      });
    }
    return serverErrorResponse(error, "Failed to manage HelpDesk tickets.");
  }
}
