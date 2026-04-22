const state = {
  user: null,
  livechat: { agents: [], groups: [] },
  helpdesk: { agents: [], teams: [] },
  logs: [],
};

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const statusMessage = document.getElementById("statusMessage");
const sessionBadge = document.getElementById("sessionBadge");
const metricRow = document.getElementById("metricRow");
const livechatContent = document.getElementById("livechatContent");
const helpdeskContent = document.getElementById("helpdeskContent");
const logsContent = document.getElementById("logsContent");

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

function badgeTone(priority) {
  if (priority === "first") {
    return "text-bg-primary";
  }

  if (priority === "last") {
    return "text-bg-dark";
  }

  return "text-bg-secondary";
}

function renderMetrics() {
  const livechatSuspended = state.livechat.agents.filter((agent) => agent.suspended).length;
  const helpdeskInvited = state.helpdesk.agents.filter((agent) => agent.status === "invited").length;
  const cards = [
    {
      label: "LiveChat agents",
      value: state.livechat.agents.length,
      meta: `${state.livechat.groups.length} groups configured`,
      icon: "bi-people",
    },
    {
      label: "LiveChat suspended",
      value: livechatSuspended,
      meta: "ready for reactivation outside this tool",
      icon: "bi-pause-circle",
    },
    {
      label: "HelpDesk agents",
      value: state.helpdesk.agents.length,
      meta: `${state.helpdesk.teams.length} teams configured`,
      icon: "bi-life-preserver",
    },
    {
      label: "Recent log rows",
      value: state.logs.length,
      meta: `${helpdeskInvited} invited HelpDesk accounts`,
      icon: "bi-journal-text",
    },
  ];

  metricRow.innerHTML = cards
    .map(
      (card) => `
        <div class="col-12 col-md-6 col-xl-3">
          <div class="glass-card metric-card p-3 h-100">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="metric-label">${card.label}</div>
                <div class="metric-value">${card.value}</div>
                <div class="metric-meta">${card.meta}</div>
              </div>
              <span class="metric-icon"><i class="bi ${card.icon}"></i></span>
            </div>
          </div>
        </div>
      `,
    )
    .join("");
}

