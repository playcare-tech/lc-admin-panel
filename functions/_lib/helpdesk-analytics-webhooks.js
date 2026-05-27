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
        updated_at TEXT NOT NULL
      )`,
    )
    .run();
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

export async function readHelpDeskAnalyticsWebhookStats(env, now = new Date()) {
  await ensureHelpDeskAnalyticsWebhookStats(env);
  const table = statsTable(env);
  const cutoff = (hours) => hourKey(new Date(now.getTime() - hours * 60 * 60 * 1000));
  const [last24h, last7d, last30d, allTime] = await Promise.all([
    env.DB.prepare(`SELECT COALESCE(SUM(received_count), 0) AS total FROM ${table} WHERE stat_hour >= ?`).bind(cutoff(24)).first(),
    env.DB.prepare(`SELECT COALESCE(SUM(received_count), 0) AS total FROM ${table} WHERE stat_hour >= ?`).bind(cutoff(24 * 7)).first(),
    env.DB.prepare(`SELECT COALESCE(SUM(received_count), 0) AS total FROM ${table} WHERE stat_hour >= ?`).bind(cutoff(24 * 30)).first(),
    env.DB.prepare(`SELECT COALESCE(SUM(received_count), 0) AS total FROM ${table}`).first(),
  ]);

  return {
    received24h: Number(last24h?.total || 0),
    received7d: Number(last7d?.total || 0),
    received30d: Number(last30d?.total || 0),
    receivedAllTime: Number(allTime?.total || 0),
  };
}
