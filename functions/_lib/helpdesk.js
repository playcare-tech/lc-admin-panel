function getAuthHeader(env) {
  if (!env.TEXT_BASIC_AUTH_B64) {
    throw new Error("Missing TEXT_BASIC_AUTH_B64 environment variable.");
  }

  return `Basic ${env.TEXT_BASIC_AUTH_B64}`;
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

export async function helpdeskRequest(env, path, options = {}) {
  const response = await fetch(`https://api.helpdesk.com/v1${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: getAuthHeader(env),
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, `HelpDesk ${path} failed.`));
  }

  return payload;
}

export async function getHelpDeskDashboard(env) {
  const [agents, teams] = await Promise.all([
    helpdeskRequest(env, "/agents"),
    helpdeskRequest(env, "/teams"),
  ]);

  const teamNameById = new Map((teams || []).map((team) => [team.ID, team.name]));

  return {
    agents: (agents || [])
      .map((agent) => ({
        id: agent.ID,
        email: agent.email,
        name: agent.name || agent.email,
        status: agent.status || "unknown",
        roles: agent.roles || [],
        teamIDs: agent.teamIDs || [],
        teams: (agent.teamIDs || []).map((teamId) => ({
          id: teamId,
          name: teamNameById.get(teamId) || "Unknown team",
        })),
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    teams: (teams || [])
      .map((team) => ({
        id: team.ID,
        name: team.name,
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
  };
}
