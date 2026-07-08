const CREATE_ADMIN_USERS_SQL =
  "CREATE TABLE IF NOT EXISTS admin_users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL, created_by TEXT, totp_secret TEXT, totp_enabled INTEGER NOT NULL DEFAULT 0, totp_setup_required INTEGER NOT NULL DEFAULT 1, password_reset_required INTEGER NOT NULL DEFAULT 0, totp_reset_at TEXT, totp_reset_by TEXT, totp_failed_attempts INTEGER NOT NULL DEFAULT 0, totp_first_failed_at TEXT, totp_locked_until TEXT, can_manage_users INTEGER NOT NULL DEFAULT 0, can_manage_admins INTEGER NOT NULL DEFAULT 0, user_role TEXT NOT NULL DEFAULT 'admin', access_level TEXT NOT NULL DEFAULT 'full', first_name TEXT, last_name TEXT, invite_email TEXT, invite_token_hash TEXT, invite_expires_at TEXT, invite_accepted_at TEXT, disabled_at TEXT, disabled_by TEXT)";

const CREATE_ADMIN_USERS_INDEX_SQL =
  "CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users (username)";

const CREATE_ADMIN_LOGIN_RATE_LIMITS_SQL =
  "CREATE TABLE IF NOT EXISTS admin_login_rate_limits (key TEXT PRIMARY KEY, scope TEXT NOT NULL, identifier_hash TEXT NOT NULL, failed_attempts INTEGER NOT NULL DEFAULT 0, first_failed_at TEXT, locked_until TEXT, updated_at TEXT NOT NULL)";

const CREATE_ADMIN_LOGIN_RATE_LIMITS_UPDATED_INDEX_SQL =
  "CREATE INDEX IF NOT EXISTS idx_admin_login_rate_limits_updated_at ON admin_login_rate_limits (updated_at)";

const PBKDF2_ITERATIONS = 100000;
const DUMMY_PASSWORD_SALT = "LC_ADMIN_DUMMY_PASSWORD_SALT_V1";
const DUMMY_PASSWORD_HASH = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
const LOGIN_RATE_LIMIT_USERNAME_MAX_ATTEMPTS = 10;
const LOGIN_RATE_LIMIT_IP_MAX_ATTEMPTS = 30;
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_RATE_LIMIT_LOCK_MS = 15 * 60 * 1000;
const LOGIN_RATE_LIMIT_RETENTION_MS = 24 * 60 * 60 * 1000;
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const TOTP_RATE_LIMIT_MAX_ATTEMPTS = 5;
const TOTP_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const TOTP_RATE_LIMIT_LOCK_MS = 15 * 60 * 1000;
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function bytesToBase64Url(bytes) {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function safeEqualBase64(left, right) {
  let leftBytes;
  let rightBytes;
  try {
    leftBytes = base64ToBytes(left);
    rightBytes = base64ToBytes(right);
  } catch {
    return false;
  }

  if (leftBytes.byteLength !== rightBytes.byteLength) {
    return false;
  }

  return crypto.subtle.timingSafeEqual(leftBytes, rightBytes);
}

function bytesToBase32(bytes) {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32ToBytes(value) {
  const normalized = `${value || ""}`.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
  let bits = 0;
  let buffer = 0;
  const bytes = [];

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) throw new Error("Invalid 2FA secret.");
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    material,
    256,
  );

  return bytesToBase64(new Uint8Array(bits));
}

