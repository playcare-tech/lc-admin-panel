import { getSession } from "../../_lib/auth.js";
import { json, methodNotAllowed } from "../../_lib/http.js";

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const session = await getSession(context.request, context.env);
  return json({
    authenticated: Boolean(session),
    user: session?.user ?? null,
  });
}
