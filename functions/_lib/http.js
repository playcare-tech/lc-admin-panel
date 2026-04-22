export function json(data, init = {}) {
  const responseInit =
    typeof init === "number"
      ? { status: init }
      : {
          status: init.status ?? 200,
          headers: init.headers ?? {},
        };

  return new Response(JSON.stringify(data), {
    ...responseInit,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...responseInit.headers,
    },
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
