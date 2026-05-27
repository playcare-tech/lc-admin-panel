import { withAccountContext } from "../_lib/accounts.js";
import { recordRawHelpDeskAnalyticsWebhook } from "../_lib/helpdesk-analytics-raw-webhooks.js";
import { json, methodNotAllowed, serverErrorResponse } from "../_lib/http.js";

export async function onRequest(context) {
  if (context.request.method !== "POST") return methodNotAllowed(["POST"]);
  context = withAccountContext(context);

  try {
    const bodyText = await context.request.text();
    const result = await recordRawHelpDeskAnalyticsWebhook(context.env, context.request, bodyText);
    return json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return serverErrorResponse(error, "Failed to record raw HelpDesk analytics webhook.");
  }
}
