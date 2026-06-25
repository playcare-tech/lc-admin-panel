import { accountTableName } from "./accounts.js";

const WEBHOOK_STATS_TABLE_BASE = "helpdesk_analytics_webhook_stats";

function statsTable(env) {
  return accountTableName(env, WEBHOOK_STATS_TABLE_BASE);
}

function hourKey(date = new Date()) {
  const copy = new Date(date);
  copy.setUTCMinutes(0, 0, 0);
  return copy.toISOString();
}

async function ensureHelpDeskAnalyticsWebhookStats(env) {
  if (!env?.DB) throw new Error("Missing DB binding.");
  await env.DB
    .prepare(
      `CREATE TABLE IF NOT EXISTS ${statsTable(env)} (
        stat_hour TEXT PRIMARY KEY,
        received_count INTEGER NOT NULL DEFAULT 0,
        assigned_points_count INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      )`,
    )
    .run();
  const { results } = await env.DB.prepare(`PRAGMA table_info(${statsTable(env)})`).all();
  if (!(results || []).some((column) => column.name === "assigned_points_count")) {
    try {
      await env.DB.prepare(`ALTER TABLE ${statsTable(env)} ADD COLUMN assigned_points_count INTEGER NOT NULL DEFAULT 0`).run();
    } catch (error) {
      if (!/duplicate column name/i.test(error.message || "")) throw error;
    }
  }
}

export async function recordHelpDeskAnalyticsWebhookReceived(env, receivedAt = new Date()) {
  await ensureHelpDeskAnalyticsWebhookStats(env);
  const statHour = hourKey(receivedAt);
  await env.DB.prepare(
    `INSERT INTO ${statsTable(env)}
      (stat_hour, received_count, updated_at)
     VALUES (?, 1, CURRENT_TIMESTAMP)
     ON CONFLICT(stat_hour) DO UPDATE SET
      received_count = received_count + 1,
      updated_at = CURRENT_TIMESTAMP`,
  )
    .bind(statHour)
    .run();
}

export async function recordHelpDeskAnalyticsWebhookAssignedPoint(env, receivedAt = new Date(), count = 1) {
  await ensureHelpDeskAnalyticsWebhookStats(env);
  const points = Math.max(0, Math.floor(Number(count || 0)));
  if (!points) return;
  const statHour = hourKey(receivedAt);
  await env.DB.prepare(
    `INSERT INTO ${statsTable(env)}
      (stat_hour, received_count, assigned_points_count, updated_at)
     VALUES (?, 0, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(stat_hour) DO UPDATE SET
      assigned_points_count = assigned_points_count + excluded.assigned_points_count,
      updated_at = CURRENT_TIMESTAMP`,
  )
    .bind(statHour, points)
    .run();
}

export async function readHelpDeskAnalyticsWebhookStats(env, now = new Date()) {
  await ensureHelpDeskAnalyticsWebhookStats(env);
  const table = statsTable(env);
  const cutoff = (hours) => hourKey(new Date(now.getTime() - hours * 60 * 60 * 1000));
  const totals = "COALESCE(SUM(received_count), 0) AS received, COALESCE(SUM(assigned_points_count), 0) AS assigned_points";
  const [last24h, last7d, last30d, allTime] = await Promise.all([
    env.DB.prepare(`SELECT ${totals} FROM ${table} WHERE stat_hour > ?`).bind(cutoff(24)).first(),
    env.DB.prepare(`SELECT ${totals} FROM ${table} WHERE stat_hour > ?`).bind(cutoff(24 * 7)).first(),
    env.DB.prepare(`SELECT ${totals} FROM ${table} WHERE stat_hour > ?`).bind(cutoff(24 * 30)).first(),
    env.DB.prepare(`SELECT ${totals} FROM ${table}`).first(),
  ]);

  return {
    received24h: Number(last24h?.received || 0),
    received7d: Number(last7d?.received || 0),
    received30d: Number(last30d?.received || 0),
    receivedAllTime: Number(allTime?.received || 0),
    assignedPoints24h: Number(last24h?.assigned_points || 0),
    assignedPoints7d: Number(last7d?.assigned_points || 0),
    assignedPoints30d: Number(last30d?.assigned_points || 0),
    assignedPointsAllTime: Number(allTime?.assigned_points || 0),
  };
}
