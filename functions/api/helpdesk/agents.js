import { requireAuth } from "../../_lib/auth.js";
import { withAccountContext } from "../../_lib/accounts.js";
import { getHelpDeskDashboard, helpdeskRequest } from "../../_lib/helpdesk.js";
import { errorResponse, json, methodNotAllowed, readJson } from "../../_lib/http.js";
import { writeLogSafely } from "../../_lib/logs.js";

function upstreamStatus(error) {
  const status = Number(error?.status || 0);
  return Number.isFinite(status) && status >= 400 ? status : 0;
}

function createAgentErrorResponse(error) {
  const message = error?.message || "Failed to create HelpDesk agent.";
  const status = upstreamStatus(error);
  const responseStatus = status >= 400 && status < 500 ? status : 502;
  return errorResponse(`Failed to create HelpDesk agent: ${message}`, responseStatus);
}

async function teamNameMapForLog(env, teamIds) {
  if (!teamIds.length) return new Map();
  try {
    const dashboard = await getHelpDeskDashboard(env);
    return new Map(dashboard.teams.map((team) => [team.id, team.name]));
  } catch (error) {
    console.error("Failed to load HelpDesk teams for create-agent audit log.", error);
    return new Map();
  }
}

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const auth = await requireAuth(context);
  if (auth.error) {
    return auth.error;
  }
  context = withAccountContext(context);

  let targetEmail = "unknown";

  try {
    const body = await readJson(context.request);
    const name = `${body.name || ""}`.trim();
    const email = `${body.email || ""}`.trim().toLowerCase();
    targetEmail = email || targetEmail;
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

    const teamNameById = await teamNameMapForLog(context.env, teamIds);

    await writeLogSafely(context.env, {
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
    await writeLogSafely(context.env, {
      actor: auth.session.user,
      area: "helpdesk",
      action: "create_agent",
      target: targetEmail,
      status: "error",
      details: error.message || "Failed to create HelpDesk agent.",
      metadata: {
        upstreamStatus: upstreamStatus(error) || null,
      },
    });
    return createAgentErrorResponse(error);
  }
}
