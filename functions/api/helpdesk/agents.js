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
    const name = `${body.name || ""}`.trim();
    const email = `${body.email || ""}`.trim().toLowerCase();
    const teamIds = Array.isArray(body.teamIds) ? body.teamIds.filter(Boolean).map(String) : [];

    if (!email) {
      return errorResponse("Email is required.", 400);
    }
    if (!teamIds.length) {
      return errorResponse("Select at least one HelpDesk group.", 400);
    }

    const payload = {
      email,
      roles: ["normal"],
      teamIDs: teamIds,
      status: "invited",
    };

    if (name) {
      payload.name = name;
    }

    const agent = await helpdeskRequest(context.env, "/agents", {
      method: "POST",
      body: payload,
    });

    const dashboard = await getHelpDeskDashboard(context.env);
    const teamNameById = new Map(dashboard.teams.map((team) => [team.id, team.name]));

    await writeLog(context.env, {
      actor: auth.session.user,
      area: "helpdesk",
      action: "create_agent",
      target: email,
      status: "success",
      details: `Created HelpDesk agent ${email}.`,
      metadata: {
        agentId: email,
        createdTeams: teamIds.map((teamId) => ({
          id: teamId,
          name: teamNameById.get(String(teamId)) || `Team ${teamId}`,
        })),
      },
    });

    return json({ ok: true, agent });
  } catch (error) {
    await writeLog(context.env, {
      actor: auth.session.user,
      area: "helpdesk",
      action: "create_agent",
      target: "unknown",
      status: "error",
      details: error.message,
    });
    return errorResponse(error.message, 500);
  }
}
