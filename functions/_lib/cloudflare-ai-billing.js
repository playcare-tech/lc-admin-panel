const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";
const MAX_HISTORY_RANGE_MS = 90 * 24 * 60 * 60 * 1000;

function text(value) {
  return `${value ?? ""}`.trim();
}

function apiToken(value) {
  let token = text(value);
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
    token = token.slice(1, -1).trim();
  }
  return token.replace(/^Bearer\s+/i, "").trim();
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function boundedTimeRange(options = {}) {
  const now = Date.now();
  const requestedEnd = finiteNumber(options.endTime, now);
  const endTime = Math.min(Math.max(requestedEnd, 0), now);
  const requestedStart = finiteNumber(options.startTime, endTime - 24 * 60 * 60 * 1000);
  const startTime = Math.max(0, Math.min(requestedStart, endTime));
  return {
    startTime: Math.max(startTime, endTime - MAX_HISTORY_RANGE_MS),
    endTime,
  };
}

function billingMetricType(id) {
  const value = text(id).toLowerCase().replaceAll("-", "_");
  if (value.includes("input") && value.includes("token")) return "input_tokens";
  if (value.includes("output") && value.includes("token")) return "output_tokens";
  if (value.includes("neuron")) return "neurons";
  if (value.includes("text") || value.includes("generation") || value.includes("token")) return "text_generation";
  return "other";
}

function normalizeHistory(history = []) {
  const meters = new Map();
  const intervals = new Map();
  for (const raw of Array.isArray(history) ? history : []) {
    const id = text(raw?.id) || "usage";
    const value = finiteNumber(raw?.aggregated_value);
    const startTime = finiteNumber(raw?.start_time);
    const endTime = finiteNumber(raw?.end_time);
    const type = billingMetricType(id);
    const meter = meters.get(id) || { id, type, total: 0 };
    meter.total += value;
    meters.set(id, meter);

    const intervalKey = `${startTime}:${endTime}`;
    const interval = intervals.get(intervalKey) || { startTime, endTime, total: 0, values: {} };
    interval.total += value;
    interval.values[id] = finiteNumber(interval.values[id]) + value;
    intervals.set(intervalKey, interval);
  }
  return {
    meters: [...meters.values()].sort((left, right) => right.total - left.total),
    intervals: [...intervals.values()].sort((left, right) => left.startTime - right.startTime),
  };
}

async function cloudflareBillingRequest(env, accountId, token, path, searchParams) {
  const url = new URL(`${CLOUDFLARE_API_BASE}/accounts/${encodeURIComponent(accountId)}/ai-gateway/billing/${path}`);
  for (const [key, value] of Object.entries(searchParams || {})) {
    if (value !== undefined && value !== null && `${value}` !== "") url.searchParams.set(key, `${value}`);
  }
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  const payload = await response.json();
  if (!response.ok || payload?.success === false) {
    const details = payload?.errors?.map((item) => {
      const message = text(item?.message);
      const code = text(item?.code);
      return message ? `${message}${code ? ` (code ${code})` : ""}` : "";
    }).filter(Boolean).join("; ");
    const authenticationHint = response.status === 401 || /authentication/i.test(details)
      ? " Check that the token belongs to this Cloudflare account and has AI Gateway Read permission."
      : "";
    throw new Error(`${details || `Cloudflare Billing API returned ${response.status}.`}${authenticationHint}`);
  }
  return payload?.result || {};
}

function rejectedMessage(result) {
  return result.status === "rejected" ? text(result.reason?.message || result.reason) : "";
}

export async function getCloudflareAiBilling(env, options = {}) {
  const accountId = text(env.CLOUDFLARE_ACCOUNT_ID);
  const token = apiToken(env.CLOUDFLARE_AI_BILLING_API_TOKEN);
  const grouping = options.grouping === "day" ? "day" : "hour";
  const { startTime, endTime } = boundedTimeRange(options);
  if (!accountId || !token) {
    return {
      configured: false,
      source: "cloudflare_ai_gateway_billing_api",
      grouping,
      startTime,
      endTime,
      message: !accountId
        ? "Cloudflare account ID is not configured."
        : "Cloudflare AI Gateway Billing API token is not configured.",
      meters: [],
      intervals: [],
      creditBalance: null,
      invoicePreview: null,
    };
  }

  const [historyResult, creditResult, invoiceResult] = await Promise.allSettled([
    cloudflareBillingRequest(env, accountId, token, "usage-history", {
      value_grouping_window: grouping,
      start_time: startTime,
      end_time: endTime,
    }),
    cloudflareBillingRequest(env, accountId, token, "credit-balance"),
    cloudflareBillingRequest(env, accountId, token, "invoice-preview"),
  ]);
  if (historyResult.status === "rejected") throw historyResult.reason;
  const normalized = normalizeHistory(historyResult.value?.history);
  return {
    configured: true,
    source: "cloudflare_ai_gateway_billing_api",
    grouping,
    startTime,
    endTime,
    fetchedAt: new Date().toISOString(),
    ...normalized,
    creditBalance: creditResult.status === "fulfilled" ? creditResult.value : null,
    invoicePreview: invoiceResult.status === "fulfilled" ? invoiceResult.value : null,
    partialErrors: [rejectedMessage(creditResult), rejectedMessage(invoiceResult)].filter(Boolean),
  };
}