async function hashRateLimitIdentifier(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

async function hashInviteToken(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${value || ""}`));
  return bytesToBase64Url(new Uint8Array(digest));
}

async function ensureColumn(db, existingColumns, name, definition) {
  if (existingColumns.has(name)) return false;
  await db.prepare(`ALTER TABLE admin_users ADD COLUMN ${name} ${definition}`).run();
  return true;
}

async function ensureAdminLoginRateLimitsTable(db) {
  if (!db) {
    throw new Error("Missing DB binding.");
  }

  await db.exec(CREATE_ADMIN_LOGIN_RATE_LIMITS_SQL);
  await db.exec(CREATE_ADMIN_LOGIN_RATE_LIMITS_UPDATED_INDEX_SQL);
}

function createSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return bytesToBase64(bytes);
}

function clientIpFromRequest(request) {
  const cfIp = request?.headers?.get("CF-Connecting-IP") || "";
  return cfIp.trim();
}

async function loginRateLimitDescriptors(request, username) {
  const normalizedUsername = `${username || ""}`.trim().toLowerCase() || "<empty>";
  const descriptors = [
    {
      scope: "username",
      identifier: normalizedUsername,
      maxAttempts: LOGIN_RATE_LIMIT_USERNAME_MAX_ATTEMPTS,
    },
  ];

  const ip = clientIpFromRequest(request);
  if (ip) {
    descriptors.push({
      scope: "ip",
      identifier: ip,
      maxAttempts: LOGIN_RATE_LIMIT_IP_MAX_ATTEMPTS,
    });
  }

  return Promise.all(
    descriptors.map(async (descriptor) => {
      const identifierHash = await hashRateLimitIdentifier(`${descriptor.scope}:${descriptor.identifier}`);
      return {
        ...descriptor,
        identifierHash,
        key: `${descriptor.scope}:${identifierHash}`,
      };
    }),
  );
}

function loginRateLimitLockState(row, timestamp = Date.now()) {
  const lockedUntilMs = row?.locked_until ? Date.parse(row.locked_until) : 0;
  if (Number.isFinite(lockedUntilMs) && lockedUntilMs > timestamp) {
    return {
      locked: true,
      scope: row.scope || "",
      lockedUntil: new Date(lockedUntilMs).toISOString(),
    };
  }

  return { locked: false, scope: "", lockedUntil: "" };
}

async function cleanupOldLoginRateLimits(env, timestamp = Date.now()) {
  const cutoff = new Date(timestamp - LOGIN_RATE_LIMIT_RETENTION_MS).toISOString();
  await env.DB.prepare("DELETE FROM admin_login_rate_limits WHERE updated_at < ?").bind(cutoff).run();
}

export function validateAdminPassword(password) {
  const value = `${password || ""}`;
  if (value.length < 12) {
    throw new Error("Password must be at least 12 characters long.");
  }
  if (!/[a-z]/.test(value)) {
    throw new Error("Password must include a lowercase letter.");
  }
  if (!/[A-Z]/.test(value)) {
    throw new Error("Password must include an uppercase letter.");
  }
  if (!/\d/.test(value)) {
    throw new Error("Password must include a number.");
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    throw new Error("Password must include a special character.");
  }
}

export async function ensureAdminUsersTable(db) {
  if (!db) {
    throw new Error("Missing DB binding.");
  }

  await db.exec(CREATE_ADMIN_USERS_SQL);
  await db.exec(CREATE_ADMIN_USERS_INDEX_SQL);
  const { results } = await db.prepare("PRAGMA table_info(admin_users)").all();
  const columns = new Set((results || []).map((column) => column.name));
  await ensureColumn(db, columns, "totp_secret", "TEXT");
  await ensureColumn(db, columns, "totp_enabled", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(db, columns, "totp_setup_required", "INTEGER NOT NULL DEFAULT 1");
  await ensureColumn(db, columns, "password_reset_required", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(db, columns, "totp_reset_at", "TEXT");
  await ensureColumn(db, columns, "totp_reset_by", "TEXT");
  await ensureColumn(db, columns, "totp_failed_attempts", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(db, columns, "totp_first_failed_at", "TEXT");
  await ensureColumn(db, columns, "totp_locked_until", "TEXT");
  const addedCanManageUsers = await ensureColumn(db, columns, "can_manage_users", "INTEGER NOT NULL DEFAULT 0");
  const addedCanManageAdmins = await ensureColumn(db, columns, "can_manage_admins", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(db, columns, "user_role", "TEXT NOT NULL DEFAULT 'admin'");
  await ensureColumn(db, columns, "access_level", "TEXT NOT NULL DEFAULT 'full'");
  await ensureColumn(db, columns, "first_name", "TEXT");
  await ensureColumn(db, columns, "last_name", "TEXT");
  await ensureColumn(db, columns, "invite_email", "TEXT");
  await ensureColumn(db, columns, "invite_token_hash", "TEXT");
  await ensureColumn(db, columns, "invite_expires_at", "TEXT");
  await ensureColumn(db, columns, "invite_accepted_at", "TEXT");
  await ensureColumn(db, columns, "disabled_at", "TEXT");
  await ensureColumn(db, columns, "disabled_by", "TEXT");
  if (addedCanManageUsers || addedCanManageAdmins) {
    await db.prepare("UPDATE admin_users SET can_manage_users = 1, can_manage_admins = 1").run();
  }
  await db.prepare("UPDATE admin_users SET user_role = 'admin' WHERE user_role IS NULL OR user_role = ''").run();
  await db.prepare("UPDATE admin_users SET access_level = 'full' WHERE access_level IS NULL OR access_level = ''").run();
}

export async function listAdminUsers(env) {
  await ensureAdminUsersTable(env.DB);
  const { results } = await env.DB.prepare(
    `
      SELECT id, username, created_at, created_by, totp_enabled, totp_setup_required, password_reset_required, totp_reset_at, totp_reset_by, totp_failed_attempts, totp_first_failed_at, totp_locked_until, can_manage_users, can_manage_admins, disabled_at, disabled_by
        , user_role, access_level, first_name, last_name, invite_email, invite_expires_at, invite_accepted_at
      FROM admin_users
      ORDER BY username ASC
    `,
  ).all();

  return results;
}

export async function findAdminUserByUsername(env, username) {
  await ensureAdminUsersTable(env.DB);
  const result = await env.DB.prepare(
    `
      SELECT id, username, password_salt, password_hash, created_at, created_by, totp_secret, totp_enabled, totp_setup_required, password_reset_required, totp_reset_at, totp_reset_by, totp_failed_attempts, totp_first_failed_at, totp_locked_until, can_manage_users, can_manage_admins, disabled_at, disabled_by
        , user_role, access_level, first_name, last_name, invite_email, invite_token_hash, invite_expires_at, invite_accepted_at
      FROM admin_users
      WHERE username = ?
      LIMIT 1
    `,
  )
    .bind(username)
    .first();

  return result || null;
}

export async function createAdminUser(env, {
  username,
  password,
  createdBy,
  canManageUsers = false,
  canManageAdmins = false,
  userRole = "admin",
  accessLevel = "",
  firstName = "",
  lastName = "",
  inviteEmail = "",
  inviteOrigin = "",
} = {}) {
  await ensureAdminUsersTable(env.DB);
  const normalizedRole = userRole === "qa_manager" ? "qa_manager" : "admin";
  const normalizedAccessLevel = accessLevel || (normalizedRole === "qa_manager" ? "qa_manager" : "full");
  const inviteToken = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const inviteTokenHash = await hashInviteToken(inviteToken);
  const inviteExpiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();
  const initialPassword = password || generateTemporaryPassword();
  validateAdminPassword(initialPassword);

  const existing = await findAdminUserByUsername(env, username);
  if (existing) {
    throw new Error("Username already exists.");
  }

  const salt = createSalt();
  const hash = await hashPassword(initialPassword, salt);

  await env.DB.prepare(
    `
      INSERT INTO admin_users (
        username, password_salt, password_hash, created_at, created_by, password_reset_required, totp_setup_required,
        can_manage_users, can_manage_admins, user_role, access_level, first_name, last_name, invite_email,
        invite_token_hash, invite_expires_at
      )
      VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  )
    .bind(
      username,
      salt,
      hash,
      new Date().toISOString(),
      createdBy || null,
      canManageUsers ? 1 : 0,
      canManageAdmins ? 1 : 0,
      normalizedRole,
      normalizedAccessLevel,
      firstName || null,
      lastName || null,
      inviteEmail || null,
      inviteTokenHash,
      inviteExpiresAt,
    )
    .run();

  const origin = `${inviteOrigin || ""}`.replace(/\/+$/g, "");
  const inviteLink = `${origin || ""}/?invite=${encodeURIComponent(inviteToken)}&username=${encodeURIComponent(username)}`;
  return { username, inviteToken, inviteLink, inviteExpiresAt };
}

