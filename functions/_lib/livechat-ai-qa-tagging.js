import { accountIndexName, accountTableName } from "./accounts.js";

const CHAT_TABLE_BASE = "livechat_ai_qa_chats";
const EVENT_TABLE_BASE = "livechat_ai_qa_events";
const VALID_ACTIONS = new Set(["incoming_chat", "chat_transferred", "incoming_event", "thread_tagged", "chat_deactivated"]);

function nowIso() {
  return new Date().toISOString();
}

function text(value) {
  return `${value ?? ""}`.trim();
}

function jsonText(value) {
  return JSON.stringify(value ?? null);
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

function unique(values) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => text(value)).filter(Boolean))];
}

function chatIdFromPayload(payload) {
  return text(payload?.chat_id || payload?.chat?.id || payload?.id);
}

function threadFromIncomingChat(payload) {
  return payload?.chat?.thread || {};
}

function threadIdFromPayload(payload) {
  return text(payload?.thread_id || payload?.chat?.thread?.id || payload?.thread?.id);
}

function eventDate(action, payload, receivedAt) {
  return payload?.event?.created_at || payload?.chat?.thread?.created_at || payload?.created_at || receivedAt;
}

function diffMs(from, to) {
  const fromMs = new Date(from || "").getTime();
  const toMs = new Date(to || "").getTime();
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) return null;
  return Math.max(0, toMs - fromMs);
}

function isAgentId(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(value).toLowerCase());
}

function isChatbotEvent(event) {
  return text(event?.custom_id).startsWith("chatbot_");
}

function actorTypeForIncomingEvent(event) {
  if (event?.type === "system_message") return "system";
  if (isChatbotEvent(event)) return "chatbot";
  if (isAgentId(event?.author_id)) return "agent";
  return "customer";
}

function messageTextForEvent(event) {
  if (text(event?.text)) return text(event.text);
  if (event?.type === "rich_message") {
    return (event.elements || [])
      .map((element) => {
        const buttons = (element.buttons || []).map((button) => button.text).filter(Boolean).join(", ");
        return [element.title, element.subtitle, buttons].map(text).filter(Boolean).join(" | ");
      })
      .filter(Boolean)
      .join("\n");
  }
  if (event?.type === "filled_form") {
    return `Filled form${event.form_type ? `: ${event.form_type}` : ""}`;
  }
  return text(event?.type || "event");
}

function parseTranslationSignal(event) {
  if (event?.type !== "system_message" || event?.system_message_type !== "translation") return null;
  const value = text(event.text);
  const match = value.match(/Visitors Language:\s*([^,]+),\s*translation enabled for\s*([^-]+?)\s*-\s*([^.]+?)\s*pair/i);
  if (!match) return { source: "system_message", raw: value };
  return {
    source: "system_message",
    customerLanguage: text(match[1]),
    translationFrom: text(match[2]),
    translationTo: text(match[3]),
    chatbotLanguage: text(match[3]),
    raw: value,
  };
}

function isQueueStartSystemEvent(event) {
  return event?.type === "system_message" && event?.system_message_type === "chat_transferred";
}

function eventKeyForWebhook(body) {
  const action = text(body.action);
  const payload = body.payload || {};
  const chatId = chatIdFromPayload(payload);
  const threadId = threadIdFromPayload(payload);
  if (action === "incoming_chat") {
    return `incoming_chat:${chatId}:${threadId}:${text(body.webhook_id || payload.chat?.thread?.id || crypto.randomUUID())}`;
  }
  if (action === "incoming_event") {
    return `incoming_event:${chatId}:${threadId}:${text(payload.event?.id || body.webhook_id)}`;
  }
  if (action === "thread_tagged") {
    return `thread_tagged:${chatId}:${threadId}:${text(body.webhook_id || payload.tag).toLowerCase()}`;
  }
  return `${action}:${chatId}:${threadId}:${text(body.webhook_id || crypto.randomUUID())}`;
}

export function livechatAiQaTables(env) {
  return {
    chats: accountTableName(env, CHAT_TABLE_BASE),
    events: accountTableName(env, EVENT_TABLE_BASE),
    chatsAgentIndex: accountIndexName(env, `idx_${CHAT_TABLE_BASE}_agent`),
    chatsLastEventIndex: accountIndexName(env, `idx_${CHAT_TABLE_BASE}_last_event`),
    chatsTransferIndex: accountIndexName(env, `idx_${CHAT_TABLE_BASE}_transfer`),
    eventsChatIndex: accountIndexName(env, `idx_${EVENT_TABLE_BASE}_chat`),
    eventsDateIndex: accountIndexName(env, `idx_${EVENT_TABLE_BASE}_date`),
  };
}

