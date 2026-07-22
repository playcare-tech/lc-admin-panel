import { ensureLivechatAiQaTables } from "./livechat-ai-qa-tagging.js";

const SETTINGS_TABLE = "livechat_ai_qa_queue_settings";
const HISTORY_TABLE = "livechat_ai_qa_review_history";
const REVIEW_TYPES = ["auto_tag", "agent_qa"];
let managementTablesReady;

function reviewTable(tables, type) {
  return type === "agent_qa" ? tables.agentQaReviews : tables.reviews;
}

async function ensureColumn(env, table, name, definition) {
  const { results } = await env.DB.prepare(`PRAGMA table_info(${table})`).all();
  if ((results || []).some((column) => column.name === name)) return;
  await env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`).run();
}

export async function ensureLivechatAiQaManagementTables(env) {
  if (!managementTablesReady) {
    managementTablesReady = ensureLivechatAiQaManagementTablesUncached(env).catch((error) => {
      managementTablesReady = null;
      throw error;
    });
  }
  return managementTablesReady;
}

async function ensureLivechatAiQaManagementTablesUncached(env) {
  const tables = await ensureLivechatAiQaTables(env);
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ${SETTINGS_TABLE} (
      username TEXT NOT NULL,
      review_type TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 0,
      target_queue_size INTEGER NOT NULL DEFAULT 20,
      updated_by TEXT,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (username, review_type)
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ${HISTORY_TABLE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_type TEXT NOT NULL,
      review_id TEXT NOT NULL,
      chat_id TEXT,
      thread_id TEXT,
      action TEXT NOT NULL,
      previous_status TEXT,
      new_status TEXT,
      previous_result_json TEXT NOT NULL DEFAULT '[]',
      new_result_json TEXT NOT NULL DEFAULT '[]',
      reviewer TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL
    )
  `).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_livechat_ai_qa_history_user_date ON ${HISTORY_TABLE}(reviewer, created_at)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_livechat_ai_qa_history_review ON ${HISTORY_TABLE}(review_type, review_id, created_at)`).run();
  for (const table of [tables.reviews, tables.agentQaReviews]) {
    await ensureColumn(env, table, "assigned_to", "TEXT");
    await ensureColumn(env, table, "assigned_at", "TEXT");
    await ensureColumn(env, table, "completed_by", "TEXT");
  }
  for (const [type, table] of [["auto_tag", tables.reviews], ["agent_qa", tables.agentQaReviews]]) {
    await env.DB.prepare(`
      INSERT INTO ${HISTORY_TABLE}
        (review_type, review_id, chat_id, thread_id, action, previous_status, new_status,
         previous_result_json, new_result_json, reviewer, note, created_at)
      SELECT ?, r.id, r.chat_id, r.thread_id, r.status, '', r.status, '[]',
             COALESCE(r.final_tags_json, '[]'), COALESCE(NULLIF(r.reviewer, ''), 'unknown'),
             COALESCE(r.decision_note, ''), COALESCE(r.reviewed_at, r.updated_at)
      FROM ${table} r
      WHERE r.status IN ('approved', 'corrected')
        AND NOT EXISTS (
          SELECT 1 FROM ${HISTORY_TABLE} h
          WHERE h.review_type = ? AND h.review_id = r.id
        )
    `).bind(type, type).run();
  }
  return tables;
}

export async function recordLivechatAiQaDecisionHistory(env, entry) {
  await ensureLivechatAiQaManagementTables(env);
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO ${HISTORY_TABLE}
      (review_type, review_id, chat_id, thread_id, action, previous_status, new_status,
       previous_result_json, new_result_json, reviewer, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      entry.reviewType,
      entry.reviewId,
      entry.chatId || "",
      entry.threadId || "",
      entry.action,
      entry.previousStatus || "",
      entry.newStatus || "",
      JSON.stringify(entry.previousResult || []),
      JSON.stringify(entry.newResult || []),
      entry.reviewer,
      `${entry.note || ""}`.slice(0, 1200),
      now,
    )
    .run();
}

export async function getLivechatAiQaQueueSettings(env, username) {
  await ensureLivechatAiQaManagementTables(env);
  const { results } = await env.DB.prepare(`
    SELECT review_type, enabled, target_queue_size, updated_by, updated_at
    FROM ${SETTINGS_TABLE}
    WHERE username = ?
  `).bind(username).all();
  const byType = new Map((results || []).map((row) => [row.review_type, row]));
  return REVIEW_TYPES.map((type) => {
    const row = byType.get(type);
    return {
      reviewType: type,
      enabled: Boolean(row?.enabled),
      targetQueueSize: Number(row?.target_queue_size || 20),
      updatedBy: row?.updated_by || "",
      updatedAt: row?.updated_at || "",
    };
  });
}

export async function saveLivechatAiQaQueueSetting(env, { username, reviewType, enabled, targetQueueSize, updatedBy }) {
  const tables = await ensureLivechatAiQaManagementTables(env);
  if (!REVIEW_TYPES.includes(reviewType)) throw new Error("Unsupported review type.");
  const size = Math.min(Math.max(Number(targetQueueSize) || 20, 1), 500);
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO ${SETTINGS_TABLE} (username, review_type, enabled, target_queue_size, updated_by, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(username, review_type) DO UPDATE SET
      enabled = excluded.enabled,
      target_queue_size = excluded.target_queue_size,
      updated_by = excluded.updated_by,
      updated_at = excluded.updated_at
  `).bind(username, reviewType, enabled ? 1 : 0, size, updatedBy, now).run();
  if (enabled) await refillLivechatAiQaQueue(env, tables, username, reviewType, size);
  return getLivechatAiQaQueueSettings(env, username);
}

