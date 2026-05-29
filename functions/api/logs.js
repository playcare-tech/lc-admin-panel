import { requireAuth } from "../_lib/auth.js";
import { withAccountContext } from "../_lib/accounts.js";
import { json, methodNotAllowed } from "../_lib/http.js";
import { listLogs, listLogsByAction } from "../_lib/logs.js";

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
      helpdeskSyncLogs: await listLogsByAction(context.env, {
        area: "helpdesk",
        action: "helpdesk_sync_tickets",
        limit: 100,
      }),
    });
  } catch (error) {
    console.error("Failed to load logs.", error);
    return json({
      logs: [],
      helpdeskSyncLogs: [],
      warning: "Failed to load logs.",
    });
  }
}
