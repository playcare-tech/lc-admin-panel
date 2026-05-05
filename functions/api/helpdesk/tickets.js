import { requireAuth } from "../../_lib/auth.js";
import {
  buildHelpDeskAgentDirectory,
  getHelpDeskDashboard,
  helpdeskRequest,
  helpdeskRequestWithMeta,
  normalizeHelpDeskConversationEvents,
  normalizeHelpDeskTicketList,
  normalizeHelpDeskTicketSummary,
} from "../../_lib/helpdesk.js";
import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../../_lib/http.js";
import { listLogsByAction, writeLog, writeLogSafely } from "../../_lib/logs.js";
import {
  lastHelpdeskWorkflowRunAt,
  listEnabledHelpdeskWorkflows,
  recordHelpdeskWorkflowRun,
} from "../../_lib/helpdesk-workflows.js";

const ACTIVE_STATUSES = ["open", "pending", "onhold"];
const ALL_STATUSES = ["open", "pending", "onhold", "solved", "closed"];
const FOLDERS = ["archive", "spam", "trash"];
const DEFAULT_PAGE_SIZE = 40;
const MAX_PAGE_SIZE = 40;
const AUTO_MERGE_PAGE_SIZE = 100;
const AUTO_MERGE_MAX_PAGES = 10;
const AUTO_MERGE_ACTION = "auto_merge_duplicate_tickets";
const AUTO_RESOLVE_WORKFLOW_TYPE = "auto_resolve_requester";
const AUTO_MERGE_WORKFLOW_TYPE = "auto_merge_duplicates";
const SORT_FIELDS = ["createdAt", "updatedAt", "lastMessageAt"];
const PRIORITIES = new Set(["-10", "0", "10", "20"]);
const STATUSES = new Set(["open", "pending", "onhold", "solved", "closed"]);

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

function dateKey(value, timezoneOffsetMinutes = 0) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - timezoneOffsetMinutes * 60000).toISOString().slice(0, 10);
}

function requesterKey(ticket) {
  return `${ticket.requesterEmail || ticket.requester?.email || ""}`.trim().toLowerCase();
}

