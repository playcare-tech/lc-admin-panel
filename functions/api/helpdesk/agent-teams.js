import { requireAuth } from "../../_lib/auth.js";
import { getHelpDeskDashboard, helpdeskRequest } from "../../_lib/helpdesk.js";
import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../../_lib/http.js";
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
    const teamIds = Array.isArray(body.teamIds) ? body.teamIds.filter(Boolean).map(String) : [];

    if (!agentId) {
      return errorResponse("agentId is required.", 400);
    }

    const dashboard = await getHelpDeskDashboard(context.env);
    const agent = dashboard.agents.find((item) => item.id === agentId);
    const teamNameById = new Map(dashboard.teams.map((team) => [team.id, team.name]));

    await helpdeskRequest(context.env, `/agents/${agentId}`, {
      method: "PATCH",
      body: {
        teamIDs: teamIds,
      },
    });

    await writeLogSafely(context.env, {
      actor: auth.session.user,
      area: "helpdesk",
      action: "replace_teams",
      target: agentId,
      status: "success",
      details: `Updated HelpDesk profile teams for ${agentId}.`,
      metadata: {
        agentId,
        before: (agent?.teams || []).map((team) => ({
          id: String(team.id),
          name: team.name,
        })),
        after: teamIds.map((teamId) => ({
          id: String(teamId),
          name: teamNameById.get(String(teamId)) || `Team ${teamId}`,
        })),
      },
    });

    return json({ ok: true });
  } catch (error) {
    return serverErrorResponse(error, "Failed to update HelpDesk teams.");
  }
}
