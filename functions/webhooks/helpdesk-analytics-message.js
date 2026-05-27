import { accountIndexName, accountTableName, withAccountContext } from "../_lib/accounts.js";
import { errorResponse, json, methodNotAllowed, serverErrorResponse } from "../_lib/http.js";

const DAILY_TABLE_BASE = "helpdesk_analytics_daily_v4";
const DEFAULT_ANALYTICS_TIME_ZONE = "Asia/Nicosia";

function safeEqualText(left, right) {
  const leftText = `${left || ""}`;
  const rightText = `${right || ""}`;
  if (leftText.length !== rightText.length) return false;

  let diff = 0;
  for (let index = 0; index < leftText.length; index += 1) {
    diff |= leftText.charCodeAt(index) ^ rightText.charCodeAt(index);
  }
  return diff === 0;
}

function webhookSecretError(context) {
  const expectedSecret = `${context.env.HELPDESK_WEBHOOK_SECRET || ""}`.trim();
  if (!expectedSecret) return null;

  const url = new URL(context.request.url);
  const submittedSecret =
    `${context.request.headers.get("X-HelpDesk-Webhook-Secret") || ""}`.trim() ||
    `${context.request.headers.get("X-Webhook-Secret") || ""}`.trim() ||
    `${url.searchParams.get("secret") || ""}`.trim();

  if (!submittedSecret || !safeEqualText(submittedSecret, expectedSecret)) {
    return errorResponse("Unauthorized.", 401);
  }
  return null;
}

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

export async function onRequest(context) {
  if (context.request.method !== "POST") return methodNotAllowed(["POST"]);
  context = withAccountContext(context);

  const secretError = webhookSecretError(context);
  if (secretError) return secretError;

  try {
    const payload = await readWebhookPayload(context.request);
    const eventType = `${payload.eventType || payload.payload?.eventType || payload.data?.eventType || ""}`.trim();
    if (eventType && eventType !== "tickets.events.message") {
      return json({ ok: true, ignored: true, reason: "event_type", eventType });
    }

    const event = extractMessageEvent(payload);
    if (!event) {
      return json({ ok: true, ignored: true, reason: "no_agent_message_event" });
    }

    const agent = eventAuthor(event);
    const messageDate = eventDate(event);
    if (!agent.id) return json({ ok: true, ignored: true, reason: "missing_agent_id" });
    if (!messageDate) return json({ ok: true, ignored: true, reason: "missing_message_date" });
    if (isPrivateEvent(event)) return json({ ok: true, ignored: true, reason: "private_message" });
    if (!eventMessageText(event)) return json({ ok: true, ignored: true, reason: "empty_message" });
    if (isConversationTranscriptEvent(event)) return json({ ok: true, ignored: true, reason: "conversation_transcript" });

    const statDate = dateKeyForTimeZone(messageDate, context.env.HELPDESK_ANALYTICS_TIME_ZONE || DEFAULT_ANALYTICS_TIME_ZONE);
    await incrementAgentHandledTicket(context.env, { date: statDate, agent });

    return json({
      ok: true,
      counted: true,
      date: statDate,
      agentId: agent.id,
    });
  } catch (error) {
    return serverErrorResponse(error, "Failed to process HelpDesk analytics message webhook.");
  }
}
