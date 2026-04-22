import { createSessionCookie } from "../../_lib/auth.js";
import { verifyAdminCredentials } from "../../_lib/admin-users.js";
import { errorResponse, json, methodNotAllowed, readJson } from "../../_lib/http.js";
import { writeLogSafely } from "../../_lib/logs.js";

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  try {
    const body = await readJson(context.request);
    const username = `${body.username || ""}`.trim();
    const password = `${body.password || ""}`;

    let authenticated = false;
    try {
      authenticated = await verifyAdminCredentials(context.env, username, password);
    } catch {
      authenticated = false;
    }

    if (
      !authenticated &&
      context.env.ADMIN_USERNAME &&
      context.env.ADMIN_PASSWORD &&
      username === context.env.ADMIN_USERNAME &&
      password === context.env.ADMIN_PASSWORD
    ) {
      authenticated = true;
    }

    if (!authenticated) {
      await writeLogSafely(context.env, {
        actor: username || "unknown",
        area: "auth",
        action: "login",
        status: "error",
        details: "Invalid admin credentials.",
      });
      return errorResponse("Invalid username or password.", 401);
    }

    const sessionCookie = await createSessionCookie(context.env, username);
    await writeLogSafely(context.env, {
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
