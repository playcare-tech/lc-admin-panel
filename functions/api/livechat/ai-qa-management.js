import { withAccountContext } from "../../_lib/accounts.js";
import { requirePermission } from "../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../../_lib/http.js";
import {
  getLivechatAiQaManagementOverview,
  getLivechatAiQaQueueSettings,
  releaseLivechatAiQaQueue,
  saveLivechatAiQaQueueSetting,
} from "../../_lib/livechat-ai-qa-management.js";

function dateBoundary(value, end = false) {
  if (!value) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (end ? 0 : 30));
    if (end) date.setUTCHours(23, 59, 59, 999);
    else date.setUTCHours(0, 0, 0, 0);
    return date.toISOString();
  }
  const date = new Date(`${value}T${end ? "23:59:59.999" : "00:00:00.000"}Z`);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid statistics date.");
  return date.toISOString();
}

export async function onRequest(context) {
  if (!["GET", "PATCH", "POST"].includes(context.request.method)) {
    return methodNotAllowed(["GET", "PATCH", "POST"]);
  }
  const auth = await requirePermission(context, "canReviewLivechatAiAutoTags");
  if (auth.error) return auth.error;
  context = withAccountContext(context);
  const isAdmin = auth.session.permissions?.role === "admin";

  try {
    if (context.request.method === "GET") {
      const url = new URL(context.request.url);
      const requestedUser = `${url.searchParams.get("username") || auth.session.user}`.trim();
      const username = isAdmin ? requestedUser : auth.session.user;
      return json(await getLivechatAiQaManagementOverview(context.env, {
        username,
        from: dateBoundary(url.searchParams.get("from"), false),
        to: dateBoundary(url.searchParams.get("to"), true),
        includeAllUsers: isAdmin && url.searchParams.get("allUsers") === "1",
      }));
    }

    const body = await readJson(context.request);
    const requestedUser = `${body.username || auth.session.user}`.trim();
    const username = isAdmin ? requestedUser : auth.session.user;
    if (!username) return errorResponse("Username is required.", 400);

    if (context.request.method === "POST" && body.action === "release") {
      if (!isAdmin && username !== auth.session.user) return errorResponse("Forbidden.", 403);
      return json(await releaseLivechatAiQaQueue(context.env, username, `${body.reviewType || ""}`));
    }

    if (context.request.method === "PATCH") {
      const current = await getLivechatAiQaQueueSettings(context.env, username);
      const existing = current.find((item) => item.reviewType === body.reviewType);
      const targetQueueSize = isAdmin ? body.targetQueueSize : existing?.targetQueueSize || 20;
      return json({
        settings: await saveLivechatAiQaQueueSetting(context.env, {
          username,
          reviewType: `${body.reviewType || ""}`,
          enabled: Boolean(body.enabled),
          targetQueueSize,
          updatedBy: auth.session.user,
        }),
      });
    }

    return errorResponse("Unsupported QA management action.", 400);
  } catch (error) {
    if (/Invalid|Unsupported/.test(error.message || "")) return errorResponse(error.message, 400);
    return serverErrorResponse(error, "Failed to manage AI QA queues.");
  }
}
