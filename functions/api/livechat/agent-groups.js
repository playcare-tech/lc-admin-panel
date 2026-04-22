import { requireAuth } from "../../_lib/auth.js";
import { getLiveChatAgent, livechatRequest } from "../../_lib/livechat.js";
import { errorResponse, json, methodNotAllowed, readJson } from "../../_lib/http.js";
import { writeLogSafely } from "../../_lib/logs.js";

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
    const groupPriorities = Array.isArray(body.groupPriorities) ? body.groupPriorities : [];

    if (!agentId) {
      return errorResponse("agentId is required.", 400);
    }

    const currentAgent = await getLiveChatAgent(context.env, agentId);
    const groupsPayload = await livechatRequest(context.env, "list_groups", {});
    const rawGroups = Array.isArray(groupsPayload)
      ? groupsPayload
      : groupsPayload.groups || groupsPayload.data || groupsPayload.items || [];
    const groupNameById = new Map(rawGroups.map((group) => [String(group.id), group.name]));

    const groups = groupPriorities.map((group) => ({
      id: Number.isNaN(Number(group.id)) ? group.id : Number(group.id),
      priority: group.priority === "last" ? "last" : group.priority === "first" ? "first" : "normal",
    }));

    await livechatRequest(context.env, "update_agent", {
      id: agentId,
      groups,
    });

    await writeLogSafely(context.env, {
      actor: auth.session.user,
      area: "livechat",
      action: "replace_groups",
      target: agentId,
      status: "success",
      details: `Updated LiveChat profile groups for ${agentId}.`,
      metadata: {
        agentId,
        before: currentAgent.groups.map((group) => ({
          id: String(group.id),
          name: group.name,
          priority: group.priority,
        })),
        after: groups.map((group) => ({
          id: String(group.id),
          name: groupNameById.get(String(group.id)) || `Group ${group.id}`,
          priority: group.priority,
        })),
      },
    });

    return json({ ok: true });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
