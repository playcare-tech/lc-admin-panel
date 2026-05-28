import { withAccountContext } from "../_lib/accounts.js";
import { recordRawHelpDeskAnalyticsWebhook } from "../_lib/helpdesk-analytics-raw-webhooks.js";
import { recordHelpDeskAnalyticsWebhookReceived } from "../_lib/helpdesk-analytics-webhooks.js";
import { json, methodNotAllowed, serverErrorResponse } from "../_lib/http.js";

export async function onRequest(context) {
  if (context.request.method !== "POST") return methodNotAllowed(["POST"]);
  context = withAccountContext(context);

  try {
    const bodyText = await context.request.text();
    const stored = await recordRawHelpDeskAnalyticsWebhook(context.env, context.request, bodyText);
    await recordHelpDeskAnalyticsWebhookReceived(context.env);
    return json({ ok: true, ...stored });
  } catch (error) {
    return serverErrorResponse(error, "Failed to record HelpDesk analytics webhook.");
  }
}