export async function verifyAdminCredentials(env, username, password, preloadedUser) {
  const user = arguments.length >= 4 ? preloadedUser : await findAdminUserByUsername(env, username);
  if (!user) {
    // Keep invalid-login timing close to the real-password path to avoid username enumeration.
    const hash = await hashPassword(password, DUMMY_PASSWORD_SALT);
    safeEqualBase64(hash, DUMMY_PASSWORD_HASH);
    return null;
  }

  const hash = await hashPassword(password, user.password_salt);
  return safeEqualBase64(hash, user.password_hash) ? user : null;
}

export async function getAdminLoginRateLimitState(env, request, username, timestamp = Date.now()) {
  await ensureAdminLoginRateLimitsTable(env.DB);
  const descriptors = await loginRateLimitDescriptors(request, username);
  for (const descriptor of descriptors) {
    const row = await env.DB.prepare(
      `
        SELECT key, scope, failed_attempts, first_failed_at, locked_until
        FROM admin_login_rate_limits
        WHERE key = ?
        LIMIT 1
      `,
    )
      .bind(descriptor.key)
      .first();
    const state = loginRateLimitLockState(row, timestamp);
    if (state.locked) return state;
  }

  return { locked: false, scope: "", lockedUntil: "" };
}

export async function recordAdminLoginFailure(env, request, username, timestamp = Date.now()) {
  await ensureAdminLoginRateLimitsTable(env.DB);
  await cleanupOldLoginRateLimits(env, timestamp);
  const descriptors = await loginRateLimitDescriptors(request, username);
  let lockedState = { locked: false, scope: "", lockedUntil: "" };

  for (const descriptor of descriptors) {
    const row = await env.DB.prepare(
      `
        SELECT key, scope, failed_attempts, first_failed_at, locked_until
        FROM admin_login_rate_limits
        WHERE key = ?
        LIMIT 1
      `,
    )
      .bind(descriptor.key)
      .first();
    const existingLock = loginRateLimitLockState(row, timestamp);
    if (existingLock.locked) {
      lockedState = existingLock;
      continue;
    }

    const firstFailedMs = row?.first_failed_at ? Date.parse(row.first_failed_at) : 0;
    const withinWindow =
      Number.isFinite(firstFailedMs) && firstFailedMs > 0 && timestamp - firstFailedMs < LOGIN_RATE_LIMIT_WINDOW_MS;
    const attempts = withinWindow ? Number(row?.failed_attempts || 0) + 1 : 1;
    const firstFailedAt = withinWindow ? row.first_failed_at : new Date(timestamp).toISOString();
    const lockedUntil = attempts >= descriptor.maxAttempts ? new Date(timestamp + LOGIN_RATE_LIMIT_LOCK_MS).toISOString() : null;
    const updatedAt = new Date(timestamp).toISOString();

    await env.DB.prepare(
      `
        INSERT INTO admin_login_rate_limits
          (key, scope, identifier_hash, failed_attempts, first_failed_at, locked_until, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          failed_attempts = excluded.failed_attempts,
          first_failed_at = excluded.first_failed_at,
          locked_until = excluded.locked_until,
          updated_at = excluded.updated_at
      `,
    )
      .bind(descriptor.key, descriptor.scope, descriptor.identifierHash, attempts, firstFailedAt, lockedUntil, updatedAt)
      .run();

    if (lockedUntil && !lockedState.locked) {
      lockedState = {
        locked: true,
        scope: descriptor.scope,
        lockedUntil,
      };
    }
  }

  return lockedState;
}

