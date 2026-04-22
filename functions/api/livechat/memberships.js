import { requireAuth } from "../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed, readJson } from "../../_lib/http.js";
import { buildLiveChatGroups, getLiveChatAgent, livechatRequest } from "../../_lib/livechat.js";
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
    const agentIds = Array.isArray(body.agentIds) ? body.agentIds.filter(Boolean).map(String) : [];
    const groupIds = Array.isArray(body.groupIds) ? body.groupIds.filter(Boolean).map(String) : [];
    const mode = body.mode === "remove" ? "remove" : "assign";
    const priority = body.priority === "last" ? "last" : body.priority === "first" ? "first" : "normal";

    if (!agentIds.length || !groupIds.length) {
      return errorResponse("Select at least one agent and one group.", 400);
    }

    const groupsPayload = await livechatRequest(context.env, "list_groups", {});
    const rawGroups = Array.isArray(groupsPayload)
      ? groupsPayload
      : groupsPayload.groups || groupsPayload.data || groupsPayload.items || [];
    const groupNameById = new Map(rawGroups.map((group) => [String(group.id), group.name]));
    const changedAgents = [];

    for (const agentId of agentIds) {
      const agent = await getLiveChatAgent(context.env, agentId);
      const previousGroups = agent.groups.map((group) => ({
        id: String(group.id),
        name: group.name,
        priority: group.priority,
      }));

      const nextGroups = new Map(agent.groups.map((group) => [String(group.id), group.priority]));
      if (mode === "assign") {
        for (const groupId of groupIds) {
          nextGroups.set(String(groupId), priority);
        }
      } else {
        for (const groupId of groupIds) {
          nextGroups.delete(String(groupId));
        }
      }

      const groups = buildLiveChatGroups(
        Array.from(nextGroups.keys()),
        "normal",
      ).map((group) => ({
        ...group,
        priority: ["first", "normal", "last", "supervisor"].includes(nextGroups.get(String(group.id)))
          ? nextGroups.get(String(group.id))
          : "normal",
      }));

      await livechatRequest(context.env, "update_agent", {
        id: agentId,
        groups,
      });

      changedAgents.push({
        id: agent.id,
        email: agent.email,
        before: previousGroups,
        after: groups.map((group) => ({
          id: String(group.id),
          name: groupNameById.get(String(group.id)) || `Group ${group.id}`,
          priority: group.priority,
        })),
      });
    }

    await writeLog(context.env, {
      actor: auth.session.user,
      area: "livechat",
      action: mode === "assign" ? "assign_groups" : "remove_groups",
      target: agentIds.join(", "),
      status: "success",
      details: `${mode === "assign" ? "Updated" : "Removed"} LiveChat groups for ${agentIds.length} agent(s).`,
      metadata: {
        mode,
        priority,
        changedAgents,
        groups: groupIds.map((groupId) => ({
          id: groupId,
          name: groupNameById.get(String(groupId)) || `Group ${groupId}`,
        })),
      },
    });

    return json({ ok: true, updatedAgents: agentIds.length });
  } catch (error) {
    await writeLog(context.env, {
      actor: auth.session.user,
      area: "livechat",
      action: "update_memberships",
      target: "bulk",
      status: "error",
      details: error.message,
    });
    return errorResponse(error.message, 500);
  }
}
