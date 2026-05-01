import { getSession } from "../../_lib/auth.js";
import { json, methodNotAllowed } from "../../_lib/http.js";

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const session = await getSession(context.request, context.env);
  if (!session) {
    return json({ authenticated: false });
  }

  return json({
    authenticated: true,
    user: session.user,
    permissions: session.permissions || {},
  });
}
