import { requireAuth } from "../../_lib/auth.js";
import { errorResponse, methodNotAllowed } from "../../_lib/http.js";

export async function onRequest(context) {
  if (context.request.method !== "GET") return methodNotAllowed(["GET"]);

  const auth = await requireAuth(context);
  if (auth.error) return auth.error;

  return errorResponse("Ticket analytics details are disabled. HelpDesk analytics stores daily totals only.", 410);
}
