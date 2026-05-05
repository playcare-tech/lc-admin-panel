import { errorResponse } from "./http.js";

const SESSION_COOKIE = "__text_admin_session";
const SESSION_TTL_SECONDS = 60 * 60;
const encoder = new TextEncoder();
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function toBase64Url(value) {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(`${normalized}${padding}`);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function sign(value, secret) {
  return toBase64Url(await signBytes(value, secret));
}

async function signBytes(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return new Uint8Array(signature);
}

async function verifySignature(value, signature, secret) {
  let signatureBytes;
  try {
    signatureBytes = fromBase64Url(signature);
  } catch {
    return false;
  }

  const expectedSignatureBytes = await signBytes(value, secret);
  if (signatureBytes.byteLength !== expectedSignatureBytes.byteLength) {
    return false;
  }

  return crypto.subtle.timingSafeEqual(signatureBytes, expectedSignatureBytes);
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  for (const segment of cookieHeader.split(";")) {
    const cookie = segment.trim();
    if (!cookie) {
      continue;
    }

    const divider = cookie.indexOf("=");
    const cookieName = divider === -1 ? cookie : cookie.slice(0, divider);
    if (cookieName === name) {
      return divider === -1 ? "" : cookie.slice(divider + 1);
    }
  }

  return null;
}

export function createCsrfToken() {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

function safeEqualBase64Url(left, right) {
  let leftBytes;
  let rightBytes;
  try {
    leftBytes = fromBase64Url(left);
    rightBytes = fromBase64Url(right);
  } catch {
    return false;
  }

  if (leftBytes.byteLength !== rightBytes.byteLength) {
    return false;
  }

  return crypto.subtle.timingSafeEqual(leftBytes, rightBytes);
}

export function verifyCsrfToken(request, session) {
  if (!UNSAFE_METHODS.has(request.method.toUpperCase())) {
    return true;
  }

  const expectedToken = session?.csrfToken;
  const submittedToken = request.headers.get("X-CSRF-Token") || "";
  if (!expectedToken || !submittedToken) {
    return false;
  }

  return safeEqualBase64Url(submittedToken, expectedToken);
}

export function isUnsafeMethod(method) {
  return UNSAFE_METHODS.has(`${method || ""}`.toUpperCase());
}

export async function createSessionCookie(env, username, extra = {}) {
  if (!env.SESSION_SECRET) {
    throw new Error("Missing SESSION_SECRET environment variable.");
  }

  const payload = {
    user: username,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
    permissions: extra.permissions || {},
    csrfToken: extra.csrfToken || createCsrfToken(),
  };
  const token = toBase64Url(JSON.stringify(payload));
  const signature = await sign(token, env.SESSION_SECRET);
  const cookieValue = `${token}.${signature}`;

  return [
    `${SESSION_COOKIE}=${cookieValue}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ].join("; ");
}

export async function rotateCsrfToken(context, response) {
  const session = await getSession(context.request, context.env);
  if (!session) {
    return response;
  }

  if (isUnsafeMethod(context.request.method) && !verifyCsrfToken(context.request, session)) {
    return response;
  }

  const csrfToken = createCsrfToken();
  const sessionCookie = await createSessionCookie(context.env, session.user, {
    permissions: session.permissions || {},
    csrfToken,
  });
  const headers = new Headers(response.headers);
  headers.set("Set-Cookie", sessionCookie);
  headers.set("X-CSRF-Token", csrfToken);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function clearSessionCookie() {
  return [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Max-Age=0",
  ].join("; ");
}

export async function getSession(request, env) {
  if (!env.SESSION_SECRET) {
    return null;
  }

  const token = getCookie(request, SESSION_COOKIE);
  if (!token) {
    return null;
  }

  const [payloadToken, signature] = token.split(".");
  if (!payloadToken || !signature) {
    return null;
  }

  if (!(await verifySignature(payloadToken, signature, env.SESSION_SECRET))) {
    return null;
  }

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadToken)));
    if (!payload?.user || !payload?.exp || payload.exp < Date.now() || !payload?.csrfToken) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function requireAuth(context) {
  const session = await getSession(context.request, context.env);
  if (!session) {
    return { error: errorResponse("Unauthorized.", 401) };
  }
  if (!verifyCsrfToken(context.request, session)) {
    return { error: errorResponse("Invalid CSRF token.", 403) };
  }

  return { session };
}

export async function requirePermission(context, permission) {
  const auth = await requireAuth(context);
  if (auth.error) return auth;
  if (!auth.session.permissions?.[permission]) {
    return { error: errorResponse("Forbidden.", 403) };
  }
  return auth;
}
