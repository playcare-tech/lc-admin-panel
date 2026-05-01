const CREATE_ADMIN_USERS_SQL =
  "CREATE TABLE IF NOT EXISTS admin_users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL, created_by TEXT, totp_secret TEXT, totp_enabled INTEGER NOT NULL DEFAULT 0, totp_setup_required INTEGER NOT NULL DEFAULT 1, password_reset_required INTEGER NOT NULL DEFAULT 0, totp_reset_at TEXT, totp_reset_by TEXT, can_manage_users INTEGER NOT NULL DEFAULT 0, can_manage_admins INTEGER NOT NULL DEFAULT 0)";

const CREATE_ADMIN_USERS_INDEX_SQL =
  "CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users (username)";

const PBKDF2_ITERATIONS = 100000;
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
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

async function ensureColumn(db, existingColumns, name, definition) {
  if (existingColumns.has(name)) return false;
  await db.prepare(`ALTER TABLE admin_users ADD COLUMN ${name} ${definition}`).run();
  return true;
}

function createSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return bytesToBase64(bytes);
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
  const addedCanManageUsers = await ensureColumn(db, columns, "can_manage_users", "INTEGER NOT NULL DEFAULT 0");
  const addedCanManageAdmins = await ensureColumn(db, columns, "can_manage_admins", "INTEGER NOT NULL DEFAULT 0");
  if (addedCanManageUsers || addedCanManageAdmins) {
    await db.prepare("UPDATE admin_users SET can_manage_users = 1, can_manage_admins = 1").run();
  }
}

export async function listAdminUsers(env) {
  await ensureAdminUsersTable(env.DB);
  const { results } = await env.DB.prepare(
    `
      SELECT id, username, created_at, created_by, totp_enabled, totp_setup_required, password_reset_required, totp_reset_at, totp_reset_by, can_manage_users, can_manage_admins
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
      SELECT id, username, password_salt, password_hash, created_at, created_by, totp_secret, totp_enabled, totp_setup_required, password_reset_required, totp_reset_at, totp_reset_by, can_manage_users, can_manage_admins
      FROM admin_users
      WHERE username = ?
      LIMIT 1
    `,
  )
    .bind(username)
    .first();

  return result || null;
}

export async function createAdminUser(env, { username, password, createdBy, canManageUsers = false, canManageAdmins = false }) {
  await ensureAdminUsersTable(env.DB);

  const existing = await findAdminUserByUsername(env, username);
  if (existing) {
    throw new Error("Username already exists.");
  }

  const salt = createSalt();
  const hash = await hashPassword(password, salt);

  await env.DB.prepare(
    `
      INSERT INTO admin_users (username, password_salt, password_hash, created_at, created_by, password_reset_required, totp_setup_required, can_manage_users, can_manage_admins)
      VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)
    `,
  )
    .bind(username, salt, hash, new Date().toISOString(), createdBy || null, canManageUsers ? 1 : 0, canManageAdmins ? 1 : 0)
    .run();
}

export async function verifyAdminCredentials(env, username, password) {
  const user = await findAdminUserByUsername(env, username);
  if (!user) {
    return null;
  }

  const hash = await hashPassword(password, user.password_salt);
  return hash === user.password_hash ? user : null;
}

export function adminPermissions(user) {
  return {
    canManageUsers: Boolean(user?.can_manage_users),
    canManageAdmins: Boolean(user?.can_manage_admins),
  };
}

export async function createOrUpdateFallbackAdminUser(env, { username, password }) {
  await ensureAdminUsersTable(env.DB);
  const existing = await findAdminUserByUsername(env, username);
  if (existing) return existing;

  const salt = createSalt();
  const hash = await hashPassword(password, salt);
  await env.DB.prepare(
    `
      INSERT INTO admin_users
        (username, password_salt, password_hash, created_at, created_by, password_reset_required, totp_setup_required, can_manage_users, can_manage_admins)
      VALUES (?, ?, ?, ?, ?, 0, 1, 1, 1)
    `,
  )
    .bind(username, salt, hash, new Date().toISOString(), "env-fallback")
    .run();
  return findAdminUserByUsername(env, username);
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

export async function updateAdminPassword(env, username, password) {
  await ensureAdminUsersTable(env.DB);
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
      SET totp_secret = ?, totp_enabled = 1, totp_setup_required = 0
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
          totp_reset_by = ?
      WHERE username = ?
    `,
  )
    .bind(new Date().toISOString(), resetBy || null, username)
    .run();
}

export async function updateAdminPermissions(env, username, { canManageUsers = false, canManageAdmins = false } = {}) {
  await ensureAdminUsersTable(env.DB);
  const result = await env.DB.prepare(
    `
      UPDATE admin_users
      SET can_manage_users = ?, can_manage_admins = ?
      WHERE username = ?
    `,
  )
    .bind(canManageUsers ? 1 : 0, canManageAdmins ? 1 : 0, username)
    .run();
  if (!result.meta?.changes) throw new Error("Admin user was not found.");
}
