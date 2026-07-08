export const DEFAULT_ACCOUNT_ID = "default";

export function normalizeAccountId(value) {
  return DEFAULT_ACCOUNT_ID;
}

export function requestAccountId(request) {
  return normalizeAccountId();
}

export function accountSecretName(accountId) {
  return "TEXT_BASIC_AUTH_B64";
}

export function accountTableName(env, baseName) {
  return baseName;
}

export function accountIndexName(env, baseName) {
  return baseName;
}

export function accountScopedEnv(context) {
  return new Proxy(context.env, {
    get(target, prop) {
      if (prop === "LC_ACCOUNT_ID") return DEFAULT_ACCOUNT_ID;
      if (prop === "LC_AUTH_SECRET_NAME") return "TEXT_BASIC_AUTH_B64";
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
