const WORKFLOWS_TABLE_SQL =
  "CREATE TABLE IF NOT EXISTS helpdesk_workflows (id TEXT PRIMARY KEY, title TEXT NOT NULL, type TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 0, config_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)";

const OPEN_TICKET_SNAPSHOTS_TABLE_SQL =
  "CREATE TABLE IF NOT EXISTS helpdesk_open_ticket_snapshots (snapshot_date TEXT PRIMARY KEY, open_ticket_count INTEGER NOT NULL DEFAULT 0, captured_at TEXT NOT NULL)";

const WEBHOOK_DAILY_STATS_TABLE_SQL =
  "CREATE TABLE IF NOT EXISTS helpdesk_webhook_daily_stats (stat_date TEXT PRIMARY KEY, webhooks_received INTEGER NOT NULL DEFAULT 0, workflow_runs INTEGER NOT NULL DEFAULT 0, tickets_solved INTEGER NOT NULL DEFAULT 0, tickets_auto_replied INTEGER NOT NULL DEFAULT 0, tickets_merged INTEGER NOT NULL DEFAULT 0, actions_count INTEGER NOT NULL DEFAULT 0, errors_count INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL)";

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
let webhookDailyStatsTableReady = false;
let webhookDailyStatsTableReadyPromise = null;
let openTicketSnapshotsTableReady = false;
let openTicketSnapshotsTableReadyPromise = null;

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

function dailyStatsFromRunMetadata(metadata = {}) {
  const metricCounts = workflowRunMetricCounts(metadata);
  return {
    ticketsSolved: Number(metricCounts[WORKFLOW_STATS_METRICS.ticketsSolved] || 0),
    ticketsAutoReplied: Number(metricCounts[WORKFLOW_STATS_METRICS.emptyTicketReplies] || 0),
    ticketsMerged: Number(metricCounts[WORKFLOW_STATS_METRICS.ticketsMerged] || 0),
  };
}

async function readWebhookDailyStats(env, date) {
  await ensureWebhookDailyStatsTable(env.DB);
  return env.DB.prepare("SELECT * FROM helpdesk_webhook_daily_stats WHERE stat_date = ?").bind(date).first();
}

