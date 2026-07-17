import { accountTableName } from "./accounts.js";
import { livechatAgentChatRequest } from "./livechat.js";

const SETTINGS_TABLE_BASE = "livechat_translation_settings";
const CHAT_TABLE_BASE = "livechat_translation_chats";
const EVENT_TABLE_BASE = "livechat_translation_events";
const DEFAULT_GROUP_ID = "263";
const DEFAULT_TARGET_LANG = "EN";

const livechatTranslationSchemaReady = new Map();

function text(value) {
  return `${value ?? ""}`.trim();
}

function nowIso() {
  return new Date().toISOString();
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

function isAgentId(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(value).toLowerCase());
}

function normalizeLanguageCode(value) {
  return text(value).toUpperCase();
}

function isEnglishLanguage(value) {
  return normalizeLanguageCode(value).startsWith("EN");
}

function chatIdFromPayload(payload) {
  return text(payload?.chat_id || payload?.chat?.id || payload?.id);
}

function threadIdFromPayload(payload) {
  return text(payload?.thread_id || payload?.chat?.thread?.id || payload?.thread?.id);
}

function groupIdsFromPayload(payload) {
  const candidates = [
    payload?.chat?.access?.group_ids,
    payload?.chat?.thread?.access?.group_ids,
    payload?.chat?.group_ids,
    payload?.chat?.group_id ? [payload.chat.group_id] : [],
    payload?.chat?.groupId ? [payload.chat.groupId] : [],
    payload?.chat?.group?.id ? [payload.chat.group.id] : [],
    payload?.queue?.group_ids,
    payload?.group_id ? [payload.group_id] : [],
    payload?.groupId ? [payload.groupId] : [],
    payload?.group_ids,
  ];
  return unique(candidates.flat().filter(Boolean));
}

function eventIdFromPayload(body) {
  const payload = body?.payload || {};
  const event = payload?.event || {};
  return text(event.id || payload.event_id || body.webhook_id || payload.webhook_id || "");
}

function eventText(event) {
  if (typeof event?.text === "string") return text(event.text);
  const message = event?.message || event?.content || {};
  if (typeof message === "string") return text(message);
  return text(
    message.text ||
      message.plainText ||
      message.plain_text ||
      event?.plainText ||
      event?.plain_text ||
      "",
  );
}

function eventType(event) {
  return text(event?.type);
}

function authorType(event) {
  if (eventType(event) === "system_message") return "system";
  if (isAgentId(event?.author_id)) return "agent";
  return "customer";
}

function sourceLangFromTranslation(result, fallback = "") {
  return normalizeLanguageCode(result?.detected_source_language || fallback);
}

function deeplBaseUrl(env, authKey) {
  if (text(env.DEEPL_API_BASE_URL)) return text(env.DEEPL_API_BASE_URL).replace(/\/$/, "");
  return authKey.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com";
}

function deeplAuthKey(env) {
  return text(env.DEEPL_AUTH_KEY);
}

function translationBotId(env) {
  return text(env.LIVECHAT_TRANSLATION_BOT_ID);
}

export function livechatTranslationTables(env) {
  return {
    settings: accountTableName(env, SETTINGS_TABLE_BASE),
    chats: accountTableName(env, CHAT_TABLE_BASE),
    events: accountTableName(env, EVENT_TABLE_BASE),
  };
}

export async function ensureLivechatTranslationTables(env) {
  const tables = livechatTranslationTables(env);
  const schemaKey = [tables.settings, tables.chats, tables.events].join("|");
  if (!livechatTranslationSchemaReady.has(schemaKey)) {
    livechatTranslationSchemaReady.set(
      schemaKey,
      ensureLivechatTranslationTablesUncached(env, tables).catch((error) => {
        livechatTranslationSchemaReady.delete(schemaKey);
        throw error;
      }),
    );
  }
  await livechatTranslationSchemaReady.get(schemaKey);
  return tables;
}

