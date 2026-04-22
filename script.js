const state = {
  user: null,
  livechat: { agents: [], groups: [] },
  logs: [],
  logsWarning: "",
  agentSearch: "",
  groupSearch: "",
  openedAgentId: null,
};

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const statusMessage = document.getElementById("statusMessage");
const sessionBadge = document.getElementById("sessionBadge");
const livechatContent = document.getElementById("livechatContent");
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
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function chipTone(priority) {
  return priority === "first" ? "primary" : "last";
}

function priorityLabel(priority) {
  return priority === "first" ? "Primary" : "Last";
}

function selectedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
}

function filteredAgents() {
  const search = state.agentSearch.trim().toLowerCase();
  if (!search) {
    return state.livechat.agents;
  }

  return state.livechat.agents.filter((agent) => {
    const groupsText = agent.groups.map((group) => `${group.name} ${group.priority}`).join(" ");
    return [agent.email, agent.name, groupsText].join(" ").toLowerCase().includes(search);
  });
}

function filteredGroups() {
  const search = state.groupSearch.trim().toLowerCase();
  if (!search) {
    return state.livechat.groups;
  }

  return state.livechat.groups.filter((group) => group.name.toLowerCase().includes(search));
}

function openedAgent() {
  return state.livechat.agents.find((agent) => agent.id === state.openedAgentId) || null;
}