function ticketCreatedTime(ticket) {
  const date = new Date(ticket.createdAt || 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function stripHtml(value) {
  return `${value || ""}`.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function ticketLink(ticket) {
  return ticket.link || `https://app.helpdesk.com/tickets/${encodeURIComponent(ticket.short_id || ticket.id)}`;
}

function preserveTeamPayload(ticket) {
  const teamIDs = Array.isArray(ticket?.teamIDs) ? ticket.teamIDs.map(String).filter(Boolean) : [];
  const teamId = String(ticket?.assignment?.team?.ID || ticket?.assignment?.team?.id || "").trim();
  const agentId = String(ticket?.assignment?.agent?.ID || ticket?.assignment?.agent?.id || "").trim();
  const assignment = {};

  if (teamId) assignment.team = { ID: teamId };
  if (agentId) assignment.agent = { ID: agentId };

  return {
    ...(teamIDs.length ? { teamIDs } : {}),
    ...(Object.keys(assignment).length ? { assignment } : {}),
  };
}

function eventMessageText(event) {
  return stripHtml(event.text || event.html || event.activity || "");
}

function mergedTicketContent(ticket, agentDirectory) {
  const events = normalizeHelpDeskConversationEvents(ticket, agentDirectory);
  const messageEvents = events
    .filter((event) => eventMessageText(event))
    .map((event) => {
      const author = event.author_name || event.author_email || event.author_type || "unknown";
      const date = event.date ? ` at ${event.date}` : "";
      return `[${author}${date}] ${eventMessageText(event)}`;
    });

  if (messageEvents.length) {
    return messageEvents.join("\n\n").slice(0, 12000);
  }

  return stripHtml(ticket.subject || "No message content found.").slice(0, 12000);
}

function internalMergeNote(parentTicket, childTicket, childContent, mode = "automatic") {
  const childId = childTicket.short_id || childTicket.id;
  const mergeLabel = mode === "manual" ? "Manual duplicate merge" : "Automatic duplicate merge";
  return [
    `${mergeLabel} from ticket ${childId}.`,
    `Merged ticket link: ${ticketLink(childTicket)}`,
    "",
    "Merged ticket content:",
    childContent || "No message content found.",
  ].join("\n");
}

async function addInternalMergeNote(env, parentTicket, childTicket, childContent, mode = "automatic") {
  await helpdeskRequest(env, `/tickets/${encodeURIComponent(parentTicket.id)}`, {
    method: "PATCH",
    body: {
      author: { type: "agent" },
      message: {
        text: internalMergeNote(parentTicket, childTicket, childContent, mode),
      },
      isPrivate: true,
    },
  });
}

async function mergeChildTicket(env, parentTicket, childTicket) {
  await helpdeskRequest(env, `/tickets/${encodeURIComponent(parentTicket.id)}/childTickets`, {
    method: "POST",
    body: { childTicketID: childTicket.id },
  });
}

async function mergeChildTicketPreservingTeam(env, parentDetail, parentTicket, childTicket, childContent, mode = "automatic") {
  const preservedTeam = preserveTeamPayload(parentDetail);
  await addInternalMergeNote(env, parentTicket, childTicket, childContent, mode);
  await mergeChildTicket(env, parentTicket, childTicket);

  if (Object.keys(preservedTeam).length) {
    await helpdeskRequest(env, `/tickets/${encodeURIComponent(parentTicket.id)}`, {
      method: "PATCH",
      body: preservedTeam,
    });
  }
}

function workflowIntervalMinutes(workflow) {
  const configured = Number(workflow.config?.intervalMinutes);
  if (Number.isFinite(configured) && configured > 0) return configured;
  return workflow.type === AUTO_MERGE_WORKFLOW_TYPE ? 30 : 5;
}

async function workflowRunDue(env, workflow) {
  const lastRunAt = await lastHelpdeskWorkflowRunAt(env, workflow.id);
  if (!lastRunAt) return true;
  const lastRunMs = new Date(lastRunAt).getTime();
  if (!Number.isFinite(lastRunMs)) return true;
  return Date.now() - lastRunMs >= workflowIntervalMinutes(workflow) * 60 * 1000;
}

async function patchTicketStatusAndTags(env, ticket, status, tagIds) {
  const ticketId = ticket.id || ticket.ticket_id;
  if (!ticketId) return null;

  const currentTagIds = new Set((ticket.tagIDs || []).map(String).filter(Boolean));
  for (const tagId of tagIds || []) {
    currentTagIds.add(String(tagId));
  }

  const nextTagIds = Array.from(currentTagIds);
  const hasAllTags = (tagIds || []).every((tagId) => currentTagIds.has(String(tagId)));
  if (ticket.status === status && hasAllTags) {
    return null;
  }

  await helpdeskRequest(env, `/tickets/${encodeURIComponent(ticketId)}`, {
    method: "PATCH",
    body: {
      status,
      tagIDs: nextTagIds,
      ...preserveTeamPayload(ticket),
    },
  });

  return {
    ticketId,
    shortId: ticket.short_id || ticket.shortID || ticketId,
    link: ticketLink(ticket),
  };
}

async function runAutoResolveWorkflow(context, workflow, openTickets) {
  const config = workflow.config || {};
  const requesterEmail = `${config.requesterEmail || ""}`.trim().toLowerCase();
  const status = `${config.status || "solved"}`.trim().toLowerCase();
  const tagIds = Array.isArray(config.tagIds) ? config.tagIds.map(String).filter(Boolean) : [];
  const tagNames = Array.isArray(config.tagNames) ? config.tagNames : [];

  if (!requesterEmail || !STATUSES.has(status)) {
    throw new Error("Auto-resolve workflow has invalid configuration.");
  }

  const changedTickets = [];
  const matches = openTickets.filter((ticket) => requesterKey(ticket) === requesterEmail);
  for (const ticket of matches) {
    const changed = await patchTicketStatusAndTags(context.env, ticket, status, tagIds);
    if (changed) changedTickets.push(changed);
  }

  return {
    details: `Auto-resolved ${changedTickets.length} ticket(s) for ${requesterEmail}.`,
    metadata: {
      type: workflow.type,
      requesterEmail,
      status,
      tagIds,
      tagNames,
      matchedTickets: matches.length,
      changedTickets,
    },
  };
}

async function runAutoMergeWorkflow(context, auth, workflow, timezoneOffsetMinutes) {
  const result = await autoMergeDuplicateOpenTickets(context, auth, timezoneOffsetMinutes);
  return {
    details: `Auto-merged ${result.merged.length} duplicate ticket(s).`,
    metadata: {
      type: workflow.type,
      mergedTickets: result.merged,
    },
  };
}

async function runWorkflowSafely(context, auth, workflow, timezoneOffsetMinutes, openTickets) {
  const startedAt = new Date().toISOString();
  try {
    const result =
      workflow.type === AUTO_MERGE_WORKFLOW_TYPE
        ? await runAutoMergeWorkflow(context, auth, workflow, timezoneOffsetMinutes)
        : await runAutoResolveWorkflow(context, workflow, openTickets);
    const finishedAt = new Date().toISOString();

    await recordHelpdeskWorkflowRun(context.env, {
      workflowId: workflow.id,
      workflowTitle: workflow.title,
      status: "success",
      startedAt,
      finishedAt,
      details: result.details,
      metadata: result.metadata,
    });
    await writeLogSafely(context.env, {
      actor: auth.session.user,
      area: "helpdesk",
      action: "run_workflow",
      target: workflow.id,
      status: "success",
      details: result.details,
      metadata: {
        workflowId: workflow.id,
        workflowTitle: workflow.title,
        ...result.metadata,
      },
    });

    return {
      workflowId: workflow.id,
      status: "success",
      details: result.details,
    };
  } catch (error) {
    const finishedAt = new Date().toISOString();
    await recordHelpdeskWorkflowRun(context.env, {
      workflowId: workflow.id,
      workflowTitle: workflow.title,
      status: "error",
      startedAt,
      finishedAt,
      details: error.message || "Workflow failed.",
      metadata: {
        type: workflow.type,
      },
    });
    await writeLogSafely(context.env, {
      actor: auth.session.user,
      area: "helpdesk",
      action: "run_workflow",
      target: workflow.id,
      status: "error",
      details: error.message || "Workflow failed.",
      metadata: {
        workflowId: workflow.id,
        workflowTitle: workflow.title,
        type: workflow.type,
      },
    });

    return {
      workflowId: workflow.id,
      status: "error",
      details: error.message || "Workflow failed.",
    };
  }
}

async function runEnabledHelpdeskWorkflows(context, auth, timezoneOffsetMinutes) {
  const workflows = await listEnabledHelpdeskWorkflows(context.env);
  if (!workflows.length) return [];

  const dueWorkflows = [];
  for (const workflow of workflows) {
    if ([AUTO_MERGE_WORKFLOW_TYPE, AUTO_RESOLVE_WORKFLOW_TYPE].includes(workflow.type) && (await workflowRunDue(context.env, workflow))) {
      dueWorkflows.push(workflow);
    }
  }
  if (!dueWorkflows.length) return [];
  dueWorkflows.sort((left, right) => {
    if (left.type === right.type) return 0;
    return left.type === AUTO_RESOLVE_WORKFLOW_TYPE ? -1 : 1;
  });

  let openTickets = null;
  if (dueWorkflows.some((workflow) => workflow.type === AUTO_RESOLVE_WORKFLOW_TYPE)) {
    openTickets = await fetchOpenTicketsForAutoMerge(context.env, timezoneOffsetMinutes);
  }

  const runs = [];
  for (const workflow of dueWorkflows) {
    runs.push(await runWorkflowSafely(context, auth, workflow, timezoneOffsetMinutes, openTickets || []));
  }

  return runs;
}

async function fetchOpenTicketsForAutoMerge(env, timezoneOffsetMinutes) {
  const tickets = [];
  let cursor = null;

  for (let page = 0; page < AUTO_MERGE_MAX_PAGES; page += 1) {
    const batch = await fetchTicketBatch(env, {
      status: "open",
      silo: "tickets",
      pageSize: AUTO_MERGE_PAGE_SIZE,
      sortBy: "createdAt",
      order: "desc",
      filters: {},
      cursor,
    });
    const normalized = batch.tickets.map((ticket) => normalizeHelpDeskTicketSummary(ticket));
    tickets.push(...normalized);
    const lastTicket = normalized.at(-1);
    if (!lastTicket || normalized.length < AUTO_MERGE_PAGE_SIZE) break;
    cursor = {
      direction: "next",
      value: lastTicket.createdAt,
      id: lastTicket.id,
    };
  }

  return tickets.filter((ticket) => {
    return ticket.status === "open" && ticket.silo === "tickets" && !ticket.parentTicket && requesterKey(ticket) && dateKey(ticket.createdAt, timezoneOffsetMinutes);
  });
}

function duplicateGroups(tickets, timezoneOffsetMinutes) {
  const groups = new Map();
  for (const ticket of tickets) {
    const key = `${requesterKey(ticket)}|${dateKey(ticket.createdAt, timezoneOffsetMinutes)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(ticket);
  }

  return Array.from(groups.entries())
    .map(([key, groupTickets]) => {
      const [requesterEmail, createdDate] = key.split("|");
      const sorted = [...groupTickets].sort((left, right) => ticketCreatedTime(left) - ticketCreatedTime(right));
      return {
        requesterEmail,
        createdDate,
        parent: sorted[0],
        children: sorted.slice(1),
      };
    })
    .filter((group) => group.children.length);
}

async function autoMergeDuplicateOpenTickets(context, auth, timezoneOffsetMinutes) {
  const tickets = await fetchOpenTicketsForAutoMerge(context.env, timezoneOffsetMinutes);
  const groups = duplicateGroups(tickets, timezoneOffsetMinutes);
  const dashboard = await getHelpDeskDashboard(context.env);
  const agentDirectory = buildHelpDeskAgentDirectory(dashboard);
  const merged = [];

  for (const group of groups) {
    const parentDetail = await helpdeskRequest(context.env, `/tickets/${encodeURIComponent(group.parent.id)}`);
    const parentTicket = normalizeHelpDeskTicketSummary(parentDetail, agentDirectory);
    if (parentTicket.status !== "open" || parentTicket.parentTicket) continue;

    for (const child of group.children) {
      try {
        const childDetail = await helpdeskRequest(context.env, `/tickets/${encodeURIComponent(child.id)}`);
        const childTicket = normalizeHelpDeskTicketSummary(childDetail, agentDirectory);
        if (childTicket.parentTicket || childTicket.status !== "open") continue;

        const childContent = mergedTicketContent(childDetail, agentDirectory);
        await mergeChildTicketPreservingTeam(context.env, parentDetail, parentTicket, childTicket, childContent);

        const logMetadata = {
          mode: "automatic",
          requesterEmail: group.requesterEmail,
          createdDate: group.createdDate,
          parentTicketId: parentTicket.id,
          parentShortId: parentTicket.short_id || parentTicket.shortID,
          parentSubject: parentTicket.subject || "",
          parentLink: ticketLink(parentTicket),
          childTicketId: childTicket.id,
          childShortId: childTicket.short_id || childTicket.shortID,
          childSubject: childTicket.subject || "",
          childLink: ticketLink(childTicket),
          mergedContentPreview: childContent.slice(0, 1000),
        };

        await writeLogSafely(context.env, {
          actor: auth.session.user,
          area: "helpdesk",
          action: AUTO_MERGE_ACTION,
          target: parentTicket.id,
          status: "success",
          details: `Auto-merged duplicate ticket ${childTicket.short_id || childTicket.id} into ${parentTicket.short_id || parentTicket.id}.`,
          metadata: logMetadata,
        });

        merged.push(logMetadata);
      } catch (error) {
        await writeLogSafely(context.env, {
          actor: auth.session.user,
          area: "helpdesk",
          action: AUTO_MERGE_ACTION,
          target: group.parent.id,
          status: "error",
          details: "Failed to auto-merge duplicate HelpDesk ticket.",
          metadata: {
            mode: "automatic",
            requesterEmail: group.requesterEmail,
            createdDate: group.createdDate,
            parentTicketId: group.parent.id,
            childTicketId: child.id,
          },
        });
      }
    }
  }

  return { merged };
}

async function mergeLogs(env) {
  try {
    const [autoLogs, manualLogs] = await Promise.all([
      listLogsByAction(env, {
        area: "helpdesk",
        action: AUTO_MERGE_ACTION,
        limit: 12,
      }),
      listLogsByAction(env, {
        area: "helpdesk",
        action: "merge_tickets",
        limit: 12,
      }),
    ]);

    return [...autoLogs, ...manualLogs]
      .filter((entry) => entry.status === "success")
      .sort((left, right) => `${right.created_at || ""}`.localeCompare(`${left.created_at || ""}`))
      .slice(0, 12);
  } catch (error) {
    console.error("Failed to load HelpDesk merge logs.", error);
    return [];
  }
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
  try {
    const statusEntries = await Promise.all(
      ALL_STATUSES.map(async (status) => [status, await ticketCount(env, { status, silo: "tickets", filters })]),
    );

    return {
      statuses: Object.fromEntries(statusEntries),
    };
  } catch (error) {
    console.error("Failed to load HelpDesk ticket counts.", error);
    return null;
  }
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

async function helpdeskAgentDirectory(env) {
  try {
    return buildHelpDeskAgentDirectory(await getHelpDeskDashboard(env));
  } catch (error) {
    console.error("Failed to load HelpDesk agent directory.", error);
    return new Map();
  }
}

async function listTickets(context, auth) {
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
  const timezoneOffsetMinutes = Number(url.searchParams.get("tzOffset") || 0);
  const shouldRunWorkflows =
    url.searchParams.get("workflows") !== "0" && status === "open" && silo === "tickets" && !cursor;

  let workflowRuns = [];
  if (shouldRunWorkflows) {
    try {
      workflowRuns = await runEnabledHelpdeskWorkflows(context, auth, timezoneOffsetMinutes);
    } catch (error) {
      console.error("Failed to run HelpDesk workflows.", error);
      await writeLogSafely(context.env, {
        actor: auth.session.user,
        area: "helpdesk",
        action: "run_workflows",
        target: "open_tickets",
        status: "error",
        details: "HelpDesk workflow scan failed.",
      });
    }
  }

  const agentDirectory = await helpdeskAgentDirectory(context.env);
  const [batches, counts, tags, recentMergeLogs] = await Promise.all([
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
    includeCounts ? mergeLogs(context.env) : Promise.resolve(null),
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
    ...(recentMergeLogs ? { mergeLogs: recentMergeLogs } : {}),
    workflowRuns,
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

  const dashboard = await getHelpDeskDashboard(context.env);
  const agentDirectory = buildHelpDeskAgentDirectory(dashboard);
  const parentDetail = await helpdeskRequest(context.env, `/tickets/${encodeURIComponent(parentTicketId)}`);
  const parentTicket = normalizeHelpDeskTicketSummary(parentDetail, agentDirectory);
  const childDetails = await Promise.all(
    uniqueChildTicketIds.map((ticketId) => helpdeskRequest(context.env, `/tickets/${encodeURIComponent(ticketId)}`)),
  );
  const childTickets = childDetails.map((ticket) => normalizeHelpDeskTicketSummary(ticket, agentDirectory));
  const childDetailById = new Map(childTickets.map((ticket, index) => [ticket.id, childDetails[index]]));
  const mergedTicketDetails = [];

  for (const childTicket of childTickets) {
    const childDetail = childDetailById.get(childTicket.id);
    const childContent = mergedTicketContent(childDetail, agentDirectory);
    await mergeChildTicketPreservingTeam(context.env, parentDetail, parentTicket, childTicket, childContent, "manual");
    mergedTicketDetails.push({
      childTicketId: childTicket.id,
      childShortId: childTicket.short_id || childTicket.shortID,
      childSubject: childTicket.subject || "",
      childLink: ticketLink(childTicket),
      mergedContentPreview: childContent.slice(0, 1000),
    });
  }

  await writeLog(context.env, {
    actor: auth.session.user,
    area: "helpdesk",
    action: "merge_tickets",
    target: parentTicketId,
    status: "success",
    details: `Merged ${childTickets.length} HelpDesk ticket(s).`,
    metadata: {
      mode: "manual",
      parentTicketId,
      parentShortId: parentTicket.short_id || parentTicket.shortID,
      parentSubject: parentTicket.subject || "",
      parentLink: ticketLink(parentTicket),
      childTicketIds: childTickets.map((ticket) => ticket.id),
      mergedTickets: mergedTicketDetails,
    },
  });

  return json({
    ok: true,
    parentTicketId,
    mergedTicketIds: childTickets.map((ticket) => ticket.id),
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
      return await listTickets(context, auth);
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
