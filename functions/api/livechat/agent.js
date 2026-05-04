import { requireAuth } from "../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed, serverErrorResponse } from "../../_lib/http.js";
import { getLiveChatAgent } from "../../_lib/livechat.js";

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const auth = await requireAuth(context);
  if (auth.error) {
    return auth.error;
  }

  try {
    const url = new URL(context.request.url);
    const agentId = `${url.searchParams.get("id") || ""}`.trim();

    if (!agentId) {
      return errorResponse("id is required.", 400);
    }

    return json({
      agent: await getLiveChatAgent(context.env, agentId),
    });
  } catch (error) {
    return serverErrorResponse(error, "Failed to load LiveChat agent.");
  }
}
