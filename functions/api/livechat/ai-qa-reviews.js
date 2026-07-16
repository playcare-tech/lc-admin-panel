import { withAccountContext } from "../../_lib/accounts.js";
import { requirePermission } from "../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../../_lib/http.js";
import {
  listLivechatAiQaReviews,
  processLivechatAiQaReview,
  processPendingLivechatAiQaReviews,
} from "../../_lib/livechat-ai-qa-tagging.js";

export async function onRequest(context) {
  if (!["GET", "POST"].includes(context.request.method)) {
    return methodNotAllowed(["GET", "POST"]);
  }

  const auth = await requirePermission(context, "canReviewLivechatAiAutoTags");
  if (auth.error) {
    return auth.error;
  }
  context = withAccountContext(context);

  try {
    if (context.request.method === "GET") {
      const url = new URL(context.request.url);
      return json(
        await listLivechatAiQaReviews(context.env, {
          status: url.searchParams.get("status") || "",
          aiStatus: url.searchParams.get("aiStatus") || "",
          chatId: url.searchParams.get("chatId") || "",
          page: url.searchParams.get("page") || "1",
          pageSize: url.searchParams.get("pageSize") || "25",
          assignedTo:
            auth.session.permissions?.role === "qa_manager" || url.searchParams.get("scope") !== "all"
              ? auth.session.user
              : "",
        }),
      );
    }

    const body = await readJson(context.request);
    if (body.reviewId) {
      return json(await processLivechatAiQaReview(context.env, body.reviewId, { force: Boolean(body.force) }));
    }
    if (!["", "process_pending", "retry_pending"].includes(`${body.action || ""}`.trim())) {
      return errorResponse("Unsupported AI QA review action.", 400);
    }
    return json(
      await processPendingLivechatAiQaReviews(context.env, {
        limit: body.limit,
        force: Boolean(body.force || body.action === "retry_pending"),
      }),
    );
  } catch (error) {
    if (error.message?.includes("Expected application/json")) {
      return errorResponse(error.message, 400);
    }
    return serverErrorResponse(error, "Failed to handle LiveChat AI QA reviews.");
  }
}
