const ACCOUNT_HEADER = "X-LC-Account";

export const DEFAULT_ACCOUNT_ID = "default";
export const SECOND_ACCOUNT_ID = "playtraffpartners";
const SECOND_ACCOUNT_TABLE_SUFFIX = "playtraffpartners";

export function normalizeAccountId(value) {
  const normalized = `${value || ""}`.trim().toLowerCase();
  if (["2", "second", "secondary", "pam", "playtraffpartners"].includes(normalized)) return SECOND_ACCOUNT_ID;
  return DEFAULT_ACCOUNT_ID;
}

export function requestAccountId(request) {
  const url = new URL(request.url);
  return normalizeAccountId(url.searchParams.get("account") || request.headers.get(ACCOUNT_HEADER));
}

export function accountSecretName(accountId) {
  return accountId === SECOND_ACCOUNT_ID ? "TEXT_BASIC_AUTH_B64_2" : "TEXT_BASIC_AUTH_B64";
}

export function accountTableName(env, baseName) {
  return normalizeAccountId(env?.LC_ACCOUNT_ID) === SECOND_ACCOUNT_ID
    ? `${baseName}_${SECOND_ACCOUNT_TABLE_SUFFIX}`
    : baseName;
}

export function accountIndexName(env, baseName) {
  return normalizeAccountId(env?.LC_ACCOUNT_ID) === SECOND_ACCOUNT_ID
    ? `${baseName}_${SECOND_ACCOUNT_TABLE_SUFFIX}`
    : baseName;
}

export function accountScopedEnv(context) {
  const accountId = requestAccountId(context.request);
  const secretName = accountSecretName(accountId);
  const authValue = `${context.env[secretName] || ""}`.trim();
  const webhookSecret =
    accountId === SECOND_ACCOUNT_ID && context.env.HELPDESK_WEBHOOK_SECRET_2
      ? context.env.HELPDESK_WEBHOOK_SECRET_2
      : context.env.HELPDESK_WEBHOOK_SECRET;
  const syncToken =
    accountId === SECOND_ACCOUNT_ID && context.env.HELPDESK_SYNC_TOKEN_2
      ? context.env.HELPDESK_SYNC_TOKEN_2
      : context.env.HELPDESK_SYNC_TOKEN;

  return new Proxy(context.env, {
    get(target, prop) {
      if (prop === "TEXT_BASIC_AUTH_B64") return authValue;
      if (prop === "HELPDESK_WEBHOOK_SECRET") return webhookSecret;
      if (prop === "HELPDESK_SYNC_TOKEN") return syncToken;
      if (prop === "LC_ACCOUNT_ID") return accountId;
      if (prop === "LC_AUTH_SECRET_NAME") return secretName;
      return target[prop];
    },
  });
}

export function withAccountContext(context) {
  return {
    ...context,
    env: accountScopedEnv(context),
  };
}