function renderOptionPills(items, name, emptyText) {
  if (!items.length) {
    return `<div class="empty-state">${emptyText}</div>`;
  }

  return `
    <div class="pill-grid">
      ${items
        .map(
          (item) => `
            <label class="selector-pill">
              <input type="checkbox" name="${name}" value="${item.id}" />
              <span>${item.name}</span>
            </label>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderAgentRows(agents, checkboxName, type) {
  if (!agents.length) {
    return `<tr><td colspan="4" class="text-center py-4 muted-copy">No agents found.</td></tr>`;
  }

  return agents
    .map((agent) => {
      const memberships =
        type === "livechat"
          ? agent.groups
              .map(
                (group) => `
                  <span class="badge ${badgeTone(group.priority)} me-1 mb-1">
                    ${group.name} · ${group.priority}
                  </span>
                `,
              )
              .join("")
          : agent.teams
              .map(
                (team) => `
                  <span class="badge text-bg-secondary me-1 mb-1">${team.name}</span>
                `,
              )
              .join("");

      const status =
        type === "livechat"
          ? agent.suspended
            ? "Suspended"
            : "Active"
          : agent.status;

      return `
        <tr>
          <td class="align-middle">
            <input type="checkbox" class="form-check-input" name="${checkboxName}" value="${agent.id}" />
          </td>
          <td class="align-middle">
            <div class="fw-semibold">${agent.name}</div>
            <div class="small text-secondary">${agent.email || agent.id}</div>
          </td>
          <td class="align-middle">
            <span class="badge ${status === "Active" || status === "active" ? "text-bg-success" : "text-bg-warning"}">
              ${status}
            </span>
          </td>
          <td class="align-middle">${memberships || '<span class="text-secondary">No memberships</span>'}</td>
        </tr>
      `;
    })
    .join("");
}

function renderLiveChat() {
  livechatContent.innerHTML = `
    <div class="row g-4">
      <div class="col-12 col-xl-4">
        <div class="glass-card p-4 h-100">
          <div class="section-tag">Create agent</div>
          <h2 class="section-title">Invite a new LiveChat user</h2>
          <form id="livechatCreateForm" class="row g-3">
            <div class="col-12">
              <label class="form-label" for="livechat-name">Full name</label>
              <input id="livechat-name" class="form-control" type="text" />
            </div>
            <div class="col-12">
              <label class="form-label" for="livechat-email">Email</label>
              <input id="livechat-email" class="form-control" type="email" required />
            </div>
            <div class="col-12">
              <label class="form-label">Initial groups</label>
              ${renderOptionPills(
                state.livechat.groups,
                "livechat-create-group",
                "No groups available in LiveChat.",
              )}
            </div>
            <div class="col-12">
              <label class="form-label" for="livechat-create-priority">Priority</label>
              <select id="livechat-create-priority" class="form-select">
                <option value="first">Primary</option>
                <option value="normal" selected>Last</option>
              </select>
            </div>
            <div class="col-12 d-grid">
              <button class="btn btn-primary" type="submit">
                <i class="bi bi-person-plus me-2"></i>Create LiveChat agent
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="col-12 col-xl-8">
        <div class="glass-card p-4 h-100">
          <div class="section-tag">Bulk group actions</div>
          <div class="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
            <div>
              <h2 class="section-title">Assign or remove groups</h2>
              <p class="muted-copy mb-0">
                Select multiple agents and multiple groups, then update memberships in one
                action.
              </p>
            </div>
            <div class="priority-box">
              <label class="form-label mb-1" for="livechat-bulk-priority">Assignment priority</label>
              <select id="livechat-bulk-priority" class="form-select">
                <option value="first">Primary</option>
                <option value="normal" selected>Last</option>
              </select>
            </div>
          </div>
          ${renderOptionPills(
            state.livechat.groups,
            "livechat-group",
            "No groups available in LiveChat.",
          )}
          <div class="d-flex flex-wrap gap-2 mt-3">
            <button id="livechatAssignBtn" class="btn btn-primary" type="button">
              Assign selected groups
            </button>
            <button id="livechatRemoveBtn" class="btn btn-outline-light" type="button">
              Remove selected groups
            </button>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-4">
        <div class="glass-card p-4 h-100">
          <div class="section-tag">Deactivate</div>
          <h2 class="section-title">Suspend a LiveChat agent</h2>
          <p class="muted-copy">
            This uses the Configuration API suspend action, which keeps the account on the
            license but disables access.
          </p>
          <form id="livechatSuspendForm" class="row g-3">
            <div class="col-12">
              <label class="form-label" for="livechat-suspend-agent">Agent</label>
              <select id="livechat-suspend-agent" class="form-select" required>
                <option value="">Choose an agent</option>
                ${state.livechat.agents
                  .filter((agent) => !agent.suspended)
                  .map(
                    (agent) =>
                      `<option value="${agent.id}">${agent.name} (${agent.id})</option>`,
                  )
                  .join("")}
              </select>
            </div>
            <div class="col-12 d-grid">
              <button class="btn btn-outline-danger" type="submit">Suspend agent</button>
            </div>
          </form>
        </div>
      </div>

      <div class="col-12 col-lg-8">
        <div class="glass-card p-4 h-100">
          <div class="section-tag">Current memberships</div>
          <h2 class="section-title">All LiveChat agent memberships</h2>
          <div class="table-responsive">
            <table class="table table-dark table-borderless align-middle admin-table mb-0">
              <thead>
                <tr>
                  <th style="width: 48px;"></th>
                  <th>Agent</th>
                  <th>Status</th>
                  <th>Groups</th>
                </tr>
              </thead>
              <tbody>${renderAgentRows(state.livechat.agents, "livechat-agent", "livechat")}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  document
    .getElementById("livechatCreateForm")
    .addEventListener("submit", handleLiveChatCreate);
  document
    .getElementById("livechatSuspendForm")
    .addEventListener("submit", handleLiveChatSuspend);
  document.getElementById("livechatAssignBtn").addEventListener("click", () =>
    handleLiveChatMembershipUpdate("assign"),
  );
  document.getElementById("livechatRemoveBtn").addEventListener("click", () =>
    handleLiveChatMembershipUpdate("remove"),
  );
}

function renderHelpDesk() {
  helpdeskContent.innerHTML = `
    <div class="row g-4">
      <div class="col-12 col-xl-4">
        <div class="glass-card p-4 h-100">
          <div class="section-tag">Create agent</div>
          <h2 class="section-title">Invite a new HelpDesk user</h2>
          <form id="helpdeskCreateForm" class="row g-3">
            <div class="col-12">
              <label class="form-label" for="helpdesk-name">Full name</label>
              <input id="helpdesk-name" class="form-control" type="text" />
            </div>
            <div class="col-12">
              <label class="form-label" for="helpdesk-email">Email</label>
              <input id="helpdesk-email" class="form-control" type="email" required />
            </div>
            <div class="col-12">
              <label class="form-label">Initial teams</label>
              ${renderOptionPills(
                state.helpdesk.teams,
                "helpdesk-create-team",
                "No teams available in HelpDesk.",
              )}
            </div>
            <div class="col-12 d-grid">
              <button class="btn btn-primary" type="submit">
                <i class="bi bi-person-plus me-2"></i>Create HelpDesk agent
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="col-12 col-xl-8">
        <div class="glass-card p-4 h-100">
          <div class="section-tag">Bulk team actions</div>
          <h2 class="section-title">Assign or remove teams</h2>
          <p class="muted-copy">
            HelpDesk uses teams rather than group priorities, so assignments here are team
            membership only.
          </p>
          ${renderOptionPills(
            state.helpdesk.teams,
            "helpdesk-team",
            "No teams available in HelpDesk.",
          )}
          <div class="d-flex flex-wrap gap-2 mt-3">
            <button id="helpdeskAssignBtn" class="btn btn-primary" type="button">
              Assign selected teams
            </button>
            <button id="helpdeskRemoveBtn" class="btn btn-outline-light" type="button">
              Remove selected teams
            </button>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-4">
        <div class="glass-card p-4 h-100">
          <div class="section-tag">Deactivate</div>
          <h2 class="section-title">Remove a HelpDesk agent</h2>
          <p class="muted-copy">
            The public HelpDesk docs expose a delete endpoint, so this action removes the
            agent instead of suspending them.
          </p>
          <form id="helpdeskDeactivateForm" class="row g-3">
            <div class="col-12">
              <label class="form-label" for="helpdesk-deactivate-agent">Agent</label>
              <select id="helpdesk-deactivate-agent" class="form-select" required>
                <option value="">Choose an agent</option>
                ${state.helpdesk.agents
                  .map(
                    (agent) =>
                      `<option value="${agent.id}">${agent.name} (${agent.email})</option>`,
                  )
                  .join("")}
              </select>
            </div>
            <div class="col-12 d-grid">
              <button class="btn btn-outline-danger" type="submit">Remove HelpDesk agent</button>
            </div>
          </form>
        </div>
      </div>

      <div class="col-12 col-lg-8">
        <div class="glass-card p-4 h-100">
          <div class="section-tag">Current memberships</div>
          <h2 class="section-title">All HelpDesk team memberships</h2>
          <div class="table-responsive">
            <table class="table table-dark table-borderless align-middle admin-table mb-0">
              <thead>
                <tr>
                  <th style="width: 48px;"></th>
                  <th>Agent</th>
                  <th>Status</th>
                  <th>Teams</th>
                </tr>
              </thead>
              <tbody>${renderAgentRows(state.helpdesk.agents, "helpdesk-agent", "helpdesk")}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  document
    .getElementById("helpdeskCreateForm")
    .addEventListener("submit", handleHelpDeskCreate);
  document
    .getElementById("helpdeskDeactivateForm")
    .addEventListener("submit", handleHelpDeskDeactivate);
  document.getElementById("helpdeskAssignBtn").addEventListener("click", () =>
    handleHelpDeskMembershipUpdate("assign"),
  );
  document.getElementById("helpdeskRemoveBtn").addEventListener("click", () =>
    handleHelpDeskMembershipUpdate("remove"),
  );
}

function renderLogs() {
  logsContent.innerHTML = `
    <div class="glass-card p-4">
      <div class="section-tag">Audit trail</div>
      <h2 class="section-title">D1-backed activity log</h2>
      <p class="muted-copy">
        Every create, delete, suspend, and membership change is recorded server-side.
      </p>
      <div class="table-responsive">
        <table class="table table-dark table-borderless align-middle admin-table mb-0">
          <thead>
            <tr>
              <th>When</th>
              <th>Area</th>
              <th>Action</th>
              <th>Status</th>
              <th>Target</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            ${
              state.logs.length
                ? state.logs
                    .map(
                      (log) => `
                        <tr>
                          <td>${new Date(log.created_at).toLocaleString()}</td>
                          <td class="text-capitalize">${log.area}</td>
                          <td>${log.action}</td>
                          <td>
                            <span class="badge ${
                              log.status === "success" ? "text-bg-success" : "text-bg-danger"
                            }">
                              ${log.status}
                            </span>
                          </td>
                          <td>${log.target || '<span class="text-secondary">-</span>'}</td>
                          <td>${log.details || '<span class="text-secondary">-</span>'}</td>
                        </tr>
                      `,
                    )
                    .join("")
                : '<tr><td colspan="6" class="text-center py-4 muted-copy">No logs yet.</td></tr>'
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAll() {
  renderMetrics();
  renderLiveChat();
  renderHelpDesk();
  renderLogs();
}

async function loadDashboard() {
  setMessage(statusMessage, "Refreshing data from LiveChat, HelpDesk, and D1...");
  const [livechat, helpdesk, logs] = await Promise.all([
    api("/api/livechat/dashboard"),
    api("/api/helpdesk/dashboard"),
    api("/api/logs"),
  ]);

  state.livechat = livechat;
  state.helpdesk = helpdesk;
  state.logs = logs.logs || [];
  renderAll();
  setMessage(statusMessage, "Data refreshed.", "success");
}

function checkedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(
    (input) => input.value,
  );
}

async function withAction(action, successMessage) {
  try {
    setMessage(statusMessage, "Working...");
    await action();
    await loadDashboard();
    setMessage(statusMessage, successMessage, "success");
  } catch (error) {
    setMessage(statusMessage, error.message, "error");
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);

  try {
    setMessage(loginMessage, "Signing in...");
    const response = await api("/api/auth/login", {
      method: "POST",
      body: {
        username: form.get("username"),
        password: form.get("password"),
      },
    });
    state.user = response.user;
    showApp();
    setMessage(loginMessage, "", "");
    await loadDashboard();
  } catch (error) {
    setMessage(loginMessage, error.message, "error");
  }
}

async function handleLogout() {
  await api("/api/auth/logout", { method: "POST" });
  state.user = null;
  showLogin();
  setMessage(statusMessage, "", "");
}

async function handleLiveChatCreate(event) {
  event.preventDefault();
  const name = document.getElementById("livechat-name").value.trim();
  const email = document.getElementById("livechat-email").value.trim();
  const groupIds = checkedValues("livechat-create-group");
  const priority = document.getElementById("livechat-create-priority").value;

  await withAction(
    () =>
      api("/api/livechat/agents", {
        method: "POST",
        body: { name, email, groupIds, priority },
      }),
    "LiveChat agent created.",
  );
}

async function handleLiveChatSuspend(event) {
  event.preventDefault();
  const agentId = document.getElementById("livechat-suspend-agent").value;
  await withAction(
    () =>
      api("/api/livechat/agents/suspend", {
        method: "POST",
        body: { agentId },
      }),
    "LiveChat agent suspended.",
  );
}

async function handleLiveChatMembershipUpdate(mode) {
  const agentIds = checkedValues("livechat-agent");
  const groupIds = checkedValues("livechat-group");
  const priority = document.getElementById("livechat-bulk-priority").value;

  await withAction(
    () =>
      api("/api/livechat/memberships", {
        method: "POST",
        body: { agentIds, groupIds, priority, mode },
      }),
    mode === "assign" ? "LiveChat groups assigned." : "LiveChat groups removed.",
  );
}

async function handleHelpDeskCreate(event) {
  event.preventDefault();
  const name = document.getElementById("helpdesk-name").value.trim();
  const email = document.getElementById("helpdesk-email").value.trim();
  const teamIds = checkedValues("helpdesk-create-team");

  await withAction(
    () =>
      api("/api/helpdesk/agents", {
        method: "POST",
        body: { name, email, teamIds },
      }),
    "HelpDesk agent created.",
  );
}

async function handleHelpDeskDeactivate(event) {
  event.preventDefault();
  const agentId = document.getElementById("helpdesk-deactivate-agent").value;

  await withAction(
    () =>
      api("/api/helpdesk/agents/deactivate", {
        method: "POST",
        body: { agentId },
      }),
    "HelpDesk agent removed.",
  );
}

async function handleHelpDeskMembershipUpdate(mode) {
  const agentIds = checkedValues("helpdesk-agent");
  const teamIds = checkedValues("helpdesk-team");

  await withAction(
    () =>
      api("/api/helpdesk/memberships", {
        method: "POST",
        body: { agentIds, teamIds, mode },
      }),
    mode === "assign" ? "HelpDesk teams assigned." : "HelpDesk teams removed.",
  );
}

async function bootstrap() {
  loginForm.addEventListener("submit", handleLogin);
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
  document.getElementById("refreshBtn").addEventListener("click", () =>
    withAction(() => Promise.resolve(), "Dashboard refreshed."),
  );

  try {
    const session = await api("/api/auth/session");
    if (!session.authenticated) {
      showLogin();
      return;
    }

    state.user = session.user;
    showApp();
    await loadDashboard();
  } catch (error) {
    showLogin();
    setMessage(loginMessage, error.message, "error");
  }
}

bootstrap();
