import { requireAuth } from "../../_lib/auth.js";
import { buildLiveChatGroups, livechatRequest } from "../../_lib/livechat.js";
import { errorResponse, json, methodNotAllowed, readJson } from "../../_lib/http.js";
import { writeLog } from "../../_lib/logs.js";

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
    const name = `${body.name || ""}`.trim();
    const email = `${body.email || ""}`.trim().toLowerCase();
    const groupIds = Array.isArray(body.groupIds) ? body.groupIds.filter(Boolean).map(String) : [];
    const priority = body.priority === "first" ? "first" : "normal";

    if (!email) {
      return errorResponse("Email is required.", 400);
    }

    const payload = {
      id: email,
      email,
      role: "agent",
    };

    if (name) {
      payload.name = name;
    }

    if (groupIds.length) {
      payload.groups = buildLiveChatGroups(groupIds, priority);
    }

    const agent = await livechatRequest(context.env, "create_agent", payload);
    await writeLog(context.env, {
      actor: auth.session.user,
      area: "livechat",
      action: "create_agent",
      target: email,
      status: "success",
      details: `Created LiveChat agent ${email}.`,
      metadata: { groupIds, priority },
    });

    return json({ ok: true, agent });
  } catch (error) {
    await writeLog(context.env, {
      actor: auth.session.user,
      area: "livechat",
      action: "create_agent",
      target: "unknown",
      status: "error",
      details: error.message,
    });
    return errorResponse(error.message, 500);
  }
}
