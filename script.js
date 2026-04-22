const state = {
  user: null,
  livechat: { agents: [], groups: [] },
  logs: [],
  logsWarning: "",
};

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const statusMessage = document.getElementById("statusMessage");
const sessionBadge = document.getElementById("sessionBadge");
const metricRow = document.getElementById("metricRow");
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
  const metricCards = [
    {
      label: "Agents",
      value: state.livechat.agents.length,
      meta: `${state.livechat.groups.length} groups available`,
      icon: "bi-people",
    },
    {
      label: "Suspended",
      value: livechatSuspended,
      meta: "deactivated from agent routing",
      icon: "bi-pause-circle",
    },
    {
      label: "Groups",
      value: state.livechat.groups.length,
      meta: "available for bulk updates",
      icon: "bi-collection",
    },
    {
      label: "Log rows",
      value: state.logs.length,
      meta: state.logsWarning || "latest D1 audit history",
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

function renderAgentRows(agents, checkboxName) {
  if (!agents.length) {
    return `<tr><td colspan="5" class="text-center py-4 muted-copy">No agents found.</td></tr>`;
  }

  return agents
    .map((agent) => {
      const memberships = agent.groups
        .map(
          (group) => `
            <span class="badge-soft ${statusBadge(group.priority)} me-1 mb-1">
              ${group.name} · ${priorityLabel(group.priority)}
            </span>
          `,
        )
        .join("");

      const status = agent.suspended ? "Suspended" : "Active";
      const tone = ["active", "online"].includes(`${status}`.toLowerCase())
        ? "neutral"
        : `${status}`.toLowerCase() === "suspended"
          ? "last"
          : "primary";

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
          <td class="text-end">
            <button class="btn btn-sm btn-outline-danger" data-livechat-suspend="${agent.id}" type="button">
              Deactivate
            </button>
          </td>
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
          <h2 class="section-title">Create a new agent</h2>
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
              ${renderOptionPills(state.livechat.groups, "livechat-create-group", "No groups available.")}
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
                <i class="bi bi-person-plus me-2"></i>Create agent
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="col-12 col-xl-8">
        <div class="glass-card p-4 h-100">
          <div class="section-tag">Bulk group editor</div>
          <div class="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
            <div>
              <h2 class="section-title">Edit groups for selected agents</h2>
              <p class="helper-copy mb-0">Select multiple agents or all of them, then assign or remove multiple groups with one priority choice.</p>
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
            ${renderOptionPills(state.livechat.groups, "livechat-group", "No groups available.")}
          </div>

          <div class="d-flex flex-wrap gap-2 mb-3">
            <button id="livechatAssignBtn" class="btn btn-primary" type="button">Assign selected groups</button>
            <button id="livechatRemoveBtn" class="btn btn-outline-light" type="button">Remove selected groups</button>
            <button id="livechatSelectAllBtn" class="btn btn-outline-light" type="button">Select all agents</button>
            <button id="livechatClearSelectionBtn" class="btn btn-outline-light" type="button">Clear selection</button>
          </div>

          <div class="table-responsive">
            <table class="table admin-table align-middle mb-0">
              <thead>
                <tr>
                  <th style="width: 48px;"></th>
                  <th>Agent email</th>
                  <th>Status</th>
                  <th>Current groups</th>
                  <th class="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                ${renderAgentRows(state.livechat.agents, "livechat-agent")}
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
        <p class="helper-copy mb-0">${state.logsWarning || "Once admins start creating users or changing memberships, the history will appear here."}</p>
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
  renderLogs();
  bindDynamicActions();
}

function selectedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
}

async function refreshData() {
  setMessage(statusMessage, "Refreshing agents and logs...");
  const [livechatResult, logsResult] = await Promise.allSettled([
    api("/api/livechat/dashboard"),
    api("/api/logs"),
  ]);

  if (livechatResult.status !== "fulfilled") {
    throw livechatResult.reason;
  }

  state.livechat = livechatResult.value;
  state.logs = logsResult.status === "fulfilled" ? logsResult.value.logs || [] : [];
  state.logsWarning =
    logsResult.status === "fulfilled"
      ? logsResult.value.warning || ""
      : "Logs are temporarily unavailable, but agent data loaded successfully.";
  renderAll();
  setMessage(
    statusMessage,
    state.logsWarning ? `Workspace updated. ${state.logsWarning}` : "Workspace updated.",
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

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function bindDynamicActions() {
  const livechatCreateForm = document.getElementById("livechatCreateForm");
  const livechatAssignBtn = document.getElementById("livechatAssignBtn");
  const livechatRemoveBtn = document.getElementById("livechatRemoveBtn");
  const livechatSelectAllBtn = document.getElementById("livechatSelectAllBtn");
  const livechatClearSelectionBtn = document.getElementById("livechatClearSelectionBtn");

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

  livechatSelectAllBtn?.addEventListener("click", () => {
    document.querySelectorAll('input[name="livechat-agent"]').forEach((input) => {
      input.checked = true;
    });
  });

  livechatClearSelectionBtn?.addEventListener("click", () => {
    document.querySelectorAll('input[name="livechat-agent"]').forEach((input) => {
      input.checked = false;
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
        `LiveChat agent ${agentId} suspended.`,
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
