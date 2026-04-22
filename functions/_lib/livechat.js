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
    livechatRequest(env, "list_agents", {}),
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

  const baseAgents = rawAgents
    .map((agent) => ({
      id: agent.id,
      email: agent.id,
      name: agent.name || agent.id,
      role: agent.role || "agent",
      suspended: Boolean(agent.suspended),
      groups: (agent.groups || agent.group_ids || []).map((group) => ({
        id: String(group.id),
        name: groupNameById.get(String(group.id)) || `Group ${group.id}`,
        priority: group.priority === "first" ? "first" : "normal",
      })),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  // Some LiveChat payloads omit full group membership data in list responses.
  // Enrich missing memberships per agent when needed so the UI can still show groups.
  const agents = await Promise.all(
    baseAgents.map(async (agent) => {
      if (agent.groups.length) {
        return agent;
      }

      try {
        const details = await livechatRequest(env, "get_agent", { id: agent.id });
        const detailGroups = details.groups || details.agent?.groups || [];

        return {
          ...agent,
          suspended: Boolean(details.suspended ?? details.agent?.suspended ?? agent.suspended),
          groups: detailGroups.map((group) => ({
            id: String(group.id),
            name: groupNameById.get(String(group.id)) || `Group ${group.id}`,
            priority: group.priority === "first" ? "first" : "normal",
          })),
        };
      } catch {
        return agent;
      }
    }),
  );

  return { agents, groups };
}

export function buildLiveChatGroups(groupIds, priority) {
  return groupIds.map((groupId) => ({
    id: normalizeGroupId(groupId),
    priority: priority === "first" ? "first" : "normal",
  }));
}
