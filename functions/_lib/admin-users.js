const CREATE_ADMIN_USERS_SQL =
  "CREATE TABLE IF NOT EXISTS admin_users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL, created_by TEXT)";

const CREATE_ADMIN_USERS_INDEX_SQL =
  "CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users (username)";

const PBKDF2_ITERATIONS = 100000;

function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
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
}

export async function listAdminUsers(env) {
  await ensureAdminUsersTable(env.DB);
  const { results } = await env.DB.prepare(
    `
      SELECT id, username, created_at, created_by
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
      SELECT id, username, password_salt, password_hash, created_at, created_by
      FROM admin_users
      WHERE username = ?
      LIMIT 1
    `,
  )
    .bind(username)
    .first();

  return result || null;
}

export async function createAdminUser(env, { username, password, createdBy }) {
  await ensureAdminUsersTable(env.DB);

  const existing = await findAdminUserByUsername(env, username);
  if (existing) {
    throw new Error("Username already exists.");
  }

  const salt = createSalt();
  const hash = await hashPassword(password, salt);

  await env.DB.prepare(
    `
      INSERT INTO admin_users (username, password_salt, password_hash, created_at, created_by)
      VALUES (?, ?, ?, ?, ?)
    `,
  )
    .bind(username, salt, hash, new Date().toISOString(), createdBy || null)
    .run();
}

export async function verifyAdminCredentials(env, username, password) {
  const user = await findAdminUserByUsername(env, username);
  if (!user) {
    return false;
  }

  const hash = await hashPassword(password, user.password_salt);
  return hash === user.password_hash;
}
