const CLOUDFLARE_GRAPHQL_URL = "https://api.cloudflare.com/client/v4/graphql";
const MAX_RANGE_MS = 90 * 24 * 60 * 60 * 1000;

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

function number(value) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function timeRange(options = {}) {
  const now = Date.now();
  const endTime = Math.min(number(options.endTime) || now, now);
  const requestedStart = number(options.startTime) || endTime - 24 * 60 * 60 * 1000;
  return { startTime: Math.max(requestedStart, endTime - MAX_RANGE_MS), endTime };
}

function graphqlError(payload, status) {
  const apiErrors = Array.isArray(payload?.errors) ? payload.errors : [];
  const details = apiErrors.map((error) => {
    const message = text(error?.message);
    const code = text(error?.code || error?.extensions?.code);
    return message ? `${message}${code ? ` (code ${code})` : ""}` : "";
  }).filter(Boolean).join("; ");
  return details || `Cloudflare GraphQL API returned ${status}.`;
}

export async function getCloudflareWorkersAiUsage(env, options = {}) {
  const accountId = text(env.CLOUDFLARE_ACCOUNT_ID);
  const token = apiToken(env.CLOUDFLARE_AI_BILLING_API_TOKEN);
  const grouping = options.grouping === "day" ? "day" : options.grouping === "half_hour" ? "half_hour" : "hour";
  const { startTime, endTime } = timeRange(options);
  if (!accountId || !token) {
    return {
      configured: false,
      source: "cloudflare_graphql_ai_inference",
      message: !accountId ? "Cloudflare account ID is not configured." : "Cloudflare API token is not configured.",
      grouping,
      startTime,
      endTime,
      intervals: [],
      models: [],
    };
  }

  const timeDimension = grouping === "day" ? "date" : grouping === "half_hour" ? "datetimeFifteenMinutes" : "datetimeHour";
  const query = `query WorkersAiUsage($accountTag: string!, $filter: AccountAiInferenceAdaptiveGroupsFilter_InputObject!) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        usage: aiInferenceAdaptiveGroups(limit: 10000, filter: $filter, orderBy: [${timeDimension}_ASC]) {
          count
          dimensions { ${timeDimension} modelId }
          sum { totalNeurons totalInputTokens totalOutputTokens }
        }
      }
    }
  }`;
  const response = await fetch(CLOUDFLARE_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        accountTag: accountId,
        filter: {
          datetime_geq: new Date(startTime).toISOString(),
          datetime_leq: new Date(endTime).toISOString(),
        },
      },
    }),
  });
  const payload = await response.json();
  if (!response.ok || payload?.errors?.length) throw new Error(graphqlError(payload, response.status));

  const rows = payload?.data?.viewer?.accounts?.[0]?.usage || [];
  const intervalMap = new Map();
  const modelMap = new Map();
  const totals = { neurons: 0, inputTokens: 0, outputTokens: 0, requests: 0 };
  for (const row of rows) {
    const dimensions = row?.dimensions || {};
    const sum = row?.sum || {};
    const modelId = text(dimensions.modelId) || "Unknown model";
    const intervalValue = dimensions[timeDimension];
    const rawIntervalStart = new Date(grouping === "day" ? `${intervalValue}T00:00:00.000Z` : intervalValue).getTime();
    if (!Number.isFinite(rawIntervalStart)) continue;
    const intervalSize = grouping === "day" ? 86400000 : grouping === "half_hour" ? 1800000 : 3600000;
    const intervalStart = grouping === "half_hour"
      ? Math.floor(rawIntervalStart / intervalSize) * intervalSize
      : rawIntervalStart;
    const values = {
      neurons: number(sum.totalNeurons),
      inputTokens: number(sum.totalInputTokens),
      outputTokens: number(sum.totalOutputTokens),
      requests: number(row.count),
    };
    for (const key of Object.keys(totals)) totals[key] += values[key];

    const interval = intervalMap.get(intervalStart) || {
      startTime: intervalStart,
      endTime: intervalStart + intervalSize,
      total: 0,
      values: { input_tokens: 0, output_tokens: 0 },
      neurons: 0,
      requests: 0,
    };
    interval.values.input_tokens += values.inputTokens;
    interval.values.output_tokens += values.outputTokens;
    interval.total += values.inputTokens + values.outputTokens;
    interval.neurons += values.neurons;
    interval.requests += values.requests;
    intervalMap.set(intervalStart, interval);

    const model = modelMap.get(modelId) || { id: modelId, neurons: 0, inputTokens: 0, outputTokens: 0, requests: 0 };
    for (const key of Object.keys(values)) model[key] += values[key];
    modelMap.set(modelId, model);
  }

  const intervals = [...intervalMap.values()].sort((left, right) => left.startTime - right.startTime);
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayNeurons = intervals
    .filter((interval) => interval.startTime >= todayStart.getTime())
    .reduce((sum, interval) => sum + number(interval.neurons), 0);
  const configuredLimit = number(env.AI_QA_DAILY_NEURON_LIMIT);

  return {
    configured: true,
    source: "cloudflare_graphql_ai_inference",
    grouping,
    startTime,
    endTime,
    fetchedAt: new Date().toISOString(),
    totals,
    todayNeurons,
    dailyLimit: configuredLimit > 0 ? configuredLimit : 10000,
    meters: [
      { id: "input_tokens", type: "input_tokens", total: totals.inputTokens },
      { id: "output_tokens", type: "output_tokens", total: totals.outputTokens },
    ],
    intervals,
    models: [...modelMap.values()].sort((left, right) => right.neurons - left.neurons),
  };
}
