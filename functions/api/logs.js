import { requireAuth } from "../_lib/auth.js";
import { errorResponse, json, methodNotAllowed } from "../_lib/http.js";
import { listLogs } from "../_lib/logs.js";

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const auth = await requireAuth(context);
  if (auth.error) {
    return auth.error;
  }

  try {
    return json({
      logs: await listLogs(context.env),
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
