import { requireAuth } from "../../_lib/auth.js";
import { getHelpdeskWorkflowAnalytics } from "../../_lib/helpdesk-workflows.js";
import { errorResponse, json, methodNotAllowed, serverErrorResponse } from "../../_lib/http.js";

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const auth = await requireAuth(context);
  if (auth.error) return auth.error;

  const url = new URL(context.request.url);
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";
  const timezoneOffsetMinutes = Number(url.searchParams.get("tzOffset") || url.searchParams.get("timezoneOffsetMinutes") || 0);

  try {
    const analytics = await getHelpdeskWorkflowAnalytics(context.env, {
      from,
      to,
      timezoneOffsetMinutes,
    });

    return json(analytics);
  } catch (error) {
    if (error.message?.includes("from date must be before")) {
      return errorResponse(error.message, 400);
    }
    return serverErrorResponse(error, "Failed to load HelpDesk workflow analytics.");
  }
}
