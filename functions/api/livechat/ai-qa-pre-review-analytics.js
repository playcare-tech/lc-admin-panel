import { withAccountContext } from "../../_lib/accounts.js";
import { requirePermission } from "../../_lib/auth.js";
import { json, methodNotAllowed, serverErrorResponse } from "../../_lib/http.js";
import { getCloudflareWorkersAiUsage } from "../../_lib/cloudflare-workers-ai-usage.js";
import { getLivechatAiQaPreReviewAnalytics } from "../../_lib/livechat-ai-qa-pre-review-analytics.js";

function dateBoundary(value, end = false) {
  if (!value) {
    const date = new Date();
    if (!end) date.setUTCDate(date.getUTCDate() - 30);
    date.setUTCHours(end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0);
    return date.toISOString();
  }
  const date = new Date(`${value}T${end ? "23:59:59.999" : "00:00:00.000"}Z`);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid analytics date.");
  return date.toISOString();
}

function billingRange(value) {
  const now = Date.now();
  const ranges = {
    "24h": { startTime: now - 24 * 60 * 60 * 1000, grouping: "half_hour" },
    "7d": { startTime: now - 7 * 24 * 60 * 60 * 1000, grouping: "day" },
    "30d": { startTime: now - 30 * 24 * 60 * 60 * 1000, grouping: "day" },
  };
  return { ...(ranges[value] || ranges["24h"]), endTime: now };
}

export async function onRequest(context) {
  if (context.request.method !== "GET") return methodNotAllowed(["GET"]);
  const auth = await requirePermission(context, "canViewLivechatAgentQaLeaderboard");
  if (auth.error) return auth.error;
  context = withAccountContext(context);

  try {
    const url = new URL(context.request.url);
    const [analytics, billingResult] = await Promise.all([
      getLivechatAiQaPreReviewAnalytics(context.env, {
        reviewType: url.searchParams.get("reviewType") || "all",
        reviewer: url.searchParams.get("reviewer") || "",
        from: dateBoundary(url.searchParams.get("from"), false),
        to: dateBoundary(url.searchParams.get("to"), true),
      }),
      getCloudflareWorkersAiUsage(context.env, billingRange(url.searchParams.get("billingRange") || "24h")).then(
        (value) => ({ value }),
        (error) => ({ error: error?.message || "Failed to load Cloudflare Workers AI usage." }),
      ),
    ]);
    return json({
      ...analytics,
      cloudflareBilling: billingResult.value || {
        configured: true,
        source: "cloudflare_graphql_ai_inference",
        error: billingResult.error,
        meters: [],
        intervals: [],
      },
    });
  } catch (error) {
    return serverErrorResponse(error, "Failed to load pre-AI QA review analytics.");
  }
}
