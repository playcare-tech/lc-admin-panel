import { rotateCsrfToken } from "./_lib/auth.js";

const SKIP_CSRF_ROTATION_PATHS = new Set(["/api/auth/login", "/api/auth/logout"]);

export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);
  if (!url.pathname.startsWith("/api/") || SKIP_CSRF_ROTATION_PATHS.has(url.pathname)) {
    return response;
  }

  return rotateCsrfToken(context, response);
}