export async function ensureLivechatAiQaTables(env) {
  const tables = livechatAiQaTables(env);
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ${tables.chats} (
      chat_id TEXT NOT NULL,
      thread_id TEXT NOT NULL,
      organization_id TEXT,
      first_seen_at TEXT,
      last_event_at TEXT,
      agent_ids_json TEXT NOT NULL DEFAULT '[]',
      agent_label TEXT,
      transferred_to_agent INTEGER NOT NULL DEFAULT 0,
      transfer_reason TEXT,
      transferred_to_agent_ids_json TEXT NOT NULL DEFAULT '[]',
      transferred_to_group_ids_json TEXT NOT NULL DEFAULT '[]',
      transfer_queue_json TEXT,
      queued_at TEXT,
      agent_transferred_at TEXT,
      queue_wait_ms INTEGER,
      transferred_at TEXT,
      deactivated_at TEXT,
      ftr_ms INTEGER,
      cht_ms INTEGER,
      customer_language TEXT,
      chatbot_language TEXT,
      translation_from TEXT,
      translation_to TEXT,
      language_source TEXT,
      tags_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (chat_id, thread_id)
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ${tables.events} (
      event_key TEXT PRIMARY KEY,
      webhook_id TEXT,
      action TEXT NOT NULL,
      organization_id TEXT,
      chat_id TEXT NOT NULL,
      thread_id TEXT NOT NULL,
      event_id TEXT,
      event_at TEXT NOT NULL,
      actor_type TEXT,
      actor_id TEXT,
      event_type TEXT,
      message_text TEXT,
      tag TEXT,
      transfer_reason TEXT,
      transfer_to_json TEXT,
      queue_json TEXT,
      language_signal_json TEXT,
      raw_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.chatsAgentIndex} ON ${tables.chats}(agent_label)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.chatsLastEventIndex} ON ${tables.chats}(last_event_at)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.chatsTransferIndex} ON ${tables.chats}(transferred_to_agent, transfer_reason)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.eventsChatIndex} ON ${tables.events}(chat_id, thread_id, event_at)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.eventsDateIndex} ON ${tables.events}(event_at)`).run();
  return tables;
}

async function ensureChat(env, body, receivedAt) {
  const tables = livechatAiQaTables(env);
  const payload = body.payload || {};
  const chatId = chatIdFromPayload(payload);
  const threadId = threadIdFromPayload(payload);
  await env.DB.prepare(`
    INSERT INTO ${tables.chats}
      (chat_id, thread_id, organization_id, first_seen_at, last_event_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(chat_id, thread_id) DO UPDATE SET
      organization_id = COALESCE(NULLIF(excluded.organization_id, ''), organization_id),
      first_seen_at = COALESCE(first_seen_at, excluded.first_seen_at),
      last_event_at = CASE
        WHEN last_event_at IS NULL OR excluded.last_event_at > last_event_at
        THEN excluded.last_event_at
        ELSE last_event_at
      END,
      updated_at = excluded.updated_at
  `)
    .bind(chatId, threadId, text(body.organization_id), receivedAt, eventDate(body.action, payload, receivedAt), receivedAt, receivedAt)
    .run();
}

async function insertEvent(env, body, receivedAt, normalized) {
  const tables = livechatAiQaTables(env);
  const payload = body.payload || {};
  const result = await env.DB.prepare(`
    INSERT OR IGNORE INTO ${tables.events}
      (event_key, webhook_id, action, organization_id, chat_id, thread_id, event_id, event_at, actor_type, actor_id,
       event_type, message_text, tag, transfer_reason, transfer_to_json, queue_json, language_signal_json, raw_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      eventKeyForWebhook(body),
      text(body.webhook_id),
      text(body.action),
      text(body.organization_id),
      chatIdFromPayload(payload),
      threadIdFromPayload(payload),
      normalized.eventId || "",
      normalized.eventAt || receivedAt,
      normalized.actorType || "",
      normalized.actorId || "",
      normalized.eventType || "",
      normalized.messageText || "",
      normalized.tag || "",
      normalized.transferReason || "",
      normalized.transferToJson || "",
      normalized.queueJson || "",
      normalized.languageSignalJson || "",
      JSON.stringify(body),
      receivedAt,
    )
    .run();
  return Number(result.meta?.changes || 0) > 0;
}

