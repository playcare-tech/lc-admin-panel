import { requireAuth } from "../../_lib/auth.js";
import {
  buildHelpDeskAgentDirectory,
  getHelpDeskDashboard,
  helpdeskRequest,
  helpdeskRequestWithMeta,
  normalizeHelpDeskTicketList,
  normalizeHelpDeskTicketSummary,
} from "../../_lib/helpdesk.js";
import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../../_lib/http.js";
import { writeLog } from "../../_lib/logs.js";

const ACTIVE_STATUSES = ["open", "pending", "onhold"];
const ALL_STATUSES = ["open", "pending", "onhold", "solved", "closed"];
const FOLDERS = ["archive", "spam", "trash"];
const DEFAULT_PAGE_SIZE = 40;
const MAX_PAGE_SIZE = 40;
const SORT_FIELDS = ["createdAt", "updatedAt", "lastMessageAt"];
const PRIORITIES = new Set(["-10", "0", "10", "20"]);

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

function safeSortBy(value) {
  return SORT_FIELDS.includes(value) ? value : "lastMessageAt";
}

function safeOrder(value) {
  return value === "asc" ? "asc" : "desc";
}

function safeSilo(value) {
  if (!value || value === "tickets") return "tickets";
  return FOLDERS.includes(value) ? value : "tickets";
}

function safePriority(value) {
  return PRIORITIES.has(`${value}`) ? `${value}` : "";
}

function appendDateRange(params, fromName, toName, fromValue, toValue) {
  if (fromValue) params.set(fromName, fromValue);
  if (toValue) params.set(toName, toValue);
}

function ticketListParams({ status, silo, pageSize, sortBy, order, filters = {}, cursor = null }) {
  const params = new URLSearchParams({
    pageSize: String(pageSize),
    order,
    sortBy,
    eventsScope: "none",
  });

  if (status && status !== "all") params.set("status", status);
  if (silo && silo !== "tickets") params.set("silo", silo);
  if (filters.priority) {
    params.set("priority", filters.priority);
    params.set("priorityOp", "eq");
  }
  if (filters.tagId) params.append("tagIDs[]", filters.tagId);

  appendDateRange(params, "createdDateFrom", "createdDateTo", filters.createdDateFrom, filters.createdDateTo);
  appendDateRange(params, "updatedDateFrom", "updatedDateTo", filters.updatedDateFrom, filters.updatedDateTo);
  appendDateRange(params, "lastMessageFrom", "lastMessageTo", filters.lastMessageFrom, filters.lastMessageTo);

  if (cursor?.direction && cursor.value && cursor.id) {
    params.set(`${cursor.direction}.value`, cursor.value);
    params.set(`${cursor.direction}.ID`, cursor.id);
  }

  return params;
}

async function fetchTicketBatch(env, options) {
  const params = ticketListParams(options);
  const { payload, headers } = await helpdeskRequestWithMeta(env, `/tickets?${params.toString()}`);
  return {
    tickets: normalizeHelpDeskTicketList(payload),
    totalResults: Number(headers.get("X-Total-Results") || 0),
    totalPages: Number(headers.get("X-Total-Pages") || 0),
  };
}

function uniqueSortedTickets(tickets, sortBy, order) {
  const byId = new Map();
  for (const ticket of tickets) {
    if (ticket.id && !byId.has(ticket.id)) {
      byId.set(ticket.id, ticket);
    }
  }

  return Array.from(byId.values()).sort((left, right) => {
    const leftDate = left[sortBy] || left.lastMessageAt || left.updatedAt || left.createdAt || "";
    const rightDate = right[sortBy] || right.lastMessageAt || right.updatedAt || right.createdAt || "";
    return order === "asc" ? leftDate.localeCompare(rightDate) : rightDate.localeCompare(leftDate);
  });
}

function cursorForTicket(ticket, sortBy) {
  if (!ticket?.id) return null;
  const value = ticket[sortBy] || ticket.lastMessageAt || ticket.updatedAt || ticket.createdAt || "";
  if (!value) return null;
  return {
    value,
    id: ticket.id,
  };
}

