import { requirePermission } from "../../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../../../_lib/http.js";
import { livechatRequest } from "../../../_lib/livechat.js";
import { writeLog } from "../../../_lib/logs.js";

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const auth = await requirePermission(context, "canManageUsers");
  if (auth.error) {
    return auth.error;
  }

  try {
    const body = await readJson(context.request);
    const agentId = `${body.agentId || ""}`.trim().toLowerCase();

    if (!agentId) {
      return errorResponse("agentId is required.", 400);
    }

    await livechatRequest(context.env, "suspend_agent", { id: agentId });
    await writeLog(context.env, {
      actor: auth.session.user,
      area: "livechat",
      action: "suspend_agent",
      target: agentId,
      status: "success",
      details: `Suspended LiveChat agent ${agentId}.`,
    });

    return json({ ok: true });
  } catch (error) {
    await writeLog(context.env, {
      actor: auth.session.user,
      area: "livechat",
      action: "suspend_agent",
      target: "unknown",
      status: "error",
      details: "Failed to suspend LiveChat agent.",
    });
    return serverErrorResponse(error, "Failed to suspend LiveChat agent.");
  }
}
