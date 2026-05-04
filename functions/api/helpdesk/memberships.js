import { requireAuth } from "../../_lib/auth.js";
import { getHelpDeskDashboard, helpdeskRequest } from "../../_lib/helpdesk.js";
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
    const agentIds = Array.isArray(body.agentIds) ? body.agentIds.filter(Boolean).map(String) : [];
    const teamIds = Array.isArray(body.teamIds) ? body.teamIds.filter(Boolean).map(String) : [];
    const mode = body.mode === "remove" ? "remove" : "assign";

    if (!agentIds.length || !teamIds.length) {
      return errorResponse("Select at least one agent and one team.", 400);
    }

    const dashboard = await getHelpDeskDashboard(context.env);
    const agentById = new Map(dashboard.agents.map((agent) => [agent.id, agent]));
    const teamNameById = new Map(dashboard.teams.map((team) => [team.id, team.name]));
    const changedAgents = [];

    for (const agentId of agentIds) {
      const agent = agentById.get(agentId);
      if (!agent) {
        throw new Error(`HelpDesk agent ${agentId} was not found.`);
      }

      const nextTeamIds = new Set(agent.teamIDs);
      const previousTeams = agent.teams.map((team) => ({
        id: String(team.id),
        name: team.name,
      }));
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

      changedAgents.push({
        id: agent.id,
        email: agent.email,
        before: previousTeams,
        after: Array.from(nextTeamIds).map((teamId) => ({
          id: String(teamId),
          name: teamNameById.get(String(teamId)) || `Team ${teamId}`,
        })),
      });
    }

    await writeLog(context.env, {
      actor: auth.session.user,
      area: "helpdesk",
      action: mode === "assign" ? "assign_teams" : "remove_teams",
      target: agentIds.join(", "),
      status: "success",
      details: `${mode === "assign" ? "Updated" : "Removed"} HelpDesk teams for ${agentIds.length} agent(s).`,
      metadata: {
        mode,
        changedAgents,
        teams: teamIds.map((teamId) => ({
          id: teamId,
          name: teamNameById.get(String(teamId)) || `Team ${teamId}`,
        })),
      },
    });

    return json({ ok: true, updatedAgents: agentIds.length });
  } catch (error) {
    await writeLog(context.env, {
      actor: auth.session.user,
      area: "helpdesk",
      action: "update_memberships",
      target: "bulk",
      status: "error",
      details: "Failed to update HelpDesk memberships.",
    });
    return serverErrorResponse(error, "Failed to update HelpDesk memberships.");
  }
}