export async function clearAdminLoginRateLimit(env, request, username) {
  await ensureAdminLoginRateLimitsTable(env.DB);
  const descriptors = await loginRateLimitDescriptors(request, username);
  for (const descriptor of descriptors) {
    await env.DB.prepare("DELETE FROM admin_login_rate_limits WHERE key = ?").bind(descriptor.key).run();
  }
}

export function adminPermissions(user) {
  const role = user?.user_role === "qa_manager" ? "qa_manager" : "admin";
  const qaPermissions = {
    canViewQaDashboard: true,
    canViewLivechatAiQaTagging: true,
    canReviewLivechatAiAutoTags: true,
    canReviewLivechatAgentQa: true,
    canViewLivechatAgentQaLeaderboard: true,
    canViewHelpdeskAnalytics: true,
  };
  if (role === "qa_manager") {
    return {
      role,
      accessLevel: user?.access_level || "qa_manager",
      canManageUsers: false,
      canManageAdmins: false,
      ...qaPermissions,
    };
  }
  return {
    role,
    accessLevel: user?.access_level || "full",
    canManageUsers: Boolean(user?.can_manage_users),
    canManageAdmins: Boolean(user?.can_manage_admins),
    canViewQaDashboard: true,
    canViewLivechatAiQaTagging: true,
    canReviewLivechatAiAutoTags: true,
    canReviewLivechatAgentQa: true,
    canViewLivechatAgentQaLeaderboard: true,
    canViewHelpdeskAnalytics: true,
  };
}

function generateTemporaryPassword() {
  const token = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(18)));
  return `Temp-${token}!A1a`;
}

export function generateTotpSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return bytesToBase32(bytes);
}

