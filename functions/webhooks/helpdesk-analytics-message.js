import { accountIndexName, accountTableName, withAccountContext } from "../_lib/accounts.js";
import { helpdeskRequest } from "../_lib/helpdesk.js";
import { recordHelpDeskAnalyticsWebhookReceived } from "../_lib/helpdesk-analytics-webhooks.js";
import { json, methodNotAllowed, serverErrorResponse } from "../_lib/http.js";

const DAILY_TABLE_BASE = "helpdesk_analytics_daily_v4";
const MESSAGE_EVENTS_TABLE_BASE = "helpdesk_analytics_message_events";
const DEFAULT_ANALYTICS_TIME_ZONE = "Asia/Nicosia";
const RECENT_TICKET_EVENT_WINDOW_MINUTES = 120;

async function readWebhookPayload(request) {
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_error) {
    return { raw: text };
  }
}

function stripHtml(value) {
  return `${value || ""}`.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function eventMessageText(event) {
  const message = event?.message || event?.content || {};
  if (typeof message === "string") return stripHtml(message);
  return stripHtml(message.text || message.plainText || event?.text || message.html || event?.richTextHtml || event?.html || "");
}

function eventAuthor(event) {
  const author = event?.author || event?.createdBy || {};
  const id =
    (typeof author === "string" ? author : author.ID || author.id || author.agentID || author.agentId) ||
    event?.agentID ||
    event?.agentId ||
    event?.authorID ||
    event?.authorId ||
    event?.createdByID ||
    event?.createdById ||
    "";
  const email = author.email || event?.agentEmail || event?.authorEmail || "";
  const name = author.name || author.fullName || event?.agentName || event?.authorName || email || id;
  const type = `${author.type || event?.authorType || event?.createdByType || author.role || ""}`.toLowerCase();
  return {
    id: String(id || email || ""),
    name,
    email,
    type,
  };
}

function eventDate(event) {
  const value = event?.date || event?.createdAt || event?.timestamp || event?.created_at;
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function firstString(values) {
  return values.map((value) => `${value || ""}`.trim()).find(Boolean) || "";
}

function looksLikeTicketPayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Boolean(
    value.shortID ||
      value.shortId ||
      value.short_id ||
      value.status ||
      value.subject ||
      value.requester ||
      value.lastMessageAt ||
      value.tagIDs,
  );
}

function collectTicketIdCandidates(value, candidates = []) {
  if (!value || typeof value !== "object") return candidates;
  if (Array.isArray(value)) {
    value.forEach((item) => collectTicketIdCandidates(item, candidates));
    return candidates;
  }

  const ticket = value.ticket || value.ticketData || value.conversation || value.resource;
  if (ticket && typeof ticket === "object") {
    candidates.push(ticket.ID, ticket.id, ticket.ticketId, ticket.ticketID, ticket.ticket_id);
  }
  candidates.push(value.ticketId, value.ticketID, value.ticket_id);

  for (const nestedValue of Object.values(value)) {
    if (nestedValue && typeof nestedValue === "object") {
      collectTicketIdCandidates(nestedValue, candidates);
    }
  }

  return candidates;
}

function extractTicketId(payload) {
  return firstString([
    payload?.payload?.ticket?.ID,
    payload?.payload?.ticket?.id,
    payload?.data?.ticket?.ID,
    payload?.data?.ticket?.id,
    payload?.ticket?.ID,
    payload?.ticket?.id,
    ...collectTicketIdCandidates(payload),
  ]);
}

function findTicketDetailCandidate(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return null;
  seen.add(value);

  if (!Array.isArray(value) && Array.isArray(value.events) && looksLikeTicketPayload(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const candidate = findTicketDetailCandidate(item, seen);
      if (candidate) return candidate;
    }
    return null;
  }

  for (const nestedValue of Object.values(value)) {
    if (nestedValue && typeof nestedValue === "object") {
      const candidate = findTicketDetailCandidate(nestedValue, seen);
      if (candidate) return candidate;
    }
  }
  return null;
}

function eventTicketId(event, payload) {
  return [
    event?.ticketID,
    event?.ticketId,
    event?.ticket_id,
    event?.ticket?.ID,
    event?.ticket?.id,
    payload?.ticketID,
    payload?.ticketId,
    payload?.ticket_id,
    payload?.ticket?.ID,
    payload?.ticket?.id,
    payload?.payload?.ticketID,
    payload?.payload?.ticketId,
    payload?.payload?.ticket?.ID,
    payload?.payload?.ticket?.id,
    payload?.data?.ticketID,
    payload?.data?.ticketId,
    payload?.data?.ticket?.ID,
    payload?.data?.ticket?.id,
  ]
    .map((value) => `${value || ""}`.trim())
    .find(Boolean) || "";
}

async function sha256Text(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function eventUniqueKey(event, payload, agent, messageDate) {
  const directId = [
    event?.ID,
    event?.id,
    event?.eventID,
    event?.eventId,
    event?.messageID,
    event?.messageId,
    event?.message?.ID,
    event?.message?.id,
    payload?.eventID,
    payload?.eventId,
    payload?.payload?.eventID,
    payload?.payload?.eventId,
    payload?.data?.eventID,
    payload?.data?.eventId,
  ]
    .map((value) => `${value || ""}`.trim())
    .find(Boolean);
  if (directId) return `direct:${directId}`;

  const fingerprint = JSON.stringify({
    ticketId: eventTicketId(event, payload),
    agentId: agent.id,
    date: messageDate.toISOString(),
    text: eventMessageText(event),
  });
  return `hash:${await sha256Text(fingerprint)}`;
}

function isMessageEvent(event) {
  if (!event || typeof event !== "object" || Array.isArray(event)) return false;
  const type = `${event.type || event.eventType || ""}`.toLowerCase();
  const hasMessagePayload = Boolean(event.message || event.text || event.content || event.richTextHtml || event.richTextObj);
  return type === "message" || type === "tickets.events.message" || hasMessagePayload;
}

function isPrivateEvent(event) {
  return Boolean(event?.isPrivate || event?.private || event?.is_private);
}

function isConversationTranscriptEvent(event) {
  const text = eventMessageText(event).toLowerCase();
  return text.includes("conversation transcript:") || text.includes("conversation trancript:");
}

function collectObjectCandidates(value, candidates = [], seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return candidates;
  seen.add(value);

  if (!Array.isArray(value)) {
    candidates.push(value);
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectObjectCandidates(item, candidates, seen));
    return candidates;
  }

  for (const nestedValue of Object.values(value)) {
    if (nestedValue && typeof nestedValue === "object") {
      collectObjectCandidates(nestedValue, candidates, seen);
    }
  }
  return candidates;
}

function extractMessageEvent(payload) {
  const priorityCandidates = [
    payload?.payload,
    payload?.data,
    payload?.event,
    payload?.message,
    payload,
  ].filter((value) => value && typeof value === "object" && !Array.isArray(value));

  const candidates = [...priorityCandidates, ...collectObjectCandidates(payload)];
  return candidates.find((candidate) => isMessageEvent(candidate) && eventAuthor(candidate).type === "agent" && eventMessageText(candidate)) || null;
}

function dateKey(date, timezoneOffsetMinutes = 0) {
  return new Date(date.getTime() - timezoneOffsetMinutes * 60000).toISOString().slice(0, 10);
}

function dateKeyForTimeZone(date, timeZone = DEFAULT_ANALYTICS_TIME_ZONE) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const valueByType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    if (valueByType.year && valueByType.month && valueByType.day) {
      return `${valueByType.year}-${valueByType.month}-${valueByType.day}`;
    }
  } catch (error) {
    console.warn("Failed to format HelpDesk analytics date with timezone.", error);
  }
  return dateKey(date, Number(new Date().getTimezoneOffset() || 0));
}

