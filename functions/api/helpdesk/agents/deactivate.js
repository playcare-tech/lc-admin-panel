import { requirePermission } from "../../../_lib/auth.js";
import { withAccountContext } from "../../../_lib/accounts.js";
import { helpdeskRequest } from "../../../_lib/helpdesk.js";
import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../../../_lib/http.js";
import { writeLog } from "../../../_lib/logs.js";

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const auth = await requirePermission(context, "canManageUsers");
  if (auth.error) {
    return auth.error;
  }
  context = withAccountContext(context);

  try {
    const body = await readJson(context.request);
    const agentId = `${body.agentId || ""}`.trim();

    if (!agentId) {
      return errorResponse("agentId is required.", 400);
    }

    await helpdeskRequest(context.env, `/agents/${agentId}`, {
      method: "DELETE",
    });

    await writeLog(context.env, {
      actor: auth.session.user,
      area: "helpdesk",
      action: "delete_agent",
      target: agentId,
      status: "success",
      details: "Removed HelpDesk agent using the public delete-agent endpoint.",
    });

    return json({ ok: true });
  } catch (error) {
    await writeLog(context.env, {
      actor: auth.session.user,
      area: "helpdesk",
      action: "delete_agent",
      target: "unknown",
      status: "error",
      details: "Failed to remove HelpDesk agent.",
    });
    return serverErrorResponse(error, "Failed to remove HelpDesk agent.");
  }
}
