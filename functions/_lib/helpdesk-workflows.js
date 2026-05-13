const WORKFLOWS_TABLE_SQL =
  "CREATE TABLE IF NOT EXISTS helpdesk_workflows (id TEXT PRIMARY KEY, title TEXT NOT NULL, type TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 0, config_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)";

const RUNS_TABLE_SQL =
  "CREATE TABLE IF NOT EXISTS helpdesk_workflow_runs (id TEXT PRIMARY KEY, workflow_id TEXT NOT NULL, workflow_title TEXT NOT NULL, status TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT NOT NULL, details TEXT, metadata TEXT)";

const RUN_STATS_TABLE_SQL =
  "CREATE TABLE IF NOT EXISTS helpdesk_workflow_run_stats (run_id TEXT NOT NULL, workflow_id TEXT NOT NULL, workflow_title TEXT NOT NULL, workflow_type TEXT NOT NULL, metric TEXT NOT NULL, metric_date TEXT NOT NULL, metric_count INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, PRIMARY KEY (run_id, metric))";

const OPEN_TICKET_SNAPSHOTS_TABLE_SQL =
  "CREATE TABLE IF NOT EXISTS helpdesk_open_ticket_snapshots (snapshot_date TEXT PRIMARY KEY, open_ticket_count INTEGER NOT NULL DEFAULT 0, captured_at TEXT NOT NULL)";

const WEBHOOK_EVENTS_TABLE_SQL =
  "CREATE TABLE IF NOT EXISTS helpdesk_webhook_events (id TEXT PRIMARY KEY, webhook_type TEXT NOT NULL, ticket_id TEXT, ticket_short_id TEXT, received_at TEXT NOT NULL, status TEXT NOT NULL, workflow_runs_count INTEGER NOT NULL DEFAULT 0, actions_count INTEGER NOT NULL DEFAULT 0, error TEXT, payload_json TEXT)";

const WORKFLOW_STATS_METRICS = {
  ticketsSolved: "tickets_solved",
  emptyTicketReplies: "empty_ticket_replies",
  ticketsMerged: "tickets_merged",
};

const AUTO_RESOLVE_WORKFLOW_TYPE = "auto_resolve_requester";
const AUTO_REPLY_EMPTY_REQUESTER_WORKFLOW_TYPE = "auto_reply_empty_requester_ticket";
const AUTO_MERGE_WORKFLOW_TYPE = "auto_merge_duplicates";
const AUTO_MERGE_6H_WORKFLOW_TYPE = "auto_merge_6h_rule";
const AUTO_MARKETING_SPAM_WORKFLOW_TYPE = "auto_resolve_marketing_spam";

const MARKETING_SPAM_DEFAULT_KEYWORDS = [
  "partnership",
  "SEO",
  "link",
  "high-quality websites",
  "Boost Your Rankings",
  "guest post",
  "opportunities",
  "streamer",
  "affiliates",
];

const EMPTY_REQUESTER_REPLY_MESSAGE = [
  "Hello dear player,",
  "",
  "Thanks for contacting Customer Support Team.",
  "",
  "How may we help you today?",
].join("\n");

const BUILT_IN_WORKFLOWS = [
  {
    id: "auto_merge_duplicates",
    title: "Auto-merge duplicate tickets",
    type: "auto_merge_duplicates",
    enabled: 0,
    config: {},
  },
  {
    id: "auto_merge_6h_rule",
    title: "Auto-merge 6h rule",
    type: "auto_merge_6h_rule",
    enabled: 0,
    config: {
      windowHours: 6,
      maxPages: 5,
      maxMergesPerRun: 3,
      maxGroupsPerRun: 3,
    },
  },
  {
    id: "auto_resolve_marketing_spam",
    title: "Auto-resolve marketing spam",
    type: "auto_resolve_marketing_spam",
    enabled: 0,
    config: {
      status: "solved",
      tagNames: ["wf_spam"],
      keywords: MARKETING_SPAM_DEFAULT_KEYWORDS,
      scoreThreshold: 4,
      maxSearchTerms: 8,
      maxCandidatesPerRun: 12,
    },
  },
  {
    id: "auto_reply_empty_requester_ticket",
    title: "Auto-reply empty requester tickets",
    type: "auto_reply_empty_requester_ticket",
    enabled: 1,
    config: {
      status: "solved",
      senderName: "Axel",
      senderEmail: "igar.k@playcare.tech",
      messageText: EMPTY_REQUESTER_REPLY_MESSAGE,
      maxPages: 10,
      maxRepliesPerRun: 15,
    },
  },
];