function dailyTable(env) {
  return accountTableName(env, DAILY_TABLE_BASE);
}

async function ensureHelpDeskAnalyticsCache(env) {
  if (!env?.DB) throw new Error("Missing DB binding.");
  const table = dailyTable(env);
  await env.DB
    .prepare(
      `CREATE TABLE IF NOT EXISTS ${table} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        agent_name TEXT,
        agent_email TEXT,
        handled_tickets INTEGER NOT NULL DEFAULT 0,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, agent_id)
      )`,
    )
    .run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${accountIndexName(env, `idx_${DAILY_TABLE_BASE}_date`)} ON ${table}(date)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${accountIndexName(env, `idx_${DAILY_TABLE_BASE}_agent`)} ON ${table}(agent_id)`).run();
}

function messageEventsTable(env) {
  return accountTableName(env, MESSAGE_EVENTS_TABLE_BASE);
}

async function ensureHelpDeskAnalyticsMessageEvents(env) {
  if (!env?.DB) throw new Error("Missing DB binding.");
  await env.DB
    .prepare(
      `CREATE TABLE IF NOT EXISTS ${messageEventsTable(env)} (
        event_key TEXT PRIMARY KEY,
        recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    )
    .run();
}

async function reserveMessageEvent(env, eventKey) {
  await ensureHelpDeskAnalyticsMessageEvents(env);
  const result = await env.DB.prepare(
    `INSERT INTO ${messageEventsTable(env)} (event_key, recorded_at)
     VALUES (?, CURRENT_TIMESTAMP)
     ON CONFLICT(event_key) DO NOTHING`,
  )
    .bind(eventKey)
    .run();
  return Number(result?.meta?.changes || 0) > 0;
}

async function incrementAgentHandledTicket(env, { date, agent }) {
  const table = dailyTable(env);
  await ensureHelpDeskAnalyticsCache(env);
  await env.DB.prepare(
    `INSERT INTO ${table}
      (date, agent_id, agent_name, agent_email, handled_tickets, cached_at)
     VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
     ON CONFLICT(date, agent_id) DO UPDATE SET
      agent_name = COALESCE(NULLIF(excluded.agent_name, ''), ${table}.agent_name),
      agent_email = COALESCE(NULLIF(excluded.agent_email, ''), ${table}.agent_email),
      handled_tickets = ${table}.handled_tickets + 1,
      cached_at = CURRENT_TIMESTAMP`,
  )
    .bind(date, agent.id, agent.name || agent.id, agent.email || "")
    .run();
}

