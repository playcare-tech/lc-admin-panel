import { clearSessionCookie, getSession } from "../../_lib/auth.js";
import { json, methodNotAllowed } from "../../_lib/http.js";
import { writeLog } from "../../_lib/logs.js";

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const session = await getSession(context.request, context.env);
  if (session) {
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