let workflowTablesReady = false;
let workflowTablesReadyPromise = null;
let workflowStatsTableReady = false;
let workflowStatsTableReadyPromise = null;
let openTicketSnapshotsTableReady = false;
let openTicketSnapshotsTableReadyPromise = null;
let webhookEventsTableReady = false;
let webhookEventsTableReadyPromise = null;

function parseJson(value, fallback = {}) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("Failed to parse HelpDesk workflow JSON.", error);
    return fallback;
  }
}

function workflowFromRow(row, stats = {}) {
  const normalizedStats = typeof stats === "number" ? { runsLast24h: stats } : stats || {};
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    enabled: Boolean(row.enabled),
    config: parseJson(row.config_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    runsLast24h: Number(normalizedStats.runsLast24h || 0),
    actionsLast24h: Number(normalizedStats.actionsLast24h || 0),
    lastRun: normalizedStats.lastRun || null,
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

function workflowDateKey(value, timezoneOffsetMinutes = 0) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return new Date(date.getTime() - Number(timezoneOffsetMinutes || 0) * 60000).toISOString().slice(0, 10);
}

function parseDateKey(value, fallback = "") {
  const text = `${value || ""}`.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = text ? new Date(text) : null;
  if (date && !Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  return fallback;
}

function addDays(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function datesBetween(fromDate, toDate) {
  const dates = [];
  for (let current = fromDate; current <= toDate; current = addDays(current, 1)) {
    dates.push(current);
  }
  return dates;
}

function countArray(value) {
  return Array.isArray(value) ? value.length : 0;
}

function solvedTicketCount(metadata) {
  const status = `${metadata?.status || ""}`.trim().toLowerCase();
  if (status !== "solved") return 0;

  const type = metadata?.type;
  if (type === AUTO_REPLY_EMPTY_REQUESTER_WORKFLOW_TYPE) {
    return countArray(metadata.repliedTickets);
  }
  if (type === AUTO_RESOLVE_WORKFLOW_TYPE || type === AUTO_MARKETING_SPAM_WORKFLOW_TYPE) {
    const changedTickets = Array.isArray(metadata.changedTickets) ? metadata.changedTickets : [];
    return changedTickets.filter((ticket) => {
      const previousStatus = `${ticket.previousStatus || ""}`.trim().toLowerCase();
      return !previousStatus || previousStatus !== "solved";
    }).length;
  }
  return 0;
}

function workflowRunMetricCounts(metadata = {}) {
  const type = metadata?.type || "";
  const counts = {
    [WORKFLOW_STATS_METRICS.ticketsSolved]: solvedTicketCount(metadata),
    [WORKFLOW_STATS_METRICS.emptyTicketReplies]: type === AUTO_REPLY_EMPTY_REQUESTER_WORKFLOW_TYPE ? countArray(metadata.repliedTickets) : 0,
    [WORKFLOW_STATS_METRICS.ticketsMerged]: [AUTO_MERGE_WORKFLOW_TYPE, AUTO_MERGE_6H_WORKFLOW_TYPE].includes(type)
      ? countArray(metadata.mergedTickets)
      : 0,
  };

  return Object.fromEntries(Object.entries(counts).filter(([, count]) => Number(count) > 0));
}

export function helpdeskWorkflowActionCount(metadata = {}) {
  return countArray(metadata.changedTickets) + countArray(metadata.repliedTickets) + countArray(metadata.mergedTickets);
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

async function tableColumns(db, tableName) {
  const { results } = await db.prepare(`PRAGMA table_info(${tableName})`).all();
  return new Set((results || []).map((column) => column.name));
}

async function prepareHelpdeskWorkflowCoreTables(db) {
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

async function prepareHelpdeskWorkflowStatsTable(db) {
  await db.exec(RUN_STATS_TABLE_SQL);
  const columns = await tableColumns(db, "helpdesk_workflow_run_stats");
  if (!columns.has("metric_count")) {
    await db.exec("ALTER TABLE helpdesk_workflow_run_stats ADD COLUMN metric_count INTEGER NOT NULL DEFAULT 0");
  }
  if (columns.has("count")) {
    await db.exec('UPDATE helpdesk_workflow_run_stats SET metric_count = "count" WHERE metric_count = 0');
  }
  await db.exec("CREATE INDEX IF NOT EXISTS idx_helpdesk_workflow_run_stats_date_metric ON helpdesk_workflow_run_stats (metric_date, metric)");
  await db.exec("CREATE INDEX IF NOT EXISTS idx_helpdesk_workflow_run_stats_workflow_date ON helpdesk_workflow_run_stats (workflow_id, metric_date)");
}

async function prepareOpenTicketSnapshotsTable(db) {
  await db.exec(OPEN_TICKET_SNAPSHOTS_TABLE_SQL);
  await db.exec("CREATE INDEX IF NOT EXISTS idx_helpdesk_open_ticket_snapshots_captured ON helpdesk_open_ticket_snapshots (captured_at DESC)");
}

async function prepareWebhookEventsTable(db) {
  await db.exec(WEBHOOK_EVENTS_TABLE_SQL);
  await db.exec("CREATE INDEX IF NOT EXISTS idx_helpdesk_webhook_events_received ON helpdesk_webhook_events (received_at DESC)");
  await db.exec("CREATE INDEX IF NOT EXISTS idx_helpdesk_webhook_events_type_received ON helpdesk_webhook_events (webhook_type, received_at DESC)");
}

export async function ensureHelpdeskWorkflowTables(db) {
  if (!db) {
    throw new Error("Missing DB binding.");
  }
  if (workflowTablesReady) return;

  if (!workflowTablesReadyPromise) {
    workflowTablesReadyPromise = prepareHelpdeskWorkflowCoreTables(db)
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

async function ensureHelpdeskWorkflowStatsTable(db) {
  await ensureHelpdeskWorkflowTables(db);
  if (workflowStatsTableReady) return;

  if (!workflowStatsTableReadyPromise) {
    workflowStatsTableReadyPromise = prepareHelpdeskWorkflowStatsTable(db)
      .then(() => {
        workflowStatsTableReady = true;
      })
      .catch((error) => {
        workflowStatsTableReadyPromise = null;
        throw error;
      });
  }

  await workflowStatsTableReadyPromise;
}

async function ensureOpenTicketSnapshotsTable(db) {
  await ensureHelpdeskWorkflowTables(db);
  if (openTicketSnapshotsTableReady) return;

  if (!openTicketSnapshotsTableReadyPromise) {
    openTicketSnapshotsTableReadyPromise = prepareOpenTicketSnapshotsTable(db)
      .then(() => {
        openTicketSnapshotsTableReady = true;
      })
      .catch((error) => {
        openTicketSnapshotsTableReadyPromise = null;
        throw error;
      });
  }

  await openTicketSnapshotsTableReadyPromise;
}

async function ensureWebhookEventsTable(db) {
  await ensureHelpdeskWorkflowTables(db);
  if (webhookEventsTableReady) return;

  if (!webhookEventsTableReadyPromise) {
    webhookEventsTableReadyPromise = prepareWebhookEventsTable(db)
      .then(() => {
        webhookEventsTableReady = true;
      })
      .catch((error) => {
        webhookEventsTableReadyPromise = null;
        throw error;
      });
  }

  await webhookEventsTableReadyPromise;
}

export async function listHelpdeskWorkflows(env) {
  await ensureHelpdeskWorkflowTables(env.DB);
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [{ results: workflows }, { results: recentRuns }] = await Promise.all([
    env.DB.prepare(
      `
        SELECT id, title, type, enabled, config_json, created_at, updated_at
        FROM helpdesk_workflows
        ORDER BY CASE type WHEN 'auto_merge_duplicates' THEN 0 WHEN 'auto_merge_6h_rule' THEN 1 WHEN 'auto_reply_empty_requester_ticket' THEN 2 ELSE 3 END, created_at ASC
      `,
    ).all(),
    env.DB.prepare(
      `
        SELECT workflow_id, status, started_at, details, metadata
        FROM helpdesk_workflow_runs
        WHERE started_at >= ?
        ORDER BY started_at DESC
        LIMIT 1000
      `,
    )
      .bind(cutoff)
      .all(),
  ]);
  const statsByWorkflow = new Map();
  for (const run of recentRuns || []) {
    const stats = statsByWorkflow.get(run.workflow_id) || {
      runsLast24h: 0,
      actionsLast24h: 0,
      lastRun: null,
    };
    stats.runsLast24h += 1;
    if (run.status === "success") {
      stats.actionsLast24h += helpdeskWorkflowActionCount(parseJson(run.metadata, {}));
    }
    if (!stats.lastRun) {
      stats.lastRun = {
        status: run.status,
        startedAt: run.started_at,
        details: run.details || "",
      };
    }
    statsByWorkflow.set(run.workflow_id, stats);
  }

  return (workflows || []).map((row) => workflowFromRow(row, statsByWorkflow.get(row.id)));
}

export async function listEnabledHelpdeskWorkflows(env) {
  await ensureHelpdeskWorkflowTables(env.DB);
  const { results } = await env.DB.prepare(
    `
      SELECT id, title, type, enabled, config_json, created_at, updated_at
      FROM helpdesk_workflows
      WHERE enabled = 1
      ORDER BY CASE type WHEN 'auto_merge_duplicates' THEN 0 WHEN 'auto_merge_6h_rule' THEN 1 WHEN 'auto_reply_empty_requester_ticket' THEN 2 ELSE 3 END, created_at ASC
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

export async function updateHelpdeskWorkflowConfig(env, workflowId, config) {
  await ensureHelpdeskWorkflowTables(env.DB);
  const now = new Date().toISOString();
  const { meta } = await env.DB.prepare(
    `
      UPDATE helpdesk_workflows
      SET config_json = ?, updated_at = ?
      WHERE id = ?
    `,
  )
    .bind(JSON.stringify(config || {}), now, workflowId)
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

export async function createHelpdeskAutoReplyWorkflow(env, { title, senderName, senderAgentId, messageText }) {
  await ensureHelpdeskWorkflowTables(env.DB);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `
      INSERT INTO helpdesk_workflows (id, title, type, enabled, config_json, created_at, updated_at)
      VALUES (?, ?, 'auto_reply_new_requester_ticket', 1, ?, ?, ?)
    `,
  )
    .bind(
      id,
      title,
      JSON.stringify({
        firstAuthorType: "client",
        senderName,
        senderAgentId,
        messageText,
        createdAfter: now,
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

export async function recordHelpdeskWorkflowRunStats(env, run, timezoneOffsetMinutes = 0) {
  await ensureHelpdeskWorkflowStatsTable(env.DB);
  if (run.status && run.status !== "success") return;

  const metadata = run.metadata || {};
  const metricCounts = workflowRunMetricCounts(metadata);
  const entries = Object.entries(metricCounts);
  if (!entries.length) return;

  const now = new Date().toISOString();
  const metricDate = workflowDateKey(run.startedAt, timezoneOffsetMinutes);
  const statements = entries.map(([metric, count]) => {
    return env.DB.prepare(
      `
        INSERT OR REPLACE INTO helpdesk_workflow_run_stats
          (run_id, workflow_id, workflow_title, workflow_type, metric, metric_date, metric_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
    ).bind(
      run.runId,
      run.workflowId,
      run.workflowTitle,
      metadata.type || "",
      metric,
      metricDate,
      count,
      now,
    );
  });

  await env.DB.batch(statements);
}

async function backfillHelpdeskWorkflowRunStats(env, fromDate, toDate, timezoneOffsetMinutes = 0) {
  await ensureHelpdeskWorkflowStatsTable(env.DB);
  const queryFrom = `${addDays(fromDate, -2)}T00:00:00.000Z`;
  const queryTo = `${addDays(toDate, 2)}T23:59:59.999Z`;
  const { results } = await env.DB.prepare(
    `
      SELECT id, workflow_id, workflow_title, status, started_at, metadata
      FROM helpdesk_workflow_runs
      WHERE status = 'success'
        AND started_at >= ?
        AND started_at <= ?
      ORDER BY started_at ASC
    `,
  )
    .bind(queryFrom, queryTo)
    .all();

  for (const row of results || []) {
    const metricDate = workflowDateKey(row.started_at, timezoneOffsetMinutes);
    if (metricDate < fromDate || metricDate > toDate) continue;
    await recordHelpdeskWorkflowRunStats(
      env,
      {
        runId: row.id,
        workflowId: row.workflow_id,
        workflowTitle: row.workflow_title,
        status: row.status,
        startedAt: row.started_at,
        metadata: parseJson(row.metadata, {}),
      },
      timezoneOffsetMinutes,
    );
  }
}

export async function getHelpdeskWorkflowAnalytics(env, { from, to, timezoneOffsetMinutes = 0 } = {}) {
  await ensureHelpdeskWorkflowStatsTable(env.DB);
  const today = workflowDateKey(new Date().toISOString(), timezoneOffsetMinutes);
  const defaultFrom = addDays(today, -6);
  const fromDate = parseDateKey(from, defaultFrom);
  const toDate = parseDateKey(to, today);
  if (fromDate > toDate) {
    throw new Error("Workflow analytics from date must be before the to date.");
  }

  await backfillHelpdeskWorkflowRunStats(env, fromDate, toDate, timezoneOffsetMinutes);

  const { results } = await env.DB.prepare(
    `
      SELECT metric_date, metric, SUM(metric_count) AS total_count
      FROM helpdesk_workflow_run_stats
      WHERE metric_date >= ?
        AND metric_date <= ?
      GROUP BY metric_date, metric
      ORDER BY metric_date ASC, metric ASC
    `,
  )
    .bind(fromDate, toDate)
    .all();

  const emptyDay = () => ({
    ticketsSolved: 0,
    emptyTicketReplies: 0,
    ticketsMerged: 0,
  });
  const dailyByDate = new Map(datesBetween(fromDate, toDate).map((date) => [date, { date, ...emptyDay() }]));
  const metricKeys = {
    [WORKFLOW_STATS_METRICS.ticketsSolved]: "ticketsSolved",
    [WORKFLOW_STATS_METRICS.emptyTicketReplies]: "emptyTicketReplies",
    [WORKFLOW_STATS_METRICS.ticketsMerged]: "ticketsMerged",
  };

  for (const row of results || []) {
    const day = dailyByDate.get(row.metric_date);
    const key = metricKeys[row.metric];
    if (!day || !key) continue;
    day[key] = Number(row.total_count || 0);
  }

  const daily = Array.from(dailyByDate.values());
  const summary = daily.reduce((totals, day) => {
    totals.ticketsSolved += day.ticketsSolved;
    totals.emptyTicketReplies += day.emptyTicketReplies;
    totals.ticketsMerged += day.ticketsMerged;
    return totals;
  }, emptyDay());

  return {
    period: { from: fromDate, to: toDate },
    summary,
    daily,
  };
}

export async function recordHelpdeskOpenTicketSnapshot(env, { date, count, capturedAt = new Date().toISOString() }) {
  await ensureOpenTicketSnapshotsTable(env.DB);
  const snapshotDate = parseDateKey(date, "");
  if (!snapshotDate) {
    throw new Error("Open ticket snapshot date is required.");
  }
  await env.DB.prepare(
    `
      INSERT OR REPLACE INTO helpdesk_open_ticket_snapshots
        (snapshot_date, open_ticket_count, captured_at)
      VALUES (?, ?, ?)
    `,
  )
    .bind(snapshotDate, Number(count || 0), capturedAt)
    .run();
}

export async function listHelpdeskOpenTicketSnapshots(env, { from, to } = {}) {
  await ensureOpenTicketSnapshotsTable(env.DB);
  const fromDate = parseDateKey(from, "");
  const toDate = parseDateKey(to, "");
  if (!fromDate || !toDate) return [];

  const { results } = await env.DB.prepare(
    `
      SELECT snapshot_date, open_ticket_count, captured_at
      FROM helpdesk_open_ticket_snapshots
      WHERE snapshot_date >= ?
        AND snapshot_date <= ?
      ORDER BY snapshot_date ASC
    `,
  )
    .bind(fromDate, toDate)
    .all();

  return (results || []).map((row) => ({
    date: row.snapshot_date,
    count: Number(row.open_ticket_count || 0),
    capturedAt: row.captured_at,
  }));
}

function webhookEventFromRow(row) {
  return {
    id: row.id,
    type: row.webhook_type,
    ticketId: row.ticket_id || "",
    ticketShortId: row.ticket_short_id || "",
    receivedAt: row.received_at,
    status: row.status,
    workflowRuns: Number(row.workflow_runs_count || 0),
    actions: Number(row.actions_count || 0),
    error: row.error || "",
  };
}

export async function recordHelpdeskWebhookEvent(env, event) {
  await ensureWebhookEventsTable(env.DB);
  const id = event.id || crypto.randomUUID();
  const receivedAt = event.receivedAt || new Date().toISOString();
  const payloadJson = event.payload === undefined ? null : JSON.stringify(event.payload).slice(0, 100000);

  await env.DB.prepare(
    `
      INSERT INTO helpdesk_webhook_events
        (id, webhook_type, ticket_id, ticket_short_id, received_at, status, workflow_runs_count, actions_count, error, payload_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  )
    .bind(
      id,
      event.type || "unknown",
      event.ticketId || null,
      event.ticketShortId || null,
      receivedAt,
      event.status || "received",
      Number(event.workflowRuns || 0),
      Number(event.actions || 0),
      event.error || null,
      payloadJson,
    )
    .run();

  return { id, receivedAt };
}

export async function finishHelpdeskWebhookEvent(env, eventId, { status = "processed", workflowRuns = 0, actions = 0, error = "" } = {}) {
  await ensureWebhookEventsTable(env.DB);
  await env.DB.prepare(
    `
      UPDATE helpdesk_webhook_events
      SET status = ?, workflow_runs_count = ?, actions_count = ?, error = ?
      WHERE id = ?
    `,
  )
    .bind(status, Number(workflowRuns || 0), Number(actions || 0), error || null, eventId)
    .run();
}

export async function getHelpdeskWebhookStats(env, { type = "create-ticket", recentLimit = 10 } = {}) {
  await ensureWebhookEventsTable(env.DB);
  const now = Date.now();
  const dayCutoff = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const tenMinuteCutoff = new Date(now - 10 * 60 * 1000).toISOString();
  const safeLimit = Math.min(50, Math.max(1, Number(recentLimit) || 10));
  const [{ total }, { recent24h }, { recent10m }, { results }] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS total FROM helpdesk_webhook_events WHERE webhook_type = ?").bind(type).first(),
    env.DB.prepare("SELECT COUNT(*) AS recent24h FROM helpdesk_webhook_events WHERE webhook_type = ? AND received_at >= ?").bind(type, dayCutoff).first(),
    env.DB.prepare("SELECT COUNT(*) AS recent10m FROM helpdesk_webhook_events WHERE webhook_type = ? AND received_at >= ?").bind(type, tenMinuteCutoff).first(),
    env.DB.prepare(
      `
        SELECT id, webhook_type, ticket_id, ticket_short_id, received_at, status, workflow_runs_count, actions_count, error
        FROM helpdesk_webhook_events
        WHERE webhook_type = ?
        ORDER BY received_at DESC
        LIMIT ?
      `,
    )
      .bind(type, safeLimit)
      .all(),
  ]);

  return {
    type,
    total: Number(total || 0),
    receivedLast24h: Number(recent24h || 0),
    receivedLast10m: Number(recent10m || 0),
    recent: (results || []).map(webhookEventFromRow),
  };
}
