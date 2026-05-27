import { withAccountContext } from "../../_lib/accounts.js";
import { requireAuth } from "../../_lib/auth.js";
import { listRawHelpDeskAnalyticsWebhooks } from "../../_lib/helpdesk-analytics-raw-webhooks.js";
import { json, methodNotAllowed, serverErrorResponse } from "../../_lib/http.js";

export async function onRequest(context) {
  if (context.request.method !== "GET") return methodNotAllowed(["GET"]);

  const auth = await requireAuth(context);
  if (auth.error) return auth.error;
  context = withAccountContext(context);

  try {
    const url = new URL(context.request.url);
    return json({
      events: await listRawHelpDeskAnalyticsWebhooks(context.env, url.searchParams.get("limit") || 20),
    });
  } catch (error) {
    return serverErrorResponse(error, "Failed to load raw HelpDesk analytics webhooks.");
  }
}
