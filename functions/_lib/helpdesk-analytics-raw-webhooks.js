import { accountIndexName, accountTableName } from "./accounts.js";

const RAW_WEBHOOK_TABLE_BASE = "helpdesk_analytics_raw_webhooks";
const MAX_RAW_WEBHOOK_ROWS = 50;
const MAX_RAW_BODY_LENGTH = 250000;

function rawWebhookTable(env) {
  return accountTableName(env, RAW_WEBHOOK_TABLE_BASE);
}

function safeHeaders(headers) {
  const result = {};
  for (const [name, value] of headers.entries()) {
    const key = name.toLowerCase();
    if (["authorization", "cookie", "x-csrf-token"].includes(key)) continue;
    result[name] = value;
  }
  return result;
}

function parseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_error) {
    return null;
  }
}

async function ensureRawWebhookTable(env) {
  if (!env?.DB) throw new Error("Missing DB binding.");
  const table = rawWebhookTable(env);
  await env.DB
    .prepare(
      `CREATE TABLE IF NOT EXISTS ${table} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        method TEXT NOT NULL,
        url TEXT NOT NULL,
        event_type TEXT,
        webhook_created_at TEXT,
        webhook_id TEXT,
        content_type TEXT,
        body_size INTEGER NOT NULL DEFAULT 0,
        body_truncated INTEGER NOT NULL DEFAULT 0,
        headers_json TEXT NOT NULL,
        body_text TEXT NOT NULL
      )`,
    )
    .run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${accountIndexName(env, `idx_${RAW_WEBHOOK_TABLE_BASE}_received`) } ON ${table}(received_at)`).run();
}

async function pruneRawWebhookRows(env) {
  const table = rawWebhookTable(env);
  await env.DB.prepare(
    `DELETE FROM ${table}
     WHERE id NOT IN (
       SELECT id FROM ${table}
       ORDER BY id DESC
       LIMIT ?
     )`,
  )
    .bind(MAX_RAW_WEBHOOK_ROWS)
    .run();
}

export async function recordRawHelpDeskAnalyticsWebhook(env, request, bodyText) {
  await ensureRawWebhookTable(env);
  const url = new URL(request.url);
  const parsed = parseJson(bodyText);
  const bodySize = new TextEncoder().encode(bodyText || "").length;
  const bodyTruncated = bodyText.length > MAX_RAW_BODY_LENGTH;
  const storedBody = bodyTruncated ? bodyText.slice(0, MAX_RAW_BODY_LENGTH) : bodyText;
  const table = rawWebhookTable(env);

  const result = await env.DB.prepare(
    `INSERT INTO ${table}
      (method, url, event_type, webhook_created_at, webhook_id, content_type, body_size, body_truncated, headers_json, body_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      request.method,
      `${url.pathname}${url.search}`,
      parsed?.eventType || "",
      parsed?.createdAt || "",
      request.headers.get("x-helpdesk-webhook-id") || "",
      request.headers.get("content-type") || "",
      bodySize,
      bodyTruncated ? 1 : 0,
      JSON.stringify(safeHeaders(request.headers), null, 2),
      storedBody,
    )
    .run();

  await pruneRawWebhookRows(env);
  return {
    id: result?.meta?.last_row_id || null,
    eventType: parsed?.eventType || "",
    bodySize,
    truncated: bodyTruncated,
  };
}

export async function listRawHelpDeskAnalyticsWebhooks(env, limit = 20) {
  await ensureRawWebhookTable(env);
  const table = rawWebhookTable(env);
  const boundedLimit = Math.max(1, Math.min(Number(limit) || 20, MAX_RAW_WEBHOOK_ROWS));
  const rows = await env.DB.prepare(
    `SELECT id, received_at, method, url, event_type, webhook_created_at, webhook_id, content_type, body_size, body_truncated, headers_json, body_text
     FROM ${table}
     ORDER BY id DESC
     LIMIT ?`,
  )
    .bind(boundedLimit)
    .all();

  return (rows.results || []).map((row) => ({
    id: row.id,
    receivedAt: row.received_at,
    method: row.method,
    url: row.url,
    eventType: row.event_type,
    webhookCreatedAt: row.webhook_created_at,
    webhookId: row.webhook_id,
    contentType: row.content_type,
    bodySize: Number(row.body_size || 0),
    bodyTruncated: Boolean(row.body_truncated),
    headers: parseJson(row.headers_json) || {},
    bodyText: row.body_text || "",
    bodyJson: parseJson(row.body_text || ""),
  }));
}
