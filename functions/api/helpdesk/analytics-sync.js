import { requireAuth, safeEqualText } from "../../_lib/auth.js";
import { accountTableName, withAccountContext } from "../../_lib/accounts.js";
import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../../_lib/http.js";
import { syncHelpDeskAnalyticsWindow } from "./analytics.js";

const SYNC_META_TABLE_BASE = "helpdesk_analytics_sync_meta";
const SYNC_STRATEGY = "last_message_hourly_v1";
const DEFAULT_WINDOW_MINUTES = 60;
const DEFAULT_DELAY_MINUTES = 60;
const DEFAULT_OVERLAP_MINUTES = 0;
const MAX_WINDOW_MINUTES = 120;

function syncMetaTable(env) {
  return accountTableName(env, SYNC_META_TABLE_BASE);
}

async function ensureSyncMetaTable(env) {
  const table = syncMetaTable(env);
  await env.DB
    .prepare(
      `CREATE TABLE IF NOT EXISTS ${table} (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    )
    .run();
}

async function readSyncMeta(env) {
  const table = syncMetaTable(env);
  await ensureSyncMetaTable(env);
  const { results } = await env.DB.prepare(`SELECT key, value FROM ${table}`).all();
  return Object.fromEntries((results || []).map((row) => [row.key, row.value]));
}

async function writeSyncMeta(env, entries) {
  const table = syncMetaTable(env);
  await ensureSyncMetaTable(env);
  await env.DB.batch(
    Object.entries(entries).map(([key, value]) =>
      env.DB.prepare(`INSERT OR REPLACE INTO ${table} (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`).bind(
        key,
        value == null ? "" : String(value),
      ),
    ),
  );
}

function syncStatusFromMeta(meta) {
  return {
    sync_strategy: meta.sync_strategy || "",
    last_started_at: meta.last_started_at || "",
    last_finished_at: meta.last_finished_at || "",
    last_success_at: meta.last_success_at || "",
    last_status: meta.last_status || "never",
    last_error: meta.last_error || "",
    last_from: meta.last_from || "",
    last_to: meta.last_to || "",
    last_detail_rows: Number(meta.last_detail_rows || 0),
    last_dates: meta.last_dates ? meta.last_dates.split(",").filter(Boolean) : [],
  };
}

function parseDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function numberOption(value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(number)));
}

function hasBearerAccess(request, env) {
  const token = env.HELPDESK_SYNC_TOKEN;
  if (!token) return false;
  const header = request.headers.get("Authorization") || "";
  return safeEqualText(header, `Bearer ${token}`);
}

async function authenticate(context) {
  if (hasBearerAccess(context.request, context.env)) return null;
  const auth = await requireAuth(context);
  return auth.error || null;
}

export async function onRequest(context) {
  if (!["GET", "POST"].includes(context.request.method)) return methodNotAllowed(["GET", "POST"]);

  context = withAccountContext(context);
  const authError = await authenticate(context);
  if (authError) return authError;

  try {
    const meta = await readSyncMeta(context.env);

    if (context.request.method === "GET") {
      return json({ sync: syncStatusFromMeta(meta) });
    }

    const body = await readJson(context.request).catch(() => ({}));
    const now = new Date();
    const targetTo = new Date(now.getTime() - numberOption(body.delayMinutes, DEFAULT_DELAY_MINUTES, { min: 0, max: 24 * 60 }) * 60000);
    const lastTo = meta.sync_strategy === SYNC_STRATEGY ? parseDate(meta.last_to) : null;
    const windowMinutes = numberOption(body.windowMinutes, DEFAULT_WINDOW_MINUTES, { min: 5, max: MAX_WINDOW_MINUTES });
    const overlapMinutes = numberOption(body.overlapMinutes, DEFAULT_OVERLAP_MINUTES, { min: 0, max: 30 });
    const timezoneOffsetMinutes = numberOption(body.tzOffset, Number(context.env.HELPDESK_ANALYTICS_TZ_OFFSET || -120), {
      min: -14 * 60,
      max: 14 * 60,
    });
    const to = targetTo;
    const from = lastTo && lastTo < to
      ? new Date(Math.max(lastTo.getTime() - overlapMinutes * 60000, to.getTime() - MAX_WINDOW_MINUTES * 60000))
      : new Date(to.getTime() - windowMinutes * 60000);

    if (to <= from) {
      await writeSyncMeta(context.env, {
        sync_strategy: SYNC_STRATEGY,
        last_started_at: now.toISOString(),
        last_finished_at: now.toISOString(),
        last_status: "success",
        last_error: "",
        last_from: from.toISOString(),
        last_to: to.toISOString(),
        last_detail_rows: "0",
        last_dates: "",
      });
      return json({ sync: syncStatusFromMeta(await readSyncMeta(context.env)), result: { skipped: true } });
    }

    await writeSyncMeta(context.env, {
      sync_strategy: SYNC_STRATEGY,
      last_started_at: now.toISOString(),
      last_status: "running",
      last_error: "",
      last_from: from.toISOString(),
      last_to: to.toISOString(),
    });

    try {
      const result = await syncHelpDeskAnalyticsWindow(context.env, { from, to, timezoneOffsetMinutes });
      const finishedAt = new Date().toISOString();
      await writeSyncMeta(context.env, {
        sync_strategy: SYNC_STRATEGY,
        last_finished_at: finishedAt,
        last_success_at: finishedAt,
        last_status: "success",
        last_error: "",
        last_from: result.from,
        last_to: result.to,
        last_detail_rows: String(result.detail_rows || 0),
        last_dates: (result.dates || []).join(","),
      });
      return json({ sync: syncStatusFromMeta(await readSyncMeta(context.env)), result });
    } catch (error) {
      const finishedAt = new Date().toISOString();
      await writeSyncMeta(context.env, {
        last_finished_at: finishedAt,
        last_status: "error",
        last_error: "HelpDesk sync failed.",
      });
      throw error;
    }
  } catch (error) {
    return serverErrorResponse(error, "HelpDesk sync failed.");
  }
}
