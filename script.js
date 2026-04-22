const state = {
  user: null,
  livechat: { agents: [], groups: [] },
  helpdesk: { agents: [], teams: [] },
  logs: [],
  logsWarning: "",
  livechatSearch: "",
  helpdeskSearch: "",
  livechatGroupSearch: "",
  helpdeskTeamSearch: "",
  openedLiveChatAgentId: null,
  openedHelpDeskAgentId: null,
};

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const statusMessage = document.getElementById("statusMessage");
const sessionBadge = document.getElementById("sessionBadge");
const livechatContent = document.getElementById("livechatContent");
const helpdeskContent = document.getElementById("helpdeskContent");
const logsContent = document.getElementById("logsContent");
const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");

function setMessage(element, message, tone = "info") {
  element.textContent = message || "";
  element.dataset.tone = message ? tone : "";
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }

  return payload;
}

function showApp() {
  loginView.classList.add("d-none");
  appView.classList.remove("d-none");
  sessionBadge.textContent = `Signed in as ${state.user}`;
}

function showLogin() {
  appView.classList.add("d-none");
  loginView.classList.remove("d-none");
  sessionBadge.textContent = "";
}

function escapeHtml(value) {
  return `${value || ""}`
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function selectedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
}

function chipTone(priority) {
  return priority === "first" ? "primary" : "last";
}

function priorityLabel(priority) {
  return priority === "first" ? "Primary" : "Last";
}

