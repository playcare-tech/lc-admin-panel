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
    const jobTitle = `${body.jobTitle || ""}`.trim();
    const avatar = `${body.avatar || ""}`.trim();
    const teamIds = Array.isArray(body.teamIds) ? body.teamIds.filter(Boolean).map(String) : [];
    const role = ["owner", "normal", "viewer"].includes(body.role) ? body.role : "normal";

    if (!email) {
      return errorResponse("Email is required.", 400);
    }

    const payload = {
      email,
      roles: [role],
    };

    if (teamIds.length) {
      payload.teamIDs = teamIds;
    }
    if (name) {
      payload.name = name;
    }
    if (jobTitle) {
      payload.jobTitle = jobTitle;
    }
    if (avatar) {
      payload.avatar = avatar;
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
        role,
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
