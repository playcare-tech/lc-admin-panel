import { withAccountContext } from "../../_lib/accounts.js";
import { requirePermission } from "../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../../_lib/http.js";
import {
  ensureLivechatAiQaTables,
  listLivechatAgentQaReviews,
  processLivechatAgentQaReview,
  processPendingLivechatAgentQaReviews,
  queueLivechatAgentQaReviewForChat,
} from "../../_lib/livechat-ai-qa-tagging.js";

export async function onRequest(context) {
  if (!["GET", "POST"].includes(context.request.method)) {
    return methodNotAllowed(["GET", "POST"]);
  }

  const auth = await requirePermission(context, "canReviewLivechatAgentQa");
  if (auth.error) {
    return auth.error;
  }
  context = withAccountContext(context);

  try {
    if (context.request.method === "GET") {
      const url = new URL(context.request.url);
      return json(
        await listLivechatAgentQaReviews(context.env, {
          status: url.searchParams.get("status") || "",
          aiStatus: url.searchParams.get("aiStatus") || "",
          agent: url.searchParams.get("agent") || "",
          tag: url.searchParams.get("tag") || "",
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
    if (body.action === "create_and_process") {
      const chatId = `${body.chatId || ""}`.trim();
      const threadId = `${body.threadId || ""}`.trim();
      if (!chatId || !threadId) return errorResponse("Chat ID and thread ID are required.", 400);
      const queued = await queueLivechatAgentQaReviewForChat(context.env, chatId, threadId);
      if (!queued.reviewId) {
        return errorResponse(`Agent QA review could not be created: ${queued.reason || "unknown error"}.`, 400);
      }
      const tables = await ensureLivechatAiQaTables(context.env);
      await context.env.DB.prepare(`
        UPDATE ${tables.agentQaReviews}
        SET assigned_to = (SELECT assigned_to FROM ${tables.reviews} WHERE chat_id = ? AND thread_id = ?),
            assigned_at = (SELECT assigned_at FROM ${tables.reviews} WHERE chat_id = ? AND thread_id = ?),
            updated_at = ?
        WHERE id = ?
      `)
        .bind(chatId, threadId, chatId, threadId, new Date().toISOString(), queued.reviewId)
        .run();
      const result = queued.aiStatus === "pending"
        ? await processLivechatAgentQaReview(context.env, queued.reviewId, { force: true })
        : { processed: false, reason: "deterministic_only" };
      return json({ queued, result, reviewId: queued.reviewId });
    }
    if (body.reviewId) {
      return json(await processLivechatAgentQaReview(context.env, body.reviewId, { force: Boolean(body.force) }));
    }
    if (!["", "process_pending", "retry_pending"].includes(`${body.action || ""}`.trim())) {
      return errorResponse("Unsupported LiveChat agent QA review action.", 400);
    }
    return json(
      await processPendingLivechatAgentQaReviews(context.env, {
        limit: body.limit,
        force: Boolean(body.force || body.action === "retry_pending"),
      }),
    );
  } catch (error) {
    if (error.message?.includes("Expected application/json")) {
      return errorResponse(error.message, 400);
    }
    return serverErrorResponse(error, "Failed to handle LiveChat agent QA reviews.");
  }
}
