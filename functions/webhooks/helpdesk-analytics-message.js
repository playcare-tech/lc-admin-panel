import { accountIndexName, accountTableName, withAccountContext } from "../_lib/accounts.js";
import { recordRawHelpDeskAnalyticsWebhook } from "../_lib/helpdesk-analytics-raw-webhooks.js";
import { recordHelpDeskAnalyticsWebhookReceived } from "../_lib/helpdesk-analytics-webhooks.js";
import { json, methodNotAllowed, serverErrorResponse } from "../_lib/http.js";

const DAILY_TABLE_BASE = "helpdesk_analytics_daily_v4";
const MESSAGE_EVENTS_TABLE_BASE = "helpdesk_analytics_message_events";
const DEFAULT_ANALYTICS_TIME_ZONE = "Asia/Nicosia";
const MESSAGE_EVENT_TYPE = "tickets.events.message";

function parseWebhookPayload(text) {
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
  return stripHtml(
    message.text ||
      message.plainText ||
      event?.text ||
      message.html ||
      event?.richTextHtml ||
      event?.html ||
      "",
  );
}

function eventSourceType(value) {
  const source = value?.source || value?.message?.source || {};
  if (typeof source === "string") return source.toLowerCase();
  return `${source.type || value?.sourceType || value?.source_type || ""}`.toLowerCase();
}

function isEmailMessageEvent(event, ticket) {
  const eventSource = eventSourceType(event);
  if (eventSource) return eventSource === "email";
  return eventSourceType(ticket) === "email";
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

function eventDate(event, webhookCreatedAt) {
  const value = event?.date || event?.createdAt || event?.timestamp || event?.created_at || webhookCreatedAt;
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function ticketId(ticket) {
  return `${ticket?.ID || ticket?.id || ticket?.ticketID || ticket?.ticketId || ticket?.ticket_id || ""}`.trim();
}

function isPrivateEvent(event) {
  const message = event?.message || {};
  return Boolean(
    event?.isPrivate ||
      event?.private ||
      event?.is_private ||
      message.isPrivate ||
      message.private ||
      message.is_private,
  );
}

function isConversationTranscriptEvent(event) {
  const text = eventMessageText(event).toLowerCase();
  return text.includes("conversation transcript:") || text.includes("conversation trancript:");
}

async function sha256Text(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function eventUniqueKey({ event, ticket, agent, messageDate }) {
  const directId = [
    event?.ID,
    event?.id,
    event?.eventID,
    event?.eventId,
    event?.messageID,
    event?.messageId,
    event?.message?.ID,
    event?.message?.id,
  ]
    .map((value) => `${value || ""}`.trim())
    .find(Boolean);
  if (directId) return `direct:${directId}`;

  return `hash:${await sha256Text(
    JSON.stringify({
      ticketId: ticketId(ticket),
      agentId: agent.id,
      date: messageDate.toISOString(),
      text: eventMessageText(event),
    }),
  )}`;
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

function messageEventsTable(env) {
  return accountTableName(env, MESSAGE_EVENTS_TABLE_BASE);
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

async function processHelpDeskMessageWebhook(env, webhookPayload) {
  const eventType = `${webhookPayload?.eventType || ""}`.trim();
  if (eventType !== MESSAGE_EVENT_TYPE) {
    return { ok: true, ignored: true, reason: "event_type", eventType };
  }

  const payload = webhookPayload?.payload || {};
  const ticket = payload.ticket || {};
  const event = payload.event || {};
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    return { ok: true, ignored: true, reason: "missing_event" };
  }

  const agent = eventAuthor(event);
  const messageDate = eventDate(event, webhookPayload?.createdAt);
  const text = eventMessageText(event);

  if (agent.type !== "agent") return { ok: true, ignored: true, reason: "not_agent_message", authorType: agent.type };
  if (!agent.id) return { ok: true, ignored: true, reason: "missing_agent_id" };
  if (!messageDate) return { ok: true, ignored: true, reason: "missing_message_date" };
  if (isPrivateEvent(event)) return { ok: true, ignored: true, reason: "private_message" };
  if (!isEmailMessageEvent(event, ticket)) {
    return { ok: true, ignored: true, reason: "not_email_source", sourceType: eventSourceType(event) || eventSourceType(ticket) };
  }
  if (!text) return { ok: true, ignored: true, reason: "empty_message" };
  if (isConversationTranscriptEvent(event)) return { ok: true, ignored: true, reason: "conversation_transcript" };

  const eventKey = await eventUniqueKey({ event, ticket, agent, messageDate });
  const reserved = await reserveMessageEvent(env, eventKey);
  if (!reserved) return { ok: true, ignored: true, reason: "duplicate_message_event", eventKey };

  const statDate = dateKeyForTimeZone(messageDate, env.HELPDESK_ANALYTICS_TIME_ZONE || DEFAULT_ANALYTICS_TIME_ZONE);
  await incrementAgentHandledTicket(env, { date: statDate, agent });

  return {
    ok: true,
    counted: true,
    date: statDate,
    agentId: agent.id,
    ticketId: ticketId(ticket),
    eventKey,
  };
}

export async function onRequest(context) {
  if (context.request.method !== "POST") return methodNotAllowed(["POST"]);
  context = withAccountContext(context);

  try {
    const bodyText = await context.request.text();
    const payload = parseWebhookPayload(bodyText);
    await recordRawHelpDeskAnalyticsWebhook(context.env, context.request, bodyText);
    await recordHelpDeskAnalyticsWebhookReceived(context.env);
    return json(await processHelpDeskMessageWebhook(context.env, payload));
  } catch (error) {
    return serverErrorResponse(error, "Failed to process HelpDesk analytics message webhook.");
  }
}
