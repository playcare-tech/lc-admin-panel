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
  "helpdesk_webhook_events",
  "helpdesk_workflow_run_stats",
  "helpdesk_workflow_runs",
];

function analyticsTables(context) {
  const currentTables = [
    accountTableName(context.env, "analytics_agent_daily"),
    accountTableName(context.env, "helpdesk_analytics_daily_v4"),
    accountTableName(context.env, "helpdesk_analytics_sync_meta"),
  ];
  return context.env.LC_ACCOUNT_ID === "default"
    ? [...new Set([...DEFAULT_OBSOLETE_ANALYTICS_TABLES, ...currentTables])]
    : currentTables;
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
