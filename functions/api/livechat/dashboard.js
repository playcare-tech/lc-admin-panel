import { requireAuth } from "../../_lib/auth.js";
import { withAccountContext } from "../../_lib/accounts.js";
import { json, methodNotAllowed, serverErrorResponse } from "../../_lib/http.js";
import { getLiveChatDashboard } from "../../_lib/livechat.js";

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const auth = await requireAuth(context);
  if (auth.error) {
    return auth.error;
  }
  context = withAccountContext(context);

  try {
    return json(await getLiveChatDashboard(context.env));
  } catch (error) {
    return serverErrorResponse(error, "Failed to load LiveChat dashboard.");
  }
}
