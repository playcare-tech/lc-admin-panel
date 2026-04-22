const CREATE_TABLE_SQL =
  "CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL, actor TEXT NOT NULL, area TEXT NOT NULL, action TEXT NOT NULL, target TEXT, status TEXT NOT NULL, details TEXT, metadata TEXT)";

const CREATE_INDEX_SQL =
  "CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs (created_at DESC)";

export async function ensureLogsTable(db) {
  if (!db) {
    throw new Error("Missing DB binding.");
  }

  await db.exec(CREATE_TABLE_SQL);
  await db.exec(CREATE_INDEX_SQL);
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
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  }));
}