function renderGroupChips(groups) {
  if (!groups.length) {
    return '<span class="subtle">No groups</span>';
  }

  return `
    <div class="chip-list">
      ${groups
        .map(
          (group) => `
            <span class="chip ${chipTone(group.priority)}">
              ${escapeHtml(group.name)}
              <span>${priorityLabel(group.priority)}</span>
            </span>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderTeamChips(teams) {
  if (!teams.length) {
    return '<span class="subtle">No teams</span>';
  }

  return `
    <div class="chip-list">
      ${teams
        .map(
          (team) => `
            <span class="chip">
              ${escapeHtml(team.name)}
            </span>
          `,
        )
        .join("")}
    </div>
  `;
}

function filteredLiveChatAgents() {
  const search = state.livechatSearch.trim().toLowerCase();
  if (!search) {
    return state.livechat.agents;
  }

  return state.livechat.agents.filter((agent) => {
    const groupsText = agent.groups.map((group) => `${group.name} ${group.priority}`).join(" ");
    return [agent.email, agent.name, groupsText].join(" ").toLowerCase().includes(search);
  });
}

function filteredHelpDeskAgents() {
  const search = state.helpdeskSearch.trim().toLowerCase();
  if (!search) {
    return state.helpdesk.agents;
  }

  return state.helpdesk.agents.filter((agent) => {
    const teamsText = agent.teams.map((team) => team.name).join(" ");
    return [agent.email, agent.name, teamsText].join(" ").toLowerCase().includes(search);
  });
}

function filteredLiveChatGroups() {
  const search = state.livechatGroupSearch.trim().toLowerCase();
  if (!search) {
    return state.livechat.groups;
  }

  return state.livechat.groups.filter((group) => group.name.toLowerCase().includes(search));
}

function filteredHelpDeskTeams() {
  const search = state.helpdeskTeamSearch.trim().toLowerCase();
  if (!search) {
    return state.helpdesk.teams;
  }

  return state.helpdesk.teams.filter((team) => team.name.toLowerCase().includes(search));
}

function openedLiveChatAgent() {
  return state.livechat.agents.find((agent) => agent.id === state.openedLiveChatAgentId) || null;
}

function openedHelpDeskAgent() {
  return state.helpdesk.agents.find((agent) => agent.id === state.openedHelpDeskAgentId) || null;
}

function renderLiveChatTable(agents) {
  if (!agents.length) {
    return `
      <div class="empty-state">
        No LiveChat agents returned. This usually means the Text credentials do not have access to read all agents, or the credentials point to a different account.
      </div>
    `;
  }

  return `
    <div class="table-responsive">
      <table class="table admin-table">
        <thead>
          <tr>
            <th style="width:36px;"></th>
            <th>Email</th>
            <th>Groups</th>
            <th>Status</th>
            <th style="width:132px;"></th>
          </tr>
        </thead>
        <tbody>
          ${agents
            .map(
              (agent) => `
                <tr>
                  <td><input type="checkbox" class="form-check-input" name="livechat-agent" value="${agent.id}" /></td>
                  <td>${escapeHtml(agent.email)}</td>
                  <td>${renderGroupChips(agent.groups)}</td>
                  <td>${agent.suspended ? '<span class="chip last">Suspended</span>' : '<span class="chip primary">Active</span>'}</td>
                  <td class="text-end">
                    <div class="agent-open">
                      <button class="btn btn-sm btn-outline-secondary" type="button" data-open-livechat-agent="${agent.id}">Open</button>
                      <button class="btn btn-sm btn-outline-danger" type="button" data-livechat-suspend="${agent.id}">Deactivate</button>
                    </div>
                  </td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderHelpDeskTable(agents) {
  if (!agents.length) {
    return '<div class="empty-state">No HelpDesk agents returned.</div>';
  }

  return `
    <div class="table-responsive">
      <table class="table admin-table">
        <thead>
          <tr>
            <th style="width:36px;"></th>
            <th>Email</th>
            <th>Teams</th>
            <th>Status</th>
            <th style="width:132px;"></th>
          </tr>
        </thead>
        <tbody>
          ${agents
            .map(
              (agent) => `
                <tr>
                  <td><input type="checkbox" class="form-check-input" name="helpdesk-agent" value="${agent.id}" /></td>
                  <td>${escapeHtml(agent.email)}</td>
                  <td>${renderTeamChips(agent.teams)}</td>
                  <td><span class="chip">${escapeHtml(agent.status)}</span></td>
                  <td class="text-end">
                    <div class="agent-open">
                      <button class="btn btn-sm btn-outline-secondary" type="button" data-open-helpdesk-agent="${agent.id}">Open</button>
                      <button class="btn btn-sm btn-outline-danger" type="button" data-helpdesk-deactivate="${agent.id}">Deactivate</button>
                    </div>
                  </td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderLiveChatProfile() {
  const agent = openedLiveChatAgent();
  const groups = filteredLiveChatGroups();

  return `
    <div class="detail-card">
      <div class="detail-header">
        <div>
          <div class="section-title mb-0">${agent ? escapeHtml(agent.email) : "Open a LiveChat agent"}</div>
          <div class="subtle">${selectedValues("livechat-agent").length} selected agent(s)</div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-secondary" type="button" id="livechatSelectAllGroupsBtn">All groups</button>
          <button class="btn btn-sm btn-outline-secondary" type="button" id="livechatClearGroupsBtn">Clear groups</button>
        </div>
      </div>

      <div class="detail-grid">
        <div>
          <div class="toolbar-grid">
            <input id="livechatGroupSearchInput" class="form-control" type="search" placeholder="Search groups" value="${escapeHtml(state.livechatGroupSearch)}" />
            <button id="livechatSelectAllAgentsBtn" class="btn btn-outline-secondary" type="button">Select all</button>
            <button id="livechatClearAgentsBtn" class="btn btn-outline-secondary" type="button">Clear selected</button>
            <select id="livechat-bulk-priority" class="form-select">
              <option value="first">Primary</option>
              <option value="normal" selected>Last</option>
            </select>
          </div>

          <div class="checkbox-grid">
            ${groups.length
              ? groups
                  .map(
                    (group) => `
                      <label class="check-pill">
                        <input type="checkbox" name="livechat-group" value="${group.id}" />
                        <span>${escapeHtml(group.name)}</span>
                      </label>
                    `,
                  )
                  .join("")
              : '<div class="empty-state">No groups match the search.</div>'}
          </div>

          <div class="detail-actions">
            <button id="livechatAssignBtn" class="btn btn-primary" type="button">Add groups</button>
            <button id="livechatRemoveBtn" class="btn btn-outline-secondary" type="button">Remove groups</button>
          </div>
        </div>

        <div class="panel">
          <div class="section-title">Current groups</div>
          ${agent ? renderGroupChips(agent.groups) : '<div class="empty-state">Open a LiveChat user to see the profile.</div>'}
          ${
            agent
              ? `
                <div class="subtle mt-2">
                  Group priority follows the LiveChat Configuration API model:
                  <strong>Primary</strong> = <code>first</code>,
                  <strong>Last</strong> = <code>normal</code>.
                </div>
              `
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

function renderHelpDeskProfile() {
  const agent = openedHelpDeskAgent();
  const teams = filteredHelpDeskTeams();

  return `
    <div class="detail-card">
      <div class="detail-header">
        <div>
          <div class="section-title mb-0">${agent ? escapeHtml(agent.email) : "Open a HelpDesk agent"}</div>
          <div class="subtle">${selectedValues("helpdesk-agent").length} selected agent(s)</div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-secondary" type="button" id="helpdeskSelectAllTeamsBtn">All teams</button>
          <button class="btn btn-sm btn-outline-secondary" type="button" id="helpdeskClearTeamsBtn">Clear teams</button>
        </div>
      </div>

      <div class="detail-grid">
        <div>
          <div class="toolbar-grid">
            <input id="helpdeskTeamSearchInput" class="form-control" type="search" placeholder="Search teams" value="${escapeHtml(state.helpdeskTeamSearch)}" />
            <button id="helpdeskSelectAllAgentsBtn" class="btn btn-outline-secondary" type="button">Select all</button>
            <button id="helpdeskClearAgentsBtn" class="btn btn-outline-secondary" type="button">Clear selected</button>
            <div class="subtle d-flex align-items-center px-2">${teams.length} teams</div>
          </div>

          <div class="checkbox-grid">
            ${teams.length
              ? teams
                  .map(
                    (team) => `
                      <label class="check-pill">
                        <input type="checkbox" name="helpdesk-team" value="${team.id}" />
                        <span>${escapeHtml(team.name)}</span>
                      </label>
                    `,
                  )
                  .join("")
              : '<div class="empty-state">No teams match the search.</div>'}
          </div>

          <div class="detail-actions">
            <button id="helpdeskAssignBtn" class="btn btn-primary" type="button">Add teams</button>
            <button id="helpdeskRemoveBtn" class="btn btn-outline-secondary" type="button">Remove teams</button>
          </div>
        </div>

        <div class="panel">
          <div class="section-title">Current teams</div>
          ${agent ? renderTeamChips(agent.teams) : '<div class="empty-state">Open a HelpDesk user to see the profile.</div>'}
        </div>
      </div>
    </div>
  `;
}

function renderLiveChatView() {
  livechatContent.innerHTML = `
    <div class="panel">
      <div class="toolbar-grid">
        <input id="livechatSearchInput" class="form-control" type="search" placeholder="Search LiveChat agents" value="${escapeHtml(state.livechatSearch)}" />
        <button id="livechatToolbarSelectAllBtn" class="btn btn-outline-secondary" type="button">Select all</button>
        <button id="livechatToolbarClearBtn" class="btn btn-outline-secondary" type="button">Clear</button>
        <div class="subtle d-flex align-items-center px-2">${filteredLiveChatAgents().length} agents</div>
      </div>
    </div>

    <div class="table-wrap">
      ${renderLiveChatTable(filteredLiveChatAgents())}
    </div>

    ${renderLiveChatProfile()}
  `;
}

function renderHelpDeskView() {
  helpdeskContent.innerHTML = `
    <div class="panel">
      <div class="toolbar-grid">
        <input id="helpdeskSearchInput" class="form-control" type="search" placeholder="Search HelpDesk agents" value="${escapeHtml(state.helpdeskSearch)}" />
        <button id="helpdeskToolbarSelectAllBtn" class="btn btn-outline-secondary" type="button">Select all</button>
        <button id="helpdeskToolbarClearBtn" class="btn btn-outline-secondary" type="button">Clear</button>
        <div class="subtle d-flex align-items-center px-2">${filteredHelpDeskAgents().length} agents</div>
      </div>
    </div>

    <div class="table-wrap">
      ${renderHelpDeskTable(filteredHelpDeskAgents())}
    </div>

    ${renderHelpDeskProfile()}
  `;
}

function renderLogs() {
  logsContent.innerHTML = `
    <div class="log-card">
      ${
        state.logs.length
          ? state.logs
              .map(
                (entry) => `
                  <div class="log-item">
                    <div class="log-meta">
                      <span class="chip">${escapeHtml(entry.area)}</span>
                      <span class="chip">${escapeHtml(entry.action)}</span>
                      <span class="chip">${escapeHtml(entry.status)}</span>
                      <span class="chip">${new Date(entry.created_at).toLocaleString()}</span>
                    </div>
                    <div>${escapeHtml(entry.target || "")}</div>
                    <div class="subtle">${escapeHtml(entry.details || "")}</div>
                  </div>
                `,
              )
              .join("")
          : `<div class="empty-state">${escapeHtml(state.logsWarning || "No logs available.")}</div>`
      }
    </div>
  `;
}

function renderAll() {
  renderLiveChatView();
  renderHelpDeskView();
  renderLogs();
  bindDynamicActions();
}

async function refreshData() {
  setMessage(statusMessage, "Refreshing...");
  const [livechatResult, helpdeskResult, logsResult] = await Promise.allSettled([
    api("/api/livechat/dashboard"),
    api("/api/helpdesk/dashboard"),
    api("/api/logs"),
  ]);

  if (livechatResult.status === "fulfilled") {
    state.livechat = livechatResult.value;
  }

  if (helpdeskResult.status === "fulfilled") {
    state.helpdesk = helpdeskResult.value;
  }

  if (!state.openedLiveChatAgentId && state.livechat.agents.length) {
    state.openedLiveChatAgentId = state.livechat.agents[0].id;
  }

  if (!state.openedHelpDeskAgentId && state.helpdesk.agents.length) {
    state.openedHelpDeskAgentId = state.helpdesk.agents[0].id;
  }

  if (
    state.openedLiveChatAgentId &&
    !state.livechat.agents.some((agent) => agent.id === state.openedLiveChatAgentId)
  ) {
    state.openedLiveChatAgentId = state.livechat.agents[0]?.id || null;
  }

  if (
    state.openedHelpDeskAgentId &&
    !state.helpdesk.agents.some((agent) => agent.id === state.openedHelpDeskAgentId)
  ) {
    state.openedHelpDeskAgentId = state.helpdesk.agents[0]?.id || null;
  }

  state.logs = logsResult.status === "fulfilled" ? logsResult.value.logs || [] : [];
  state.logsWarning =
    logsResult.status === "fulfilled"
      ? logsResult.value.warning || ""
      : "Logs are temporarily unavailable.";

  renderAll();

  if (livechatResult.status !== "fulfilled" && helpdeskResult.status !== "fulfilled") {
    throw livechatResult.reason || helpdeskResult.reason;
  }

  const warnings = [
    livechatResult.status !== "fulfilled" ? `LiveChat: ${livechatResult.reason.message}` : "",
    helpdeskResult.status !== "fulfilled" ? `HelpDesk: ${helpdeskResult.reason.message}` : "",
    state.logsWarning,
  ].filter(Boolean);

  setMessage(
    statusMessage,
    warnings.length ? `Updated. ${warnings.join(" | ")}` : "Updated.",
    warnings.length ? "info" : "success",
  );
}

async function withBusyState(action, successMessage) {
  try {
    setMessage(statusMessage, "Working...");
    await action();
    await refreshData();
    setMessage(statusMessage, successMessage, "success");
  } catch (error) {
    setMessage(statusMessage, error.message, "error");
  }
}

function toggleCheckboxes(name, checked) {
  document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    input.checked = checked;
  });
}

function bindDynamicActions() {
  document.getElementById("livechatSearchInput")?.addEventListener("input", (event) => {
    state.livechatSearch = event.target.value;
    renderLiveChatView();
    bindDynamicActions();
  });

  document.getElementById("helpdeskSearchInput")?.addEventListener("input", (event) => {
    state.helpdeskSearch = event.target.value;
    renderHelpDeskView();
    bindDynamicActions();
  });

  document.getElementById("livechatGroupSearchInput")?.addEventListener("input", (event) => {
    state.livechatGroupSearch = event.target.value;
    renderLiveChatView();
    bindDynamicActions();
  });

  document.getElementById("helpdeskTeamSearchInput")?.addEventListener("input", (event) => {
    state.helpdeskTeamSearch = event.target.value;
    renderHelpDeskView();
    bindDynamicActions();
  });

  document.getElementById("livechatToolbarSelectAllBtn")?.addEventListener("click", () => {
    toggleCheckboxes("livechat-agent", true);
  });
  document.getElementById("livechatToolbarClearBtn")?.addEventListener("click", () => {
    toggleCheckboxes("livechat-agent", false);
  });
  document.getElementById("livechatSelectAllAgentsBtn")?.addEventListener("click", () => {
    toggleCheckboxes("livechat-agent", true);
  });
  document.getElementById("livechatClearAgentsBtn")?.addEventListener("click", () => {
    toggleCheckboxes("livechat-agent", false);
  });
  document.getElementById("livechatSelectAllGroupsBtn")?.addEventListener("click", () => {
    toggleCheckboxes("livechat-group", true);
  });
  document.getElementById("livechatClearGroupsBtn")?.addEventListener("click", () => {
    toggleCheckboxes("livechat-group", false);
  });

  document.getElementById("helpdeskToolbarSelectAllBtn")?.addEventListener("click", () => {
    toggleCheckboxes("helpdesk-agent", true);
  });
  document.getElementById("helpdeskToolbarClearBtn")?.addEventListener("click", () => {
    toggleCheckboxes("helpdesk-agent", false);
  });
  document.getElementById("helpdeskSelectAllAgentsBtn")?.addEventListener("click", () => {
    toggleCheckboxes("helpdesk-agent", true);
  });
  document.getElementById("helpdeskClearAgentsBtn")?.addEventListener("click", () => {
    toggleCheckboxes("helpdesk-agent", false);
  });
  document.getElementById("helpdeskSelectAllTeamsBtn")?.addEventListener("click", () => {
    toggleCheckboxes("helpdesk-team", true);
  });
  document.getElementById("helpdeskClearTeamsBtn")?.addEventListener("click", () => {
    toggleCheckboxes("helpdesk-team", false);
  });

  document.querySelectorAll("[data-open-livechat-agent]").forEach((button) => {
    button.addEventListener("click", () => {
      state.openedLiveChatAgentId = button.getAttribute("data-open-livechat-agent");
      renderLiveChatView();
      bindDynamicActions();
    });
  });

  document.querySelectorAll("[data-open-helpdesk-agent]").forEach((button) => {
    button.addEventListener("click", () => {
      state.openedHelpDeskAgentId = button.getAttribute("data-open-helpdesk-agent");
      renderHelpDeskView();
      bindDynamicActions();
    });
  });

  document.querySelectorAll("[data-livechat-suspend]").forEach((button) => {
    button.addEventListener("click", async () => {
      const agentId = button.getAttribute("data-livechat-suspend");
      await withBusyState(
        async () => {
          await api("/api/livechat/agents/suspend", {
            method: "POST",
            body: { agentId },
          });
        },
        `LiveChat agent ${agentId} deactivated.`,
      );
    });
  });

  document.querySelectorAll("[data-helpdesk-deactivate]").forEach((button) => {
    button.addEventListener("click", async () => {
      const agentId = button.getAttribute("data-helpdesk-deactivate");
      await withBusyState(
        async () => {
          await api("/api/helpdesk/agents/deactivate", {
            method: "POST",
            body: { agentId },
          });
        },
        `HelpDesk agent ${agentId} deactivated.`,
      );
    });
  });

  document.getElementById("livechatAssignBtn")?.addEventListener("click", async () => {
    await withBusyState(
      async () => {
        await api("/api/livechat/memberships", {
          method: "POST",
          body: {
            agentIds: selectedValues("livechat-agent"),
            groupIds: selectedValues("livechat-group"),
            mode: "assign",
            priority: document.getElementById("livechat-bulk-priority").value,
          },
        });
      },
      "LiveChat groups updated.",
    );
  });

  document.getElementById("livechatRemoveBtn")?.addEventListener("click", async () => {
    await withBusyState(
      async () => {
        await api("/api/livechat/memberships", {
          method: "POST",
          body: {
            agentIds: selectedValues("livechat-agent"),
            groupIds: selectedValues("livechat-group"),
            mode: "remove",
          },
        });
      },
      "LiveChat groups removed.",
    );
  });

  document.getElementById("helpdeskAssignBtn")?.addEventListener("click", async () => {
    await withBusyState(
      async () => {
        await api("/api/helpdesk/memberships", {
          method: "POST",
          body: {
            agentIds: selectedValues("helpdesk-agent"),
            teamIds: selectedValues("helpdesk-team"),
            mode: "assign",
          },
        });
      },
      "HelpDesk teams updated.",
    );
  });

  document.getElementById("helpdeskRemoveBtn")?.addEventListener("click", async () => {
    await withBusyState(
      async () => {
        await api("/api/helpdesk/memberships", {
          method: "POST",
          body: {
            agentIds: selectedValues("helpdesk-agent"),
            teamIds: selectedValues("helpdesk-team"),
            mode: "remove",
          },
        });
      },
      "HelpDesk teams removed.",
    );
  });
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(loginMessage, "Signing in...");

  try {
    const formData = new FormData(loginForm);
    const result = await api("/api/auth/login", {
      method: "POST",
      body: {
        username: `${formData.get("username") || ""}`.trim(),
        password: `${formData.get("password") || ""}`,
      },
    });

    state.user = result.user;
    showApp();
    setMessage(loginMessage, "");
    await refreshData();
  } catch (error) {
    setMessage(loginMessage, error.message, "error");
  }
});

refreshBtn?.addEventListener("click", async () => {
  await withBusyState(async () => refreshData(), "Updated.");
});

logoutBtn?.addEventListener("click", async () => {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } finally {
    state.user = null;
    showLogin();
    setMessage(statusMessage, "");
  }
});

async function bootstrap() {
  try {
    const session = await api("/api/auth/session");
    if (!session.authenticated) {
      showLogin();
      return;
    }

    state.user = session.user;
    showApp();
    await refreshData();
  } catch {
    showLogin();
  }
}

bootstrap();
