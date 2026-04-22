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

function statusBadge(status) {
  const normalized = `${status || ""}`.toLowerCase();
  if (normalized === "first") {
    return "primary";
  }

  if (normalized === "normal" || normalized === "last") {
    return "last";
  }

  return "neutral";
}

function priorityLabel(priority) {
  return priority === "first" ? "Primary" : "Last";
}

function renderMetrics() {
  const livechatSuspended = state.livechat.agents.filter((agent) => agent.suspended).length;
  const helpdeskInvited = state.helpdesk.agents.filter((agent) => agent.status === "invited").length;
  const metricCards = [
    {
      label: "LiveChat agents",
      value: state.livechat.agents.length,
      meta: `${state.livechat.groups.length} groups available`,
      icon: "bi-people",
    },
    {
      label: "LiveChat suspended",
      value: livechatSuspended,
      meta: "ready for manual reactivation outside this app",
      icon: "bi-pause-circle",
    },
    {
      label: "HelpDesk agents",
      value: state.helpdesk.agents.length,
      meta: `${state.helpdesk.teams.length} teams available`,
      icon: "bi-life-preserver",
    },
    {
      label: "Log rows",
      value: state.logs.length,
      meta: `${helpdeskInvited} invited HelpDesk users`,
      icon: "bi-journal-text",
    },
  ];

  metricRow.innerHTML = metricCards
    .map(
      (card) => `
        <div class="col-12 col-md-6 col-xl-3">
          <div class="glass-card metric-card p-3 h-100">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="metric-label">${card.label}</div>
                <div class="metric-value mt-2">${card.value}</div>
                <div class="metric-meta mt-2">${card.meta}</div>
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
    return `<tr><td colspan="5" class="text-center py-4 muted-copy">No agents found.</td></tr>`;
  }

  return agents
    .map((agent) => {
      const memberships =
        type === "livechat"
          ? agent.groups
              .map(
                (group) => `
                  <span class="badge-soft ${statusBadge(group.priority)} me-1 mb-1">
                    ${group.name} · ${priorityLabel(group.priority)}
                  </span>
                `,
              )
              .join("")
          : agent.teams
              .map(
                (team) => `
                  <span class="badge-soft neutral me-1 mb-1">${team.name}</span>
                `,
              )
              .join("");

      const status = type === "livechat" ? (agent.suspended ? "Suspended" : "Active") : agent.status;
      const tone = ["active", "online"].includes(`${status}`.toLowerCase())
        ? "neutral"
        : `${status}`.toLowerCase() === "suspended"
          ? "last"
          : "primary";

      const actionButton =
        type === "livechat"
          ? `
            <button class="btn btn-sm btn-outline-danger" data-livechat-suspend="${agent.id}" type="button">
              Suspend
            </button>
          `
          : `
            <button class="btn btn-sm btn-outline-danger" data-helpdesk-deactivate="${agent.id}" type="button">
              Remove
            </button>
          `;

      return `
        <tr>
          <td>
            <input type="checkbox" class="form-check-input" name="${checkboxName}" value="${agent.id}" />
          </td>
          <td>
            <div class="fw-semibold">${agent.name}</div>
            <div class="small text-secondary">${agent.email || agent.id}</div>
          </td>
          <td>
            <span class="badge-soft ${tone}">${status}</span>
          </td>
          <td>${memberships || '<span class="muted-copy">No memberships</span>'}</td>
          <td class="text-end">${actionButton}</td>
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
          <p class="helper-copy mb-4">Assign one or more groups immediately and decide whether they should join as primary or last.</p>
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
              ${renderOptionPills(state.livechat.groups, "livechat-create-group", "No LiveChat groups available.")}
            </div>
            <div class="col-12">
              <label class="form-label" for="livechat-create-priority">Assignment priority</label>
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
              <p class="helper-copy mb-0">Select multiple agents and multiple groups, then update memberships in one request.</p>
            </div>
            <div class="priority-box">
              <label class="form-label mb-1" for="livechat-bulk-priority">Assignment priority</label>
              <select id="livechat-bulk-priority" class="form-select">
                <option value="first">Primary</option>
                <option value="normal" selected>Last</option>
              </select>
            </div>
          </div>

          <div class="selection-toolbar p-3 mb-3">
            <div class="fw-semibold mb-2">Available groups</div>
            ${renderOptionPills(state.livechat.groups, "livechat-group", "No LiveChat groups available.")}
          </div>

          <div class="d-flex flex-wrap gap-2 mb-3">
            <button id="livechatAssignBtn" class="btn btn-primary" type="button">Assign selected groups</button>
            <button id="livechatRemoveBtn" class="btn btn-outline-light" type="button">Remove selected groups</button>
          </div>

          <div class="table-responsive">
            <table class="table admin-table align-middle mb-0">
              <thead>
                <tr>
                  <th style="width: 48px;"></th>
                  <th>Agent</th>
                  <th>Status</th>
                  <th>Current groups</th>
                  <th class="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                ${renderAgentRows(state.livechat.agents, "livechat-agent", "livechat")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderHelpDesk() {
  helpdeskContent.innerHTML = `
    <div class="row g-4">
      <div class="col-12 col-xl-4">
        <div class="glass-card p-4 h-100">
          <div class="section-tag">Create agent</div>
          <h2 class="section-title">Invite a new HelpDesk user</h2>
          <p class="helper-copy mb-4">Assign one or more teams during creation and update them later in bulk.</p>
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
              ${renderOptionPills(state.helpdesk.teams, "helpdesk-create-team", "No HelpDesk teams available.")}
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
          <p class="helper-copy mb-3">Manage multiple users and multiple teams in one go.</p>

          <div class="selection-toolbar p-3 mb-3">
            <div class="fw-semibold mb-2">Available teams</div>
            ${renderOptionPills(state.helpdesk.teams, "helpdesk-team", "No HelpDesk teams available.")}
          </div>

          <div class="d-flex flex-wrap gap-2 mb-3">
            <button id="helpdeskAssignBtn" class="btn btn-primary" type="button">Assign selected teams</button>
            <button id="helpdeskRemoveBtn" class="btn btn-outline-light" type="button">Remove selected teams</button>
          </div>

          <div class="table-responsive">
            <table class="table admin-table align-middle mb-0">
              <thead>
                <tr>
                  <th style="width: 48px;"></th>
                  <th>Agent</th>
                  <th>Status</th>
                  <th>Current teams</th>
                  <th class="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                ${renderAgentRows(state.helpdesk.agents, "helpdesk-agent", "helpdesk")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderLogs() {
  if (!state.logs.length) {
    logsContent.innerHTML = `
      <div class="glass-card p-4">
        <div class="section-tag">Audit history</div>
        <h2 class="section-title">No logs yet</h2>
        <p class="helper-copy mb-0">Once admins start creating users or changing memberships, the history will appear here.</p>
      </div>
    `;
    return;
  }

  logsContent.innerHTML = `
    <div class="glass-card p-4">
      <div class="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
        <div>
          <div class="section-tag">Audit history</div>
          <h2 class="section-title">Latest actions stored in D1</h2>
        </div>
        <div class="helper-copy">Newest first, up to the latest 250 rows.</div>
      </div>
      <div class="log-list">
        ${state.logs
          .map(
            (entry) => `
              <article class="log-item">
                <div class="log-meta">
                  <span class="log-chip ${entry.status}">${entry.status}</span>
                  <span class="log-chip">${entry.area}</span>
                  <span class="log-chip">${entry.action}</span>
                  <span class="log-chip">${new Date(entry.created_at).toLocaleString()}</span>
                  <span class="log-chip">${entry.actor}</span>
                </div>
                <div class="fw-semibold mb-1">${entry.target || "No explicit target"}</div>
                <div class="helper-copy">${entry.details || "No extra details."}</div>
                ${
                  entry.metadata
                    ? `<pre class="subtle-panel p-3 mt-3 mb-0 small overflow-auto">${escapeHtml(
                        JSON.stringify(entry.metadata, null, 2),
                      )}</pre>`
                    : ""
                }
              </article>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderAll() {
  renderMetrics();
  renderLiveChat();
  renderHelpDesk();
  renderLogs();
  bindDynamicActions();
}

function selectedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
}

async function refreshData() {
  setMessage(statusMessage, "Refreshing LiveChat, HelpDesk, and logs...");
  const [livechat, helpdesk, logsResponse] = await Promise.all([
    api("/api/livechat/dashboard"),
    api("/api/helpdesk/dashboard"),
    api("/api/logs"),
  ]);

  state.livechat = livechat;
  state.helpdesk = helpdesk;
  state.logs = logsResponse.logs || [];
  renderAll();
  setMessage(statusMessage, "Workspace updated.", "success");
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

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function bindDynamicActions() {
  const livechatCreateForm = document.getElementById("livechatCreateForm");
  const helpdeskCreateForm = document.getElementById("helpdeskCreateForm");
  const livechatAssignBtn = document.getElementById("livechatAssignBtn");
  const livechatRemoveBtn = document.getElementById("livechatRemoveBtn");
  const helpdeskAssignBtn = document.getElementById("helpdeskAssignBtn");
  const helpdeskRemoveBtn = document.getElementById("helpdeskRemoveBtn");

  livechatCreateForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await withBusyState(
      async () => {
        await api("/api/livechat/agents", {
          method: "POST",
          body: {
            name: document.getElementById("livechat-name").value.trim(),
            email: document.getElementById("livechat-email").value.trim(),
            groupIds: selectedValues("livechat-create-group"),
            priority: document.getElementById("livechat-create-priority").value,
          },
        });
      },
      "LiveChat agent created.",
    );
  });

  helpdeskCreateForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await withBusyState(
      async () => {
        await api("/api/helpdesk/agents", {
          method: "POST",
          body: {
            name: document.getElementById("helpdesk-name").value.trim(),
            email: document.getElementById("helpdesk-email").value.trim(),
            teamIds: selectedValues("helpdesk-create-team"),
          },
        });
      },
      "HelpDesk agent created.",
    );
  });

  livechatAssignBtn?.addEventListener("click", async () => {
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
      "LiveChat memberships updated.",
    );
  });

  livechatRemoveBtn?.addEventListener("click", async () => {
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
      "Selected LiveChat groups removed.",
    );
  });

  helpdeskAssignBtn?.addEventListener("click", async () => {
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

  helpdeskRemoveBtn?.addEventListener("click", async () => {
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
      "Selected HelpDesk teams removed.",
    );
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
        `LiveChat agent ${agentId} suspended.`,
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
        `HelpDesk agent ${agentId} removed.`,
      );
    });
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
  await withBusyState(async () => refreshData(), "Workspace updated.");
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
