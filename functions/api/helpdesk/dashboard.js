import { requireAuth } from "../../_lib/auth.js";
import { getHelpDeskDashboard } from "../../_lib/helpdesk.js";
import { errorResponse, json, methodNotAllowed } from "../../_lib/http.js";

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const auth = await requireAuth(context);
  if (auth.error) {
    return auth.error;
  }

  try {
    return json(await getHelpDeskDashboard(context.env));
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