function renderGroupsSummary(groups) {
  if (!groups.length) {
    return '<span class="subtle">No groups</span>';
  }

  return `
    <div class="chip-list">
      ${groups
        .map(
          (group) => `
            <span class="chip ${chipTone(group.priority)}">
              ${group.name}
              <span>${priorityLabel(group.priority)}</span>
            </span>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderAgentsTable(agents) {
  if (!agents.length) {
    return `
      <div class="empty-state">
        No agents returned by the LiveChat API.
        Check that your Text credentials belong to the correct account and have permission to read all agents.
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
            <th style="width:130px;"></th>
          </tr>
        </thead>
        <tbody>
          ${agents
            .map(
              (agent) => `
                <tr>
                  <td><input type="checkbox" class="form-check-input" name="livechat-agent" value="${agent.id}" /></td>
                  <td>
                    <div>${agent.email}</div>
                  </td>
                  <td>${renderGroupsSummary(agent.groups)}</td>
                  <td>${agent.suspended ? '<span class="chip last">Suspended</span>' : '<span class="chip primary">Active</span>'}</td>
                  <td class="text-end">
                    <div class="agent-open">
                      <button class="btn btn-sm btn-outline-secondary" type="button" data-open-agent="${agent.id}">
                        Open
                      </button>
                      <button class="btn btn-sm btn-outline-danger" type="button" data-livechat-suspend="${agent.id}">
                        Deactivate
                      </button>
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

function renderDetailPanel() {
  const agent = openedAgent();
  const selectedAgentIds = selectedValues("livechat-agent");
  const groups = filteredGroups();

  return `
    <div class="detail-card">
      <div class="detail-header">
        <div>
          <div class="section-title mb-0">${agent ? escapeHtml(agent.email) : "Open an agent"}</div>
          <div class="subtle">
            ${selectedAgentIds.length} selected agent(s) for bulk group updates
          </div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-secondary" type="button" id="selectAllGroupsBtn">All groups</button>
          <button class="btn btn-sm btn-outline-secondary" type="button" id="clearGroupsBtn">Clear groups</button>
        </div>
      </div>

      <div class="detail-grid">
        <div>
          <div class="toolbar-grid">
            <input id="groupSearchInput" class="form-control" type="search" placeholder="Search groups" value="${escapeHtml(state.groupSearch)}" />
            <button id="selectAllAgentsBtn" class="btn btn-outline-secondary" type="button">Select all agents</button>
            <button id="clearAgentsBtn" class="btn btn-outline-secondary" type="button">Clear selected</button>
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
              : '<div class="empty-state">No groups match this search.</div>'}
          </div>

          <div class="detail-actions">
            <button id="livechatAssignBtn" class="btn btn-primary" type="button">Add groups</button>
            <button id="livechatRemoveBtn" class="btn btn-outline-secondary" type="button">Remove groups</button>
          </div>
        </div>

        <div class="panel">
          <div class="section-title">Current groups</div>
          ${agent ? renderGroupsSummary(agent.groups) : '<div class="empty-state">Use Open in the table to inspect one agent.</div>'}
        </div>
      </div>
    </div>
  `;
}

function renderAgentsView() {
  const agents = filteredAgents();

  livechatContent.innerHTML = `
    <div class="panel">
      <div class="toolbar-grid">
        <input id="agentSearchInput" class="form-control" type="search" placeholder="Search agents" value="${escapeHtml(state.agentSearch)}" />
        <button id="toolbarSelectAllBtn" class="btn btn-outline-secondary" type="button">Select all</button>
        <button id="toolbarClearBtn" class="btn btn-outline-secondary" type="button">Clear</button>
        <div class="subtle d-flex align-items-center px-2">${agents.length} agents</div>
      </div>
    </div>

    <div class="table-wrap">
      ${renderAgentsTable(agents)}
    </div>

    ${renderDetailPanel()}
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
                      <span class="chip">${entry.area}</span>
                      <span class="chip">${entry.action}</span>
                      <span class="chip">${entry.status}</span>
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
  renderAgentsView();
  renderLogs();
  bindDynamicActions();
}

async function refreshData() {
  setMessage(statusMessage, "Refreshing...");
  const [livechatResult, logsResult] = await Promise.allSettled([
    api("/api/livechat/dashboard"),
    api("/api/logs"),
  ]);

  if (livechatResult.status !== "fulfilled") {
    throw livechatResult.reason;
  }

  state.livechat = livechatResult.value;

  if (!state.openedAgentId && state.livechat.agents.length) {
    state.openedAgentId = state.livechat.agents[0].id;
  }

  if (
    state.openedAgentId &&
    !state.livechat.agents.some((agent) => agent.id === state.openedAgentId)
  ) {
    state.openedAgentId = state.livechat.agents[0]?.id || null;
  }

  state.logs = logsResult.status === "fulfilled" ? logsResult.value.logs || [] : [];
  state.logsWarning =
    logsResult.status === "fulfilled"
      ? logsResult.value.warning || ""
      : "Logs are temporarily unavailable.";

  renderAll();
  setMessage(
    statusMessage,
    state.logsWarning ? `Updated. ${state.logsWarning}` : "Updated.",
    state.logsWarning ? "info" : "success",
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

function bindDynamicActions() {
  document.getElementById("agentSearchInput")?.addEventListener("input", (event) => {
    state.agentSearch = event.target.value;
    renderAgentsView();
    bindDynamicActions();
  });

  document.getElementById("groupSearchInput")?.addEventListener("input", (event) => {
    state.groupSearch = event.target.value;
    renderAgentsView();
    bindDynamicActions();
  });

  document.getElementById("toolbarSelectAllBtn")?.addEventListener("click", () => {
    document.querySelectorAll('input[name="livechat-agent"]').forEach((input) => {
      input.checked = true;
    });
  });

  document.getElementById("toolbarClearBtn")?.addEventListener("click", () => {
    document.querySelectorAll('input[name="livechat-agent"]').forEach((input) => {
      input.checked = false;
    });
  });

  document.getElementById("selectAllAgentsBtn")?.addEventListener("click", () => {
    document.querySelectorAll('input[name="livechat-agent"]').forEach((input) => {
      input.checked = true;
    });
  });

  document.getElementById("clearAgentsBtn")?.addEventListener("click", () => {
    document.querySelectorAll('input[name="livechat-agent"]').forEach((input) => {
      input.checked = false;
    });
  });

  document.getElementById("selectAllGroupsBtn")?.addEventListener("click", () => {
    document.querySelectorAll('input[name="livechat-group"]').forEach((input) => {
      input.checked = true;
    });
  });

  document.getElementById("clearGroupsBtn")?.addEventListener("click", () => {
    document.querySelectorAll('input[name="livechat-group"]').forEach((input) => {
      input.checked = false;
    });
  });

  document.querySelectorAll("[data-open-agent]").forEach((button) => {
    button.addEventListener("click", () => {
      state.openedAgentId = button.getAttribute("data-open-agent");
      renderAgentsView();
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
        `Agent ${agentId} deactivated.`,
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
      "Groups added.",
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
      "Groups removed.",
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
