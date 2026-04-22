import { requireAuth } from "../../_lib/auth.js";
import { getHelpDeskDashboard, helpdeskRequest } from "../../_lib/helpdesk.js";
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
    const agentIds = Array.isArray(body.agentIds) ? body.agentIds.filter(Boolean).map(String) : [];
    const teamIds = Array.isArray(body.teamIds) ? body.teamIds.filter(Boolean).map(String) : [];
    const mode = body.mode === "remove" ? "remove" : "assign";

    if (!agentIds.length || !teamIds.length) {
      return errorResponse("Select at least one agent and one team.", 400);
    }

    const dashboard = await getHelpDeskDashboard(context.env);
    const agentById = new Map(dashboard.agents.map((agent) => [agent.id, agent]));

    for (const agentId of agentIds) {
      const agent = agentById.get(agentId);
      if (!agent) {
        throw new Error(`HelpDesk agent ${agentId} was not found.`);
      }

      const nextTeamIds = new Set(agent.teamIDs);
      if (mode === "assign") {
        for (const teamId of teamIds) {
          nextTeamIds.add(teamId);
        }
      } else {
        for (const teamId of teamIds) {
          nextTeamIds.delete(teamId);
        }
      }

      await helpdeskRequest(context.env, `/agents/${agentId}`, {
        method: "PATCH",
        body: {
          teamIDs: Array.from(nextTeamIds),
        },
      });
    }

    await writeLog(context.env, {
      actor: auth.session.user,
      area: "helpdesk",
      action: mode === "assign" ? "assign_teams" : "remove_teams",
      target: agentIds.join(", "),
      status: "success",
      details: `${mode === "assign" ? "Updated" : "Removed"} HelpDesk teams for ${agentIds.length} agent(s).`,
      metadata: { agentIds, teamIds },
    });

    return json({ ok: true, updatedAgents: agentIds.length });
  } catch (error) {
    await writeLog(context.env, {
      actor: auth.session.user,
      area: "helpdesk",
      action: "update_memberships",
      target: "bulk",
      status: "error",
      details: error.message,
    });
    return errorResponse(error.message, 500);
  }
}
