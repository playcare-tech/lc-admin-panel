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
  lastAnyHelpdeskWorkflowRunAt,
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
const WORKFLOW_OPEN_TICKETS_MAX_PAGES = 10;
const AUTO_MERGE_MAX_PAGES = 5;
const AUTO_MERGE_DETAIL_LOOKUP_LIMIT = 12;
const AUTO_MERGE_MAX_MERGES_PER_RUN = 2;
const AUTO_RESOLVE_PAGE_SIZE = 100;
const AUTO_RESOLVE_SOURCE_STATUSES = ["open", "pending", "onhold", "solved"];
const AUTO_RESOLVE_MAX_CHANGES_PER_RUN = 20;
const WORKFLOW_AUTOMATIC_RUN_INTERVAL_MINUTES = 5;
const MARKETING_SPAM_TAG_NAME = "wf_spam";
const MARKETING_SPAM_RECENT_OPEN_PAGE_SIZE = 40;
const MARKETING_SPAM_RECENT_OPEN_MAX_PAGES = 3;
const MARKETING_SPAM_MIN_CANDIDATES_PER_RUN = 15;
const AUTO_MERGE_ACTION = "auto_merge_duplicate_tickets";
const AUTO_RESOLVE_WORKFLOW_TYPE = "auto_resolve_requester";
const AUTO_REPLY_WORKFLOW_TYPE = "auto_reply_new_requester_ticket";
const AUTO_REPLY_EMPTY_REQUESTER_WORKFLOW_TYPE = "auto_reply_empty_requester_ticket";
const AUTO_MERGE_WORKFLOW_TYPE = "auto_merge_duplicates";
const AUTO_MERGE_6H_WORKFLOW_TYPE = "auto_merge_6h_rule";
const AUTO_MARKETING_SPAM_WORKFLOW_TYPE = "auto_resolve_marketing_spam";
const RUNNABLE_WORKFLOW_TYPES = new Set([
  AUTO_RESOLVE_WORKFLOW_TYPE,
  AUTO_REPLY_WORKFLOW_TYPE,
  AUTO_REPLY_EMPTY_REQUESTER_WORKFLOW_TYPE,
  AUTO_MERGE_WORKFLOW_TYPE,
  AUTO_MERGE_6H_WORKFLOW_TYPE,
  AUTO_MARKETING_SPAM_WORKFLOW_TYPE,
]);
const WORKFLOW_TYPE_ORDER = {
  [AUTO_RESOLVE_WORKFLOW_TYPE]: 0,
  [AUTO_MARKETING_SPAM_WORKFLOW_TYPE]: 1,
  [AUTO_REPLY_WORKFLOW_TYPE]: 2,
  [AUTO_REPLY_EMPTY_REQUESTER_WORKFLOW_TYPE]: 3,
  [AUTO_MERGE_WORKFLOW_TYPE]: 4,
  [AUTO_MERGE_6H_WORKFLOW_TYPE]: 5,
};
const SORT_FIELDS = ["createdAt", "updatedAt", "lastMessageAt"];
const PRIORITIES = new Set(["-10", "0", "10", "20"]);
const STATUSES = new Set(["open", "pending", "onhold", "solved", "closed"]);
const KNOWN_AUTO_REPLY_MESSAGE = [
  "Dear player,",
  "",
  "Thank you for reaching out to us. This email confirms that we have received your request and will get back to you as soon as possible. Please note that our response time may be longer than usual due to a high volume of incoming requests.",
  "",
  "We appreciate your patience in the meantime.",
  "",
  "Best regards,",
  "",
  "Customer Support Team",
].join("\n");
const MARKETING_HIGH_CONFIDENCE_PHRASES = [
  "backlink",
  "link building",
  "guest post",
  "high-quality websites",
  "boost your rankings",
  "sponsored post",
  "advertising opportunity",
  "increase traffic",
  "improve rankings",
  "domain authority",
  "casino backlinks",
  "seo services",
];
const MARKETING_MEDIUM_CONFIDENCE_PHRASES = [
  "seo",
  "partnership",
  "digital marketing",
  "marketing services",
  "content writing",
  "outreach specialist",
  "lead generation",
  "write for you",
  "partnership opportunity",
  "streamer",
  "affiliates",
  "web design services",
  "app development services",
];
const MARKETING_LOW_CONFIDENCE_PHRASES = [
  "link",
  "opportunities",
  "i found your website",
  "your website",
  "collaboration",
  "collaborate",
  "promote your",
  "high quality content",
];
const MARKETING_SPAM_DEFAULT_KEYWORDS = [
  "partnership",
  "SEO",
  "link",
  "high-quality websites",
  "Boost Your Rankings",
  "guest post",
  "opportunities",
  "streamer",
  "affiliates",
];
const MARKETING_SPAM_SEARCH_TERMS = [
  "seo",
  "guest post",
  "partnership",
  "link",
  "high-quality websites",
  "boost your rankings",
  "streamer",
  "affiliates",
  "backlink",
  "link building",
  "opportunities",
  "sponsored post",
  "advertising",
  "marketing services",
  "digital marketing",
  "domain authority",
  "lead generation",
];
const SUPPORT_EXCLUSION_PHRASES = [
  "complaint",
  "withdrawal",
  "deposit",
  "payment",
  "refund",
  "account",
  "verification",
  "kyc",
  "bonus",
  "login",
  "blocked",
  "self-exclusion",
  "gambling problem",
];

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

