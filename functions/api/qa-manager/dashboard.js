import { accountTableName, withAccountContext } from "../../_lib/accounts.js";
import { requirePermission } from "../../_lib/auth.js";
import { json, methodNotAllowed, serverErrorResponse } from "../../_lib/http.js";
import { getLivechatAgentQaLeaderboard } from "../../_lib/livechat-ai-qa-tagging.js";

function isoDaysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function dateDaysAgo(days) {
  return isoDaysAgo(days).slice(0, 10);
}

function helpdeskAgentName(row) {
  return row.agent_name || row.agent_email || row.agent_id || "Unknown agent";
}

async function firstNumber(env, sql, binds = []) {
  const row = await env.DB.prepare(sql).bind(...binds).first();
  return Number(row?.value || 0);
}

async function helpdeskLeaderboard(env, fromDate, toDate) {
  const table = accountTableName(env, "helpdesk_analytics_daily_v7");
  const { results } = await env.DB.prepare(
    `
      SELECT
        agent_id,
        MAX(agent_name) AS agent_name,
        MAX(agent_email) AS agent_email,
        SUM(handled_tickets) AS total_tickets
      FROM ${table}
      WHERE date >= ? AND date <= ?
      GROUP BY agent_id
      HAVING total_tickets > 0
      ORDER BY total_tickets DESC
      LIMIT 200
    `,
  )
    .bind(fromDate, toDate)
    .all();

  return (results || []).map((row) => ({
    agent: helpdeskAgentName(row),
    total: Number(row.total_tickets || 0),
    agentId: row.agent_id || "",
    agentEmail: row.agent_email || "",
  }));
}

export async function onRequest(context) {
  if (context.request.method !== "GET") return methodNotAllowed(["GET"]);

  const auth = await requirePermission(context, "canViewQaDashboard");
  if (auth.error) return auth.error;
  context = withAccountContext(context);

  try {
    const fromIso = isoDaysAgo(7);
    const fromDate = dateDaysAgo(7);
    const toDate = new Date().toISOString().slice(0, 10);
    const autoTagTable = accountTableName(context.env, "livechat_ai_qa_reviews");
    const agentQaTable = accountTableName(context.env, "livechat_ai_agent_qa_reviews");

    const [
      pendingAutoTag,
      pendingAgentQa,
      autoTagReviewedByUser,
      agentQaReviewedByUser,
      livechatLeaderboard,
      helpdeskRows,
    ] = await Promise.all([
      firstNumber(context.env, `SELECT COUNT(*) AS value FROM ${autoTagTable} WHERE status = 'pending_review'`),
      firstNumber(context.env, `SELECT COUNT(*) AS value FROM ${agentQaTable} WHERE status = 'pending_review'`),
      firstNumber(
        context.env,
        `SELECT COUNT(*) AS value FROM ${autoTagTable} WHERE reviewer = ? AND reviewed_at >= ?`,
        [auth.session.user, fromIso],
      ),
      firstNumber(
        context.env,
        `SELECT COUNT(*) AS value FROM ${agentQaTable} WHERE reviewer = ? AND reviewed_at >= ?`,
        [auth.session.user, fromIso],
      ),
      getLivechatAgentQaLeaderboard(context.env, { from: fromIso, to: new Date().toISOString() }),
      helpdeskLeaderboard(context.env, fromDate, toDate),
    ]);

    const livechatRows = livechatLeaderboard.rows || [];
    return json({
      range: { from: fromDate, to: toDate },
      pending: {
        autoTag: pendingAutoTag,
        agentQa: pendingAgentQa,
      },
      reviewedByMeLast7Days: autoTagReviewedByUser + agentQaReviewedByUser,
      helpdesk: {
        best: helpdeskRows.slice(0, 5),
        worst: [...helpdeskRows].reverse().slice(0, 5),
      },
      livechat: {
        best: livechatRows.slice(0, 5),
        worst: [...livechatRows].reverse().slice(0, 5),
      },
    });
  } catch (error) {
    return serverErrorResponse(error, "Failed to load QA manager dashboard.");
  }
}