async function refreshChatMetrics(env, chatId, threadId) {
  const tables = livechatAiQaTables(env);
  const chat = await env.DB.prepare(`SELECT * FROM ${tables.chats} WHERE chat_id = ? AND thread_id = ?`)
    .bind(chatId, threadId)
    .first();
  if (!chat) return;

  const firstAgent = await env.DB.prepare(`
    SELECT event_at FROM ${tables.events}
    WHERE chat_id = ? AND thread_id = ? AND actor_type = 'agent' AND message_text <> ''
    ORDER BY event_at ASC
    LIMIT 1
  `)
    .bind(chatId, threadId)
    .first();

  const transferredAt = chat.agent_transferred_at || chat.transferred_at || null;
  const ftrMs = transferredAt && firstAgent?.event_at ? diffMs(transferredAt, firstAgent.event_at) : null;
  const chtMs = transferredAt && chat.deactivated_at ? diffMs(transferredAt, chat.deactivated_at) : null;
  const queueWaitMs =
    chat.queued_at && chat.agent_transferred_at
      ? diffMs(chat.queued_at, chat.agent_transferred_at)
      : chat.queue_wait_ms ?? null;

  await env.DB.prepare(`
    UPDATE ${tables.chats}
    SET ftr_ms = ?, cht_ms = ?, queue_wait_ms = ?, updated_at = ?
    WHERE chat_id = ? AND thread_id = ?
  `)
    .bind(ftrMs, chtMs, queueWaitMs, nowIso(), chatId, threadId)
    .run();
}

async function applyChatTransferred(env, body, receivedAt) {
  const tables = livechatAiQaTables(env);
  const payload = body.payload || {};
  const chatId = chatIdFromPayload(payload);
  const threadId = threadIdFromPayload(payload);
  const eventAt = receivedAt;
  const agentIds = unique(payload.transferred_to?.agent_ids || []);
  const groupIds = unique(payload.transferred_to?.group_ids || []);
  const hasAgent = agentIds.length > 0;
  const reason = text(payload.reason);
  const queueJson = payload.queue ? jsonText(payload.queue) : null;
  const fallbackQueuedAt = text(payload.queue?.queued_at);

  await insertEvent(env, body, receivedAt, {
    eventAt,
    eventType: payload.queue ? "queued" : hasAgent ? "transfer_to_agent" : "transfer",
    messageText: hasAgent ? `Transferred to ${agentIds.join(", ")}` : "Chat transferred",
    transferReason: reason,
    transferToJson: jsonText(payload.transferred_to || {}),
    queueJson,
  });

  await env.DB.prepare(`
    UPDATE ${tables.chats}
    SET
      transferred_to_agent = CASE WHEN ? THEN 1 ELSE transferred_to_agent END,
      transfer_reason = COALESCE(NULLIF(?, ''), transfer_reason),
      transferred_to_agent_ids_json = CASE WHEN ? THEN ? ELSE transferred_to_agent_ids_json END,
      transferred_to_group_ids_json = CASE WHEN ? THEN ? ELSE transferred_to_group_ids_json END,
      agent_ids_json = CASE WHEN ? THEN ? ELSE agent_ids_json END,
      agent_label = CASE WHEN ? THEN ? ELSE agent_label END,
      transfer_queue_json = COALESCE(?, transfer_queue_json),
      queued_at = CASE WHEN ? THEN COALESCE(queued_at, ?) ELSE queued_at END,
      transferred_at = COALESCE(transferred_at, ?),
      agent_transferred_at = CASE WHEN ? THEN COALESCE(agent_transferred_at, ?) ELSE agent_transferred_at END,
      updated_at = ?
    WHERE chat_id = ? AND thread_id = ?
  `)
    .bind(
      hasAgent ? 1 : 0,
      reason,
      hasAgent ? 1 : 0,
      jsonText(agentIds),
      groupIds.length ? 1 : 0,
      jsonText(groupIds),
      hasAgent ? 1 : 0,
      jsonText(agentIds),
      hasAgent ? 1 : 0,
      agentIds.join(", "),
      queueJson,
      fallbackQueuedAt ? 1 : 0,
      fallbackQueuedAt,
      eventAt,
      hasAgent ? 1 : 0,
      eventAt,
      receivedAt,
      chatId,
      threadId,
    )
    .run();
}

