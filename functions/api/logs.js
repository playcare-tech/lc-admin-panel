import { requireAuth } from "../_lib/auth.js";
import { withAccountContext } from "../_lib/accounts.js";
import { json, methodNotAllowed } from "../_lib/http.js";
import { listLogs } from "../_lib/logs.js";

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
    return json({
      logs: await listLogs(context.env),
    });
  } catch (error) {
    console.error("Failed to load logs.", error);
    return json({
      logs: [],
      warning: "Failed to load logs.",
    });
  }
}
