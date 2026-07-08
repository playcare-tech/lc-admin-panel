import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../_lib/http.js";
import { recordLivechatAiQaWebhook } from "../_lib/livechat-ai-qa-tagging.js";

function text(value) {
  return `${value ?? ""}`.trim();
}

function internalWorkerToken(env) {
  return text(env.AI_QA_WORKER_TOKEN || env.HELPDESK_SYNC_TOKEN);
}

function shouldProcessReview(review) {
  if (!review?.reviewId) return false;
  if (["approved", "corrected"].includes(review.status)) return false;
  return ["pending", "running", "failed", "skipped"].includes(review.aiStatus);
}

function kickoffAiQaWorker(context, body, result) {
  if (body?.action !== "chat_deactivated") return;
  const token = internalWorkerToken(context.env);
  if (!token || typeof context.waitUntil !== "function") return;

  const tasks = [
    {
      kind: "ftr",
      chatId: result.chatId,
      threadId: result.threadId,
    },
    shouldProcessReview(result.aiReview)
      ? {
          kind: "content",
          reviewId: result.aiReview.reviewId,
          chatId: result.chatId,
          threadId: result.threadId,
        }
      : null,
    shouldProcessReview(result.agentQaReview)
      ? {
          kind: "agent",
          reviewId: result.agentQaReview.reviewId,
          chatId: result.chatId,
          threadId: result.threadId,
        }
      : null,
  ].filter(Boolean);

  for (const taskBody of tasks) {
    const url = new URL("/webhooks/livechat-ai-qa-worker", context.request.url);
    const task = fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskBody),
    }).catch((error) => {
      console.error("Failed to kick off LiveChat AI QA worker.", {
        kind: taskBody.kind,
        chatId: taskBody.chatId,
        threadId: taskBody.threadId,
        message: error.message,
      });
    });
    context.waitUntil(task);
  }
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
    kickoffAiQaWorker(context, body, result);
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
