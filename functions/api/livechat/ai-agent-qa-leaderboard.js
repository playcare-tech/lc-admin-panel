import { withAccountContext } from "../../_lib/accounts.js";
import { requirePermission } from "../../_lib/auth.js";
import { json, methodNotAllowed, serverErrorResponse } from "../../_lib/http.js";
import { getLivechatAgentQaLeaderboard } from "../../_lib/livechat-ai-qa-tagging.js";

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const auth = await requirePermission(context, "canViewLivechatAgentQaLeaderboard");
  if (auth.error) {
    return auth.error;
  }
  context = withAccountContext(context);

  try {
    const url = new URL(context.request.url);
    return json(
      await getLivechatAgentQaLeaderboard(context.env, {
        from: url.searchParams.get("from") || "",
        to: url.searchParams.get("to") || "",
        agent: url.searchParams.get("agent") || "",
      }),
    );
  } catch (error) {
    return serverErrorResponse(error, "Failed to load LiveChat agent QA leaderboard.");
  }
}
