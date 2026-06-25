import { requireAuth } from "../../_lib/auth.js";
import { accountTableName, withAccountContext } from "../../_lib/accounts.js";
import { json, methodNotAllowed, serverErrorResponse } from "../../_lib/http.js";

const DEFAULT_OBSOLETE_ANALYTICS_TABLES = [
  "analytics_agent_daily_fetches",
  "helpdesk_analytics_daily",
  "helpdesk_analytics_daily_fetches",
  "helpdesk_analytics_agent_fetches",
  "helpdesk_analytics_daily_v2",
  "helpdesk_analytics_daily_fetches_v2",
  "helpdesk_analytics_agent_fetches_v2",
  "helpdesk_analytics_daily_v3",
  "helpdesk_analytics_handled_tickets_v3",
  "helpdesk_analytics_daily_fetches_v3",
  "helpdesk_analytics_daily_v4",
  "helpdesk_analytics_handled_tickets_v4",
  "helpdesk_analytics_daily_fetches_v4",
  "helpdesk_analytics_agent_fetches_v3",
  "helpdesk_analytics_agent_fetches_v4",
  "helpdesk_analytics_message_events",
  "helpdesk_analytics_reply_details_v1",
  "helpdesk_analytics_daily_v5",
  "helpdesk_analytics_message_events_v2",
  "helpdesk_analytics_reply_details_v2",
  "helpdesk_analytics_daily_v6",
  "helpdesk_analytics_message_events_v3",
  "helpdesk_analytics_reply_details_v3",
  "helpdesk_webhook_events",
  "helpdesk_workflow_run_stats",
  "helpdesk_workflow_runs",
];

function analyticsTables(context) {
  const obsoleteTables = DEFAULT_OBSOLETE_ANALYTICS_TABLES.map((table) => accountTableName(context.env, table));
  const currentTables = [
    accountTableName(context.env, "analytics_agent_daily"),
    accountTableName(context.env, "helpdesk_analytics_daily_v7"),
    accountTableName(context.env, "helpdesk_analytics_message_events_v4"),
    accountTableName(context.env, "helpdesk_analytics_reply_details_v4"),
    accountTableName(context.env, "helpdesk_analytics_comment_daily_v1"),
    accountTableName(context.env, "helpdesk_analytics_comment_events_v1"),
    accountTableName(context.env, "helpdesk_analytics_comment_details_v1"),
    accountTableName(context.env, "helpdesk_analytics_sync_meta"),
  ];
  return [...new Set([...obsoleteTables, ...currentTables])];
}

export async function onRequest(context) {
  if (!["DELETE", "POST"].includes(context.request.method)) {
    return methodNotAllowed(["DELETE", "POST"]);
  }

  const auth = await requireAuth(context);
  if (auth.error) return auth.error;
  context = withAccountContext(context);

  try {
    if (!context.env.DB) throw new Error("Missing DB binding.");
    const tables = analyticsTables(context);

    await context.env.DB.batch(
      tables.map((table) => context.env.DB.prepare(`DROP TABLE IF EXISTS ${table}`)),
    );

    return json({ ok: true, cleared_tables: tables });
  } catch (error) {
    return serverErrorResponse(error, "Failed to clear HelpDesk analytics cache.");
  }
}