async function applyIncomingChat(env, body, receivedAt) {
  const tables = livechatAiQaTables(env);
  const payload = body.payload || {};
  const chat = payload.chat || {};
  const thread = threadFromIncomingChat(payload);
  const chatId = chatIdFromPayload(payload);
  const threadId = threadIdFromPayload(payload);
  const eventAt = thread.created_at || chat.created_at || receivedAt;

  await insertEvent(env, body, receivedAt, {
    eventAt,
    actorType: "system",
    eventType: "incoming_chat",
    messageText: "Incoming chat started",
  });

  const threadTags = unique(thread.tags || []);
  if (threadTags.length) {
    const row = await env.DB.prepare(`SELECT tags_json FROM ${tables.chats} WHERE chat_id = ? AND thread_id = ?`)
      .bind(chatId, threadId)
      .first();
    const tags = unique([...parseJson(row?.tags_json, []), ...threadTags]);
    await env.DB.prepare(`UPDATE ${tables.chats} SET tags_json = ?, updated_at = ? WHERE chat_id = ? AND thread_id = ?`)
      .bind(jsonText(tags), receivedAt, chatId, threadId)
      .run();
  }

  for (const event of thread.events || []) {
    await applyIncomingEvent(
      env,
      {
        ...body,
        action: "incoming_event",
        payload: {
          chat_id: chatId,
          thread_id: threadId,
          event,
        },
      },
      receivedAt,
    );
  }
}

async function applyThreadTagged(env, body, receivedAt) {
  const tables = livechatAiQaTables(env);
  const payload = body.payload || {};
  const chatId = chatIdFromPayload(payload);
  const threadId = threadIdFromPayload(payload);
  const tag = text(payload.tag);
  await insertEvent(env, body, receivedAt, {
    eventAt: eventDate(body.action, payload, receivedAt),
    eventType: "tag_added",
    messageText: tag ? `Tag added: ${tag}` : "Tag added",
    tag,
  });
  const row = await env.DB.prepare(`SELECT tags_json FROM ${tables.chats} WHERE chat_id = ? AND thread_id = ?`)
    .bind(chatId, threadId)
    .first();
  const tags = unique([...parseJson(row?.tags_json, []), tag]);
  await env.DB.prepare(`UPDATE ${tables.chats} SET tags_json = ?, updated_at = ? WHERE chat_id = ? AND thread_id = ?`)
    .bind(jsonText(tags), receivedAt, chatId, threadId)
    .run();
}

async function applyIncomingEvent(env, body, receivedAt) {
  const tables = livechatAiQaTables(env);
  const payload = body.payload || {};
  const event = payload.event || {};
  const chatId = chatIdFromPayload(payload);
  const threadId = threadIdFromPayload(payload);
  const actorType = actorTypeForIncomingEvent(event);
  const languageSignal = parseTranslationSignal(event);
  const queueStarted = isQueueStartSystemEvent(event);
  const inserted = await insertEvent(env, body, receivedAt, {
    eventId: text(event.id),
    eventAt: eventDate(body.action, payload, receivedAt),
    actorType,
    actorId: text(event.author_id),
    eventType: queueStarted ? "queue_started" : text(event.system_message_type || event.type),
    messageText: messageTextForEvent(event),
    languageSignalJson: languageSignal ? jsonText(languageSignal) : "",
  });
  if (!inserted) return;

  if (queueStarted) {
    await env.DB.prepare(`
      UPDATE ${tables.chats}
      SET queued_at = COALESCE(queued_at, ?),
          updated_at = ?
      WHERE chat_id = ? AND thread_id = ?
    `)
      .bind(eventDate(body.action, payload, receivedAt), receivedAt, chatId, threadId)
      .run();
  }

  if (actorType === "agent" && isAgentId(event.author_id)) {
    const current = await env.DB.prepare(`SELECT agent_ids_json, agent_label FROM ${tables.chats} WHERE chat_id = ? AND thread_id = ?`)
      .bind(chatId, threadId)
      .first();
    const agentIds = unique([...parseJson(current?.agent_ids_json, []), text(event.author_id)]);
    await env.DB.prepare(`
      UPDATE ${tables.chats}
      SET agent_ids_json = ?, agent_label = COALESCE(NULLIF(agent_label, ''), ?), updated_at = ?
      WHERE chat_id = ? AND thread_id = ?
    `)
      .bind(jsonText(agentIds), agentIds.join(", "), receivedAt, chatId, threadId)
      .run();
  }

  if (languageSignal) {
    await env.DB.prepare(`
      UPDATE ${tables.chats}
      SET customer_language = COALESCE(NULLIF(?, ''), customer_language),
          chatbot_language = COALESCE(NULLIF(?, ''), chatbot_language),
          translation_from = COALESCE(NULLIF(?, ''), translation_from),
          translation_to = COALESCE(NULLIF(?, ''), translation_to),
          language_source = ?,
          updated_at = ?
      WHERE chat_id = ? AND thread_id = ?
    `)
      .bind(
        languageSignal.customerLanguage || "",
        languageSignal.chatbotLanguage || "",
        languageSignal.translationFrom || "",
        languageSignal.translationTo || "",
        "system_message",
        receivedAt,
        chatId,
        threadId,
      )
      .run();
  }
}

