import { withAccountContext } from "../_lib/accounts.js";
import { recordRawHelpDeskAnalyticsWebhook } from "../_lib/helpdesk-analytics-raw-webhooks.js";
import {
  recordHelpDeskAnalyticsWebhookAssignedPoint,
  recordHelpDeskAnalyticsWebhookReceived,
} from "../_lib/helpdesk-analytics-webhooks.js";
import { recordHelpDeskAnalyticsMessageWebhook } from "../api/helpdesk/analytics.js";
import { json, methodNotAllowed, serverErrorResponse } from "../_lib/http.js";

export async function onRequest(context) {
  if (context.request.method !== "POST") return methodNotAllowed(["POST"]);
  context = withAccountContext(context);

  try {
    const bodyText = await context.request.text();
    const stored = await recordRawHelpDeskAnalyticsWebhook(context.env, context.request, bodyText);
    await recordHelpDeskAnalyticsWebhookReceived(context.env);
    const payload = JSON.parse(bodyText);
    const analytics = await recordHelpDeskAnalyticsMessageWebhook(context.env, payload);
    const assignedPoints = Number(analytics.assignedPoints || 0);
    if (assignedPoints > 0) {
      await recordHelpDeskAnalyticsWebhookAssignedPoint(context.env, new Date(), assignedPoints);
    }
    return json({ ok: true, ...stored, analytics });
  } catch (error) {
    return serverErrorResponse(error, "Failed to record HelpDesk analytics webhook.");
  }
}