async function processHelpDeskAnalyticsEvent(env, event, payload = {}) {
  const agent = eventAuthor(event);
  const messageDate = eventDate(event);
  if (!agent.id) return { ok: true, ignored: true, reason: "missing_agent_id" };
  if (!messageDate) return { ok: true, ignored: true, reason: "missing_message_date" };
  if (isPrivateEvent(event)) return { ok: true, ignored: true, reason: "private_message" };
  if (!eventMessageText(event)) return { ok: true, ignored: true, reason: "empty_message" };
  if (isConversationTranscriptEvent(event)) return { ok: true, ignored: true, reason: "conversation_transcript" };

  const eventKey = await eventUniqueKey(event, payload, agent, messageDate);
  const reserved = await reserveMessageEvent(env, eventKey);
  if (!reserved) {
    return { ok: true, ignored: true, reason: "duplicate_message_event", eventKey };
  }

  const statDate = dateKeyForTimeZone(messageDate, env.HELPDESK_ANALYTICS_TIME_ZONE || DEFAULT_ANALYTICS_TIME_ZONE);
  await incrementAgentHandledTicket(env, { date: statDate, agent });

  return {
    ok: true,
    counted: true,
    date: statDate,
    agentId: agent.id,
    eventKey,
  };
}

export async function processHelpDeskAnalyticsMessagePayload(env, payload) {
  const eventType = `${payload.eventType || payload.payload?.eventType || payload.data?.eventType || ""}`.trim();
  if (eventType && !["tickets.events.message", "tickets.update"].includes(eventType)) {
    return { ok: true, ignored: true, reason: "event_type", eventType };
  }

  const event = extractMessageEvent(payload);
  if (!event) {
    return { ok: true, ignored: true, reason: "no_agent_message_event" };
  }

  return processHelpDeskAnalyticsEvent(env, event, payload);
}

export async function processHelpDeskAnalyticsTicketDetail(env, ticketDetail, options = {}) {
  const receivedAt = options.receivedAt || new Date();
  const windowMs = Number(options.recentWindowMinutes || RECENT_TICKET_EVENT_WINDOW_MINUTES) * 60 * 1000;
  const minDate = new Date(receivedAt.getTime() - windowMs);
  const maxDate = new Date(receivedAt.getTime() + 5 * 60 * 1000);
  const payload = options.payload || ticketDetail || {};
  const events = (Array.isArray(ticketDetail?.events) ? ticketDetail.events : [])
    .filter((event) => {
      if (!isMessageEvent(event) || eventAuthor(event).type !== "agent") return false;
      const date = eventDate(event);
      return date && date >= minDate && date <= maxDate;
    })
    .sort((left, right) => {
      const leftDate = eventDate(left)?.getTime() || 0;
      const rightDate = eventDate(right)?.getTime() || 0;
      return leftDate - rightDate;
    });

  const results = [];
  for (const event of events) {
    results.push(await processHelpDeskAnalyticsEvent(env, event, payload));
  }
  const counted = results.filter((result) => result.counted).length;
  return {
    ok: true,
    counted: counted > 0,
    countedEvents: counted,
    ignoredEvents: results.length - counted,
    reason: counted > 0 ? undefined : "no_recent_agent_message_events",
    results,
  };
}

export async function onRequest(context) {
  if (context.request.method !== "POST") return methodNotAllowed(["POST"]);
  context = withAccountContext(context);

  try {
    const payload = await readWebhookPayload(context.request);
    await recordHelpDeskAnalyticsWebhookReceived(context.env);
    const directResult = await processHelpDeskAnalyticsMessagePayload(context.env, payload);
    if (directResult.counted) return json(directResult);

    const ticketCandidate = findTicketDetailCandidate(payload);
    if (ticketCandidate) {
      const embeddedResult = await processHelpDeskAnalyticsTicketDetail(context.env, ticketCandidate, {
        receivedAt: new Date(),
        payload,
      });
      return json({
        ...embeddedResult,
        direct: directResult,
        source: "embedded_ticket_detail",
      });
    }

    const ticketId = extractTicketId(payload);
    if (!ticketId) return json(directResult);

    let ticketDetail = null;
    try {
      ticketDetail = await helpdeskRequest(context.env, `/tickets/${encodeURIComponent(ticketId)}`);
    } catch (error) {
      if (error?.status === 404) {
        return json({
          ok: true,
          ignored: true,
          reason: "ticket_not_found",
          direct: directResult,
          ticketId,
        });
      }
      throw error;
    }
    const ticketResult = await processHelpDeskAnalyticsTicketDetail(context.env, ticketDetail, {
      receivedAt: new Date(),
      payload,
    });
    return json({
      ...ticketResult,
      direct: directResult,
      ticketId,
      source: "ticket_detail",
    });
  } catch (error) {
    return serverErrorResponse(error, "Failed to process HelpDesk analytics message webhook.");
  }
}
