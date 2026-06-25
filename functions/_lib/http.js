const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export function json(data, init = {}) {
  const responseInit =
    typeof init === "number"
      ? { status: init }
      : {
          status: init.status ?? 200,
          headers: init.headers ?? {},
        };
  const headers = new Headers(responseInit.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(name)) {
      headers.set(name, value);
    }
  }

  return new Response(JSON.stringify(data), {
    ...responseInit,
    headers,
  });
}

export function errorResponse(message, status = 400, extra = {}) {
  return json(
    {
      error: message,
      ...extra,
    },
    status,
  );
}

export function serverErrorResponse(error, message = "Request failed.") {
  console.error(message, error);
  return errorResponse(message, 500);
}

export function methodNotAllowed(allowed) {
  return errorResponse(`Method not allowed. Use ${allowed.join(", ")}.`, 405, { allowed });
}

export async function readJson(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Expected application/json request body.");
  }

  return request.json();
}