async function ensureLivechatTranslationTablesUncached(env, tables) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ${tables.settings} (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      group_id TEXT NOT NULL DEFAULT '${DEFAULT_GROUP_ID}',
      enabled INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      updated_by TEXT NOT NULL DEFAULT ''
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ${tables.chats} (
      chat_id TEXT NOT NULL,
      thread_id TEXT NOT NULL,
      group_id TEXT NOT NULL DEFAULT '',
      customer_language TEXT NOT NULL DEFAULT '',
      last_customer_event_id TEXT NOT NULL DEFAULT '',
      last_agent_event_id TEXT NOT NULL DEFAULT '',
      last_customer_at TEXT NOT NULL DEFAULT '',
      last_agent_at TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (chat_id, thread_id)
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ${tables.events} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_key TEXT NOT NULL UNIQUE,
      chat_id TEXT NOT NULL,
      thread_id TEXT NOT NULL,
      group_id TEXT NOT NULL DEFAULT '',
      event_id TEXT NOT NULL DEFAULT '',
      author_type TEXT NOT NULL DEFAULT '',
      direction TEXT NOT NULL DEFAULT '',
      source_lang TEXT NOT NULL DEFAULT '',
      target_lang TEXT NOT NULL DEFAULT '',
      source_text TEXT NOT NULL DEFAULT '',
      translated_text TEXT NOT NULL DEFAULT '',
      generated_event_id TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      skip_reason TEXT NOT NULL DEFAULT '',
      error TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      processed_at TEXT NOT NULL DEFAULT ''
    )
  `).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_${EVENT_TABLE_BASE}_chat ON ${tables.events}(chat_id, thread_id, created_at)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_${EVENT_TABLE_BASE}_status ON ${tables.events}(status, created_at)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_${EVENT_TABLE_BASE}_generated ON ${tables.events}(generated_event_id)`).run();
}

export async function getLivechatTranslationSettings(env) {
  const tables = await ensureLivechatTranslationTables(env);
  const row = await env.DB.prepare(`SELECT * FROM ${tables.settings} WHERE id = 1`).first();
  if (row) {
    return {
      groupId: row.group_id || DEFAULT_GROUP_ID,
      enabled: Boolean(row.enabled),
      updatedAt: row.updated_at || "",
      updatedBy: row.updated_by || "",
    };
  }
  const settings = {
    groupId: DEFAULT_GROUP_ID,
    enabled: false,
    updatedAt: nowIso(),
    updatedBy: "",
  };
  await env.DB.prepare(`
    INSERT INTO ${tables.settings} (id, group_id, enabled, updated_at, updated_by)
    VALUES (1, ?, 0, ?, '')
  `).bind(settings.groupId, settings.updatedAt).run();
  return settings;
}

export async function saveLivechatTranslationSettings(env, { groupId, enabled, updatedBy }) {
  const tables = await ensureLivechatTranslationTables(env);
  const now = nowIso();
  const value = text(groupId) || DEFAULT_GROUP_ID;
  await env.DB.prepare(`
    INSERT INTO ${tables.settings} (id, group_id, enabled, updated_at, updated_by)
    VALUES (1, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      group_id = excluded.group_id,
      enabled = excluded.enabled,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by
  `).bind(value, enabled ? 1 : 0, now, text(updatedBy)).run();
  return getLivechatTranslationSettings(env);
}

