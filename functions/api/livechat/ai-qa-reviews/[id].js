import { withAccountContext } from "../../../_lib/accounts.js";
import { requirePermission } from "../../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../../../_lib/http.js";
import {
  decideLivechatAiQaReview,
  getLivechatAiQaReview,
  processLivechatAiQaReview,
} from "../../../_lib/livechat-ai-qa-tagging.js";

export async function onRequest(context) {
  if (!["GET", "PATCH", "POST"].includes(context.request.method)) {
    return methodNotAllowed(["GET", "PATCH", "POST"]);
  }

  const auth = await requirePermission(context, "canReviewLivechatAiAutoTags");
  if (auth.error) {
    return auth.error;
  }
  context = withAccountContext(context);

  try {
    const id = context.params.id;
    if (context.request.method === "GET") {
      const review = await getLivechatAiQaReview(context.env, id);
      if (!review) return errorResponse("AI QA review not found.", 404);
      return json(review);
    }

    const body = await readJson(context.request);
    if (body.action === "process" || body.action === "retry") {
      return json(await processLivechatAiQaReview(context.env, id, { force: body.action === "retry" || Boolean(body.force) }));
    }

    const result = await decideLivechatAiQaReview(context.env, id, {
      ...body,
      reviewer: auth.session.user,
    });
    if (!result.decided && result.reason === "not_found") {
      return errorResponse("AI QA review not found.", 404);
    }
    if (!result.decided) {
      return errorResponse("Unsupported AI QA review decision.", 400, { reason: result.reason });
    }
    return json(result);
  } catch (error) {
    if (error.message?.includes("Expected application/json")) {
      return errorResponse(error.message, 400);
    }
    return serverErrorResponse(error, "Failed to handle LiveChat AI QA review.");
  }
}
