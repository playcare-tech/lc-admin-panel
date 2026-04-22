import { clearSessionCookie, createSessionCookie } from "../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed, readJson } from "../../_lib/http.js";

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  if (!context.env.ADMIN_USERNAME || !context.env.ADMIN_PASSWORD) {
    return errorResponse(
      "Missing ADMIN_USERNAME or ADMIN_PASSWORD environment variable.",
      500,
    );
  }

  try {
    const body = await readJson(context.request);
    const username = `${body.username || ""}`.trim();
    const password = `${body.password || ""}`;

    if (
      username !== context.env.ADMIN_USERNAME ||
      password !== context.env.ADMIN_PASSWORD
    ) {
      return errorResponse("Invalid credentials.", 401);
    }

    const cookie = await createSessionCookie(context.env, username);
    return json(
      {
        ok: true,
        user: username,
      },
      {
        headers: {
          "Set-Cookie": cookie,
        },
      },
    );
  } catch (error) {
    return json(
      {
        ok: false,
        error: error.message,
      },
      {
        status: 400,
        headers: {
          "Set-Cookie": clearSessionCookie(),
        },
      },
    );
  }
}