async function upsertChatState(env, tables, { chatId, threadId, groupId, customerLanguage = "", customerEventId = "", agentEventId = "", customerAt = "", agentAt = "" }) {
  const now = nowIso();
  const row = await env.DB.prepare(`SELECT * FROM ${tables.chats} WHERE chat_id = ? AND thread_id = ?`).bind(chatId, threadId).first();
  if (!row) {
    await env.DB.prepare(`
      INSERT INTO ${tables.chats}
        (chat_id, thread_id, group_id, customer_language, last_customer_event_id, last_agent_event_id,
         last_customer_at, last_agent_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(chatId, threadId, groupId, customerLanguage, customerEventId, agentEventId, customerAt, agentAt, now, now).run();
    return;
  }
  await env.DB.prepare(`
    UPDATE ${tables.chats}
    SET
      group_id = COALESCE(NULLIF(?, ''), group_id),
      customer_language = COALESCE(NULLIF(?, ''), customer_language),
      last_customer_event_id = COALESCE(NULLIF(?, ''), last_customer_event_id),
      last_agent_event_id = COALESCE(NULLIF(?, ''), last_agent_event_id),
      last_customer_at = COALESCE(NULLIF(?, ''), last_customer_at),
      last_agent_at = COALESCE(NULLIF(?, ''), last_agent_at),
      updated_at = ?
    WHERE chat_id = ? AND thread_id = ?
  `).bind(groupId, customerLanguage, customerEventId, agentEventId, customerAt, agentAt, now, chatId, threadId).run();
}

async function recordEvent(env, tables, payload) {
  await env.DB.prepare(`
    INSERT OR IGNORE INTO ${tables.events}
      (event_key, chat_id, thread_id, group_id, event_id, author_type, direction, source_lang, target_lang,
       source_text, translated_text, generated_event_id, status, skip_reason, error, created_at, processed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      payload.eventKey,
      payload.chatId,
      payload.threadId,
      payload.groupId,
      payload.eventId,
      payload.authorType,
      payload.direction,
      payload.sourceLang,
      payload.targetLang,
      payload.sourceText,
      payload.translatedText,
      payload.generatedEventId,
      payload.status,
      payload.skipReason,
      payload.error,
      payload.createdAt,
      payload.processedAt,
    )
    .run();
}

async function updateEvent(env, tables, eventKey, updates) {
  const row = await env.DB.prepare(`SELECT id FROM ${tables.events} WHERE event_key = ?`).bind(eventKey).first();
  if (!row) return;
  const assignments = [];
  const values = [];
  for (const [key, value] of Object.entries(updates)) {
    assignments.push(`${key} = ?`);
    values.push(value);
  }
  if (!assignments.length) return;
  values.push(eventKey);
  await env.DB.prepare(`UPDATE ${tables.events} SET ${assignments.join(", ")} WHERE event_key = ?`).bind(...values).run();
}

function agentMessagePayload(chatId, textValue, visibility = "all") {
  return {
    chat_id: chatId,
    event: {
      type: "message",
      text: textValue,
      visibility,
    },
  };
}

async function sendTranslationMessage(env, chatId, translatedText, visibility, authorId = "") {
  const headers = {};
  if (text(authorId)) {
    headers["X-Author-Id"] = text(authorId);
  }
  const response = await livechatAgentChatRequest(env, "send_event", agentMessagePayload(chatId, translatedText, visibility), { headers });
  return text(response?.event_id || response?.eventId || "");
}

async function translateText(env, textValue, targetLang, sourceLang = "") {
  const key = deeplAuthKey(env);
  if (!key) throw new Error("Missing DEEPL_AUTH_KEY.");
  const baseUrl = deeplBaseUrl(env, key);
  const body = {
    text: [textValue],
    target_lang: normalizeLanguageCode(targetLang) || DEFAULT_TARGET_LANG,
  };
  if (text(sourceLang)) {
    body.source_lang = normalizeLanguageCode(sourceLang);
  }

  const response = await fetch(`${baseUrl}/v2/translate`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  let payload = {};
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch (_error) {
      payload = { raw: responseText };
    }
  }

  if (!response.ok) {
    const message = payload?.message || payload?.error || payload?.error_msg || `DeepL translation failed (${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  const translation = payload?.translations?.[0] || {};
  return {
    text: text(translation.text),
    detectedSourceLanguage: sourceLangFromTranslation(translation, sourceLang),
    raw: payload,
  };
}

async function latestCustomerLanguage(env, tables, chatId, threadId) {
  const row = await env.DB.prepare(`
    SELECT customer_language
    FROM ${tables.chats}
    WHERE chat_id = ? AND thread_id = ?
  `).bind(chatId, threadId).first();
  return normalizeLanguageCode(row?.customer_language || "");
}

function translationEventKey(body) {
  const payload = body?.payload || {};
  const event = payload?.event || {};
  const eventId = text(event.id || payload.event_id || body.webhook_id || "");
  if (eventId) return eventId;
  return `${text(body.action)}:${chatIdFromPayload(payload)}:${threadIdFromPayload(payload)}:${crypto.randomUUID()}`;
}

function shouldIgnoreWebhookEvent(body, settings, payload) {
  const event = payload?.event || {};
  const groupIds = groupIdsFromPayload(payload);
  if (!settings.enabled) {
    return { ignored: true, reason: "disabled" };
  }
  if (settings.groupId && !groupIds.includes(text(settings.groupId))) {
    return { ignored: true, reason: "group_not_selected" };
  }
  if (!chatIdFromPayload(payload) || !threadIdFromPayload(payload)) {
    return { ignored: true, reason: "missing_chat_or_thread" };
  }
  if (!eventText(event)) {
    return { ignored: true, reason: "empty_message" };
  }
  if (eventType(event) === "system_message") {
    return { ignored: true, reason: "system_message" };
  }
  return null;
}

async function recordIgnoredEvent(env, tables, { eventKey, chatId, threadId, groupId, eventId, authorType, direction, sourceText, skipReason }) {
  await updateEvent(env, tables, eventKey, {
    status: "skipped",
    skip_reason: skipReason,
    error: "",
    processed_at: nowIso(),
    source_lang: "",
    target_lang: "",
    translated_text: "",
    generated_event_id: "",
  });
}

export async function processLivechatTranslationWebhook(env, body) {
  const tables = await ensureLivechatTranslationTables(env);
  const settings = await getLivechatTranslationSettings(env);
  if (text(body?.action) !== "incoming_event") {
    return {
      recorded: false,
      ignored: true,
      reason: "unsupported_action",
      chatId: chatIdFromPayload(body?.payload || {}),
      threadId: threadIdFromPayload(body?.payload || {}),
    };
  }
  const payload = body?.payload || {};
  const event = payload?.event || {};
  const chatId = chatIdFromPayload(payload);
  const threadId = threadIdFromPayload(payload);
  const eventId = eventIdFromPayload(body);
  const groupIds = groupIdsFromPayload(payload);
  const groupId = groupIds[0] || "";
  const eventKey = translationEventKey(body);
  const detectedAuthorType = authorType(event);
  const direction = detectedAuthorType === "agent" ? "outbound" : "inbound";
  const sourceText = eventText(event);

  const ignore = shouldIgnoreWebhookEvent(body, settings, payload);
  if (ignore) {
    return {
      recorded: false,
      ignored: true,
      reason: ignore.reason,
      chatId,
      threadId,
      groupId,
    };
  }

  const existing = await env.DB.prepare(`
    SELECT id
    FROM ${tables.events}
    WHERE event_key = ? OR event_id = ? OR generated_event_id = ?
    LIMIT 1
  `).bind(eventKey, eventId, eventId).first();
  if (existing) {
    return {
      recorded: false,
      ignored: true,
      reason: "duplicate",
      chatId,
      threadId,
      groupId,
    };
  }

  await recordEvent(env, tables, {
    eventKey,
    chatId,
    threadId,
    groupId,
    eventId,
    authorType: detectedAuthorType,
    direction,
    sourceLang: "",
    targetLang: "",
    sourceText,
    translatedText: "",
    generatedEventId: "",
    status: "pending",
    skipReason: "",
    error: "",
    createdAt: nowIso(),
    processedAt: "",
  });

  if (detectedAuthorType === "customer") {
    try {
      const translation = await translateText(env, sourceText, DEFAULT_TARGET_LANG);
      const detectedLang = normalizeLanguageCode(translation.detectedSourceLanguage || "");
      if (!detectedLang || isEnglishLanguage(detectedLang)) {
        await updateEvent(env, tables, eventKey, {
          status: "skipped",
          skip_reason: "already_english",
          source_lang: detectedLang || DEFAULT_TARGET_LANG,
          target_lang: DEFAULT_TARGET_LANG,
          processed_at: nowIso(),
        });
        await upsertChatState(env, tables, {
          chatId,
          threadId,
          groupId,
          customerLanguage: detectedLang || DEFAULT_TARGET_LANG,
        });
        return {
          recorded: true,
          ignored: false,
          translated: false,
          reason: "already_english",
          chatId,
          threadId,
          groupId,
        };
      }

      const translatedText = translation.text;
      const authorId = translationBotId(env);
      const generatedEventId = await sendTranslationMessage(
        env,
        chatId,
        `Translation to English (${detectedLang} -> EN): ${translatedText}`,
        "agents",
        authorId,
      );
      await updateEvent(env, tables, eventKey, {
        status: "translated",
        skip_reason: "",
        source_lang: detectedLang,
        target_lang: DEFAULT_TARGET_LANG,
        translated_text: translatedText,
        generated_event_id: generatedEventId,
        processed_at: nowIso(),
      });
      await upsertChatState(env, tables, {
        chatId,
        threadId,
        groupId,
        customerLanguage: detectedLang,
        customerEventId: eventId,
        customerAt: text(payload?.event?.created_at || payload?.created_at || nowIso()),
      });
      return {
        recorded: true,
        ignored: false,
        translated: true,
        direction: "inbound",
        sourceLang: detectedLang,
        targetLang: DEFAULT_TARGET_LANG,
        translatedText,
        chatId,
        threadId,
        groupId,
        generatedEventId,
      };
    } catch (error) {
      await updateEvent(env, tables, eventKey, {
        status: "error",
        error: text(error.message || "Translation failed."),
        processed_at: nowIso(),
      });
      return {
        recorded: true,
        ignored: false,
        translated: false,
        error: error.message || "Translation failed.",
        chatId,
        threadId,
        groupId,
      };
    }
  }

  const customerLanguage = await latestCustomerLanguage(env, tables, chatId, threadId);
  if (!customerLanguage || isEnglishLanguage(customerLanguage)) {
    await recordIgnoredEvent(env, tables, {
      eventKey,
      chatId,
      threadId,
      groupId,
      eventId,
      authorType: detectedAuthorType,
      direction,
      sourceText,
      skipReason: customerLanguage ? "customer_language_english" : "missing_customer_language",
    });
    return {
      recorded: true,
      ignored: false,
      translated: false,
      reason: customerLanguage ? "customer_language_english" : "missing_customer_language",
      chatId,
      threadId,
      groupId,
    };
  }

  try {
    const translation = await translateText(env, sourceText, customerLanguage);
    const translatedText = translation.text;
    const generatedEventId = await sendTranslationMessage(
      env,
      chatId,
      `Translation to ${customerLanguage}: ${translatedText}`,
      "all",
      translationBotId(env),
    );
    await updateEvent(env, tables, eventKey, {
      status: "translated",
      skip_reason: "",
      source_lang: translation.detectedSourceLanguage || "",
      target_lang: customerLanguage,
      translated_text: translatedText,
      generated_event_id: generatedEventId,
      processed_at: nowIso(),
    });
    await upsertChatState(env, tables, {
      chatId,
      threadId,
      groupId,
      customerLanguage,
      agentEventId: eventId,
      agentAt: text(payload?.event?.created_at || payload?.created_at || nowIso()),
    });
    return {
      recorded: true,
      ignored: false,
      translated: true,
      direction: "outbound",
      sourceLang: translation.detectedSourceLanguage || "",
      targetLang: customerLanguage,
      translatedText,
      chatId,
      threadId,
      groupId,
      generatedEventId,
    };
  } catch (error) {
    await updateEvent(env, tables, eventKey, {
      status: "error",
      error: text(error.message || "Translation failed."),
      processed_at: nowIso(),
    });
    return {
      recorded: true,
      ignored: false,
      translated: false,
      error: error.message || "Translation failed.",
      chatId,
      threadId,
      groupId,
    };
  }
}

export async function getLivechatTranslationOverview(env) {
  const tables = await ensureLivechatTranslationTables(env);
  const settings = await getLivechatTranslationSettings(env);
  const statsRow = await env.DB.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'translated' AND direction = 'inbound' THEN 1 ELSE 0 END) AS inbound_translated,
      SUM(CASE WHEN status = 'translated' AND direction = 'outbound' THEN 1 ELSE 0 END) AS outbound_translated,
      SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) AS skipped,
      SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS errors,
      MAX(created_at) AS last_seen_at
    FROM ${tables.events}
  `).first();
  const { results } = await env.DB.prepare(`
    SELECT
      event_key,
      chat_id,
      thread_id,
      group_id,
      event_id,
      author_type,
      direction,
      source_lang,
      target_lang,
      source_text,
      translated_text,
      generated_event_id,
      status,
      skip_reason,
      error,
      created_at,
      processed_at
    FROM ${tables.events}
    ORDER BY created_at DESC, id DESC
    LIMIT 50
  `).all();

  return {
    settings,
    stats: {
      total: Number(statsRow?.total || 0),
      inboundTranslated: Number(statsRow?.inbound_translated || 0),
      outboundTranslated: Number(statsRow?.outbound_translated || 0),
      skipped: Number(statsRow?.skipped || 0),
      errors: Number(statsRow?.errors || 0),
      lastSeenAt: statsRow?.last_seen_at || "",
    },
    recent: (results || []).map((row) => ({
      eventKey: row.event_key,
      chatId: row.chat_id,
      threadId: row.thread_id,
      groupId: row.group_id,
      eventId: row.event_id,
      authorType: row.author_type,
      direction: row.direction,
      sourceLang: row.source_lang,
      targetLang: row.target_lang,
      sourceText: row.source_text,
      translatedText: row.translated_text,
      generatedEventId: row.generated_event_id,
      status: row.status,
      skipReason: row.skip_reason,
      error: row.error,
      createdAt: row.created_at,
      processedAt: row.processed_at,
    })),
  };
}

export async function testLivechatTranslation(env, { text: inputText, targetLang = DEFAULT_TARGET_LANG, sourceLang = "" }) {
  const translation = await translateText(env, text(inputText), text(targetLang) || DEFAULT_TARGET_LANG, text(sourceLang));
  return {
    text: translation.text,
    detectedSourceLanguage: translation.detectedSourceLanguage,
    targetLang: text(targetLang) || DEFAULT_TARGET_LANG,
  };
}
