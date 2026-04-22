import { createSessionCookie } from "../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed, readJson } from "../../_lib/http.js";
import { writeLog } from "../../_lib/logs.js";

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  try {
    const body = await readJson(context.request);
    const username = `${body.username || ""}`.trim();
    const password = `${body.password || ""}`;

    if (!context.env.ADMIN_USERNAME || !context.env.ADMIN_PASSWORD) {
      return errorResponse("Admin credentials are not configured.", 500);
    }

    if (username !== context.env.ADMIN_USERNAME || password !== context.env.ADMIN_PASSWORD) {
      await writeLog(context.env, {
        actor: username || "unknown",
        area: "auth",
        action: "login",
        status: "error",
        details: "Invalid admin credentials.",
      });
      return errorResponse("Invalid username or password.", 401);
    }

    const sessionCookie = await createSessionCookie(context.env, username);
    await writeLog(context.env, {
      actor: username,
      area: "auth",
      action: "login",
      status: "success",
      details: "Admin signed in.",
    });

    return json(
      {
        ok: true,
        user: username,
      },
      {
        headers: {
          "Set-Cookie": sessionCookie,
        },
      },
    );
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
