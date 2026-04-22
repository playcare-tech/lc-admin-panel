import { requireAuth } from "../../_lib/auth.js";
import { helpdeskRequest } from "../../_lib/helpdesk.js";
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
    const teamIds = Array.isArray(body.teamIds) ? body.teamIds.filter(Boolean).map(String) : [];

    if (!agentId) {
      return errorResponse("agentId is required.", 400);
    }

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
      metadata: { teamIds },
    });

    return json({ ok: true });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