export async function refillLivechatAiQaQueue(env, preloadedTables, username, reviewType, targetQueueSize) {
  const tables = preloadedTables || await ensureLivechatAiQaManagementTables(env);
  const table = reviewTable(tables, reviewType);
  if (reviewType === "auto_tag") {
    const current = await env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM ${tables.reviews} r
      LEFT JOIN ${tables.agentQaReviews} aq ON aq.chat_id = r.chat_id AND aq.thread_id = r.thread_id
      WHERE r.assigned_to = ? AND (r.status = 'pending_review' OR aq.status = 'pending_review')
    `).bind(username).first();
    const needed = Math.max(0, Number(targetQueueSize || 0) - Number(current?.count || 0));
    if (!needed) return { assigned: 0 };
    const { results } = await env.DB.prepare(`
      SELECT r.id, r.chat_id, r.thread_id
      FROM ${tables.reviews} r
      JOIN ${tables.agentQaReviews} aq ON aq.chat_id = r.chat_id AND aq.thread_id = r.thread_id
      WHERE r.status = 'pending_review'
        AND aq.status = 'pending_review'
        AND r.ai_status = 'completed'
        AND aq.ai_status = 'completed'
        AND (r.assigned_to IS NULL OR r.assigned_to = '')
        AND (aq.assigned_to IS NULL OR aq.assigned_to = '')
      ORDER BY
        CASE
          WHEN r.suggested_tags_json LIKE '%"other"%' THEN 0
          WHEN COALESCE(r.ai_overall_confidence, 1) < 0.75 OR COALESCE(aq.ai_overall_confidence, 1) < 0.85 THEN 1
          ELSE 2
        END ASC,
        MIN(COALESCE(r.ai_overall_confidence, 1), COALESCE(aq.ai_overall_confidence, 1)) ASC,
        r.queued_at DESC,
        r.created_at DESC
      LIMIT ?
    `).bind(needed).all();
    let assigned = 0;
    for (const row of results || []) {
      const now = new Date().toISOString();
      const result = await env.DB.prepare(`
        UPDATE ${tables.reviews} SET assigned_to = ?, assigned_at = ?, updated_at = ?
        WHERE id = ? AND (assigned_to IS NULL OR assigned_to = '')
      `).bind(username, now, now, row.id).run();
      if (Number(result.meta?.changes || 0)) {
        await env.DB.prepare(`
          UPDATE ${tables.agentQaReviews} SET assigned_to = ?, assigned_at = ?, updated_at = ?
          WHERE chat_id = ? AND thread_id = ?
        `).bind(username, now, now, row.chat_id, row.thread_id).run();
        assigned += 1;
      }
    }
    return { assigned };
  }
  const current = await env.DB.prepare(`
    SELECT COUNT(*) AS count FROM ${table}
    WHERE assigned_to = ? AND status = 'pending_review'
  `).bind(username).first();
  const needed = Math.max(0, Number(targetQueueSize || 0) - Number(current?.count || 0));
  if (!needed) return { assigned: 0 };
  const { results } = await env.DB.prepare(`
    SELECT id FROM ${table}
    WHERE status = 'pending_review'
      AND ai_status = 'completed'
      AND (assigned_to IS NULL OR assigned_to = '')
    ORDER BY
      CASE WHEN COALESCE(ai_overall_confidence, 1) < 0.85 THEN 0 ELSE 1 END ASC,
      COALESCE(ai_overall_confidence, 1) ASC,
      queued_at DESC,
      created_at DESC
    LIMIT ?
  `).bind(needed).all();
  let assigned = 0;
  for (const row of results || []) {
    const result = await env.DB.prepare(`
      UPDATE ${table} SET assigned_to = ?, assigned_at = ?, updated_at = ?
      WHERE id = ? AND status = 'pending_review' AND (assigned_to IS NULL OR assigned_to = '')
    `).bind(username, new Date().toISOString(), new Date().toISOString(), row.id).run();
    assigned += Number(result.meta?.changes || 0);
  }
  return { assigned };
}

export async function releaseLivechatAiQaQueue(env, username, reviewType) {
  const tables = await ensureLivechatAiQaManagementTables(env);
  const types = REVIEW_TYPES.includes(reviewType) ? [reviewType] : REVIEW_TYPES;
  let released = 0;
  for (const type of types) {
    const result = await env.DB.prepare(`
      UPDATE ${reviewTable(tables, type)}
      SET assigned_to = NULL, assigned_at = NULL, updated_at = ?
      WHERE assigned_to = ? AND status = 'pending_review'
    `).bind(new Date().toISOString(), username).run();
    released += Number(result.meta?.changes || 0);
    if (type === "auto_tag") {
      await env.DB.prepare(`
        UPDATE ${tables.agentQaReviews}
        SET assigned_to = NULL, assigned_at = NULL, updated_at = ?
        WHERE assigned_to = ? AND status = 'pending_review'
      `).bind(new Date().toISOString(), username).run();
    }
  }
  return { released };
}

export async function refillConfiguredLivechatAiQaQueue(env, username, reviewType) {
  if (!username || !REVIEW_TYPES.includes(reviewType)) return { assigned: 0 };
  const settings = await getLivechatAiQaQueueSettings(env, username);
  const setting = settings.find((item) => item.reviewType === reviewType);
  if (!setting?.enabled) return { assigned: 0 };
  return refillLivechatAiQaQueue(env, null, username, reviewType, setting.targetQueueSize);
}

export async function refillAllEnabledLivechatAiQaQueues(env, reviewType) {
  if (!REVIEW_TYPES.includes(reviewType)) return { assigned: 0 };
  const tables = await ensureLivechatAiQaManagementTables(env);
  const { results } = await env.DB.prepare(`
    SELECT username, target_queue_size
    FROM ${SETTINGS_TABLE}
    WHERE review_type = ? AND enabled = 1
    ORDER BY updated_at ASC, username ASC
  `).bind(reviewType).all();
  let assigned = 0;
  for (const row of results || []) {
    const result = await refillLivechatAiQaQueue(env, tables, row.username, reviewType, row.target_queue_size);
    assigned += result.assigned;
  }
  return { assigned };
}

export async function getLivechatAiQaManagementOverview(env, { username, from, to, includeAllUsers = false }) {
  const tables = await ensureLivechatAiQaManagementTables(env);
  const settings = await getLivechatAiQaQueueSettings(env, username);
  const queue = {};
  for (const type of REVIEW_TYPES) {
    const setting = settings.find((item) => item.reviewType === type);
    if (setting?.enabled) {
      await refillLivechatAiQaQueue(env, tables, username, type, setting.targetQueueSize);
    }
    const table = reviewTable(tables, type);
    const row = type === "auto_tag"
      ? await env.DB.prepare(`
          SELECT
            SUM(CASE WHEN r.assigned_to = ? AND (r.status = 'pending_review' OR aq.status = 'pending_review') THEN 1 ELSE 0 END) AS assigned,
            SUM(CASE WHEN (r.assigned_to IS NULL OR r.assigned_to = '') AND (r.status = 'pending_review' OR aq.status = 'pending_review') THEN 1 ELSE 0 END) AS unassigned
          FROM ${tables.reviews} r
          LEFT JOIN ${tables.agentQaReviews} aq ON aq.chat_id = r.chat_id AND aq.thread_id = r.thread_id
        `).bind(username).first()
      : await env.DB.prepare(`
          SELECT
            SUM(CASE WHEN assigned_to = ? AND status = 'pending_review' THEN 1 ELSE 0 END) AS assigned,
            SUM(CASE WHEN (assigned_to IS NULL OR assigned_to = '') AND status = 'pending_review' THEN 1 ELSE 0 END) AS unassigned
          FROM ${table}
        `).bind(username).first();
    queue[type] = { assigned: Number(row?.assigned || 0), unassigned: Number(row?.unassigned || 0) };
  }
  const where = ["created_at >= ?", "created_at <= ?"];
  const binds = [from, to];
  if (!includeAllUsers) {
    where.push("reviewer = ?");
    binds.push(username);
  }
  const { results } = await env.DB.prepare(`
    SELECT reviewer,
      SUM(CASE WHEN action = 'approved' THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN action = 'corrected' THEN 1 ELSE 0 END) AS corrected,
      SUM(CASE WHEN action = 'edited' THEN 1 ELSE 0 END) AS edited,
      SUM(CASE WHEN action IN ('approved', 'corrected') THEN 1 ELSE 0 END) AS processed
    FROM ${HISTORY_TABLE}
    WHERE ${where.join(" AND ")}
    GROUP BY reviewer
    ORDER BY processed DESC, corrected DESC, reviewer ASC
  `).bind(...binds).all();
  const { results: dailyResults } = await env.DB.prepare(`
    SELECT substr(created_at, 1, 10) AS date, reviewer,
      SUM(CASE WHEN action = 'approved' THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN action = 'corrected' THEN 1 ELSE 0 END) AS corrected,
      SUM(CASE WHEN action = 'edited' THEN 1 ELSE 0 END) AS edited,
      SUM(CASE WHEN action IN ('approved', 'corrected') THEN 1 ELSE 0 END) AS processed
    FROM ${HISTORY_TABLE}
    WHERE ${where.join(" AND ")}
    GROUP BY substr(created_at, 1, 10), reviewer
    ORDER BY date DESC, processed DESC, reviewer ASC
  `).bind(...binds).all();
  let users = [username];
  if (includeAllUsers) {
    const adminTable = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'admin_users'").first();
    if (adminTable) {
      const userRows = await env.DB.prepare(`
        SELECT username FROM admin_users
        WHERE disabled_at IS NULL AND user_role IN ('qa_manager', 'admin')
        ORDER BY user_role DESC, username ASC
      `).all();
      users = (userRows.results || []).map((row) => row.username);
    }
  }
  return {
    users,
    settings,
    queue,
    statistics: (results || []).map((row) => ({
      reviewer: row.reviewer,
      approved: Number(row.approved || 0),
      corrected: Number(row.corrected || 0),
      edited: Number(row.edited || 0),
      processed: Number(row.processed || 0),
    })),
    dailyStatistics: (dailyResults || []).map((row) => ({
      date: row.date,
      reviewer: row.reviewer,
      approved: Number(row.approved || 0),
      corrected: Number(row.corrected || 0),
      edited: Number(row.edited || 0),
      processed: Number(row.processed || 0),
    })),
  };
}
