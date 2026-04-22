const state = {
  user: null,
  livechat: { agents: [], groups: [] },
  helpdesk: { agents: [], teams: [] },
  logs: [],
  logsWarning: "",
  livechatSearch: "",
  helpdeskSearch: "",
  livechatBulkGroupSearch: "",
  helpdeskBulkTeamSearch: "",
  modal: null,
  modalType: null,
  modalAgentId: null,
  modalSearch: "",
  modalAgent: null,
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

function ensureSelection(values, label) {
  if (!values.length) {
    throw new Error(`Select at least one ${label}.`);
  }
}

function priorityLabel(priority) {
  return priority === "first" ? "Primary" : "Last";
}

function chipTone(priority) {
  return priority === "first" ? "primary" : "last";
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
            <span class="chip">${escapeHtml(team.name)}</span>
          `,
        )
        .join("")}
    </div>
  `;
}

function toggleCheckboxes(name, checked) {
  document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    input.checked = checked;
  });
}

function visibleCheckboxes(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]`));
}

function filteredLiveChatAgents() {
  const search = state.livechatSearch.trim().toLowerCase();
  if (!search) {
    return state.livechat.agents;
  }

  return state.livechat.agents.filter((agent) => {
    const groupsText = agent.groups.map((group) => `${group.name} ${group.priority}`).join(" ");
    return `${agent.email} ${groupsText}`.toLowerCase().includes(search);
  });
}

function filteredHelpDeskAgents() {
  const search = state.helpdeskSearch.trim().toLowerCase();
  if (!search) {
    return state.helpdesk.agents;
  }

  return state.helpdesk.agents.filter((agent) => {
    const teamText = agent.teams.map((team) => team.name).join(" ");
    return `${agent.email} ${teamText}`.toLowerCase().includes(search);
  });
}

function filteredLiveChatGroups() {
  const search = state.livechatBulkGroupSearch.trim().toLowerCase();
  if (!search) {
    return state.livechat.groups;
  }

  return state.livechat.groups.filter((group) => group.name.toLowerCase().includes(search));
}

function filteredHelpDeskTeams() {
  const search = state.helpdeskBulkTeamSearch.trim().toLowerCase();
  if (!search) {
    return state.helpdesk.teams;
  }

  return state.helpdesk.teams.filter((team) => team.name.toLowerCase().includes(search));
}

function renderLiveChatBulkEditor() {
  const groups = filteredLiveChatGroups();

  return `
    <div class="panel">
      <div class="section-title">Change groups</div>
      <div class="toolbar-grid">
        <input id="livechatBulkGroupSearchInput" class="form-control" type="search" placeholder="Search groups" value="${escapeHtml(state.livechatBulkGroupSearch)}" />
        <button id="livechatSelectAllAgentsBtn" class="btn btn-outline-secondary" type="button">Select all agents</button>
        <button id="livechatClearAgentsBtn" class="btn btn-outline-secondary" type="button">Clear agents</button>
        <select id="livechat-bulk-priority" class="form-select">
          <option value="first">Primary</option>
          <option value="normal" selected>Last</option>
        </select>
      </div>
      <div class="detail-actions mt-2">
        <button id="livechatSelectAllGroupsBtn" class="btn btn-outline-secondary" type="button">Select all groups</button>
        <button id="livechatClearGroupsBtn" class="btn btn-outline-secondary" type="button">Clear groups</button>
        <button id="livechatAssignBtn" class="btn btn-primary" type="button">Add groups</button>
        <button id="livechatRemoveBtn" class="btn btn-outline-secondary" type="button">Remove groups</button>
      </div>
      <div class="checkbox-grid">
        ${
          groups.length
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
            : '<div class="empty-state">No groups match the search.</div>'
        }
      </div>
    </div>
  `;
}

function renderHelpDeskBulkEditor() {
  const teams = filteredHelpDeskTeams();

  return `
    <div class="panel">
      <div class="section-title">Change teams</div>
      <div class="toolbar-grid">
        <input id="helpdeskBulkTeamSearchInput" class="form-control" type="search" placeholder="Search teams" value="${escapeHtml(state.helpdeskBulkTeamSearch)}" />
        <button id="helpdeskSelectAllAgentsBtn" class="btn btn-outline-secondary" type="button">Select all agents</button>
        <button id="helpdeskClearAgentsBtn" class="btn btn-outline-secondary" type="button">Clear agents</button>
        <div class="subtle d-flex align-items-center px-2">${teams.length} teams</div>
      </div>
      <div class="detail-actions mt-2">
        <button id="helpdeskSelectAllTeamsBtn" class="btn btn-outline-secondary" type="button">Select all teams</button>
        <button id="helpdeskClearTeamsBtn" class="btn btn-outline-secondary" type="button">Clear teams</button>
        <button id="helpdeskAssignBtn" class="btn btn-primary" type="button">Add teams</button>
        <button id="helpdeskRemoveBtn" class="btn btn-outline-secondary" type="button">Remove teams</button>
      </div>
      <div class="checkbox-grid">
        ${
          teams.length
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
            : '<div class="empty-state">No teams match the search.</div>'
        }
      </div>
    </div>
  `;
}

function renderLiveChatTable() {
  const agents = filteredLiveChatAgents();
  if (!agents.length) {
    return `
      <div class="table-wrap">
        <div class="empty-state">
          No LiveChat agents returned. This usually means the Text credentials do not have access to read all agents, or the credentials point to a different account.
        </div>
      </div>
    `;
  }

  return `
    <div class="table-wrap">
      <div class="toolbar-grid mb-2">
        <input id="livechatSearchInput" class="form-control" type="search" placeholder="Search LiveChat agents" value="${escapeHtml(state.livechatSearch)}" />
        <button id="livechatToolbarSelectAllBtn" class="btn btn-outline-secondary" type="button">Select all</button>
        <button id="livechatToolbarClearBtn" class="btn btn-outline-secondary" type="button">Clear</button>
        <div class="subtle d-flex align-items-center px-2">${agents.length} agents</div>
      </div>
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
    </div>
  `;
}

function renderHelpDeskTable() {
  const agents = filteredHelpDeskAgents();
  if (!agents.length) {
    return `
      <div class="table-wrap">
        <div class="empty-state">No HelpDesk agents returned.</div>
      </div>
    `;
  }

  return `
    <div class="table-wrap">
      <div class="toolbar-grid mb-2">
        <input id="helpdeskSearchInput" class="form-control" type="search" placeholder="Search HelpDesk agents" value="${escapeHtml(state.helpdeskSearch)}" />
        <button id="helpdeskToolbarSelectAllBtn" class="btn btn-outline-secondary" type="button">Select all</button>
        <button id="helpdeskToolbarClearBtn" class="btn btn-outline-secondary" type="button">Clear</button>
        <div class="subtle d-flex align-items-center px-2">${agents.length} agents</div>
      </div>
      <div class="table-responsive">
        <table class="table admin-table">
          <thead>
            <tr>
              <th style="width:36px;"></th>
              <th>Email</th>
              <th>Teams count</th>
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
                    <td>${agent.teams.length}</td>
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
    </div>
  `;
}

function renderLiveChatView() {
  livechatContent.innerHTML = `${renderLiveChatBulkEditor()}${renderLiveChatTable()}`;
}

function renderHelpDeskView() {
  helpdeskContent.innerHTML = `${renderHelpDeskBulkEditor()}${renderHelpDeskTable()}`;
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

function ensureModal() {
  if (state.modal) {
    return state.modal;
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div class="modal fade" id="agentProfileModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="agentProfileModalTitle">Profile</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" id="agentProfileModalBody"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper.firstElementChild);
  const BootstrapModal = window.bootstrap?.Modal;
  if (!BootstrapModal) {
    throw new Error("Bootstrap modal is not available.");
  }
  state.modal = new BootstrapModal(document.getElementById("agentProfileModal"));
  return state.modal;
}

function getModalAgent() {
  if (state.modalAgent) {
    return state.modalAgent;
  }
  if (state.modalType === "livechat") {
    return state.livechat.agents.find((agent) => agent.id === state.modalAgentId) || null;
  }
  if (state.modalType === "helpdesk") {
    return state.helpdesk.agents.find((agent) => agent.id === state.modalAgentId) || null;
  }
  return null;
}

function getModalItems() {
  const search = state.modalSearch.trim().toLowerCase();
  const source = state.modalType === "livechat" ? state.livechat.groups : state.helpdesk.teams;
  if (!search) {
    return source;
  }
  return source.filter((item) => item.name.toLowerCase().includes(search));
}

function renderModalContent() {
  const title = document.getElementById("agentProfileModalTitle");
  const body = document.getElementById("agentProfileModalBody");
  const agent = getModalAgent();
  const items = getModalItems();

  if (!agent) {
    title.textContent = "Profile";
    body.innerHTML = '<div class="empty-state">Agent not found.</div>';
    return;
  }

  if (state.modalType === "livechat") {
    const selectedMap = new Map(agent.groups.map((group) => [String(group.id), group.priority]));
    title.textContent = agent.email;
    body.innerHTML = `
      <div class="panel">
        <div class="section-title">Current groups</div>
        ${renderGroupChips(agent.groups)}
      </div>
      <div class="panel mt-2">
        <div class="toolbar-grid">
          <input id="modalSearchInput" class="form-control" type="search" placeholder="Search groups" value="${escapeHtml(state.modalSearch)}" />
          <button id="modalSelectAllBtn" class="btn btn-outline-secondary" type="button">Select all shown</button>
          <button id="modalClearBtn" class="btn btn-outline-secondary" type="button">Clear shown</button>
          <select id="modalPrioritySelect" class="form-select">
            <option value="first">Primary</option>
            <option value="normal" selected>Last</option>
          </select>
        </div>
        <div class="checkbox-grid mt-2">
          ${items
            .map(
              (group) => `
                <label class="check-pill">
                  <input type="checkbox" name="modal-livechat-group" value="${group.id}" ${selectedMap.has(String(group.id)) ? "checked" : ""} />
                  <span>${escapeHtml(group.name)}</span>
                </label>
              `,
            )
            .join("")}
        </div>
        <div class="detail-actions">
          <button id="saveLiveChatProfileBtn" class="btn btn-primary" type="button">Save groups</button>
        </div>
      </div>
    `;
  } else {
    const selected = new Set(agent.teams.map((team) => String(team.id)));
    title.textContent = agent.email;
    body.innerHTML = `
      <div class="panel">
        <div class="section-title">Current teams</div>
        ${renderTeamChips(agent.teams)}
      </div>
      <div class="panel mt-2">
        <div class="toolbar-grid">
          <input id="modalSearchInput" class="form-control" type="search" placeholder="Search teams" value="${escapeHtml(state.modalSearch)}" />
          <button id="modalSelectAllBtn" class="btn btn-outline-secondary" type="button">Select all shown</button>
          <button id="modalClearBtn" class="btn btn-outline-secondary" type="button">Clear shown</button>
          <div class="subtle d-flex align-items-center px-2">${items.length} teams</div>
        </div>
        <div class="checkbox-grid mt-2">
          ${items
            .map(
              (team) => `
                <label class="check-pill">
                  <input type="checkbox" name="modal-helpdesk-team" value="${team.id}" ${selected.has(String(team.id)) ? "checked" : ""} />
                  <span>${escapeHtml(team.name)}</span>
                </label>
              `,
            )
            .join("")}
        </div>
        <div class="detail-actions">
          <button id="saveHelpDeskProfileBtn" class="btn btn-primary" type="button">Save teams</button>
        </div>
      </div>
    `;
  }

  bindModalActions();
}

function openAgentModal(type, agentId) {
  state.modalType = type;
  state.modalAgentId = agentId;
  state.modalSearch = "";
  state.modalAgent = null;
  ensureModal();

  if (type === "livechat") {
    api(`/api/livechat/agent?id=${encodeURIComponent(agentId)}`)
      .then((result) => {
        state.modalAgent = result.agent;
        renderModalContent();
        state.modal.show();
      })
      .catch((error) => {
        setMessage(statusMessage, error.message, "error");
      });
    return;
  }

  renderModalContent();
  state.modal.show();
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
  state.logs = logsResult.status === "fulfilled" ? logsResult.value.logs || [] : [];
  state.logsWarning =
    logsResult.status === "fulfilled"
      ? logsResult.value.warning || ""
      : "Logs are temporarily unavailable.";

  renderAll();

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

function rerenderSection(section, preserveId) {
  const scrollY = window.scrollY;
  const value = preserveId ? document.getElementById(preserveId)?.value || "" : "";

  if (section === "livechat") {
    renderLiveChatView();
  } else if (section === "helpdesk") {
    renderHelpDeskView();
  }
  bindDynamicActions();

  if (preserveId) {
    const input = document.getElementById(preserveId);
    if (input) {
      input.value = value;
      input.focus();
      input.setSelectionRange(value.length, value.length);
    }
  }
  window.scrollTo(0, scrollY);
}

function bindDynamicActions() {
  document.getElementById("livechatSearchInput")?.addEventListener("input", (event) => {
    state.livechatSearch = event.target.value;
    rerenderSection("livechat", "livechatSearchInput");
  });

  document.getElementById("helpdeskSearchInput")?.addEventListener("input", (event) => {
    state.helpdeskSearch = event.target.value;
    rerenderSection("helpdesk", "helpdeskSearchInput");
  });

  document.getElementById("livechatBulkGroupSearchInput")?.addEventListener("input", (event) => {
    state.livechatBulkGroupSearch = event.target.value;
    rerenderSection("livechat", "livechatBulkGroupSearchInput");
  });

  document.getElementById("helpdeskBulkTeamSearchInput")?.addEventListener("input", (event) => {
    state.helpdeskBulkTeamSearch = event.target.value;
    rerenderSection("helpdesk", "helpdeskBulkTeamSearchInput");
  });

  document.getElementById("livechatToolbarSelectAllBtn")?.addEventListener("click", () => toggleCheckboxes("livechat-agent", true));
  document.getElementById("livechatToolbarClearBtn")?.addEventListener("click", () => toggleCheckboxes("livechat-agent", false));
  document.getElementById("livechatSelectAllAgentsBtn")?.addEventListener("click", () => toggleCheckboxes("livechat-agent", true));
  document.getElementById("livechatClearAgentsBtn")?.addEventListener("click", () => toggleCheckboxes("livechat-agent", false));
  document.getElementById("helpdeskToolbarSelectAllBtn")?.addEventListener("click", () => toggleCheckboxes("helpdesk-agent", true));
  document.getElementById("helpdeskToolbarClearBtn")?.addEventListener("click", () => toggleCheckboxes("helpdesk-agent", false));
  document.getElementById("helpdeskSelectAllAgentsBtn")?.addEventListener("click", () => toggleCheckboxes("helpdesk-agent", true));
  document.getElementById("helpdeskClearAgentsBtn")?.addEventListener("click", () => toggleCheckboxes("helpdesk-agent", false));

  document.getElementById("livechatSelectAllGroupsBtn")?.addEventListener("click", () => {
    visibleCheckboxes("livechat-group").forEach((input) => {
      input.checked = true;
    });
  });
  document.getElementById("livechatClearGroupsBtn")?.addEventListener("click", () => {
    visibleCheckboxes("livechat-group").forEach((input) => {
      input.checked = false;
    });
  });
  document.getElementById("helpdeskSelectAllTeamsBtn")?.addEventListener("click", () => {
    visibleCheckboxes("helpdesk-team").forEach((input) => {
      input.checked = true;
    });
  });
  document.getElementById("helpdeskClearTeamsBtn")?.addEventListener("click", () => {
    visibleCheckboxes("helpdesk-team").forEach((input) => {
      input.checked = false;
    });
  });

  document.querySelectorAll("[data-open-livechat-agent]").forEach((button) => {
    button.addEventListener("click", () => openAgentModal("livechat", button.getAttribute("data-open-livechat-agent")));
  });
  document.querySelectorAll("[data-open-helpdesk-agent]").forEach((button) => {
    button.addEventListener("click", () => openAgentModal("helpdesk", button.getAttribute("data-open-helpdesk-agent")));
  });

  document.querySelectorAll("[data-livechat-suspend]").forEach((button) => {
    button.addEventListener("click", async () => {
      const agentId = button.getAttribute("data-livechat-suspend");
      await withBusyState(
        async () => {
          await api("/api/livechat/agents/suspend", { method: "POST", body: { agentId } });
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
          await api("/api/helpdesk/agents/deactivate", { method: "POST", body: { agentId } });
        },
        `HelpDesk agent ${agentId} deactivated.`,
      );
    });
  });

  document.getElementById("livechatAssignBtn")?.addEventListener("click", async () => {
    await withBusyState(
      async () => {
        const agentIds = selectedValues("livechat-agent");
        const groupIds = selectedValues("livechat-group");
        ensureSelection(agentIds, "agent");
        ensureSelection(groupIds, "group");
        await api("/api/livechat/memberships", {
          method: "POST",
          body: {
            agentIds,
            groupIds,
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
        const agentIds = selectedValues("livechat-agent");
        const groupIds = selectedValues("livechat-group");
        ensureSelection(agentIds, "agent");
        ensureSelection(groupIds, "group");
        await api("/api/livechat/memberships", {
          method: "POST",
          body: {
            agentIds,
            groupIds,
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
        const agentIds = selectedValues("helpdesk-agent");
        const teamIds = selectedValues("helpdesk-team");
        ensureSelection(agentIds, "agent");
        ensureSelection(teamIds, "team");
        await api("/api/helpdesk/memberships", {
          method: "POST",
          body: {
            agentIds,
            teamIds,
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
        const agentIds = selectedValues("helpdesk-agent");
        const teamIds = selectedValues("helpdesk-team");
        ensureSelection(agentIds, "agent");
        ensureSelection(teamIds, "team");
        await api("/api/helpdesk/memberships", {
          method: "POST",
          body: {
            agentIds,
            teamIds,
            mode: "remove",
          },
        });
      },
      "HelpDesk teams removed.",
    );
  });
}

function bindModalActions() {
  document.getElementById("modalSearchInput")?.addEventListener("input", (event) => {
    state.modalSearch = event.target.value;
    renderModalContent();
  });

  document.getElementById("modalSelectAllBtn")?.addEventListener("click", () => {
    const name = state.modalType === "livechat" ? "modal-livechat-group" : "modal-helpdesk-team";
    visibleCheckboxes(name).forEach((input) => {
      input.checked = true;
    });
  });

  document.getElementById("modalClearBtn")?.addEventListener("click", () => {
    const name = state.modalType === "livechat" ? "modal-livechat-group" : "modal-helpdesk-team";
    visibleCheckboxes(name).forEach((input) => {
      input.checked = false;
    });
  });

  document.getElementById("saveLiveChatProfileBtn")?.addEventListener("click", async () => {
    const groupIds = selectedValues("modal-livechat-group");
    const priority = document.getElementById("modalPrioritySelect").value;
    await withBusyState(
      async () => {
        ensureSelection(groupIds, "group");
        await api("/api/livechat/memberships", {
          method: "POST",
          body: {
            agentIds: [state.modalAgentId],
            groupIds,
            mode: "assign",
            priority,
          },
        });
      },
      "LiveChat profile updated.",
    );
    state.modal.hide();
  });

  document.getElementById("saveHelpDeskProfileBtn")?.addEventListener("click", async () => {
    const agent = getModalAgent();
    const selectedTeamIds = selectedValues("modal-helpdesk-team");
    const currentIds = new Set(agent.teams.map((team) => String(team.id)));
    const selectedIds = new Set(selectedTeamIds.map(String));

    const toAssign = selectedTeamIds.filter((id) => !currentIds.has(String(id)));
    const toRemove = Array.from(currentIds).filter((id) => !selectedIds.has(String(id)));

    await withBusyState(
      async () => {
        if (toAssign.length) {
          await api("/api/helpdesk/memberships", {
            method: "POST",
            body: {
              agentIds: [state.modalAgentId],
              teamIds: toAssign,
              mode: "assign",
            },
          });
        }
        if (toRemove.length) {
          await api("/api/helpdesk/memberships", {
            method: "POST",
            body: {
              agentIds: [state.modalAgentId],
              teamIds: toRemove,
              mode: "remove",
            },
          });
        }
      },
      "HelpDesk profile updated.",
    );
    state.modal.hide();
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
