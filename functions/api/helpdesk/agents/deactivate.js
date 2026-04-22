import { requireAuth } from "../../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed, readJson } from "../../../_lib/http.js";
import { helpdeskRequest } from "../../../_lib/helpdesk.js";
import { writeLog } from "../../../_lib/logs.js";

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const auth = await requireAuth(context);
  if (auth.error) {
    return auth.error;
  }

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
      details:
        "Removed HelpDesk agent. The public HelpDesk docs expose delete rather than a separate deactivate endpoint.",
    });

    return json({ ok: true });
  } catch (error) {
    await writeLog(context.env, {
      actor: auth.session.user,
      area: "helpdesk",
      action: "delete_agent",
      target: "unknown",
      status: "error",
      details: error.message,
    });
    return errorResponse(error.message, 500);
  }
}
