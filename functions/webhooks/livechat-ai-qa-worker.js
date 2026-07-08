import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../_lib/http.js";
import {
  processLivechatAgentQaReview,
  processLivechatAiQaReview,
  tagLivechatThreadByFtrForChat,
} from "../_lib/livechat-ai-qa-tagging.js";

function text(value) {
  return `${value ?? ""}`.trim();
}

function internalWorkerToken(env) {
  return text(env.AI_QA_WORKER_TOKEN || env.HELPDESK_SYNC_TOKEN);
}

function bearerToken(request) {
  const value = request.headers.get("authorization") || "";
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? text(match[1]) : "";
}

async function processReview(env, body) {
  if (body.kind === "ftr") {
    return tagLivechatThreadByFtrForChat(env, text(body.chatId), text(body.threadId));
  }
  const kind = body.kind === "agent" ? "agent" : "content";
  const reviewId = text(body.reviewId);
  if (!reviewId) {
    return { processed: false, reason: "missing_review_id", kind };
  }
  return kind === "agent"
    ? processLivechatAgentQaReview(env, reviewId)
    : processLivechatAiQaReview(env, reviewId);
}

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const token = internalWorkerToken(context.env);
  if (!token || bearerToken(context.request) !== token) {
    return errorResponse("Not found.", 404);
  }

  try {
    const body = await readJson(context.request);
    const task = processReview(context.env, body).catch((error) => {
      console.error("Failed to process LiveChat AI QA worker task.", {
        kind: body?.kind,
        reviewId: body?.reviewId,
        chatId: body?.chatId,
        threadId: body?.threadId,
        message: error.message,
      });
    });
    if (typeof context.waitUntil === "function") {
      context.waitUntil(task);
      return json({ ok: true, scheduled: true });
    }
    const result = await task;
    return json({ ok: true, scheduled: false, result });
  } catch (error) {
    if (error.message?.includes("Expected application/json")) {
      return errorResponse(error.message, 400);
    }
    return serverErrorResponse(error, "Failed to schedule LiveChat AI QA worker.");
  }
}
