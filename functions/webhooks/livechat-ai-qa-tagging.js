import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../_lib/http.js";
import { recordLivechatAiQaWebhook } from "../_lib/livechat-ai-qa-tagging.js";

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  try {
    const body = await readJson(context.request);
    const result = await recordLivechatAiQaWebhook(context.env, body);
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