async function incrementWebhookDailyStats(env, date, increments = {}) {
  await ensureWebhookDailyStatsTable(env.DB);
  const statDate = parseDateKey(date, workflowDateKey(new Date().toISOString(), Number(env.HELPDESK_ANALYTICS_TZ_OFFSET || 0)));
  const now = new Date().toISOString();
  await env.DB.prepare(
    `
      INSERT INTO helpdesk_webhook_daily_stats
        (stat_date, webhooks_received, workflow_runs, tickets_solved, tickets_auto_replied, tickets_merged, actions_count, errors_count, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(stat_date) DO UPDATE SET
        webhooks_received = webhooks_received + excluded.webhooks_received,
        workflow_runs = workflow_runs + excluded.workflow_runs,
        tickets_solved = tickets_solved + excluded.tickets_solved,
        tickets_auto_replied = tickets_auto_replied + excluded.tickets_auto_replied,
        tickets_merged = tickets_merged + excluded.tickets_merged,
        actions_count = actions_count + excluded.actions_count,
        errors_count = errors_count + excluded.errors_count,
        updated_at = excluded.updated_at
    `,
  )
    .bind(
      statDate,
      Number(increments.webhooksReceived || 0),
      Number(increments.workflowRuns || 0),
      Number(increments.ticketsSolved || 0),
      Number(increments.ticketsAutoReplied || 0),
      Number(increments.ticketsMerged || 0),
      Number(increments.actions || 0),
      Number(increments.errors || 0),
      now,
    )
    .run();
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

async function prepareHelpdeskWorkflowCoreTables(db) {
  if (!(await objectExists(db, "table", "helpdesk_workflows"))) {
    await db.exec(WORKFLOWS_TABLE_SQL);
  }
  await db.exec(WEBHOOK_DAILY_STATS_TABLE_SQL);
  await db.exec("DROP TABLE IF EXISTS helpdesk_webhook_events");
  await db.exec("DROP TABLE IF EXISTS helpdesk_workflow_run_stats");
  await db.exec("DROP TABLE IF EXISTS helpdesk_workflow_runs");

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

async function prepareWebhookDailyStatsTable(db) {
  await db.exec(WEBHOOK_DAILY_STATS_TABLE_SQL);
}

async function prepareOpenTicketSnapshotsTable(db) {
  await db.exec(OPEN_TICKET_SNAPSHOTS_TABLE_SQL);
  await db.exec("CREATE INDEX IF NOT EXISTS idx_helpdesk_open_ticket_snapshots_captured ON helpdesk_open_ticket_snapshots (captured_at DESC)");
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

async function ensureWebhookDailyStatsTable(db) {
  await ensureHelpdeskWorkflowTables(db);
  if (webhookDailyStatsTableReady) return;

  if (!webhookDailyStatsTableReadyPromise) {
    webhookDailyStatsTableReadyPromise = prepareWebhookDailyStatsTable(db)
      .then(() => {
        webhookDailyStatsTableReady = true;
      })
      .catch((error) => {
        webhookDailyStatsTableReadyPromise = null;
        throw error;
      });
  }

  await webhookDailyStatsTableReadyPromise;
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

export async function listHelpdeskWorkflows(env) {
  await ensureHelpdeskWorkflowTables(env.DB);
  const { results: workflows } = await env.DB.prepare(
    `
      SELECT id, title, type, enabled, config_json, created_at, updated_at
      FROM helpdesk_workflows
      ORDER BY CASE type WHEN 'auto_merge_duplicates' THEN 0 WHEN 'auto_merge_6h_rule' THEN 1 WHEN 'auto_reply_empty_requester_ticket' THEN 2 ELSE 3 END, created_at ASC
    `,
  ).all();

  return (workflows || []).map((row) => workflowFromRow(row));
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
  return [];
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
  return crypto.randomUUID();
}

export async function recordHelpdeskWorkflowRunStats(env, run, timezoneOffsetMinutes = 0) {
  if (run.status && run.status !== "success") {
    await incrementWebhookDailyStats(env, workflowDateKey(run.startedAt, timezoneOffsetMinutes), { errors: 1 });
    return;
  }

  const counts = dailyStatsFromRunMetadata(run.metadata || {});
  await incrementWebhookDailyStats(env, workflowDateKey(run.startedAt, timezoneOffsetMinutes), {
    workflowRuns: 1,
    ticketsSolved: counts.ticketsSolved,
    ticketsAutoReplied: counts.ticketsAutoReplied,
    ticketsMerged: counts.ticketsMerged,
    actions: helpdeskWorkflowActionCount(run.metadata || {}),
  });
}

export async function getHelpdeskWorkflowAnalytics(env, { from, to, timezoneOffsetMinutes = 0 } = {}) {
  await ensureWebhookDailyStatsTable(env.DB);
  const today = workflowDateKey(new Date().toISOString(), timezoneOffsetMinutes);
  const defaultFrom = addDays(today, -6);
  const fromDate = parseDateKey(from, defaultFrom);
  const toDate = parseDateKey(to, today);
  if (fromDate > toDate) {
    throw new Error("Workflow analytics from date must be before the to date.");
  }

  const { results } = await env.DB.prepare(
    `
      SELECT stat_date, tickets_solved, tickets_auto_replied, tickets_merged
      FROM helpdesk_webhook_daily_stats
      WHERE stat_date >= ?
        AND stat_date <= ?
      ORDER BY stat_date ASC
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

  for (const row of results || []) {
    const day = dailyByDate.get(row.stat_date);
    if (!day) continue;
    day.ticketsSolved = Number(row.tickets_solved || 0);
    day.emptyTicketReplies = Number(row.tickets_auto_replied || 0);
    day.ticketsMerged = Number(row.tickets_merged || 0);
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

export async function recordHelpdeskWebhookEvent(env, event) {
  const receivedAt = event.receivedAt || new Date().toISOString();
  const timezoneOffsetMinutes = Number(env.HELPDESK_ANALYTICS_TZ_OFFSET || 0);
  const date = workflowDateKey(receivedAt, timezoneOffsetMinutes);
  const id = event.id || `${date}:${crypto.randomUUID()}`;
  await incrementWebhookDailyStats(env, date, { webhooksReceived: 1 });

  return { id, receivedAt, date };
}

export async function finishHelpdeskWebhookEvent(env, eventId, { status = "processed", error = "" } = {}) {
  const fallbackDate = workflowDateKey(new Date().toISOString(), Number(env.HELPDESK_ANALYTICS_TZ_OFFSET || 0));
  const eventDate = `${eventId || ""}`.split(":")[0];
  const date = parseDateKey(eventDate, fallbackDate);
  const failed = status === "error" || Boolean(error);
  await incrementWebhookDailyStats(env, date, {
    errors: failed ? 1 : 0,
  });
}

export async function getHelpdeskWebhookStats(env, { type = "create-ticket", recentLimit = 10 } = {}) {
  await ensureWebhookDailyStatsTable(env.DB);
  const today = workflowDateKey(new Date().toISOString(), Number(env.HELPDESK_ANALYTICS_TZ_OFFSET || 0));
  const safeLimit = Math.min(50, Math.max(1, Number(recentLimit) || 10));
  const [{ total }, todayRow, { results }] = await Promise.all([
    env.DB.prepare("SELECT SUM(webhooks_received) AS total FROM helpdesk_webhook_daily_stats").first(),
    readWebhookDailyStats(env, today),
    env.DB.prepare(
      `
        SELECT stat_date, webhooks_received, workflow_runs, tickets_solved, tickets_auto_replied, tickets_merged, actions_count, errors_count
        FROM helpdesk_webhook_daily_stats
        ORDER BY stat_date DESC
        LIMIT ?
      `,
    )
      .bind(safeLimit)
      .all(),
  ]);

  const daily = (results || []).map((row) => ({
    date: row.stat_date,
    webhooksReceived: Number(row.webhooks_received || 0),
    workflowRuns: Number(row.workflow_runs || 0),
    ticketsSolved: Number(row.tickets_solved || 0),
    ticketsAutoReplied: Number(row.tickets_auto_replied || 0),
    ticketsMerged: Number(row.tickets_merged || 0),
    actions: Number(row.actions_count || 0),
    errors: Number(row.errors_count || 0),
  }));

  return {
    type,
    total: Number(total || 0),
    receivedLast24h: Number(todayRow?.webhooks_received || 0),
    receivedLast10m: Number(todayRow?.webhooks_received || 0),
    daily,
    recent: daily.map((row) => ({
      id: row.date,
      type,
      ticketId: "",
      ticketShortId: row.date,
      receivedAt: row.date,
      status: row.errors ? "errors" : "ok",
      workflowRuns: row.workflowRuns,
      actions: row.actions,
      error: row.errors ? `${row.errors} error(s)` : "",
    })),
  };
}
