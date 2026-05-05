const WORKFLOWS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS helpdesk_workflows (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 0,
    config_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;

const RUNS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS helpdesk_workflow_runs (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    workflow_title TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TEXT NOT NULL,
    finished_at TEXT NOT NULL,
    details TEXT,
    metadata TEXT
  )
`;

const BUILT_IN_WORKFLOWS = [
  {
    id: "auto_merge_duplicates",
    title: "Auto-merge duplicate tickets",
    type: "auto_merge_duplicates",
    enabled: 0,
    config: {
      intervalMinutes: 30,
    },
  },
];

let workflowTablesReady = false;
let workflowTablesReadyPromise = null;

function parseJson(value, fallback = {}) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("Failed to parse HelpDesk workflow JSON.", error);
    return fallback;
  }
}

function workflowFromRow(row, runsLast24h = 0) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    enabled: Boolean(row.enabled),
    config: parseJson(row.config_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    runsLast24h: Number(runsLast24h || 0),
  };
}

function runFromRow(row) {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    workflowTitle: row.workflow_title,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    details: row.details || "",
    metadata: parseJson(row.metadata, null),
  };
}

async function objectExists(db, type, name) {
  const row = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = ? AND name = ?")
    .bind(type, name)
    .first();
  return Boolean(row);
}

async function workflowExists(db, workflowId) {
  const row = await db.prepare("SELECT id FROM helpdesk_workflows WHERE id = ?").bind(workflowId).first();
  return Boolean(row);
}

async function prepareHelpdeskWorkflowTables(db) {
  if (!(await objectExists(db, "table", "helpdesk_workflows"))) {
    await db.exec(WORKFLOWS_TABLE_SQL);
  }
  if (!(await objectExists(db, "table", "helpdesk_workflow_runs"))) {
    await db.exec(RUNS_TABLE_SQL);
  }
  if (!(await objectExists(db, "index", "idx_helpdesk_workflow_runs_workflow_started"))) {
    await db.exec("CREATE INDEX IF NOT EXISTS idx_helpdesk_workflow_runs_workflow_started ON helpdesk_workflow_runs (workflow_id, started_at DESC)");
  }
  if (!(await objectExists(db, "index", "idx_helpdesk_workflow_runs_started"))) {
    await db.exec("CREATE INDEX IF NOT EXISTS idx_helpdesk_workflow_runs_started ON helpdesk_workflow_runs (started_at DESC)");
  }

  const now = new Date().toISOString();
  for (const workflow of BUILT_IN_WORKFLOWS) {
    if (await workflowExists(db, workflow.id)) continue;
    await db
      .prepare(
        `
          INSERT OR IGNORE INTO helpdesk_workflows (id, title, type, enabled, config_json, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .bind(workflow.id, workflow.title, workflow.type, workflow.enabled, JSON.stringify(workflow.config), now, now)
      .run();
  }
}

export async function ensureHelpdeskWorkflowTables(db) {
  if (!db) {
    throw new Error("Missing DB binding.");
  }
  if (workflowTablesReady) return;

  if (!workflowTablesReadyPromise) {
    workflowTablesReadyPromise = prepareHelpdeskWorkflowTables(db)
      .then(() => {
        workflowTablesReady = true;
      })
      .catch((error) => {
        workflowTablesReadyPromise = null;
        throw error;
      });
  }

  await workflowTablesReadyPromise;
}

export async function listHelpdeskWorkflows(env) {
  await ensureHelpdeskWorkflowTables(env.DB);
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [{ results: workflows }, { results: runCounts }] = await Promise.all([
    env.DB.prepare(
      `
        SELECT id, title, type, enabled, config_json, created_at, updated_at
        FROM helpdesk_workflows
        ORDER BY type = 'auto_merge_duplicates' DESC, created_at ASC
      `,
    ).all(),
    env.DB.prepare(
      `
        SELECT workflow_id, COUNT(*) AS count
        FROM helpdesk_workflow_runs
        WHERE started_at >= ?
        GROUP BY workflow_id
      `,
    )
      .bind(cutoff)
      .all(),
  ]);
  const counts = new Map((runCounts || []).map((row) => [row.workflow_id, row.count]));

  return (workflows || []).map((row) => workflowFromRow(row, counts.get(row.id)));
}

export async function listEnabledHelpdeskWorkflows(env) {
  await ensureHelpdeskWorkflowTables(env.DB);
  const { results } = await env.DB.prepare(
    `
      SELECT id, title, type, enabled, config_json, created_at, updated_at
      FROM helpdesk_workflows
      WHERE enabled = 1
      ORDER BY type = 'auto_merge_duplicates' DESC, created_at ASC
    `,
  ).all();

  return (results || []).map((row) => workflowFromRow(row));
}

export async function listHelpdeskWorkflowRuns(env, workflowId, limit = 50) {
  await ensureHelpdeskWorkflowTables(env.DB);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
  const { results } = await env.DB.prepare(
    `
      SELECT id, workflow_id, workflow_title, status, started_at, finished_at, details, metadata
      FROM helpdesk_workflow_runs
      WHERE workflow_id = ?
      ORDER BY started_at DESC
      LIMIT ?
    `,
  )
    .bind(workflowId, safeLimit)
    .all();

  return (results || []).map(runFromRow);
}

export async function lastHelpdeskWorkflowRunAt(env, workflowId) {
  await ensureHelpdeskWorkflowTables(env.DB);
  const row = await env.DB.prepare(
    `
      SELECT started_at
      FROM helpdesk_workflow_runs
      WHERE workflow_id = ?
      ORDER BY started_at DESC
      LIMIT 1
    `,
  )
    .bind(workflowId)
    .first();

  return row?.started_at || "";
}

export async function setHelpdeskWorkflowEnabled(env, workflowId, enabled) {
  await ensureHelpdeskWorkflowTables(env.DB);
  const now = new Date().toISOString();
  const { meta } = await env.DB.prepare(
    `
      UPDATE helpdesk_workflows
      SET enabled = ?, updated_at = ?
      WHERE id = ?
    `,
  )
    .bind(enabled ? 1 : 0, now, workflowId)
    .run();

  if (!meta?.changes) {
    throw new Error("Workflow not found.");
  }
}

export async function createHelpdeskAutoResolveWorkflow(env, { title, requesterEmail, status, tagNames, tagIds }) {
  await ensureHelpdeskWorkflowTables(env.DB);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `
      INSERT INTO helpdesk_workflows (id, title, type, enabled, config_json, created_at, updated_at)
      VALUES (?, ?, 'auto_resolve_requester', 1, ?, ?, ?)
    `,
  )
    .bind(
      id,
      title,
      JSON.stringify({
        intervalMinutes: 5,
        requesterEmail,
        status,
        tagNames,
        tagIds,
      }),
      now,
      now,
    )
    .run();

  return id;
}

export async function recordHelpdeskWorkflowRun(env, run) {
  await ensureHelpdeskWorkflowTables(env.DB);
  const startedAt = run.startedAt || new Date().toISOString();
  const finishedAt = run.finishedAt || new Date().toISOString();
  const id = crypto.randomUUID();

  await env.DB.prepare(
    `
      INSERT INTO helpdesk_workflow_runs
        (id, workflow_id, workflow_title, status, started_at, finished_at, details, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
  )
    .bind(
      id,
      run.workflowId,
      run.workflowTitle,
      run.status || "success",
      startedAt,
      finishedAt,
      run.details || "",
      run.metadata ? JSON.stringify(run.metadata) : null,
    )
    .run();

  return id;
}
