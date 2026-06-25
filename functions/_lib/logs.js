import { accountIndexName, accountTableName } from "./accounts.js";

const LOG_RETENTION_DAYS = 7;
const SKIPPED_LOG_ACTIONS = new Set(["run_workflow", "create_ticket_webhook"]);
const SKIPPED_LOG_ACTORS = new Set(["system:helpdesk-webhook"]);

const LOG_COLUMNS = {
  actor: "TEXT NOT NULL DEFAULT 'unknown'",
  area: "TEXT NOT NULL DEFAULT 'app'",
  action: "TEXT NOT NULL DEFAULT 'unknown'",
  target: "TEXT",
  status: "TEXT NOT NULL DEFAULT 'success'",
  details: "TEXT",
  metadata: "TEXT",
};

const logsReady = new Map();

function parseMetadata(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("Failed to parse audit log metadata.", error);
    return null;
  }
}

function logsTable(env) {
  return accountTableName(env, "logs");
}

async function prepareLogsTable(env) {
  const table = logsTable(env);
  const index = accountIndexName(env, "idx_logs_created_at");
  await env.DB.exec(
    `CREATE TABLE IF NOT EXISTS ${table} (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL, actor TEXT NOT NULL, area TEXT NOT NULL, action TEXT NOT NULL, target TEXT, status TEXT NOT NULL, details TEXT, metadata TEXT)`,
  );
  const { results } = await env.DB.prepare(`PRAGMA table_info(${table})`).all();
  const existingColumns = new Set((results || []).map((column) => column.name));
  for (const [column, definition] of Object.entries(LOG_COLUMNS)) {
    if (!existingColumns.has(column)) {
      await env.DB.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }
  await env.DB.exec(`CREATE INDEX IF NOT EXISTS ${index} ON ${table} (created_at DESC)`);
  await purgeOldLogs(env);
}

async function purgeOldLogs(env) {
  const table = logsTable(env);
  const cutoff = new Date(Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare(`DELETE FROM ${table} WHERE created_at < ?`).bind(cutoff).run();
}

function shouldStoreLog(entry = {}) {
  if (SKIPPED_LOG_ACTIONS.has(`${entry.action || ""}`)) return false;
  if (SKIPPED_LOG_ACTORS.has(`${entry.actor || ""}`)) return false;
  return true;
}

export async function ensureLogsTable(env) {
  if (!env?.DB) {
    throw new Error("Missing DB binding.");
  }
  const table = logsTable(env);
  if (!logsReady.has(table)) {
    logsReady.set(
      table,
      prepareLogsTable(env).catch((error) => {
        logsReady.delete(table);
        throw error;
      }),
    );
  }

  await logsReady.get(table);
}

export async function writeLog(env, entry) {
  if (!shouldStoreLog(entry)) return;
  const table = logsTable(env);
  await ensureLogsTable(env);
  await purgeOldLogs(env);
  await env.DB.prepare(
    `
      INSERT INTO ${table} (created_at, actor, area, action, target, status, details, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
  )
    .bind(
      entry.createdAt ?? new Date().toISOString(),
      entry.actor ?? "unknown",
      entry.area ?? "app",
      entry.action ?? "unknown",
      entry.target ?? "",
      entry.status ?? "success",
      entry.details ?? "",
      entry.metadata ? JSON.stringify(entry.metadata) : null,
    )
    .run();
}

export async function writeLogSafely(env, entry) {
  try {
    await writeLog(env, entry);
  } catch (error) {
    console.error("Failed to write audit log.", error);
  }
}

export async function listLogs(env, limit = 250) {
  const table = logsTable(env);
  await ensureLogsTable(env);
  await purgeOldLogs(env);
  const { results } = await env.DB.prepare(
    `
      SELECT id, created_at, actor, area, action, target, status, details, metadata
      FROM ${table}
      ORDER BY created_at DESC
      LIMIT ?
    `,
  )
    .bind(limit)
    .all();

  return results.map((row) => ({
    ...row,
    metadata: parseMetadata(row.metadata),
  }));
}

export async function listLogsByAction(env, { area, action, limit = 25 } = {}) {
  const table = logsTable(env);
  await ensureLogsTable(env);
  await purgeOldLogs(env);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 25));
  const { results } = await env.DB.prepare(
    `
      SELECT id, created_at, actor, area, action, target, status, details, metadata
      FROM ${table}
      WHERE (? IS NULL OR area = ?)
        AND (? IS NULL OR action = ?)
      ORDER BY created_at DESC
      LIMIT ?
    `,
  )
    .bind(area || null, area || null, action || null, action || null, safeLimit)
    .all();

  return results.map((row) => ({
    ...row,
    metadata: parseMetadata(row.metadata),
  }));
}