function safePositiveInteger(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function autoMergeLimits(workflow) {
  const config = workflow?.config || {};
  return {
    maxPages: safePositiveInteger(config.maxPages, AUTO_MERGE_MAX_PAGES, 10),
    maxDetailLookups: safePositiveInteger(config.maxDetailLookups, AUTO_MERGE_DETAIL_LOOKUP_LIMIT, 25),
    maxMergesPerRun: safePositiveInteger(config.maxMergesPerRun, AUTO_MERGE_MAX_MERGES_PER_RUN, 5),
  };
}

function autoMergeSixHourLimits(workflow) {
  const config = workflow?.config || {};
  return {
    maxPages: safePositiveInteger(config.maxPages, AUTO_MERGE_MAX_PAGES, 10),
    maxGroupsPerRun: safePositiveInteger(config.maxGroupsPerRun, 3, 10),
    maxMergesPerRun: safePositiveInteger(config.maxMergesPerRun, 3, 10),
    windowHours: safePositiveInteger(config.windowHours, 6, 24),
  };
}

function appendDateRange(params, fromName, toName, fromValue, toValue) {
  if (fromValue) params.set(fromName, fromValue);
  if (toValue) params.set(toName, toValue);
}

async function helpdeskTags(env) {
  const payload = await helpdeskRequest(env, "/tags");
  return (Array.isArray(payload) ? payload : payload?.tags || payload?.data || payload?.items || [])
    .map((tag) => ({
      id: String(tag.ID || tag.id || ""),
      name: tag.name || "",
    }))
    .filter((tag) => tag.id && tag.name);
}

async function resolveHelpdeskTagIds(env, tagNames) {
  const names = [...new Set((tagNames || []).map((tag) => `${tag || ""}`.trim()).filter(Boolean))];
  if (!names.length) return [];

  const tags = await helpdeskTags(env);
  const byName = new Map(tags.map((tag) => [tag.name.trim().toLowerCase(), tag.id]));
  const byId = new Map(tags.map((tag) => [tag.id, tag.id]));
  const tagIds = [];
  const missing = [];

  for (const tagName of names) {
    const id = byName.get(tagName.toLowerCase()) || byId.get(tagName);
    if (id) {
      tagIds.push(id);
    } else {
      missing.push(tagName);
    }
  }

  if (missing.length) {
    throw new Error(`HelpDesk tag not found: ${missing.join(", ")}.`);
  }

  return [...new Set(tagIds)];
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

function textIncludesPhrase(text, phrase) {
  const comparableText = ` ${normalizedComparableMessage(text)} `;
  const comparablePhrase = ` ${normalizedComparableMessage(phrase)} `;
  return comparableText.includes(comparablePhrase);
}

function textMatchingPhrases(text, phrases) {
  return phrases.filter((phrase) => textIncludesPhrase(text, phrase));
}

function uniquePhrases(phrases) {
  const seen = new Set();
  const unique = [];
  for (const phrase of phrases || []) {
    const value = `${phrase || ""}`.trim();
    const key = normalizedComparableMessage(value);
    if (!value || !key || seen.has(key)) continue;
    seen.add(key);
    unique.push(value);
  }
  return unique;
}

function uniqueMatchedPhrases(text, phrases, seen = new Set()) {
  const matches = [];
  for (const phrase of textMatchingPhrases(text, uniquePhrases(phrases))) {
    const key = normalizedComparableMessage(phrase);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    matches.push(phrase);
  }
  return matches;
}

function splitWorkflowPhrases(value) {
  const phrases = Array.isArray(value) ? value : `${value || ""}`.split(",");
  return uniquePhrases(phrases.map((phrase) => `${phrase || ""}`.trim()).filter(Boolean));
}

function marketingSpamConfiguredKeywords(config = {}) {
  const configuredKeywords = splitWorkflowPhrases(config.keywords || config.phrases || config.customPhrases);
  return configuredKeywords.length ? configuredKeywords : MARKETING_SPAM_DEFAULT_KEYWORDS;
}

function marketingSpamSearchTerms(config = {}) {
  const configuredTerms = splitWorkflowPhrases(config.searchTerms);
  const configuredKeywords = marketingSpamConfiguredKeywords(config);
  return uniquePhrases([
    ...configuredKeywords,
    ...(configuredTerms.length ? configuredTerms : MARKETING_SPAM_SEARCH_TERMS),
  ]);
}

function normalizedComparableMessage(value) {
  return stripHtml(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isKnownAutoReplyText(value) {
  return normalizedComparableMessage(value) === normalizedComparableMessage(KNOWN_AUTO_REPLY_MESSAGE);
}

function ticketLink(ticket) {
  return ticket.link || `https://app.helpdesk.com/tickets/${encodeURIComponent(ticket.short_id || ticket.id)}`;
}

function preserveTeamPayload(ticket) {
  const teamIDs = Array.isArray(ticket?.teamIDs) ? ticket.teamIDs.map(String).filter(Boolean) : [];
  const teamId = String(ticket?.assignment?.team?.ID || ticket?.assignment?.team?.id || "").trim();
  const agentId = String(ticket?.assignment?.agent?.ID || ticket?.assignment?.agent?.id || "").trim();
  const assignment = {};

  if (agentId) assignment.agent = { ID: agentId };
  if (teamId && agentId) assignment.team = { ID: teamId };

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
  const mergeLabel =
    mode === "manual"
      ? "Manual duplicate merge"
      : mode === "automatic_6h_rule"
        ? "Automatic 6h requester merge"
        : "Automatic duplicate merge";
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
  return WORKFLOW_AUTOMATIC_RUN_INTERVAL_MINUTES;
}

function dateMs(value) {
  const parsed = value ? new Date(value).getTime() : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function elapsedMinutesSince(value) {
  const lastMs = dateMs(value);
  if (!lastMs) return Number.POSITIVE_INFINITY;
  return (Date.now() - lastMs) / 60000;
}

async function workflowRunInfo(env, workflow) {
  const lastRunAt = await lastHelpdeskWorkflowRunAt(env, workflow.id);
  return {
    workflow,
    lastRunAt,
    lastRunMs: dateMs(lastRunAt),
    due: elapsedMinutesSince(lastRunAt) >= workflowIntervalMinutes(workflow),
  };
}

async function automaticWorkflowRunDue(env) {
  const lastRunAt = await lastAnyHelpdeskWorkflowRunAt(env);
  return elapsedMinutesSince(lastRunAt) >= WORKFLOW_AUTOMATIC_RUN_INTERVAL_MINUTES;
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

async function fetchAutoResolveTicketBatch(env, { status, email, cursor }) {
  const params = new URLSearchParams({
    status,
    query: email,
    pageSize: String(AUTO_RESOLVE_PAGE_SIZE),
    order: "desc",
    sortBy: "createdAt",
    eventsScope: "none",
  });

  if (cursor?.value && cursor.id) {
    params.set("next.value", cursor.value);
    params.set("next.ID", cursor.id);
  }

  const payload = await helpdeskRequest(env, `/tickets?${params.toString()}`);
  return normalizeHelpDeskTicketList(payload).map((ticket) => normalizeHelpDeskTicketSummary(ticket));
}

async function fetchRequesterTicketsForAutoResolve(env, requesterEmail, options = {}) {
  const email = `${requesterEmail || ""}`.trim().toLowerCase();
  const statuses = options.statuses || AUTO_RESOLVE_SOURCE_STATUSES;
  const maxPagesPerStatus = safePositiveInteger(options.maxPagesPerStatus, 2, 5);
  const tickets = [];

  for (const status of statuses) {
    let cursor = null;
    for (let page = 0; page < maxPagesPerStatus; page += 1) {
      const batch = await fetchAutoResolveTicketBatch(env, { status, email, cursor });
      tickets.push(...batch);
      const lastTicket = batch.at(-1);
      if (!lastTicket || batch.length < AUTO_RESOLVE_PAGE_SIZE) break;
      cursor = {
        value: lastTicket.createdAt,
        id: lastTicket.id,
      };
    }
  }

  const byId = new Map();
  for (const ticket of tickets) {
    if (
      ticket.id &&
      !byId.has(ticket.id) &&
      requesterKey(ticket) === email &&
      ticket.silo === "tickets" &&
      !ticket.parentTicket
    ) {
      byId.set(ticket.id, ticket);
    }
  }

  return Array.from(byId.values()).sort((left, right) => {
    return (right.createdAt || "").localeCompare(left.createdAt || "");
  });
}

async function fetchMarketingSpamCandidates(env, options = {}) {
  const searchTerms = Array.isArray(options.searchTerms) && options.searchTerms.length
    ? options.searchTerms
    : MARKETING_SPAM_SEARCH_TERMS;
  const maxSearchTerms = safePositiveInteger(options.maxSearchTerms, 8, Math.max(searchTerms.length, MARKETING_SPAM_SEARCH_TERMS.length));
  const pageSize = safePositiveInteger(options.pageSize, 50, 100);
  const recentOpenPages = safePositiveInteger(options.recentOpenPages, MARKETING_SPAM_RECENT_OPEN_MAX_PAGES, MARKETING_SPAM_RECENT_OPEN_MAX_PAGES);
  const recentPageSize = safePositiveInteger(options.recentPageSize, MARKETING_SPAM_RECENT_OPEN_PAGE_SIZE, 100);
  const byId = new Map();
  const searchGroups = [];
  const addCandidate = (ticket) => {
    if (ticket.id && ticket.status === "open" && ticket.silo === "tickets" && !ticket.parentTicket && !byId.has(ticket.id)) {
      byId.set(ticket.id, ticket);
    }
  };

  for (const term of searchTerms.slice(0, maxSearchTerms)) {
    const params = new URLSearchParams({
      status: "open",
      query: term,
      pageSize: String(pageSize),
      order: "desc",
      sortBy: "createdAt",
      eventsScope: "none",
    });
    const payload = await helpdeskRequest(env, `/tickets?${params.toString()}`);
    const tickets = normalizeHelpDeskTicketList(payload).map((ticket) => normalizeHelpDeskTicketSummary(ticket));
    searchGroups.push(tickets);
  }

  const longestSearchGroup = Math.max(0, ...searchGroups.map((tickets) => tickets.length));
  for (let index = 0; index < longestSearchGroup; index += 1) {
    for (const tickets of searchGroups) {
      const ticket = tickets[index];
      if (!ticket) continue;
      addCandidate(ticket);
    }
  }

  let cursor = null;
  for (let page = 0; page < recentOpenPages; page += 1) {
    const batch = await fetchTicketBatch(env, {
      status: "open",
      silo: "tickets",
      pageSize: recentPageSize,
      sortBy: "createdAt",
      order: "desc",
      filters: {},
      cursor,
    });
    const tickets = batch.tickets.map((ticket) => normalizeHelpDeskTicketSummary(ticket));
    for (const ticket of tickets) {
      addCandidate(ticket);
    }
    const lastTicket = tickets.at(-1);
    if (!lastTicket || tickets.length < recentPageSize) break;
    cursor = {
      direction: "next",
      value: lastTicket.createdAt,
      id: lastTicket.id,
    };
  }

  return Array.from(byId.values());
}

async function runAutoResolveWorkflow(context, workflow) {
  const config = workflow.config || {};
  const requesterEmail = `${config.requesterEmail || ""}`.trim().toLowerCase();
  const status = `${config.status || "solved"}`.trim().toLowerCase();
  const configuredTagIds = Array.isArray(config.tagIds) ? config.tagIds.map(String).filter(Boolean) : [];
  const tagNames = Array.isArray(config.tagNames) ? config.tagNames : [];
  const tagIds = configuredTagIds.length ? configuredTagIds : await resolveHelpdeskTagIds(context.env, tagNames);
  const maxChangesPerRun = safePositiveInteger(config.maxChangesPerRun, AUTO_RESOLVE_MAX_CHANGES_PER_RUN, 40);

  if (!requesterEmail || !STATUSES.has(status)) {
    throw new Error("Auto-resolve workflow has invalid configuration.");
  }

  const matches = await fetchRequesterTicketsForAutoResolve(context.env, requesterEmail, {
    maxPagesPerStatus: config.maxPagesPerStatus,
  });
  const changedTickets = [];
  for (const ticket of matches) {
    if (changedTickets.length >= maxChangesPerRun) break;
    const changed = await patchTicketStatusAndTags(context.env, ticket, status, tagIds);
    if (changed) changedTickets.push(changed);
  }
  const changeLimitReached = changedTickets.length >= maxChangesPerRun && matches.length > changedTickets.length;

  return {
    details: `Auto-resolved ${changedTickets.length} ticket(s) for ${requesterEmail} after checking ${matches.length} matching ticket(s).${changeLimitReached ? " More matches will be processed on the next run." : ""}`,
    metadata: {
      type: workflow.type,
      requesterEmail,
      status,
      tagIds,
      tagNames,
      matchedTickets: matches.length,
      changedTickets,
      changeLimitReached,
      maxChangesPerRun,
    },
  };
}

function workflowCreatedAfter(workflow) {
  const configured = workflow.config?.createdAfter || workflow.createdAt || "";
  const date = configured ? new Date(configured) : null;
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
}

function candidateCreatedAt(ticket) {
  const date = ticket.createdAt ? new Date(ticket.createdAt) : null;
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
}

function comparableAgentValue(value) {
  return `${value || ""}`.trim().toLowerCase();
}

async function resolveWorkflowAgent(env, config) {
  const senderAgentId = `${config.senderAgentId || ""}`.trim();
  const senderEmail = `${config.senderEmail || config.senderAgentEmail || ""}`.trim().toLowerCase();
  const senderName = `${config.senderName || config.sender || ""}`.trim();
  if (!senderAgentId && !senderEmail && !senderName) {
    throw new Error("Auto-reply workflow has no sender configured.");
  }

  const dashboard = await getHelpDeskDashboard(env);
  const agents = dashboard.agents || [];
  if (senderAgentId) {
    const exactAgent = agents.find((agent) => agent.id === senderAgentId);
    if (exactAgent) return exactAgent;
  }

  if (senderEmail) {
    const exactAgent = agents.find((agent) => comparableAgentValue(agent.email) === senderEmail);
    if (exactAgent) return exactAgent;
  }

  const senderKey = comparableAgentValue(senderName || senderEmail || senderAgentId);
  const exactMatches = agents.filter((agent) => {
    return [agent.id, agent.email, agent.name].some((value) => comparableAgentValue(value) === senderKey);
  });
  if (exactMatches.length === 1) return exactMatches[0];
  if (exactMatches.length > 1) {
    throw new Error(`Auto-reply sender "${senderName}" matches multiple HelpDesk agents.`);
  }

  const prefixMatches = agents.filter((agent) => comparableAgentValue(agent.name).startsWith(senderKey));
  if (prefixMatches.length === 1) return prefixMatches[0];
  if (prefixMatches.length > 1) {
    throw new Error(`Auto-reply sender "${senderName}" matches multiple HelpDesk agents.`);
  }

  throw new Error(`Auto-reply sender "${senderName || senderEmail || senderAgentId}" was not found in HelpDesk agents.`);
}

function eventPublicMessageText(event) {
  if (event.is_private) return "";
  return stripHtml(event.text || event.html || "");
}

function isRequesterMessageAuthor(event) {
  const authorType = `${event.author_type || ""}`.trim().toLowerCase();
  return ["client", "requester", "customer"].includes(authorType);
}

function normalizedMessageText(value) {
  return stripHtml(value).replace(/\s+/g, " ").trim().toLowerCase();
}

function duplicateEmailContent(ticketDetail, agentDirectory = new Map()) {
  const events = normalizeHelpDeskConversationEvents(ticketDetail, agentDirectory);
  const firstRequesterMessage = events.find((event) => {
    return isRequesterMessageAuthor(event) && eventPublicMessageText(event);
  });
  const messageText = normalizedMessageText(eventPublicMessageText(firstRequesterMessage || {}));
  if (!messageText) return null;

  return {
    key: messageText,
    preview: eventPublicMessageText(firstRequesterMessage).slice(0, 1000),
  };
}

function ticketAlreadyHasAutoReply(events, messageText) {
  const expected = normalizedMessageText(messageText);
  if (!expected) return false;
  return events.some((event) => !event.is_private && normalizedMessageText(event.text || event.html || "") === expected);
}

function emptyRequesterTicketMatch(ticket, events, messageText) {
  if (ticketAlreadyHasAutoReply(events, messageText)) {
    return {
      matched: false,
      reason: "already_replied",
    };
  }

  const publicEvents = events.filter((event) => !event.is_private);
  const publicMessageEvents = publicEvents.filter((event) => eventPublicMessageText(event));
  const publicAgentMessages = publicMessageEvents.filter((event) => `${event.author_type || ""}`.trim().toLowerCase() === "agent");
  if (publicAgentMessages.length) {
    return {
      matched: false,
      reason: "has_agent_reply",
    };
  }

  const requesterEvents = publicEvents.filter((event) => isRequesterMessageAuthor(event));
  const requesterMessageTexts = requesterEvents.map((event) => eventPublicMessageText(event)).filter(Boolean);
  if (requesterMessageTexts.length) {
    return {
      matched: false,
      reason: "requester_message_not_empty",
      messagePreview: requesterMessageTexts.join("\n\n").slice(0, 500),
    };
  }

  const nonSystemPublicEvents = publicEvents.filter((event) => {
    const authorType = `${event.author_type || ""}`.trim().toLowerCase();
    return authorType && authorType !== "system";
  });
  if (requesterEvents.length || (!publicMessageEvents.length && !nonSystemPublicEvents.length && requesterKey(ticket))) {
    return {
      matched: true,
      reason: requesterEvents.length ? "empty_requester_message" : "no_public_message_text",
    };
  }

  const firstPublicMessage = publicMessageEvents[0];
  return {
    matched: false,
    reason: firstPublicMessage ? `first_public_author:${firstPublicMessage.author_type || "unknown"}` : "no_requester_event",
  };
}

async function replyAndSetTicketStatus(env, ticket, senderAgent, messageText, status) {
  await helpdeskRequest(env, `/tickets/${encodeURIComponent(ticket.id)}`, {
    method: "PATCH",
    body: {
      status,
      author: {
        type: "agent",
        ID: senderAgent.id,
      },
      message: {
        text: messageText,
      },
      isPrivate: false,
      ...preserveTeamPayload(ticket),
    },
  });
}

function marketingSpamMatch(ticket, events, threshold, configuredKeywords = []) {
  const publicMessageEvents = events.filter((event) => eventPublicMessageText(event));
  const requesterMessageEvents = publicMessageEvents.filter((event) => isRequesterMessageAuthor(event));
  if (!requesterMessageEvents.length) {
    const firstPublicMessage = publicMessageEvents[0];
    return {
      matched: false,
      reason: firstPublicMessage ? `no_requester_message:first_public_author:${firstPublicMessage.author_type || "unknown"}` : "no_public_message",
    };
  }

  const requesterMessage = requesterMessageEvents.map((event) => eventPublicMessageText(event)).join("\n\n");
  const seenPhrases = new Set();
  const custom = uniqueMatchedPhrases(requesterMessage, configuredKeywords, seenPhrases);
  if (custom.length) {
    return {
      matched: true,
      reason: "keyword_matched",
      score: custom.length * 2,
      matchedPhrases: custom,
      messagePreview: requesterMessage.slice(0, 500),
    };
  }

  const realAgentMessages = publicMessageEvents.filter((event) => {
    return `${event.author_type || ""}`.trim().toLowerCase() === "agent" && !isKnownAutoReplyText(eventPublicMessageText(event));
  });
  if (realAgentMessages.length) {
    return {
      matched: false,
      reason: "has_real_agent_reply",
    };
  }

  const subjectAndMessage = `${ticket.subject || ""} ${requesterMessage}`;
  const supportExclusions = textMatchingPhrases(subjectAndMessage, SUPPORT_EXCLUSION_PHRASES);
  if (supportExclusions.length) {
    return {
      matched: false,
      reason: "support_terms",
      supportExclusions,
    };
  }

  const high = uniqueMatchedPhrases(subjectAndMessage, MARKETING_HIGH_CONFIDENCE_PHRASES, seenPhrases);
  const medium = uniqueMatchedPhrases(subjectAndMessage, MARKETING_MEDIUM_CONFIDENCE_PHRASES, seenPhrases);
  const low = uniqueMatchedPhrases(subjectAndMessage, MARKETING_LOW_CONFIDENCE_PHRASES, seenPhrases);
  const score = high.length * 3 + medium.length * 2 + low.length;
  const matchedPhrases = [...high, ...medium, ...low];
  const thresholdMatched = score >= threshold;

  return {
    matched: thresholdMatched,
    reason: thresholdMatched ? "matched" : "score_below_threshold",
    score,
    matchedPhrases,
    messagePreview: requesterMessage.slice(0, 500),
  };
}

async function runMarketingSpamWorkflow(context, workflow) {
  const config = workflow.config || {};
  const status = `${config.status || "solved"}`.trim().toLowerCase();
  const tagNames = Array.isArray(config.tagNames) && config.tagNames.length ? config.tagNames : [MARKETING_SPAM_TAG_NAME];
  const configuredTagIds = Array.isArray(config.tagIds) ? config.tagIds.map(String).filter(Boolean) : [];
  const tagIds = configuredTagIds.length ? configuredTagIds : await resolveHelpdeskTagIds(context.env, tagNames);
  const scoreThreshold = safePositiveInteger(config.scoreThreshold, 4, 20);
  const maxCandidatesPerRun = Math.max(
    safePositiveInteger(config.maxCandidatesPerRun, MARKETING_SPAM_MIN_CANDIDATES_PER_RUN, MARKETING_SPAM_MIN_CANDIDATES_PER_RUN),
    MARKETING_SPAM_MIN_CANDIDATES_PER_RUN,
  );
  const configuredKeywords = marketingSpamConfiguredKeywords(config);
  const searchTerms = marketingSpamSearchTerms(config);
  const maxSearchTerms = Math.max(
    safePositiveInteger(config.maxSearchTerms, 8, 9),
    configuredKeywords.length ? Math.min(configuredKeywords.length, 9) : 0,
  );
  const tickets = await fetchMarketingSpamCandidates(context.env, {
    maxSearchTerms,
    pageSize: config.searchPageSize,
    recentOpenPages: config.recentOpenPages,
    recentPageSize: config.recentPageSize,
    searchTerms,
  });
  const candidates = tickets.slice(0, maxCandidatesPerRun);
  const changedTickets = [];
  const skippedTickets = [];

  if (!STATUSES.has(status)) {
    throw new Error("Marketing spam workflow has invalid status configuration.");
  }

  for (const candidate of candidates) {
    const ticketDetail = await helpdeskRequest(context.env, `/tickets/${encodeURIComponent(candidate.id)}`);
    const ticket = normalizeHelpDeskTicketSummary(ticketDetail);
    if (ticket.status !== "open" || ticket.parentTicket) continue;

    const events = normalizeHelpDeskConversationEvents(ticketDetail);
    const match = marketingSpamMatch(ticket, events, scoreThreshold, configuredKeywords);
    if (!match.matched) {
      skippedTickets.push({
        ticketId: ticket.id,
        shortId: ticket.short_id,
        reason: match.reason,
        score: match.score || 0,
        matchedPhrases: match.matchedPhrases || [],
      });
      continue;
    }

    const changed = await patchTicketStatusAndTags(context.env, ticket, status, tagIds);
    if (changed) {
      changedTickets.push({
        ...changed,
        score: match.score,
        matchedPhrases: match.matchedPhrases,
        messagePreview: match.messagePreview,
      });
    }
  }

  const candidateLimitReached = tickets.length > candidates.length;
  return {
    details: `Auto-resolved ${changedTickets.length} marketing spam ticket(s) with ${tagNames.join(", ")}.${candidateLimitReached ? " More candidates will be checked on the next run." : ""}`,
    metadata: {
      type: workflow.type,
      status,
      tagIds,
      tagNames,
      keywords: configuredKeywords,
      scoreThreshold,
      scannedTickets: candidates.length,
      changedTickets,
      skippedTickets,
      candidateLimitReached,
    },
  };
}

async function runAutoReplyWorkflow(context, workflow, openTickets) {
  const config = workflow.config || {};
  const messageText = `${config.messageText || config.message || ""}`.trim();
  if (!messageText) {
    throw new Error("Auto-reply workflow has no message text configured.");
  }

  const senderAgent = await resolveWorkflowAgent(context.env, config);
  const createdAfterMs = workflowCreatedAfter(workflow);
  const candidates = openTickets.filter((ticket) => {
    return ticket.status === "open" && candidateCreatedAt(ticket) >= createdAfterMs;
  });
  const repliedTickets = [];
  const skippedTickets = [];

  for (const candidate of candidates) {
    const ticketDetail = await helpdeskRequest(context.env, `/tickets/${encodeURIComponent(candidate.id)}`);
    const normalizedTicket = normalizeHelpDeskTicketSummary(ticketDetail);
    if (normalizedTicket.status !== "open" || normalizedTicket.parentTicket) {
      continue;
    }

    const events = normalizeHelpDeskConversationEvents(ticketDetail);
    const publicMessageEvents = events.filter((event) => eventPublicMessageText(event));
    const firstPublicMessage = publicMessageEvents[0];
    const hasAgentPublicMessage = publicMessageEvents.some((event) => event.author_type === "agent");

    if (!firstPublicMessage || firstPublicMessage.author_type !== "client" || hasAgentPublicMessage) {
      skippedTickets.push({
        ticketId: normalizedTicket.id,
        shortId: normalizedTicket.short_id,
        reason: firstPublicMessage ? `first_public_author:${firstPublicMessage.author_type || "unknown"}` : "no_public_message",
      });
      continue;
    }
    if (ticketAlreadyHasAutoReply(events, messageText)) {
      continue;
    }

    await helpdeskRequest(context.env, `/tickets/${encodeURIComponent(normalizedTicket.id)}`, {
      method: "PATCH",
      body: {
        author: {
          type: "agent",
          ID: senderAgent.id,
        },
        message: {
          text: messageText,
        },
        isPrivate: false,
      },
    });

    repliedTickets.push({
      ticketId: normalizedTicket.id,
      shortId: normalizedTicket.short_id,
      link: ticketLink(normalizedTicket),
      requesterEmail: normalizedTicket.requesterEmail,
    });
  }

  return {
    details: `Auto-replied to ${repliedTickets.length} new requester ticket(s).`,
    metadata: {
      type: workflow.type,
      senderAgentId: senderAgent.id,
      senderName: senderAgent.name,
      candidates: candidates.length,
      repliedTickets,
      skippedTickets,
    },
  };
}

async function runEmptyRequesterReplyWorkflow(context, workflow) {
  const config = workflow.config || {};
  const messageText = `${config.messageText || config.message || ""}`.trim();
  const status = `${config.status || "solved"}`.trim().toLowerCase();
  const maxPages = safePositiveInteger(config.maxPages, 3, 5);
  const maxCandidatesPerRun = safePositiveInteger(config.maxCandidatesPerRun, 10, 15);

  if (!messageText) {
    throw new Error("Empty requester workflow has no message text configured.");
  }
  if (!STATUSES.has(status)) {
    throw new Error("Empty requester workflow has invalid status configuration.");
  }

  const senderAgent = await resolveWorkflowAgent(context.env, config);
  const tickets = await fetchOpenTicketsForAutoMerge(context.env, maxPages);
  const candidates = tickets.slice(0, maxCandidatesPerRun);
  const repliedTickets = [];
  const skippedTickets = [];

  for (const candidate of candidates) {
    const ticketDetail = await helpdeskRequest(context.env, `/tickets/${encodeURIComponent(candidate.id)}`);
    const normalizedTicket = normalizeHelpDeskTicketSummary(ticketDetail);
    if (normalizedTicket.status !== "open" || normalizedTicket.parentTicket) {
      continue;
    }

    const events = normalizeHelpDeskConversationEvents(ticketDetail);
    const match = emptyRequesterTicketMatch(normalizedTicket, events, messageText);
    if (!match.matched) {
      skippedTickets.push({
        ticketId: normalizedTicket.id,
        shortId: normalizedTicket.short_id,
        reason: match.reason,
        messagePreview: match.messagePreview || "",
      });
      continue;
    }

    await replyAndSetTicketStatus(context.env, normalizedTicket, senderAgent, messageText, status);
    repliedTickets.push({
      ticketId: normalizedTicket.id,
      shortId: normalizedTicket.short_id,
      link: ticketLink(normalizedTicket),
      requesterEmail: normalizedTicket.requesterEmail,
      reason: match.reason,
    });
  }

  const candidateLimitReached = tickets.length > candidates.length;
  return {
    details: `Auto-replied to and ${status} ${repliedTickets.length} empty requester ticket(s).${candidateLimitReached ? " More candidates will be checked on the next run." : ""}`,
    metadata: {
      type: workflow.type,
      status,
      senderAgentId: senderAgent.id,
      senderName: senderAgent.name,
      senderEmail: senderAgent.email,
      candidates: candidates.length,
      repliedTickets,
      skippedTickets,
      candidateLimitReached,
    },
  };
}

async function runAutoMergeWorkflow(context, auth, workflow) {
  const result = await autoMergeDuplicateOpenTickets(context, auth, workflow);
  const limitText = result.detailLimitReached || result.mergeLimitReached ? " More candidates will be checked on the next run." : "";
  return {
    details: `Auto-merged ${result.merged.length} duplicate ticket(s) after checking ${result.detailLookups} ticket detail(s).${limitText}`,
    metadata: {
      type: workflow.type,
      mergedTickets: result.merged,
      mergeErrors: result.mergeErrors,
      scannedTickets: result.scannedTickets,
      duplicateGroups: result.duplicateGroups,
      detailLookups: result.detailLookups,
      detailLimitReached: result.detailLimitReached,
      mergeLimitReached: result.mergeLimitReached,
      limits: result.limits,
    },
  };
}

function sixHourRequesterMergeGroups(tickets, limits) {
  const groups = [];
  const windowMs = limits.windowHours * 60 * 60 * 1000;
  const requesterGroups = requesterTicketGroups(tickets);

  for (const requesterGroup of requesterGroups) {
    const sorted = [...requesterGroup.tickets]
      .filter((ticket) => ticketCreatedTime(ticket) > 0)
      .sort((left, right) => ticketCreatedTime(left) - ticketCreatedTime(right));
    if (sorted.length < 2) continue;

    const latestTicket = sorted.at(-1);
    const latestCreatedMs = ticketCreatedTime(latestTicket);
    const windowStartMs = latestCreatedMs - windowMs;
    const windowTickets = sorted.filter((ticket) => {
      const createdMs = ticketCreatedTime(ticket);
      return createdMs >= windowStartMs && createdMs <= latestCreatedMs;
    });

    if (windowTickets.length < 2) continue;
    groups.push({
      requesterEmail: requesterGroup.requesterEmail,
      windowStart: new Date(windowStartMs).toISOString(),
      windowEnd: new Date(latestCreatedMs).toISOString(),
      parent: windowTickets[0],
      children: windowTickets.slice(1),
    });
  }

  return groups;
}

async function autoMergeSixHourRequesterTickets(context, auth, workflow) {
  const limits = autoMergeSixHourLimits(workflow);
  const tickets = await fetchOpenTicketsForAutoMerge(context.env, limits.maxPages);
  const groups = sixHourRequesterMergeGroups(tickets, limits);
  const agentDirectory = new Map();
  const merged = [];
  const mergeErrors = [];
  let mergeLimitReached = false;
  let groupLimitReached = false;
  let processedGroups = 0;

  groupLoop:
  for (const group of groups) {
    if (processedGroups >= limits.maxGroupsPerRun) {
      groupLimitReached = true;
      break;
    }
    processedGroups += 1;

    let parentDetail;
    let parentTicket;
    try {
      parentDetail = await helpdeskRequest(context.env, `/tickets/${encodeURIComponent(group.parent.id)}`);
      parentTicket = normalizeHelpDeskTicketSummary(parentDetail, agentDirectory);
      if (parentTicket.status !== "open" || parentTicket.parentTicket || requesterKey(parentTicket) !== group.requesterEmail) {
        continue;
      }
    } catch (error) {
      mergeErrors.push({
        requesterEmail: group.requesterEmail,
        parentTicketId: group.parent.id,
        message: error.message || "Failed to load 6h auto-merge parent ticket.",
      });
      continue;
    }

    for (const child of group.children) {
      if (merged.length >= limits.maxMergesPerRun) {
        mergeLimitReached = true;
        break groupLoop;
      }

      try {
        const childDetail = await helpdeskRequest(context.env, `/tickets/${encodeURIComponent(child.id)}`);
        const childTicket = normalizeHelpDeskTicketSummary(childDetail, agentDirectory);
        if (childTicket.status !== "open" || childTicket.parentTicket || requesterKey(childTicket) !== group.requesterEmail) {
          continue;
        }

        const childContent = mergedTicketContent(childDetail, agentDirectory);
        await mergeChildTicketPreservingTeam(context.env, parentDetail, parentTicket, childTicket, childContent, "automatic_6h_rule");

        merged.push({
          mode: "automatic_6h_rule",
          requesterEmail: group.requesterEmail,
          windowHours: limits.windowHours,
          windowStart: group.windowStart,
          windowEnd: group.windowEnd,
          parentTicketId: parentTicket.id,
          parentShortId: parentTicket.short_id || parentTicket.shortID,
          parentSubject: parentTicket.subject || "",
          parentLink: ticketLink(parentTicket),
          childTicketId: childTicket.id,
          childShortId: childTicket.short_id || childTicket.shortID,
          childSubject: childTicket.subject || "",
          childLink: ticketLink(childTicket),
          mergedContentPreview: childContent.slice(0, 1000),
        });
      } catch (error) {
        mergeErrors.push({
          requesterEmail: group.requesterEmail,
          parentTicketId: parentTicket?.id || group.parent.id,
          childTicketId: child.id,
          message: error.message || "Failed to auto-merge 6h HelpDesk ticket.",
        });
      }
    }
  }

  if (merged.length) {
    await writeLogSafely(context.env, {
      actor: auth.session.user,
      area: "helpdesk",
      action: AUTO_MERGE_ACTION,
      target: merged[0].parentTicketId,
      status: "success",
      details: `Auto-merged ${merged.length} HelpDesk ticket(s) by 6h requester rule.`,
      metadata: {
        mode: "automatic_6h_rule",
        requesterEmail: merged[0].requesterEmail || "",
        createdDate: `${merged[0].windowStart || ""} to ${merged[0].windowEnd || ""}`,
        mergedTickets: merged,
        scannedTickets: tickets.length,
        candidateGroups: groups.length,
        processedGroups,
        mergeLimitReached,
        groupLimitReached,
        limits,
      },
    });
  }

  if (mergeErrors.length) {
    await writeLogSafely(context.env, {
      actor: auth.session.user,
      area: "helpdesk",
      action: AUTO_MERGE_ACTION,
      target: mergeErrors[0].parentTicketId,
      status: "error",
      details: `Failed to auto-merge ${mergeErrors.length} HelpDesk ticket(s) by 6h requester rule.`,
      metadata: {
        mode: "automatic_6h_rule",
        mergeErrors,
      },
    });
  }

  return {
    merged,
    mergeErrors,
    scannedTickets: tickets.length,
    candidateGroups: groups.length,
    processedGroups,
    mergeLimitReached,
    groupLimitReached,
    limits,
  };
}

async function runAutoMergeSixHourWorkflow(context, auth, workflow) {
  const result = await autoMergeSixHourRequesterTickets(context, auth, workflow);
  const limitText = result.mergeLimitReached || result.groupLimitReached ? " More candidates will be checked on the next run." : "";
  return {
    details: `Auto-merged ${result.merged.length} ticket(s) by 6h requester rule after scanning ${result.scannedTickets} open ticket(s).${limitText}`,
    metadata: {
      type: workflow.type,
      mergedTickets: result.merged,
      mergeErrors: result.mergeErrors,
      scannedTickets: result.scannedTickets,
      candidateGroups: result.candidateGroups,
      processedGroups: result.processedGroups,
      mergeLimitReached: result.mergeLimitReached,
      groupLimitReached: result.groupLimitReached,
      limits: result.limits,
    },
  };
}

async function runWorkflowSafely(context, auth, workflow, timezoneOffsetMinutes, openTickets) {
  const startedAt = new Date().toISOString();
  try {
    let result;
    if (workflow.type === AUTO_MERGE_WORKFLOW_TYPE) {
      result = await runAutoMergeWorkflow(context, auth, workflow);
    } else if (workflow.type === AUTO_MERGE_6H_WORKFLOW_TYPE) {
      result = await runAutoMergeSixHourWorkflow(context, auth, workflow);
    } else if (workflow.type === AUTO_MARKETING_SPAM_WORKFLOW_TYPE) {
      result = await runMarketingSpamWorkflow(context, workflow);
    } else if (workflow.type === AUTO_REPLY_WORKFLOW_TYPE) {
      result = await runAutoReplyWorkflow(context, workflow, openTickets);
    } else if (workflow.type === AUTO_REPLY_EMPTY_REQUESTER_WORKFLOW_TYPE) {
      result = await runEmptyRequesterReplyWorkflow(context, workflow);
    } else {
      result = await runAutoResolveWorkflow(context, workflow);
    }
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

export async function runHelpdeskWorkflowOnce(context, auth, workflow, timezoneOffsetMinutes = 0) {
  return runWorkflowSafely(context, auth, workflow, timezoneOffsetMinutes, []);
}

export async function runNextAutomaticHelpdeskWorkflow(
  context,
  auth,
  timezoneOffsetMinutes = 0,
  { enforceGlobalInterval = false, forceOne = false } = {},
) {
  if (enforceGlobalInterval && !(await automaticWorkflowRunDue(context.env))) return [];

  const workflows = await listEnabledHelpdeskWorkflows(context.env);
  if (!workflows.length) return [];

  const workflowInfos = [];
  const dueWorkflowInfos = [];
  for (const workflow of workflows) {
    if (!RUNNABLE_WORKFLOW_TYPES.has(workflow.type)) continue;
    const runInfo = await workflowRunInfo(context.env, workflow);
    workflowInfos.push(runInfo);
    if (runInfo.due) {
      dueWorkflowInfos.push(runInfo);
    }
  }
  const candidates = dueWorkflowInfos.length ? dueWorkflowInfos : forceOne ? workflowInfos : [];
  if (!candidates.length) return [];
  candidates.sort((left, right) => {
    return (
      left.lastRunMs - right.lastRunMs ||
      (WORKFLOW_TYPE_ORDER[left.workflow.type] ?? 99) - (WORKFLOW_TYPE_ORDER[right.workflow.type] ?? 99)
    );
  });

  const workflow = candidates[0].workflow;
  let openTickets = null;
  if (workflow.type === AUTO_REPLY_WORKFLOW_TYPE) {
    openTickets = await fetchOpenTicketsForAutoMerge(context.env);
  }

  return [await runWorkflowSafely(context, auth, workflow, timezoneOffsetMinutes, openTickets || [])];
}

async function runEnabledHelpdeskWorkflows(context, auth, timezoneOffsetMinutes) {
  return runNextAutomaticHelpdeskWorkflow(context, auth, timezoneOffsetMinutes, {
    enforceGlobalInterval: true,
  });
}

async function fetchOpenTicketsForAutoMerge(env, maxPages = WORKFLOW_OPEN_TICKETS_MAX_PAGES) {
  const tickets = [];
  let cursor = null;

  for (let page = 0; page < maxPages; page += 1) {
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
    return ticket.status === "open" && ticket.silo === "tickets" && !ticket.parentTicket && requesterKey(ticket);
  });
}

function requesterTicketGroups(tickets) {
  const groups = new Map();
  for (const ticket of tickets) {
    const key = requesterKey(ticket);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(ticket);
  }

  return Array.from(groups.entries())
    .map(([requesterEmail, groupTickets]) => ({ requesterEmail, tickets: groupTickets }))
    .filter((group) => group.tickets.length > 1);
}

async function duplicateGroupsByRequesterAndContent(
  context,
  tickets,
  agentDirectory,
  maxDetailLookups = AUTO_MERGE_DETAIL_LOOKUP_LIMIT,
) {
  const groups = [];
  const requesterGroups = requesterTicketGroups(tickets);
  let detailLookups = 0;
  let detailLimitReached = false;

  for (const requesterGroup of requesterGroups) {
    const contentGroups = new Map();
    const sortedTickets = [...requesterGroup.tickets].sort((left, right) => ticketCreatedTime(left) - ticketCreatedTime(right));

    for (const ticket of sortedTickets) {
      if (detailLookups >= maxDetailLookups) {
        detailLimitReached = true;
        break;
      }
      detailLookups += 1;
      const detail = await helpdeskRequest(context.env, `/tickets/${encodeURIComponent(ticket.id)}`);
      const normalizedTicket = normalizeHelpDeskTicketSummary(detail, agentDirectory);
      if (normalizedTicket.status !== "open" || normalizedTicket.parentTicket || requesterKey(normalizedTicket) !== requesterGroup.requesterEmail) {
        continue;
      }

      const content = duplicateEmailContent(detail, agentDirectory);
      if (!content?.key) continue;

      if (!contentGroups.has(content.key)) contentGroups.set(content.key, []);
      contentGroups.get(content.key).push({
        detail,
        ticket: normalizedTicket,
        contentPreview: content.preview,
      });
    }

    for (const [contentKey, contentTickets] of contentGroups.entries()) {
      if (contentTickets.length < 2) continue;
      const sorted = [...contentTickets].sort((left, right) => ticketCreatedTime(left.ticket) - ticketCreatedTime(right.ticket));
      groups.push({
        requesterEmail: requesterGroup.requesterEmail,
        contentKey,
        contentPreview: sorted[0].contentPreview,
        parent: sorted[0],
        children: sorted.slice(1),
      });
    }

    if (detailLimitReached) break;
  }

  return {
    groups,
    detailLookups,
    detailLimitReached,
    requesterGroups: requesterGroups.length,
  };
}

async function autoMergeDuplicateOpenTickets(context, auth, workflow) {
  const limits = autoMergeLimits(workflow);
  const tickets = await fetchOpenTicketsForAutoMerge(context.env, limits.maxPages);
  const agentDirectory = new Map();
  const scan = await duplicateGroupsByRequesterAndContent(context, tickets, agentDirectory, limits.maxDetailLookups);
  const groups = scan.groups;
  const merged = [];
  const mergeErrors = [];
  let mergeLimitReached = false;

  groupLoop:
  for (const group of groups) {
    const parentDetail = group.parent.detail;
    const parentTicket = group.parent.ticket;
    if (parentTicket.status !== "open" || parentTicket.parentTicket) continue;

    for (const child of group.children) {
      if (merged.length >= limits.maxMergesPerRun) {
        mergeLimitReached = true;
        break groupLoop;
      }
      try {
        const childDetail = child.detail;
        const childTicket = child.ticket;
        if (childTicket.parentTicket || childTicket.status !== "open") continue;

        const childContent = mergedTicketContent(childDetail, agentDirectory);
        await mergeChildTicketPreservingTeam(context.env, parentDetail, parentTicket, childTicket, childContent);

        const logMetadata = {
          mode: "automatic",
          requesterEmail: group.requesterEmail,
          duplicateContentPreview: group.contentPreview,
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

        merged.push(logMetadata);
      } catch (error) {
        const parentId = group.parent.ticket?.id || group.parent.detail?.id || "unknown";
        mergeErrors.push({
          requesterEmail: group.requesterEmail,
          parentTicketId: parentId,
          childTicketId: child.ticket?.id || "unknown",
          message: error.message || "Failed to auto-merge duplicate HelpDesk ticket.",
        });
      }
    }
  }

  if (merged.length) {
    await writeLogSafely(context.env, {
      actor: auth.session.user,
      area: "helpdesk",
      action: AUTO_MERGE_ACTION,
      target: merged[0].parentTicketId,
      status: "success",
      details: `Auto-merged ${merged.length} duplicate HelpDesk ticket(s).`,
      metadata: {
        mode: "automatic",
        requesterEmail: merged[0].requesterEmail || "",
        duplicateContentPreview: merged[0].duplicateContentPreview || "",
        mergedTickets: merged,
        scannedTickets: tickets.length,
        duplicateGroups: groups.length,
        detailLookups: scan.detailLookups,
        detailLimitReached: scan.detailLimitReached,
        mergeLimitReached,
        limits,
      },
    });
  }

  if (mergeErrors.length) {
    await writeLogSafely(context.env, {
      actor: auth.session.user,
      area: "helpdesk",
      action: AUTO_MERGE_ACTION,
      target: mergeErrors[0].parentTicketId,
      status: "error",
      details: `Failed to auto-merge ${mergeErrors.length} duplicate HelpDesk ticket(s).`,
      metadata: {
        mode: "automatic",
        mergeErrors,
      },
    });
  }

  return {
    merged,
    mergeErrors,
    scannedTickets: tickets.length,
    duplicateGroups: groups.length,
    detailLookups: scan.detailLookups,
    detailLimitReached: scan.detailLimitReached,
    mergeLimitReached,
    limits,
  };
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
    url.searchParams.get("workflows") === "1" && status === "open" && silo === "tickets" && !cursor;

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
