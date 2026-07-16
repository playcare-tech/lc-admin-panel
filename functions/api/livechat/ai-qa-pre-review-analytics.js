import { withAccountContext } from "../../_lib/accounts.js";
import { requirePermission } from "../../_lib/auth.js";
import { json, methodNotAllowed, serverErrorResponse } from "../../_lib/http.js";
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

export async function onRequest(context) {
  if (context.request.method !== "GET") return methodNotAllowed(["GET"]);
  const auth = await requirePermission(context, "canViewLivechatAgentQaLeaderboard");
  if (auth.error) return auth.error;
  context = withAccountContext(context);

  try {
    const url = new URL(context.request.url);
    return json(
      await getLivechatAiQaPreReviewAnalytics(context.env, {
        reviewType: url.searchParams.get("reviewType") || "all",
        reviewer: url.searchParams.get("reviewer") || "",
        from: dateBoundary(url.searchParams.get("from"), false),
        to: dateBoundary(url.searchParams.get("to"), true),
      }),
    );
  } catch (error) {
    return serverErrorResponse(error, "Failed to load pre-AI QA review analytics.");
  }
}
