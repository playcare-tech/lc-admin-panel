import { requireAuth } from "../../_lib/auth.js";
import { accountTableName, withAccountContext } from "../../_lib/accounts.js";
import { getHelpDeskDashboard } from "../../_lib/helpdesk.js";
import { json, methodNotAllowed, serverErrorResponse } from "../../_lib/http.js";

async function readHistoricalAnalyticsAgents(env, tableBase) {
  if (!env?.DB) return [];
  const table = accountTableName(env, tableBase);
  try {
    const { results } = await env.DB.prepare(`
      SELECT
        agent_id AS id,
        COALESCE(MAX(NULLIF(agent_name, '')), agent_id) AS name,
        COALESCE(MAX(NULLIF(agent_email, '')), '') AS email,
        MAX(date) AS last_seen_at,
        SUM(handled_tickets) AS analytics_points
      FROM ${table}
      WHERE agent_id IS NOT NULL AND agent_id <> ''
      GROUP BY agent_id
    `).all();
    return results || [];
  } catch (error) {
    if (/no such table/i.test(error.message || "")) return [];
    throw error;
  }
}

async function getAnalyticsAgents(env, activeAgents = []) {
  const [publicAgents, commentAgents] = await Promise.all([
    readHistoricalAnalyticsAgents(env, "helpdesk_analytics_daily_v7"),
    readHistoricalAnalyticsAgents(env, "helpdesk_analytics_comment_daily_v1"),
  ]);
  const activeIds = new Set((activeAgents || []).map((agent) => String(agent.id)));
  const byId = new Map();

  for (const row of [...publicAgents, ...commentAgents]) {
    const id = String(row.id || "");
    if (!id) continue;
    const current = byId.get(id) || {
      id,
      name: row.name || id,
      email: row.email || "",
      status: activeIds.has(id) ? "active" : "historical",
      historical: !activeIds.has(id),
      analytics_points: 0,
      last_seen_at: row.last_seen_at || "",
      teamIDs: [],
      teams: [],
    };
    current.name = current.name || row.name || id;
    current.email = current.email || row.email || "";
    current.analytics_points += Number(row.analytics_points || 0);
    if (row.last_seen_at && (!current.last_seen_at || row.last_seen_at > current.last_seen_at)) {
      current.last_seen_at = row.last_seen_at;
    }
    byId.set(id, current);
  }

  return [...byId.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const auth = await requireAuth(context);
  if (auth.error) {
    return auth.error;
  }
  context = withAccountContext(context);

  try {
    const dashboard = await getHelpDeskDashboard(context.env);
    return json({
      ...dashboard,
      analyticsAgents: await getAnalyticsAgents(context.env, dashboard.agents),
    });
  } catch (error) {
    return serverErrorResponse(error, "Failed to load HelpDesk dashboard.");
  }
}
