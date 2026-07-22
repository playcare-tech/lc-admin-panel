import {
  processLivechatAgentQaReview,
  processLivechatAiQaReview,
} from "../functions/_lib/livechat-ai-qa-tagging.js";

function text(value) {
  return `${value ?? ""}`.trim();
}

function retryDelaySeconds(reason, attempts) {
  if (reason === "daily_limit") return 60 * 60;
  if (reason === "already_running") return 10 * 60;
  return Math.min(30 * 60, 30 * 2 ** Math.max(0, Number(attempts || 1) - 1));
}

async function processQueueJob(env, body) {
  if (!body || typeof body !== "object") return { terminal: true, reason: "invalid_message" };
  const reviewId = text(body.reviewId);
  if (!reviewId) return { terminal: true, reason: "missing_review_id" };
  const result = body.kind === "agent"
    ? await processLivechatAgentQaReview(env, reviewId)
    : await processLivechatAiQaReview(env, reviewId);
  const reason = text(result?.reason);
  const aiStatus = text(result?.review?.aiStatus);
  if (["daily_limit", "already_running"].includes(reason) || aiStatus === "failed") {
    return { terminal: false, reason: reason || "analysis_failed", result };
  }
  return { terminal: true, reason: reason || "completed", result };
}

export default {
  async queue(batch, env) {
    for (const message of batch.messages) {
      try {
        const outcome = await processQueueJob(env, message.body);
        console.log(JSON.stringify({
          message: "LiveChat AI QA queue job handled.",
          queueMessageId: message.id,
          kind: message.body?.kind || "unknown",
          reviewId: message.body?.reviewId || "",
          attempt: message.attempts,
          outcome: outcome.reason,
          terminal: outcome.terminal,
        }));
        if (outcome.terminal) {
          message.ack();
        } else {
          message.retry({ delaySeconds: retryDelaySeconds(outcome.reason, message.attempts) });
        }
      } catch (error) {
        console.error(JSON.stringify({
          message: "LiveChat AI QA queue job failed.",
          queueMessageId: message.id,
          kind: message.body?.kind || "unknown",
          reviewId: message.body?.reviewId || "",
          attempt: message.attempts,
          error: error instanceof Error ? error.message : String(error),
        }));
        message.retry({ delaySeconds: retryDelaySeconds("exception", message.attempts) });
      }
    }
  },
};
