import { requireAuth } from "../../_lib/auth.js";
import { buildLiveChatGroups, livechatRequest } from "../../_lib/livechat.js";
import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../../_lib/http.js";
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
    const priority = body.priority === "last" ? "last" : body.priority === "first" ? "first" : "normal";
    const allowedRoles = new Set(["normal", "administrator", "viceowner"]);
    const role = allowedRoles.has(body.role) ? body.role : "normal";

    if (!email) {
      return errorResponse("Email is required.", 400);
    }

    const payload = {
      id: email,
      role,
    };

    if (name) {
      payload.name = name;
    }

    if (groupIds.length) {
      payload.groups = buildLiveChatGroups(groupIds, priority);
    }

    const agent = await livechatRequest(context.env, "create_agent", payload);
    const groupsPayload = await livechatRequest(context.env, "list_groups", {});
    const rawGroups = Array.isArray(groupsPayload)
      ? groupsPayload
      : groupsPayload.groups || groupsPayload.data || groupsPayload.items || [];
    const groupNameById = new Map(rawGroups.map((group) => [String(group.id), group.name]));
    await writeLog(context.env, {
      actor: auth.session.user,
      area: "livechat",
      action: "create_agent",
      target: email,
      status: "success",
      details: `Created LiveChat agent ${email}.`,
      metadata: {
        agentId: email,
        role,
        createdGroups: groupIds.map((groupId) => ({
          id: groupId,
          name: groupNameById.get(String(groupId)) || `Group ${groupId}`,
          priority,
        })),
      },
    });

    return json({ ok: true, agent });
  } catch (error) {
    await writeLog(context.env, {
      actor: auth.session.user,
      area: "livechat",
      action: "create_agent",
      target: "unknown",
      status: "error",
      details: "Failed to create LiveChat agent.",
    });
    return serverErrorResponse(error, "Failed to create LiveChat agent.");
  }
}
