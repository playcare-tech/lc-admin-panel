import { requireAuth } from "../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed, readJson } from "../../_lib/http.js";
import { helpdeskRequest } from "../../_lib/helpdesk.js";
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
    const teamIds = Array.isArray(body.teamIds) ? body.teamIds.filter(Boolean) : [];

    if (!email) {
      return errorResponse("Email is required.", 400);
    }

    const agent = await helpdeskRequest(context.env, "/agents", {
      method: "POST",
      body: {
        email,
        name,
        roles: ["normal"],
        status: "invited",
        teamIDs: teamIds,
      },
    });

    await writeLog(context.env, {
      actor: auth.session.user,
      area: "helpdesk",
      action: "create_agent",
      target: email,
      status: "success",
      details: `Created HelpDesk agent ${email}.`,
      metadata: {
        teamIds,
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