async function applyChatDeactivated(env, body, receivedAt) {
  const tables = livechatAiQaTables(env);
  const payload = body.payload || {};
  const chatId = chatIdFromPayload(payload);
  const threadId = threadIdFromPayload(payload);
  const eventAt = eventDate(body.action, payload, receivedAt);
  await insertEvent(env, body, receivedAt, {
    eventAt,
    eventType: "chat_deactivated",
    messageText: "Chat deactivated",
  });
  await env.DB.prepare(`UPDATE ${tables.chats} SET deactivated_at = COALESCE(deactivated_at, ?), updated_at = ? WHERE chat_id = ? AND thread_id = ?`)
    .bind(eventAt, receivedAt, chatId, threadId)
    .run();
}

export async function recordLivechatAiQaWebhook(env, body) {
  if (!VALID_ACTIONS.has(text(body.action))) {
    return { recorded: false, ignored: true, reason: "unsupported_action" };
  }
  const payload = body.payload || {};
  const chatId = chatIdFromPayload(payload);
  const threadId = threadIdFromPayload(payload);
  if (!chatId || !threadId) {
    return { recorded: false, ignored: true, reason: "missing_chat_or_thread" };
  }

  const receivedAt = nowIso();
  await ensureLivechatAiQaTables(env);
  await ensureChat(env, body, receivedAt);

  if (body.action === "incoming_chat") {
    await applyIncomingChat(env, body, receivedAt);
  } else if (body.action === "chat_transferred") {
    await applyChatTransferred(env, body, receivedAt);
  } else if (body.action === "thread_tagged") {
    await applyThreadTagged(env, body, receivedAt);
  } else if (body.action === "incoming_event") {
    await applyIncomingEvent(env, body, receivedAt);
  } else if (body.action === "chat_deactivated") {
    await applyChatDeactivated(env, body, receivedAt);
  }

  await refreshChatMetrics(env, chatId, threadId);
  return { recorded: true, chatId, threadId };
}

function durationLabel(ms) {
  const value = Number(ms);
  if (!Number.isFinite(value) || value < 0) return "";
  const seconds = Math.round(value / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours) return `${hours}h ${minutes}m ${rest}s`;
  if (minutes) return `${minutes}m ${rest}s`;
  return `${rest}s`;
}

function chatRow(row, events = []) {
  const tags = parseJson(row.tags_json, []);
  const agentIds = parseJson(row.agent_ids_json, []);
  const transferAgentIds = parseJson(row.transferred_to_agent_ids_json, []);
  return {
    chatId: row.chat_id,
    threadId: row.thread_id,
    organizationId: row.organization_id || "",
    firstSeenAt: row.first_seen_at || "",
    lastEventAt: row.last_event_at || "",
    agentIds,
    agentLabel: row.agent_label || agentIds.join(", "),
    transferredToAgent: Boolean(row.transferred_to_agent),
    transferReason: row.transfer_reason || "",
    transferAgentIds,
    transferGroupIds: parseJson(row.transferred_to_group_ids_json, []),
    queue: parseJson(row.transfer_queue_json, null),
    queuedAt: row.queued_at || "",
    agentTransferredAt: row.agent_transferred_at || "",
    queueWaitMs: row.queue_wait_ms,
    queueWaitLabel: durationLabel(row.queue_wait_ms),
    transferredAt: row.transferred_at || "",
    deactivatedAt: row.deactivated_at || "",
    ftrMs: row.ftr_ms,
    ftrLabel: durationLabel(row.ftr_ms),
    chtMs: row.cht_ms,
    chtLabel: durationLabel(row.cht_ms),
    customerLanguage: row.customer_language || "",
    chatbotLanguage: row.chatbot_language || "",
    translationFrom: row.translation_from || "",
    translationTo: row.translation_to || "",
    languageSource: row.language_source || "",
    tags,
    tagsLabel: tags.join(", "),
    events: events.map(eventRow),
  };
}