export function buildTotpUri(username, secret) {
  const issuer = "LC Admin";
  const label = `${issuer}:${username}`;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP_SECONDS),
  });
  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}

async function totpCodeAt(secret, counter) {
  const key = await crypto.subtle.importKey(
    "raw",
    base32ToBytes(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(4, counter, false);
  const hmac = new Uint8Array(await crypto.subtle.sign("HMAC", key, buffer));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)) %
    10 ** TOTP_DIGITS;
  return String(code).padStart(TOTP_DIGITS, "0");
}

export async function verifyTotpCode(secret, code, timestamp = Date.now()) {
  const normalized = `${code || ""}`.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;
  const counter = Math.floor(timestamp / 1000 / TOTP_STEP_SECONDS);
  try {
    for (const drift of [-1, 0, 1]) {
      if ((await totpCodeAt(secret, counter + drift)) === normalized) return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function getTotpRateLimitState(user, timestamp = Date.now()) {
  const lockedUntilMs = user?.totp_locked_until ? Date.parse(user.totp_locked_until) : 0;
  if (Number.isFinite(lockedUntilMs) && lockedUntilMs > timestamp) {
    return {
      locked: true,
      retryAfterSeconds: Math.ceil((lockedUntilMs - timestamp) / 1000),
      lockedUntil: new Date(lockedUntilMs).toISOString(),
    };
  }

  return { locked: false, retryAfterSeconds: 0, lockedUntil: "" };
}

export async function recordTotpFailure(env, username, timestamp = Date.now()) {
  await ensureAdminUsersTable(env.DB);
  const user = await findAdminUserByUsername(env, username);
  if (!user) {
    return { locked: false, retryAfterSeconds: 0, lockedUntil: "" };
  }

  const firstFailedMs = user.totp_first_failed_at ? Date.parse(user.totp_first_failed_at) : 0;
  const withinWindow = Number.isFinite(firstFailedMs) && firstFailedMs > 0 && timestamp - firstFailedMs < TOTP_RATE_LIMIT_WINDOW_MS;
  const attempts = withinWindow ? Number(user.totp_failed_attempts || 0) + 1 : 1;
  const firstFailedAt = withinWindow ? user.totp_first_failed_at : new Date(timestamp).toISOString();
  const lockedUntil = attempts >= TOTP_RATE_LIMIT_MAX_ATTEMPTS ? new Date(timestamp + TOTP_RATE_LIMIT_LOCK_MS).toISOString() : null;

  await env.DB.prepare(
    `
      UPDATE admin_users
      SET totp_failed_attempts = ?,
          totp_first_failed_at = ?,
          totp_locked_until = ?
      WHERE username = ?
    `,
  )
    .bind(attempts, firstFailedAt, lockedUntil, username)
    .run();

  return lockedUntil
    ? {
        locked: true,
        retryAfterSeconds: Math.ceil(TOTP_RATE_LIMIT_LOCK_MS / 1000),
        lockedUntil,
      }
    : { locked: false, retryAfterSeconds: 0, lockedUntil: "" };
}

export async function clearTotpRateLimit(env, username) {
  await ensureAdminUsersTable(env.DB);
  await env.DB.prepare(
    `
      UPDATE admin_users
      SET totp_failed_attempts = 0,
          totp_first_failed_at = NULL,
          totp_locked_until = NULL
      WHERE username = ?
    `,
  )
    .bind(username)
    .run();
}

export async function updateAdminPassword(env, username, password) {
  await ensureAdminUsersTable(env.DB);
  validateAdminPassword(password);
  const salt = createSalt();
  const hash = await hashPassword(password, salt);
  await env.DB.prepare(
    `
      UPDATE admin_users
      SET password_salt = ?, password_hash = ?, password_reset_required = 0
      WHERE username = ?
    `,
  )
    .bind(salt, hash, username)
    .run();
}

export async function enableAdminTotp(env, username, secret) {
  await ensureAdminUsersTable(env.DB);
  await env.DB.prepare(
    `
      UPDATE admin_users
      SET totp_secret = ?,
          totp_enabled = 1,
          totp_setup_required = 0,
          totp_failed_attempts = 0,
          totp_first_failed_at = NULL,
          totp_locked_until = NULL
      WHERE username = ?
    `,
  )
    .bind(secret, username)
    .run();
}

export async function resetAdminTotp(env, username, resetBy) {
  await ensureAdminUsersTable(env.DB);
  const existing = await findAdminUserByUsername(env, username);
  if (!existing) throw new Error("Admin user was not found.");

  await env.DB.prepare(
    `
      UPDATE admin_users
      SET totp_secret = NULL,
          totp_enabled = 0,
          totp_setup_required = 1,
          password_reset_required = 1,
          totp_reset_at = ?,
          totp_reset_by = ?,
          totp_failed_attempts = 0,
          totp_first_failed_at = NULL,
          totp_locked_until = NULL
      WHERE username = ?
    `,
  )
    .bind(new Date().toISOString(), resetBy || null, username)
    .run();
}

export async function updateAdminPermissions(env, username, {
  canManageUsers = false,
  canManageAdmins = false,
  userRole = "admin",
  accessLevel = "",
  firstName = "",
  lastName = "",
  inviteEmail = "",
} = {}) {
  await ensureAdminUsersTable(env.DB);
  const normalizedRole = userRole === "qa_manager" ? "qa_manager" : "admin";
  const normalizedAccessLevel = accessLevel || (normalizedRole === "qa_manager" ? "qa_manager" : "full");
  const result = await env.DB.prepare(
    `
      UPDATE admin_users
      SET can_manage_users = ?,
          can_manage_admins = ?,
          user_role = ?,
          access_level = ?,
          first_name = ?,
          last_name = ?,
          invite_email = ?
      WHERE username = ?
    `,
  )
    .bind(
      normalizedRole === "qa_manager" ? 0 : canManageUsers ? 1 : 0,
      normalizedRole === "qa_manager" ? 0 : canManageAdmins ? 1 : 0,
      normalizedRole,
      normalizedAccessLevel,
      firstName || null,
      lastName || null,
      inviteEmail || null,
      username,
    )
    .run();
  if (!result.meta?.changes) throw new Error("Admin user was not found.");
}

export async function setupInvitedAdminUser(env, { token, username, password, setupSecret, otp } = {}) {
  await ensureAdminUsersTable(env.DB);
  validateAdminPassword(password);
  const user = await findValidAdminInvite(env, { token, username });
  if (!(await verifyTotpCode(setupSecret, otp))) throw new Error("Invalid 2FA setup code.");

  const salt = createSalt();
  const hash = await hashPassword(password, salt);
  await env.DB.prepare(
    `
      UPDATE admin_users
      SET password_salt = ?,
          password_hash = ?,
          password_reset_required = 0,
          totp_secret = ?,
          totp_enabled = 1,
          totp_setup_required = 0,
          invite_accepted_at = ?,
          invite_token_hash = NULL,
          totp_failed_attempts = 0,
          totp_first_failed_at = NULL,
          totp_locked_until = NULL
      WHERE username = ?
    `,
  )
    .bind(salt, hash, setupSecret, new Date().toISOString(), user.username)
    .run();
  return { ok: true, username: user.username };
}

export async function findValidAdminInvite(env, { token, username } = {}) {
  await ensureAdminUsersTable(env.DB);
  const tokenHash = await hashInviteToken(token);
  const user = await env.DB.prepare(
    `
      SELECT username, invite_expires_at, invite_accepted_at
      FROM admin_users
      WHERE username = ? AND invite_token_hash = ?
      LIMIT 1
    `,
  )
    .bind(username, tokenHash)
    .first();
  if (!user) throw new Error("Invitation link is invalid.");
  if (user.invite_accepted_at) throw new Error("Invitation link was already used.");
  if (!user.invite_expires_at || Date.parse(user.invite_expires_at) < Date.now()) throw new Error("Invitation link expired.");
  return user;
}

export async function setAdminDisabled(env, username, disabled, actor) {
  await ensureAdminUsersTable(env.DB);
  const existing = await findAdminUserByUsername(env, username);
  if (!existing) throw new Error("Admin user was not found.");
  await env.DB.prepare(
    `
      UPDATE admin_users
      SET disabled_at = ?, disabled_by = ?
      WHERE username = ?
    `,
  )
    .bind(disabled ? new Date().toISOString() : null, disabled ? actor || null : null, username)
    .run();
}

export async function deleteAdminUser(env, username) {
  await ensureAdminUsersTable(env.DB);
  const existing = await findAdminUserByUsername(env, username);
  if (!existing) throw new Error("Admin user was not found.");
  await env.DB.prepare("DELETE FROM admin_users WHERE username = ?").bind(username).run();
}