function normalizeTicketFilters(url) {
  return {
    createdDateFrom: url.searchParams.get("createdDateFrom") || "",
    createdDateTo: url.searchParams.get("createdDateTo") || "",
    updatedDateFrom: url.searchParams.get("updatedDateFrom") || "",
    updatedDateTo: url.searchParams.get("updatedDateTo") || "",
    lastMessageFrom: url.searchParams.get("lastMessageFrom") || "",
    lastMessageTo: url.searchParams.get("lastMessageTo") || "",
    priority: safePriority(url.searchParams.get("priority") || ""),
    tagId: url.searchParams.get("tagId") || "",
  };
}

function normalizeCursor(url) {
  const direction = url.searchParams.get("cursorDirection");
  const value = url.searchParams.get("cursorValue");
  const id = url.searchParams.get("cursorId");
  if (!["next", "prev"].includes(direction) || !value || !id) return null;
  return { direction, value, id };
}

async function ticketCount(env, { status, silo, filters }) {
  const result = await fetchTicketBatch(env, {
    status,
    silo,
    pageSize: 1,
    sortBy: "createdAt",
    order: "desc",
    filters,
  });
  return result.totalResults || result.tickets.length;
}

async function ticketCounts(env, filters) {
  const statusEntries = await Promise.all(
    ALL_STATUSES.map(async (status) => [status, await ticketCount(env, { status, silo: "tickets", filters })]),
  );

  return {
    statuses: Object.fromEntries(statusEntries),
  };
}

async function ticketTags(env) {
  let tags = [];
  try {
    tags = await helpdeskRequest(env, "/tags");
  } catch (error) {
    console.warn("Failed to load HelpDesk tags.", error);
  }
  return (Array.isArray(tags) ? tags : [])
    .map((tag) => ({
      id: String(tag.ID || tag.id || ""),
      name: tag.name || "",
      count: Number(tag.count || 0),
    }))
    .filter((tag) => tag.id && tag.name)
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function listTickets(context) {
  const url = new URL(context.request.url);
  const pageSize = clampPageSize(url.searchParams.get("pageSize"));
  const statusParam = url.searchParams.get("status") || "open";
  const statuses = requestedStatuses(statusParam);
  const status = statuses.length === 1 ? statuses[0] : "all";
  const silo = safeSilo(url.searchParams.get("silo"));
  const sortBy = safeSortBy(url.searchParams.get("sortBy"));
  const order = safeOrder(url.searchParams.get("order"));
  const filters = normalizeTicketFilters(url);
  const cursor = normalizeCursor(url);
  const includeCounts = url.searchParams.get("includeCounts") !== "0";

  const dashboard = await getHelpDeskDashboard(context.env);
  const agentDirectory = buildHelpDeskAgentDirectory(dashboard);
  const [batches, counts, tags] = await Promise.all([
    Promise.all(
      statuses.map((item) =>
        fetchTicketBatch(context.env, {
          status: item,
          silo,
          pageSize,
          sortBy,
          order,
          filters,
          cursor: statuses.length === 1 ? cursor : null,
        }),
      ),
    ),
    includeCounts ? ticketCounts(context.env, filters) : Promise.resolve(null),
    includeCounts ? ticketTags(context.env) : Promise.resolve(null),
  ]);
  const allTickets = uniqueSortedTickets(
    batches.flatMap((batch) => batch.tickets).map((ticket) => normalizeHelpDeskTicketSummary(ticket, agentDirectory)),
    sortBy,
    order,
  );
  const tickets = allTickets.slice(0, pageSize);
  const totalResults = batches.reduce((sum, batch) => sum + Number(batch.totalResults || batch.tickets.length || 0), 0);
  const totalPages = statuses.length === 1 ? batches[0]?.totalPages || 0 : Math.ceil(totalResults / pageSize);

  return json({
    tickets,
    status,
    silo,
    ...(counts ? { counts } : {}),
    ...(tags ? { tags } : {}),
    updatedAt: new Date().toISOString(),
    refreshIntervalSeconds: 30,
    page: {
      pageSize,
      totalResults,
      totalPages,
      sortBy,
      order,
      nextCursor: statuses.length === 1 ? cursorForTicket(tickets.at(-1), sortBy) : null,
      prevCursor: statuses.length === 1 ? cursorForTicket(tickets[0], sortBy) : null,
      cursorPagination: statuses.length === 1,
    },
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