function eventRow(row) {
  return {
    key: row.event_key,
    webhookId: row.webhook_id || "",
    action: row.action,
    chatId: row.chat_id,
    threadId: row.thread_id,
    eventId: row.event_id || "",
    eventAt: row.event_at,
    actorType: row.actor_type || "",
    actorId: row.actor_id || "",
    eventType: row.event_type || "",
    messageText: row.message_text || "",
    tag: row.tag || "",
    transferReason: row.transfer_reason || "",
    transferTo: parseJson(row.transfer_to_json, null),
    queue: parseJson(row.queue_json, null),
    languageSignal: parseJson(row.language_signal_json, null),
  };
}

export async function listLivechatAiQaChats(env, filters = {}) {
  const tables = await ensureLivechatAiQaTables(env);
  const where = [];
  const binds = [];
  if (filters.from) {
    where.push("last_event_at >= ?");
    binds.push(filters.from);
  }
  if (filters.to) {
    where.push("last_event_at <= ?");
    binds.push(filters.to);
  }
  if (filters.agent) {
    where.push("(agent_label LIKE ? OR agent_ids_json LIKE ? OR transferred_to_agent_ids_json LIKE ?)");
    const value = `%${filters.agent}%`;
    binds.push(value, value, value);
  }
  if (filters.tag) {
    where.push("tags_json LIKE ?");
    binds.push(`%${filters.tag}%`);
  }
  if (filters.chatId) {
    where.push("(chat_id LIKE ? OR thread_id LIKE ?)");
    const value = `%${filters.chatId}%`;
    binds.push(value, value);
  }
  if (filters.transferred === "yes") where.push("transferred_to_agent = 1");
  if (filters.transferred === "no") where.push("transferred_to_agent = 0");
  if (filters.reason) {
    where.push("transfer_reason = ?");
    binds.push(filters.reason);
  }
  if (filters.hasQueue === "yes") where.push("queued_at IS NOT NULL");
  if (filters.hasQueue === "no") where.push("queued_at IS NULL");
  if (filters.customerLanguage) {
    where.push("customer_language LIKE ?");
    binds.push(`%${filters.customerLanguage}%`);
  }
  if (filters.chatbotLanguage) {
    where.push("chatbot_language LIKE ?");
    binds.push(`%${filters.chatbotLanguage}%`);
  }

  const sortMap = {
    date: "last_event_at",
    agent: "agent_label",
    transferred: "transferred_to_agent",
    reason: "transfer_reason",
    queue: "queue_wait_ms",
    ftr: "ftr_ms",
    cht: "cht_ms",
    customerLanguage: "customer_language",
    chatbotLanguage: "chatbot_language",
    tags: "tags_json",
  };
  const sortColumn = sortMap[filters.sort] || "last_event_at";
  const order = filters.order === "asc" ? "ASC" : "DESC";
  const pageSize = Math.min(Math.max(Number(filters.pageSize) || 50, 1), 200);
  const page = Math.max(Number(filters.page) || 1, 1);
  const offset = (page - 1) * pageSize;
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countRow = await env.DB.prepare(`SELECT COUNT(*) AS count FROM ${tables.chats} ${whereSql}`).bind(...binds).first();
  const rows = await env.DB.prepare(`
    SELECT * FROM ${tables.chats}
    ${whereSql}
    ORDER BY ${sortColumn} ${order}, chat_id ASC
    LIMIT ? OFFSET ?
  `)
    .bind(...binds, pageSize, offset)
    .all();

  const events = [];
  const chatKeys = (rows.results || []).map((row) => [row.chat_id, row.thread_id]);
  for (const [chatId, threadId] of chatKeys) {
    const eventRows = await env.DB.prepare(`
      SELECT * FROM ${tables.events}
      WHERE chat_id = ? AND thread_id = ?
      ORDER BY event_at ASC, event_id ASC, event_key ASC
    `)
      .bind(chatId, threadId)
      .all();
    events.push([`${chatId}:${threadId}`, eventRows.results || []]);
  }
  const eventsByChat = new Map(events);

  return {
    rows: (rows.results || []).map((row) => chatRow(row, eventsByChat.get(`${row.chat_id}:${row.thread_id}`) || [])),
    page,
    pageSize,
    total: Number(countRow?.count || 0),
  };
}
