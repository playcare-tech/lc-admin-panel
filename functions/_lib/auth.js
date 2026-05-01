import { errorResponse } from "./http.js";

const SESSION_COOKIE = "__text_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const encoder = new TextEncoder();

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
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return toBase64Url(new Uint8Array(signature));
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

export async function createSessionCookie(env, username, extra = {}) {
  if (!env.SESSION_SECRET) {
    throw new Error("Missing SESSION_SECRET environment variable.");
  }

  const payload = {
    user: username,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
    permissions: extra.permissions || {},
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

  const expectedSignature = await sign(payloadToken, env.SESSION_SECRET);
  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadToken)));
    if (!payload?.user || !payload?.exp || payload.exp < Date.now()) {
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
