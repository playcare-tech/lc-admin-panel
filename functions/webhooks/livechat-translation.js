import { withAccountContext } from "../_lib/accounts.js";
import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../_lib/http.js";
import { processLivechatTranslationWebhook } from "../_lib/livechat-translation.js";

function text(value) {
  return `${value ?? ""}`.trim();
}

function safeEqualText(left, right) {
  const leftText = text(left);
  const rightText = text(right);
  if (leftText.length !== rightText.length) return false;

  let diff = 0;
  for (let index = 0; index < leftText.length; index += 1) {
    diff |= leftText.charCodeAt(index) ^ rightText.charCodeAt(index);
  }
  return diff === 0;
}

function webhookSecretError(context) {
  const expectedSecret = text(context.env.LIVECHAT_TRANSLATION_WEBHOOK_SECRET);
  if (!expectedSecret) return null;

  const url = new URL(context.request.url);
  const submittedSecret =
    text(context.request.headers.get("X-Livechat-Translation-Secret")) ||
    text(context.request.headers.get("X-Webhook-Secret")) ||
    text(url.searchParams.get("secret"));

  if (!submittedSecret || !safeEqualText(submittedSecret, expectedSecret)) {
    return errorResponse("Unauthorized.", 401);
  }
  return null;
}

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  context = withAccountContext(context);

  const secretError = webhookSecretError(context);
  if (secretError) return secretError;

  try {
    const body = await readJson(context.request);
    const result = await processLivechatTranslationWebhook(context.env, body);
    return json({ ok: true, ...result });
  } catch (error) {
    if (error.message?.includes("Expected application/json")) {
      return errorResponse(error.message, 400);
    }
    return serverErrorResponse(error, "Failed to process LiveChat translation webhook.");
  }
}
