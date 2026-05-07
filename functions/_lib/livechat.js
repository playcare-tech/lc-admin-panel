const DEFAULT_LIVECHAT_API_VERSION = "v3.6";

function getBaseUrl(env) {
  const version = env.LIVECHAT_API_VERSION || DEFAULT_LIVECHAT_API_VERSION;
  return `https://api.livechatinc.com/${version}/configuration/action`;
}

function extractErrorMessage(payload, fallback) {
  if (!payload) {
    return fallback;
  }

  if (typeof payload === "string") {
    return payload;
  }

  return payload.error?.message || payload.message || payload.error || fallback;
}

function normalizeGroupId(value) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}

function normalizeAvatarPath(value) {
  if (!value) {
    return "";
  }

  const path = `${value}`;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (path.startsWith("//")) {
    return `https:${path}`;
  }
  return path;
}

export async function livechatRequest(env, action, body = {}) {
  if (!env.TEXT_BASIC_AUTH_B64) {
    throw new Error("Missing TEXT_BASIC_AUTH_B64 environment variable.");
  }

  const response = await fetch(`${getBaseUrl(env)}/${action}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${env.TEXT_BASIC_AUTH_B64}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, `LiveChat ${action} failed.`));
  }

  return payload;
}

export async function getLiveChatDashboard(env) {
  const [agentsPayload, groupsPayload] = await Promise.all([
    livechatRequest(env, "list_agents", {
      fields: ["groups", "suspended"],
    }),
    livechatRequest(env, "list_groups", {}),
  ]);

  const rawGroups = Array.isArray(groupsPayload)
    ? groupsPayload
    : groupsPayload.groups || groupsPayload.data || groupsPayload.items || [];

  const rawAgents = Array.isArray(agentsPayload)
    ? agentsPayload
    : agentsPayload.agents || agentsPayload.data || agentsPayload.items || [];

  const groups = rawGroups
    .map((group) => ({
      id: String(group.id),
      name: group.name,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  const groupNameById = new Map(groups.map((group) => [group.id, group.name]));

  const agents = rawAgents
    .map((agent) => ({
      id: agent.id,
      email: agent.login || agent.email || agent.id,
      name: agent.name || agent.id,
      role: agent.permission || agent.role || "normal",
      jobTitle: agent.job_title || agent.jobTitle || "",
      chatLimit: agent.max_chats_count ?? agent.chat_limit ?? agent.chatLimit ?? "",
      avatar: normalizeAvatarPath(agent.avatar_path || agent.avatar || agent.avatar_url || agent.avatarUrl),
      suspended: Boolean(agent.suspended),
      groups: (agent.groups || agent.group_ids || []).map((group) => ({
        id: String(group.id),
        name: groupNameById.get(String(group.id)) || `Group ${group.id}`,
        priority: ["first", "normal", "last", "supervisor"].includes(group.priority)
          ? group.priority
          : "normal",
      })),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return { agents, groups };
}

export async function getLiveChatAgent(env, agentId) {
  const [agentPayload, groupsPayload] = await Promise.all([
    livechatRequest(env, "get_agent", {
      id: agentId,
      fields: ["groups", "suspended"],
    }),
    livechatRequest(env, "list_groups", {}),
  ]);

  const rawAgent = agentPayload.agent || agentPayload;
  const rawGroups = Array.isArray(groupsPayload)
    ? groupsPayload
    : groupsPayload.groups || groupsPayload.data || groupsPayload.items || [];
  const groupNameById = new Map(rawGroups.map((group) => [String(group.id), group.name]));

  return {
    id: rawAgent.id,
    email: rawAgent.login || rawAgent.email || rawAgent.id,
    name: rawAgent.name || rawAgent.id,
    role: rawAgent.permission || rawAgent.role || "normal",
    jobTitle: rawAgent.job_title || rawAgent.jobTitle || "",
    chatLimit: rawAgent.max_chats_count ?? rawAgent.chat_limit ?? rawAgent.chatLimit ?? "",
    avatar: normalizeAvatarPath(rawAgent.avatar_path || rawAgent.avatar || rawAgent.avatar_url || rawAgent.avatarUrl),
    suspended: Boolean(rawAgent.suspended),
    groups: (rawAgent.groups || []).map((group) => ({
      id: String(group.id),
      name: groupNameById.get(String(group.id)) || `Group ${group.id}`,
      priority: ["first", "normal", "last", "supervisor"].includes(group.priority)
        ? group.priority
        : "normal",
    })),
  };
}

export function buildLiveChatGroups(groupIds, priority) {
  return groupIds.map((groupId) => ({
    id: normalizeGroupId(groupId),
    priority: priority === "last" ? "last" : priority === "first" ? "first" : "normal",
  }));
}

function getReportsBaseUrl(env) {
  const version = env.LIVECHAT_API_VERSION || DEFAULT_LIVECHAT_API_VERSION;
  return `https://api.livechatinc.com/${version}/reports`;
}

function getAgentChatBaseUrl(env) {
  const version = env.LIVECHAT_API_VERSION || DEFAULT_LIVECHAT_API_VERSION;
  return `https://api.livechatinc.com/${version}/agent/action`;
}

export async function livechatReportsRequest(env, path, body = {}) {
  if (!env.TEXT_BASIC_AUTH_B64) {
    throw new Error("Missing TEXT_BASIC_AUTH_B64 environment variable.");
  }

  const response = await fetch(`${getReportsBaseUrl(env)}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${env.TEXT_BASIC_AUTH_B64}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(payload, `LiveChat reports${path} failed.`)
    );
  }

  return payload;
}

export async function livechatAgentChatRequest(env, action, body = {}) {
  if (!env.TEXT_BASIC_AUTH_B64) {
    throw new Error("Missing TEXT_BASIC_AUTH_B64 environment variable.");
  }

  const response = await fetch(`${getAgentChatBaseUrl(env)}/${action}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${env.TEXT_BASIC_AUTH_B64}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(payload, `LiveChat agent ${action} failed.`)
    );
  }

  return payload;
}
