import { requireAuth } from "../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed, readJson } from "../../_lib/http.js";
import { buildLiveChatGroups, getLiveChatDashboard, livechatRequest } from "../../_lib/livechat.js";
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
    const priority = body.priority === "first" ? "first" : "normal";

    if (!agentIds.length || !groupIds.length) {
      return errorResponse("Select at least one agent and one group.", 400);
    }

    const dashboard = await getLiveChatDashboard(context.env);
    const agentById = new Map(dashboard.agents.map((agent) => [agent.id, agent]));

    for (const agentId of agentIds) {
      const agent = agentById.get(agentId);
      if (!agent) {
        throw new Error(`LiveChat agent ${agentId} was not found.`);
      }

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
        priority: nextGroups.get(String(group.id)) === "first" ? "first" : "normal",
      }));

      await livechatRequest(context.env, "update_agent", {
        id: agentId,
        groups,
      });
    }

    await writeLog(context.env, {
      actor: auth.session.user,
      area: "livechat",
      action: mode === "assign" ? "assign_groups" : "remove_groups",
      target: agentIds.join(", "),
      status: "success",
      details: `${mode === "assign" ? "Updated" : "Removed"} LiveChat groups for ${agentIds.length} agent(s).`,
      metadata: { agentIds, groupIds, priority },
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
