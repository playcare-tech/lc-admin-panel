import { clearSessionCookie, getSession, verifyCsrfToken } from "../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed } from "../../_lib/http.js";
import { writeLog } from "../../_lib/logs.js";

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const session = await getSession(context.request, context.env);
  if (session) {
    if (!verifyCsrfToken(context.request, session)) {
      return errorResponse("Invalid CSRF token.", 403);
    }

    await writeLog(context.env, {
      actor: session.user,
      area: "auth",
      action: "logout",
      status: "success",
      details: "Admin signed out.",
    });
  }

  return json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": clearSessionCookie(),
      },
    },
  );
}
