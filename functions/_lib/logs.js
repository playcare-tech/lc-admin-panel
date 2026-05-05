const CREATE_TABLE_SQL =
  "CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL, actor TEXT NOT NULL, area TEXT NOT NULL, action TEXT NOT NULL, target TEXT, status TEXT NOT NULL, details TEXT, metadata TEXT)";

const CREATE_INDEX_SQL =
  "CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs (created_at DESC)";

const LOG_COLUMNS = {
  actor: "TEXT NOT NULL DEFAULT 'unknown'",
  area: "TEXT NOT NULL DEFAULT 'app'",
  action: "TEXT NOT NULL DEFAULT 'unknown'",
  target: "TEXT",
  status: "TEXT NOT NULL DEFAULT 'success'",
  details: "TEXT",
  metadata: "TEXT",
};

let logsTableReady = false;
let logsTableReadyPromise = null;

function parseMetadata(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("Failed to parse audit log metadata.", error);
    return null;
  }
}

async function prepareLogsTable(db) {
  await db.exec(CREATE_TABLE_SQL);
  const { results } = await db.prepare("PRAGMA table_info(logs)").all();
  const existingColumns = new Set((results || []).map((column) => column.name));
  for (const [column, definition] of Object.entries(LOG_COLUMNS)) {
    if (!existingColumns.has(column)) {
      await db.exec(`ALTER TABLE logs ADD COLUMN ${column} ${definition}`);
    }
  }
  await db.exec(CREATE_INDEX_SQL);
}

export async function ensureLogsTable(db) {
  if (!db) {
    throw new Error("Missing DB binding.");
  }
  if (logsTableReady) return;

  if (!logsTableReadyPromise) {
    logsTableReadyPromise = prepareLogsTable(db)
      .then(() => {
        logsTableReady = true;
      })
      .catch((error) => {
        logsTableReadyPromise = null;
        throw error;
      });
  }

  await logsTableReadyPromise;
}

export async function writeLog(env, entry) {
  await ensureLogsTable(env.DB);
  await env.DB.prepare(
    `
      INSERT INTO logs (created_at, actor, area, action, target, status, details, metadata)
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
  await ensureLogsTable(env.DB);
  const { results } = await env.DB.prepare(
    `
      SELECT id, created_at, actor, area, action, target, status, details, metadata
      FROM logs
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
  await ensureLogsTable(env.DB);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 25));
  const { results } = await env.DB.prepare(
    `
      SELECT id, created_at, actor, area, action, target, status, details, metadata
      FROM logs
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
