import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../_lib/http.js";
import {
  processLivechatAgentQaReview,
  processLivechatAiQaReview,
  recordLivechatAiQaWebhook,
  tagLivechatThreadByFtrForChat,
} from "../_lib/livechat-ai-qa-tagging.js";

function text(value) {
  return `${value ?? ""}`.trim();
}

function shouldProcessReview(review) {
  if (!review?.reviewId) return false;
  if (["approved", "corrected"].includes(review.status)) return false;
  return ["pending", "running", "failed", "skipped"].includes(review.aiStatus);
}

async function kickoffAiQaTasks(context, result, options = {}) {
  const hasWaitUntil = typeof context.waitUntil === "function";

  const tasks = [
    options.includeFtr === false
      ? null
      : tagLivechatThreadByFtrForChat(context.env, result.chatId, result.threadId).catch((error) => {
          console.error("Failed to tag LiveChat thread by FTR.", {
            chatId: result.chatId,
            threadId: result.threadId,
            message: error.message,
            status: error.status,
            payload: error.payload,
          });
        }),
    shouldProcessReview(result.aiReview)
      ? processLivechatAiQaReview(context.env, result.aiReview.reviewId).catch((error) => {
          console.error("Failed to process LiveChat AI QA review.", {
            chatId: result.chatId,
            threadId: result.threadId,
            reviewId: result.aiReview.reviewId,
            message: error.message,
          });
        })
      : null,
    shouldProcessReview(result.agentQaReview)
      ? processLivechatAgentQaReview(context.env, result.agentQaReview.reviewId).catch((error) => {
          console.error("Failed to process LiveChat agent QA review.", {
            chatId: result.chatId,
            threadId: result.threadId,
            reviewId: result.agentQaReview.reviewId,
            message: error.message,
          });
        })
      : null,
  ].filter(Boolean);

  if (hasWaitUntil) {
    for (const task of tasks) {
      context.waitUntil(task);
    }
    return;
  }

  await Promise.allSettled(tasks);
}

function aiQaQueueMessages(result) {
  return [
    shouldProcessReview(result.aiReview)
      ? { body: { kind: "content", reviewId: result.aiReview.reviewId, chatId: result.chatId, threadId: result.threadId } }
      : null,
    shouldProcessReview(result.agentQaReview)
      ? { body: { kind: "agent", reviewId: result.agentQaReview.reviewId, chatId: result.chatId, threadId: result.threadId } }
      : null,
  ].filter(Boolean);
}

async function dispatchAiQaTasks(context, result) {
  await kickoffAiQaTasks(context, { ...result, aiReview: null, agentQaReview: null });
  const messages = aiQaQueueMessages(result);
  if (!messages.length) return { mode: "none", count: 0 };
  if (typeof context.env.AI_QA_QUEUE?.sendBatch === "function") {
    try {
      await context.env.AI_QA_QUEUE.sendBatch(messages);
      return { mode: "queue", count: messages.length };
    } catch (error) {
      console.error(JSON.stringify({
        message: "Failed to publish LiveChat AI QA jobs; using waitUntil fallback.",
        chatId: result.chatId,
        threadId: result.threadId,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }
  await kickoffAiQaTasks(context, result, { includeFtr: false });
  return { mode: "waitUntil_fallback", count: messages.length };
}

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  try {
    const body = await readJson(context.request);
    const result = await recordLivechatAiQaWebhook(context.env, body, {
      waitUntil: context.waitUntil?.bind(context),
      processQueuedReviews: false,
      tagFtr: false,
    });
    if (body?.action === "chat_deactivated") {
      result.processing = await dispatchAiQaTasks(context, result);
    }
    if (result.ignored) {
      return json({ ok: true, ...result });
    }
    return json({ ok: true, ...result });
  } catch (error) {
    if (error.message?.includes("Expected application/json")) {
      return errorResponse(error.message, 400);
    }
    return serverErrorResponse(error, "Failed to record LiveChat AI QA tagging webhook.");
  }
}
