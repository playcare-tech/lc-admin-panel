const APP_URL = "https://lc-admin.pages.dev/";
const DEFAULT_HELPDESK_ANALYTICS_AGENT_EMAILS = [
  "aleksandr.lavrushkin@boomerang-partners.com",
];
const EXCLUDED_DEFAULT_HELPDESK_ANALYTICS_AGENT_EMAILS = [
  "daryia.spirydovich@boomerang-partners.com",
];
const DEFAULT_HELPDESK_ANALYTICS_AGENT_NAMES = [
  "Megan",
  "Emma",
  "Alice",
  "Liliana",
  "Nicole",
  "Matt",
  "Oliver",
  "Nelly",
  "Robert",
  "Luke",
  "Gary",
  "Nate",
  "Litta",
  "Aaron",
  "Sarah",
  "Lara",
  "Celina",
  "Rosa",
  "Oscar",
  "Melany",
  "Beatrice",
  "Mollie",
  "Bob",
  "Jasper",
  "Leo",
  "Noah",
  "Billie",
  "Sandra",
  "Stella",
  "Kyle",
  "Layla",
  "Hugo",
  "Ian",
  "Kirk",
  "Nancy",
  "Jennie",
  "Otis",
  "Benedict",
  "Ben",
  "Sabrina",
  "Nicky",
  "Douglas",
  "Violet",
  "Ada",
  "Mia",
  "Murphy",
  "Zoe",
  "Michael",
  "Evelyn",
  "Milky",
  "Maryia Kavalchuk",
  "Anna Makarova",
  "Alesia Misura",
  "Alina Savchuk",
  "Kateryna Brezhneva",
  "Matvey Ivanov",
  "Oleg Fadeev",
  "Naima Voloshina",
  "Konstantin Dziamida",
  "Valeriya Ilhan",
  "Garnik Makvetsyan",
  "Timur Hamidov",
  "Aleksandr Lavrushkin",
  "Daria Potapova",
  "Andrey Solovyev",
  "Bela Boyajyan",
  "Victoria Namupala",
  "Mariia Priakhina",
  "Yehor Starchev",
  "Mikhail Desiatov",
  "Elgin Bakhishov",
  "Yury Rybakov",
  "Irada Mukhtarova",
  "Oscar Tuleshov",
  "Arslan Abubikirov",
  "Zhomart Adanbekov",
  "Artemiy Selyushkov",
  "Maksim Yerdenov",
  "Alexandra Mirzaliyeva",
  "Elizaveta Kozlovskaya",
  "Stepan Ptashnik",
  "Nikolay Baranchuk",
  "Arman Harutyunyan",
  "Ilya Pantsiukhou",
  "Alexander Shishkin",
  "Hanna Mashchytskaya",
  "Khushnur Turgunbaev",
  "Ivan Sakovich",
  "Igor Filonik",
  "Vladislav Kholkin",
  "Anastasiia Amelkina",
  "Mikhail Kipel",
  "Anatoliy Tolstov",
  "Aldiyar Kadyrbekov",
  "Anastasiia Kozlova",
  "Alisa Maisiuk",
  "Anastasiya Leonchikova",
  "Nikita Tsyganov",
  "Gurgen Abelyan",
  "Sofia Kalinovskaya",
  "Viktoria Zaitsava",
];

const state = {
  user: null,
  permissions: {},
  loginChallenge: null,
  section: "livechat-users",
  livechat: { agents: [], groups: [] },
  helpdesk: { agents: [], teams: [] },
  adminUsers: [],
  logs: [],
  logsWarning: "",
  livechatSearch: "",
  helpdeskSearch: "",
  helpdeskSync: null,
  helpdeskSyncTimer: null,
  helpdeskSyncInFlight: false,
  livechatGroupSearch: "",
  livechatGroupQuickFilter: "",
  livechatGroupPriorityFilter: "",
  livechatSelectedGroupsCollapsed: false,
  helpdeskTeamSearch: "",
  livechatCreateSearch: "",
  helpdeskCreateSearch: "",
  livechatSelectedAgentIds: new Set(),
  livechatSelectedGroupIds: new Set(),
  helpdeskSelectedAgentIds: new Set(),
  helpdeskSelectedTeamIds: new Set(),
  modalOpen: false,
  modalType: null,
  modalAgent: null,
  modalSearch: "",
  generatedAdminPassword: "",
  analytics: {
    loading: false,
    error: null,
    data: null,
    sort: "tickets",
    filters: {
      preset: "last_7_days",
      from: "",
      to: "",
      agents: [],
      excludeAgents: [],
      includeSearch: "",
      excludeSearch: "",
      compare: true,
    },
  },
  helpdesk_analytics: {
    loading: false,
    error: null,
    loadStatus: "",
    loadProgress: null,
    filters: {
      preset: "this_month",
      from: null,
      to: null,
      agents: [],
      excludeAgents: [],
      groups: [],
      agentSearch: "",
      excludeAgentSearch: "",
      groupSearch: "",
    },
    appliedFilters: null,
    importOptions: {
      sliceMinutes: 10,
      concurrency: 1,
    },
    data: null,
    expandedAgents: new Set(),
    defaultAgentsApplied: false,
    ticketModal: {
      loading: false,
      error: null,
      ticket: null,
    },
  },
};

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const loginForm = document.getElementById("loginForm");
const loginChallengeFields = document.getElementById("loginChallengeFields");
const loginMessage = document.getElementById("loginMessage");
const statusMessage = document.getElementById("statusMessage");
const syncStatusMessage = document.getElementById("syncStatusMessage");
const sessionBadge = document.getElementById("sessionBadge");
const pageTitle = document.getElementById("pageTitle");
const appContent = document.getElementById("appContent");
const modalRoot = document.getElementById("modalRoot");
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
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (_error) {
      payload = {
        error: response.ok
          ? "Invalid JSON response."
          : `Request failed with ${response.status} ${response.statusText || ""}`.trim(),
      };
    }
  }

  if (!response.ok) {
    throw new Error(payload.error || `Request failed with ${response.status}.`);
  }

  return payload;
}

function showApp() {
  loginView.classList.add("d-none");
  appView.classList.remove("d-none");
  sessionBadge.textContent = `Signed in as ${state.user}`;
  startHelpdeskAutoSync();
}

function showLogin() {
  appView.classList.add("d-none");
  loginView.classList.remove("d-none");
  if (state.helpdeskSyncTimer) {
    clearInterval(state.helpdeskSyncTimer);
    state.helpdeskSyncTimer = null;
  }
}

function renderLoginChallenge() {
  if (!loginChallengeFields) return;
  const challenge = state.loginChallenge;
  if (!challenge) {
    loginChallengeFields.innerHTML = "";
    return;
  }

  loginChallengeFields.innerHTML = `
    ${
      challenge.requiresPasswordChange
        ? `<input id="newPassword" name="newPassword" type="password" class="form-control" placeholder="New password (12+ characters)" autocomplete="new-password" required />`
        : ""
    }
    ${
      challenge.requiresTotpSetup
        ? `<div class="totp-setup-box">
            <div class="subtle">Scan the QR code in Google Authenticator, or use the setup key, then enter the 6-digit code.</div>
            <canvas id="totpQrCanvas" class="totp-qr" aria-label="Google Authenticator QR code"></canvas>
            <div class="credentials-box">${escapeHtml(challenge.setupSecret || "")}</div>
            <input type="hidden" name="setupSecret" value="${escapeHtml(challenge.setupSecret || "")}" />
          </div>`
        : ""
    }
    ${
      challenge.requiresOtp || challenge.requiresTotpSetup
        ? `<input id="otp" name="otp" type="text" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" class="form-control" placeholder="Google Authenticator code" autocomplete="one-time-code" required />`
        : ""
    }
  `;
  renderTotpQr();
}

function canManageUsers() {
  return Boolean(state.permissions?.canManageUsers);
}

function canManageAdmins() {
  return Boolean(state.permissions?.canManageAdmins);
}

function renderTotpQr() {
  const canvas = document.getElementById("totpQrCanvas");
  const uri = state.loginChallenge?.otpauthUri;
  if (!canvas || !uri) return;
  if (!window.QRCode?.toCanvas) {
    canvas.replaceWith(Object.assign(document.createElement("div"), {
      className: "empty-state",
      textContent: "QR library did not load. Use the setup key below.",
    }));
    return;
  }
  window.QRCode.toCanvas(canvas, uri, { width: 184, margin: 1 }, () => {});
}

function escapeHtml(value) {
  return `${value ?? ""}`
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function localDateValue(date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function localEndDateValue(date) {
  return localDateValue(new Date(date.getTime() - 1));
}

function offsetForDate(date) {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  return `${sign}${padDatePart(Math.floor(absolute / 60))}:${padDatePart(absolute % 60)}`;
}

function dateWithOffset(date, offset = offsetForDate(date)) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}:${padDatePart(date.getSeconds())}${offset}`;
}

function dateInputToReportDate(value, endOfDay = false, offset = "") {
  const date = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  return dateWithOffset(date, offset || offsetForDate(date));
}

function isoToDateInput(value) {
  if (!value) {
    return "";
  }
  return localDateValue(new Date(value));
}

function analyticsPresetRange(preset) {
  const now = new Date();
  const startOfDay = (date) => new Date(`${localDateValue(date)}T00:00:00`);
  const endOfDay = (date) => new Date(`${localDateValue(date)}T23:59:59`);
  const startOfWeek = (date) => {
    const copy = new Date(date);
    const diff = copy.getDay() === 0 ? -6 : 1 - copy.getDay();
    copy.setDate(copy.getDate() + diff);
    return startOfDay(copy);
  };

  if (preset === "today") {
    return { from: startOfDay(now), to: endOfDay(now) };
  }
  if (preset === "yesterday") {
    const date = new Date(now);
    date.setDate(date.getDate() - 1);
    return { from: startOfDay(date), to: endOfDay(date) };
  }
  if (preset === "last_30_days") {
    const from = new Date(now);
    from.setDate(from.getDate() - 29);
    return { from: startOfDay(from), to: endOfDay(now) };
  }
  if (preset === "this_week") {
    return { from: startOfWeek(now), to: endOfDay(now) };
  }
  if (preset === "last_week") {
    const from = startOfWeek(now);
    from.setDate(from.getDate() - 7);
    const to = new Date(from);
    to.setDate(to.getDate() + 6);
    return { from, to: endOfDay(to) };
  }
  if (preset === "this_month") {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay(now) };
  }
  if (preset === "last_month") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from, to: endOfDay(to) };
  }

  const from = new Date(now);
  from.setDate(from.getDate() - 6);
  return { from: startOfDay(from), to: endOfDay(now) };
}

function ensureAnalyticsRange() {
  const filters = state.analytics.filters;
  if (filters.preset !== "custom" || !filters.from || !filters.to) {
    const range = analyticsPresetRange(filters.preset);
    const offset = offsetForDate(range.from);
    filters.from = dateWithOffset(range.from, offset);
    filters.to = dateWithOffset(range.to, offset);
  }
}

function shiftAnalyticsPeriod(direction) {
  ensureAnalyticsRange();
  const filters = state.analytics.filters;
  const from = new Date(filters.from);
  const to = new Date(filters.to);
  const isMonth = ["this_month", "last_month"].includes(filters.preset);

  if (isMonth) {
    from.setMonth(from.getMonth() + direction);
    to.setMonth(to.getMonth() + direction);
  } else {
    const stepDays = ["today", "yesterday"].includes(filters.preset) ? 1 : 7;
    from.setDate(from.getDate() + direction * stepDays);
    to.setDate(to.getDate() + direction * stepDays);
  }

  const offset = offsetForDate(from);
  filters.from = dateWithOffset(from, offset);
  filters.to = dateWithOffset(to, offset);
  filters.preset = "custom";
}

function formatDuration(ms) {
  if (ms === null || ms === undefined || Number.isNaN(Number(ms))) {
    return "—";
  }
  const totalSeconds = Math.round(Number(ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function formatCsat(value) {
  return value === null || value === undefined ? "—" : `${Math.round(Number(value) * 20)}%`;
}

function formatCsatDelta(value) {
  return `${Math.round(Number(value) * 20)} pp`;
}

function analyticsAgentLabel(agent) {
  const name = agent.name && agent.name !== agent.email && agent.name !== agent.id ? agent.name : "";
  return name || agent.email || agent.id || agent.record_key || "";
}

function analyticsAgentSubLabel(agent) {
  const main = analyticsAgentLabel(agent);
  const secondary = agent.email && agent.email !== main ? agent.email : agent.id && agent.id !== main ? agent.id : agent.record_key;
  return secondary && secondary !== main ? secondary : "";
}

function selectedValues(name) {
  const bulkSelections = {
    "livechat-agent": state.livechatSelectedAgentIds,
    "livechat-group": state.livechatSelectedGroupIds,
    "helpdesk-agent": state.helpdeskSelectedAgentIds,
    "helpdesk-team": state.helpdeskSelectedTeamIds,
  };

  if (bulkSelections[name]) {
    return Array.from(bulkSelections[name]);
  }

  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
}

function isSelected(name, value) {
  return selectedValues(name).includes(String(value));
}

function setSelection(name, value, checked) {
  const bulkSelections = {
    "livechat-agent": state.livechatSelectedAgentIds,
    "livechat-group": state.livechatSelectedGroupIds,
    "helpdesk-agent": state.helpdeskSelectedAgentIds,
    "helpdesk-team": state.helpdeskSelectedTeamIds,
  };
  const selection = bulkSelections[name];

  if (!selection) {
    return;
  }

  if (checked) {
    selection.add(String(value));
  } else {
    selection.delete(String(value));
  }
}

function setVisibleSelection(name, checked) {
  document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    input.checked = checked;
    setSelection(name, input.value, checked);
  });
}

function selectedLiveChatAgents() {
  const selectedAgentIds = selectedValues("livechat-agent");
  return state.livechat.agents.filter((agent) => selectedAgentIds.includes(String(agent.id)));
}

function liveChatGroupIdsForSelectedPriority(priority) {
  if (!priority) {
    return new Set();
  }

  return new Set(
    selectedLiveChatAgents()
      .flatMap((agent) => agent.groups)
      .filter((group) => {
        const groupPriority = group.priority === "last" ? "last" : "normal";
        return groupPriority === priority;
      })
      .map((group) => String(group.id)),
  );
}

function selectedLiveChatGroupIdsForAction() {
  const selectedGroupIds = selectedValues("livechat-group");
  const priorityGroupIds = liveChatGroupIdsForSelectedPriority(state.livechatGroupPriorityFilter);

  if (!priorityGroupIds.size) {
    return selectedGroupIds;
  }

  return selectedGroupIds.filter((groupId) => priorityGroupIds.has(String(groupId)));
}

function selectLiveChatAgentGroups(agentIds) {
  state.livechat.agents
    .filter((agent) => agentIds.includes(String(agent.id)))
    .flatMap((agent) => agent.groups)
    .forEach((group) => state.livechatSelectedGroupIds.add(String(group.id)));
}

function syncLiveChatGroupsFromSelectedAgents() {
  state.livechatSelectedGroupIds.clear();
  selectLiveChatAgentGroups(selectedValues("livechat-agent"));
}

function selectHelpDeskAgentTeams(agentIds) {
  state.helpdesk.agents
    .filter((agent) => agentIds.includes(String(agent.id)))
    .flatMap((agent) => agent.teams)
    .forEach((team) => state.helpdeskSelectedTeamIds.add(String(team.id)));
}

function syncHelpDeskTeamsFromSelectedAgents() {
  state.helpdeskSelectedTeamIds.clear();
  selectHelpDeskAgentTeams(selectedValues("helpdesk-agent"));
}

function ensureSelection(values, label) {
  if (!values.length) {
    throw new Error(`Select at least one ${label}.`);
  }
}

function generatePassword(length = 14) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
}

function priorityLabel(priority) {
  if (priority === "first") {
    return "First";
  }
  if (priority === "last") {
    return "Last";
  }
  if (priority === "supervisor") {
    return "Supervisor";
  }
  return "Primary";
}

function chipTone(priority) {
  return priority === "last" ? "last" : "primary";
}

function renderGroupChips(groups) {
  if (!groups.length) {
    return '<span class="subtle">No groups</span>';
  }

  return `<div class="chip-list">${groups
    .map(
      (group) =>
        `<span class="chip ${chipTone(group.priority)}">${escapeHtml(group.name)} <span>${priorityLabel(group.priority)}</span></span>`,
    )
    .join("")}</div>`;
}

function renderTeamChips(teams) {
  if (!teams.length) {
    return '<span class="subtle">No teams</span>';
  }

  return `<div class="chip-list">${teams
    .map((team) => `<span class="chip">${escapeHtml(team.name)}</span>`)
    .join("")}</div>`;
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
    const teamsText = agent.teams.map((team) => team.name).join(" ");
    return `${agent.email} ${teamsText}`.toLowerCase().includes(search);
  });
}

function filterByName(items, search) {
  const normalized = search.trim().toLowerCase();
  if (!normalized) {
    return items;
  }
  return items.filter((item) => item.name.toLowerCase().includes(normalized));
}

function filterLiveChatGroups(groups) {
  const searchedGroups = filterByName(groups, state.livechatGroupSearch);
  const quickFilter = state.livechatGroupQuickFilter.trim().toLowerCase();
  const priorityFilter = state.livechatGroupPriorityFilter;
  const selectedAgents = selectedLiveChatAgents();

  let filteredGroups = searchedGroups;

  if (!quickFilter) {
    filteredGroups = searchedGroups;
  } else {
    filteredGroups = filteredGroups.filter((group) => group.name.toLowerCase().includes(quickFilter));
  }

  if (!priorityFilter || !selectedAgents.length) {
    return filteredGroups;
  }

  const matchingGroupIds = liveChatGroupIdsForSelectedPriority(priorityFilter);

  return filteredGroups.filter((group) => matchingGroupIds.has(String(group.id)));
}

function livechatGroupsWithCounts() {
  const counts = new Map();
  state.livechat.agents.forEach((agent) => {
    agent.groups.forEach((group) => {
      counts.set(String(group.id), (counts.get(String(group.id)) || 0) + 1);
    });
  });

  return state.livechat.groups.map((group) => ({
    ...group,
    agentCount: counts.get(String(group.id)) || 0,
  }));
}

function helpdeskGroupsWithCounts() {
  const counts = new Map();
  state.helpdesk.agents.forEach((agent) => {
    agent.teams.forEach((team) => {
      counts.set(String(team.id), (counts.get(String(team.id)) || 0) + 1);
    });
  });

  return state.helpdesk.teams.map((team) => ({
    ...team,
    agentCount: counts.get(String(team.id)) || 0,
  }));
}

function renderMembershipTable(rows, columns, emptyMessage) {
  if (!rows.length) {
    return `<div class="empty-state">${escapeHtml(emptyMessage)}</div>`;
  }

  return `
    <div class="table-responsive">
      <table class="table admin-table">
        <thead>
          <tr>${columns.map((column) => `<th>${column}</th>`).join("")}</tr>
        </thead>
        <tbody>${rows.join("")}</tbody>
      </table>
    </div>
  `;
}

function renderStats(cards) {
  return `
    <div class="stats-grid">
      ${cards
        .map(
          (card) => `
            <div class="stats-card">
              <div class="stats-label">${card.label}</div>
              <div class="stats-value">${card.value}</div>
              <div class="subtle mt-1">${card.meta}</div>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderBulkEditor({
  title,
  searchId,
  searchValue,
  searchPlaceholder,
  items,
  checkboxName,
  selectAllId,
  clearId,
  primaryActionId,
  primaryLabel,
  secondaryActionId,
  secondaryLabel,
  secondaryTone = "secondary",
  extraControl = "",
  quickFilters = [],
  activeQuickFilter = "",
  quickFilterPrefix = "",
  priorityFilters = [],
  activePriorityFilter = "",
  selectedItems = [],
  selectedSummaryToggleId = "",
  selectedSummaryCollapsed = false,
}) {
  return `
    <div class="editor-shell">
      <div class="section-title">${title}</div>
      ${
        quickFilters.length
          ? `<div class="filter-row">
              <button class="filter-chip ${activeQuickFilter ? "" : "active"}" type="button" data-${quickFilterPrefix}-filter="">All</button>
              ${quickFilters
                .map(
                  (filter) =>
                    `<button class="filter-chip ${activeQuickFilter === filter ? "active" : ""}" type="button" data-${quickFilterPrefix}-filter="${escapeHtml(filter)}">${escapeHtml(filter)}</button>`,
                )
                .join("")}
            </div>`
          : ""
      }
      ${
        priorityFilters.length
          ? `<div class="filter-row">
              <button class="filter-chip ${activePriorityFilter ? "" : "active"}" type="button" data-livechat-priority-filter="">All active</button>
              ${priorityFilters
                .map(
                  (filter) =>
                    `<button class="filter-chip ${activePriorityFilter === filter.value ? "active" : ""}" type="button" data-livechat-priority-filter="${escapeHtml(filter.value)}">${escapeHtml(filter.label)}</button>`,
                )
                .join("")}
            </div>`
          : ""
      }
      ${
        selectedItems.length
          ? `<div class="selected-summary">
              <div class="selected-summary-header">
                <span class="subtle">${selectedItems.length} selected</span>
                ${
                  selectedSummaryToggleId
                    ? `<button id="${selectedSummaryToggleId}" class="btn btn-sm btn-outline-secondary" type="button">${selectedSummaryCollapsed ? "Show" : "Hide"}</button>`
                    : ""
                }
              </div>
              ${
                selectedSummaryCollapsed
                  ? ""
                  : `<div class="chip-list">${selectedItems
                      .map((item) => `<span class="chip">${escapeHtml(item.name)}</span>`)
                      .join("")}</div>`
              }
            </div>`
          : ""
      }
      <div class="toolbar-row">
        <input id="${searchId}" class="form-control" type="search" placeholder="${searchPlaceholder}" value="${escapeHtml(searchValue)}" />
        <button id="${selectAllId}" class="btn btn-outline-secondary" type="button">Select all shown</button>
        <button id="${clearId}" class="btn btn-outline-secondary" type="button">Clear shown</button>
      </div>
      <div class="action-row">
        <button id="${primaryActionId}" class="btn btn-primary" type="button">${primaryLabel}</button>
        <button id="${secondaryActionId}" class="btn ${secondaryTone === "danger" ? "btn-outline-danger" : "btn-outline-secondary"}" type="button">${secondaryLabel}</button>
        ${extraControl}
      </div>
      <div class="checkbox-grid">
        ${
          items.length
            ? items
                .map(
                  (item) => `
                    <label class="check-pill">
                      <input type="checkbox" name="${checkboxName}" value="${item.id}" ${isSelected(checkboxName, item.id) ? "checked" : ""} />
                      <span>${escapeHtml(item.name)}</span>
                    </label>
                  `,
                )
                .join("")
            : '<div class="empty-state">Nothing matches the current search.</div>'
        }
      </div>
    </div>
  `;
}

function renderLiveChatUsers() {
  const agents = filteredLiveChatAgents();
  const selectedAgents = selectedLiveChatAgents();
  const groups = filterLiveChatGroups(state.livechat.groups);
  const priorityGroupIds = liveChatGroupIdsForSelectedPriority(state.livechatGroupPriorityFilter);
  const selectedGroups = state.livechat.groups
    .filter((group) => state.livechatSelectedGroupIds.has(String(group.id)))
    .filter((group) => !priorityGroupIds.size || priorityGroupIds.has(String(group.id)))
    .sort((left, right) => left.name.localeCompare(right.name));

  return `
    ${renderStats([
      { label: "Agents", value: state.livechat.agents.length, meta: "LiveChat users" },
      { label: "Groups", value: state.livechat.groups.length, meta: "Available groups" },
      { label: "Selected", value: selectedValues("livechat-agent").length, meta: "Ready for bulk change" },
      { label: "Suspended", value: state.livechat.agents.filter((agent) => agent.suspended).length, meta: "Inactive users" },
    ])}
    <div class="section-grid">
      <div class="card-shell">
        <div class="section-title">Bulk change</div>
        <div class="toolbar-row">
          <button id="livechatSelectAllAgentsBtn" class="btn btn-outline-secondary" type="button">Select all agents</button>
          <button id="livechatClearAgentsBtn" class="btn btn-outline-secondary" type="button">Clear agents</button>
          <select id="livechatBulkPriority" class="form-select">
            <option value="normal" selected>Primary</option>
            <option value="last">Last</option>
          </select>
          <div class="subtle d-flex align-items-center px-2">${selectedValues("livechat-agent").length} selected</div>
        </div>
        ${renderBulkEditor({
          title: "Groups",
          searchId: "livechatGroupSearchInput",
          searchValue: state.livechatGroupSearch,
          searchPlaceholder: "Search groups",
          items: groups,
          checkboxName: "livechat-group",
          selectAllId: "livechatSelectAllGroupsBtn",
          clearId: "livechatClearGroupsBtn",
          primaryActionId: "livechatAssignBtn",
          primaryLabel: "Add groups",
          secondaryActionId: "livechatRemoveBtn",
          secondaryLabel: "Remove groups",
          secondaryTone: "danger",
          extraControl: '<button id="livechatChangePriorityBtn" class="btn btn-outline-secondary" type="button">Change priority</button>',
          quickFilters: ["SS", "VIP", "TL", "S2B"],
          activeQuickFilter: state.livechatGroupQuickFilter,
          quickFilterPrefix: "livechat-group",
          priorityFilters: selectedAgents.length
            ? [
                { label: "Primary groups", value: "normal" },
                { label: "Last groups", value: "last" },
              ]
            : [],
          activePriorityFilter: state.livechatGroupPriorityFilter,
          selectedItems: selectedGroups,
          selectedSummaryToggleId: "livechatToggleSelectedGroupsBtn",
          selectedSummaryCollapsed: state.livechatSelectedGroupsCollapsed,
        })}
      </div>
      <div class="table-shell">
        <div class="toolbar-row">
          <input id="livechatSearchInput" class="form-control" type="search" placeholder="Search LiveChat users" value="${escapeHtml(state.livechatSearch)}" />
          <button id="livechatSelectVisibleBtn" class="btn btn-outline-secondary" type="button">Select visible</button>
          <button id="livechatClearVisibleBtn" class="btn btn-outline-secondary" type="button">Clear visible</button>
          <div class="subtle d-flex align-items-center px-2">${agents.length} results</div>
        </div>
        ${
          agents.length
            ? `
              <div class="table-responsive">
                <table class="table admin-table">
                  <thead>
                    <tr>
                      <th style="width:36px;"></th>
                      <th>Email</th>
                      <th>Groups count</th>
                      <th>Status</th>
                      <th style="width:132px;"></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${agents
                      .map(
                        (agent) => `
                          <tr>
                            <td><input type="checkbox" class="form-check-input" name="livechat-agent" value="${agent.id}" ${isSelected("livechat-agent", agent.id) ? "checked" : ""} /></td>
                            <td>${escapeHtml(agent.email)}</td>
                            <td>${agent.groups.length}</td>
                            <td>${agent.suspended ? '<span class="chip last">Suspended</span>' : '<span class="chip primary">Active</span>'}</td>
                            <td class="text-end">
                              <div class="d-flex gap-2 justify-content-end">
                                <button class="btn btn-sm btn-outline-secondary" type="button" data-open-livechat="${agent.id}">Open</button>
                                ${canManageUsers() ? `<button class="btn btn-sm btn-outline-danger" type="button" data-livechat-suspend="${agent.id}">Deactivate</button>` : ""}
                              </div>
                            </td>
                          </tr>
                        `,
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            `
            : '<div class="empty-state">No LiveChat users returned. This usually means the Text token does not have permission to read users or belongs to a different account.</div>'
        }
      </div>
    </div>
  `;
}

function renderHelpDeskUsers() {
  const agents = filteredHelpDeskAgents();
  const teams = filterByName(state.helpdesk.teams, state.helpdeskTeamSearch);

  return `
    ${renderStats([
      { label: "Agents", value: state.helpdesk.agents.length, meta: "HelpDesk users" },
      { label: "Groups", value: state.helpdesk.teams.length, meta: "Available groups" },
      { label: "Selected", value: selectedValues("helpdesk-agent").length, meta: "Ready for bulk change" },
      { label: "Invited", value: state.helpdesk.agents.filter((agent) => agent.status === "invited").length, meta: "Pending access" },
    ])}
    <div class="section-grid">
      <div class="card-shell">
        <div class="section-title">Bulk change</div>
        <div class="toolbar-row">
          <button id="helpdeskSelectAllAgentsBtn" class="btn btn-outline-secondary" type="button">Select all agents</button>
          <button id="helpdeskClearAgentsBtn" class="btn btn-outline-secondary" type="button">Clear agents</button>
          <div class="subtle d-flex align-items-center px-2">${selectedValues("helpdesk-agent").length} selected</div>
          <div></div>
        </div>
        ${renderBulkEditor({
          title: "Groups",
          searchId: "helpdeskTeamSearchInput",
          searchValue: state.helpdeskTeamSearch,
          searchPlaceholder: "Search groups",
          items: teams,
          checkboxName: "helpdesk-team",
          selectAllId: "helpdeskSelectAllTeamsBtn",
          clearId: "helpdeskClearTeamsBtn",
          primaryActionId: "helpdeskAssignBtn",
          primaryLabel: "Add groups",
          secondaryActionId: "helpdeskRemoveBtn",
          secondaryLabel: "Remove groups",
          secondaryTone: "danger",
        })}
      </div>
      <div class="table-shell">
        <div class="toolbar-row">
          <input id="helpdeskSearchInput" class="form-control" type="search" placeholder="Search HelpDesk users" value="${escapeHtml(state.helpdeskSearch)}" />
          <button id="helpdeskSelectVisibleBtn" class="btn btn-outline-secondary" type="button">Select visible</button>
          <button id="helpdeskClearVisibleBtn" class="btn btn-outline-secondary" type="button">Clear visible</button>
          <div class="subtle d-flex align-items-center px-2">${agents.length} results</div>
        </div>
        ${
          agents.length
            ? `
              <div class="table-responsive">
                <table class="table admin-table">
                  <thead>
                    <tr>
                      <th style="width:36px;"></th>
                      <th>Email</th>
                      <th>Groups count</th>
                      <th>Status</th>
                      <th style="width:132px;"></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${agents
                      .map(
                        (agent) => `
                          <tr>
                            <td><input type="checkbox" class="form-check-input" name="helpdesk-agent" value="${agent.id}" ${isSelected("helpdesk-agent", agent.id) ? "checked" : ""} /></td>
                            <td>${escapeHtml(agent.email)}</td>
                            <td>${agent.teams.length}</td>
                            <td><span class="chip">${escapeHtml(agent.status)}</span></td>
                            <td class="text-end">
                              <div class="d-flex gap-2 justify-content-end">
                                <button class="btn btn-sm btn-outline-secondary" type="button" data-open-helpdesk="${agent.id}">Open</button>
                                ${canManageUsers() ? `<button class="btn btn-sm btn-outline-danger" type="button" data-helpdesk-deactivate="${agent.id}">Deactivate</button>` : ""}
                              </div>
                            </td>
                          </tr>
                        `,
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            `
            : '<div class="empty-state">No HelpDesk users returned.</div>'
        }
      </div>
    </div>
  `;
}

function renderLiveChatGroups() {
  const groups = filterByName(livechatGroupsWithCounts(), state.livechatGroupSearch);

  return `
    ${renderStats([
      { label: "Groups", value: state.livechat.groups.length, meta: "Configured entries" },
      { label: "Shown", value: groups.length, meta: "Filtered groups" },
      { label: "Agents", value: state.livechat.agents.length, meta: "LiveChat users" },
      { label: "Scope", value: "LC", meta: "Product" },
    ])}
    <div class="table-shell">
      <div class="toolbar-row">
        <input id="livechatGroupSearchInput" class="form-control" type="search" placeholder="Search LiveChat groups" value="${escapeHtml(state.livechatGroupSearch)}" />
        <div class="subtle d-flex align-items-center px-2">${groups.length} results</div>
      </div>
      ${renderMembershipTable(
        groups.map(
          (group) => `
            <tr>
              <td>${escapeHtml(group.name)}</td>
              <td>${group.agentCount}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-secondary" type="button" data-open-livechat-group="${group.id}">Open group</button>
              </td>
            </tr>
          `,
        ),
        ["Group", "Agents", ""],
        "No LiveChat groups returned.",
      )}
    </div>
  `;
}

function renderHelpDeskGroups() {
  const groups = filterByName(helpdeskGroupsWithCounts(), state.helpdeskTeamSearch);

  return `
    ${renderStats([
      { label: "Groups", value: state.helpdesk.teams.length, meta: "Configured entries" },
      { label: "Shown", value: groups.length, meta: "Filtered groups" },
      { label: "Agents", value: state.helpdesk.agents.length, meta: "HelpDesk users" },
      { label: "Scope", value: "HD", meta: "Product" },
    ])}
    <div class="table-shell">
      <div class="toolbar-row">
        <input id="helpdeskTeamSearchInput" class="form-control" type="search" placeholder="Search HelpDesk groups" value="${escapeHtml(state.helpdeskTeamSearch)}" />
        <div class="subtle d-flex align-items-center px-2">${groups.length} results</div>
      </div>
      ${renderMembershipTable(
        groups.map(
          (group) => `
            <tr>
              <td>${escapeHtml(group.name)}</td>
              <td>${group.agentCount}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-secondary" type="button" data-open-helpdesk-group="${group.id}">Open group</button>
              </td>
            </tr>
          `,
        ),
        ["Group", "Agents", ""],
        "No HelpDesk groups returned.",
      )}
    </div>
  `;
}

function renderCreateUserForm(type) {
  const isLiveChat = type === "livechat";
  const items = isLiveChat
    ? filterByName(state.livechat.groups, state.livechatCreateSearch)
    : filterByName(state.helpdesk.teams, state.helpdeskCreateSearch);
  const searchValue = isLiveChat ? state.livechatCreateSearch : state.helpdeskCreateSearch;
  const checkboxName = isLiveChat ? "create-livechat-group" : "create-helpdesk-team";

  return `
    ${renderStats([
      { label: "Available groups", value: items.length, meta: isLiveChat ? "LiveChat groups" : "HelpDesk groups" },
      { label: "All groups", value: isLiveChat ? state.livechat.groups.length : state.helpdesk.teams.length, meta: "Directory total" },
      { label: "Product", value: isLiveChat ? "LC" : "HD", meta: "Target" },
      { label: "Mode", value: "Create", meta: "New user" },
    ])}
    <div class="section-grid">
      <div class="card-shell">
        <div class="section-title">${isLiveChat ? "Create LiveChat user" : "Create HelpDesk user"}</div>
        <form id="${isLiveChat ? "createLiveChatForm" : "createHelpDeskForm"}" class="row g-2">
          <div class="col-12">
            <input id="${isLiveChat ? "createLiveChatName" : "createHelpDeskName"}" class="form-control" type="text" placeholder="Full name" />
          </div>
          <div class="col-12">
            <input id="${isLiveChat ? "createLiveChatEmail" : "createHelpDeskEmail"}" class="form-control" type="email" placeholder="Email" required />
          </div>
          ${
            isLiveChat
              ? `<div class="col-12">
                  <select id="createLiveChatRole" class="form-select">
                    <option value="normal" selected>Normal</option>
                    <option value="administrator">Administrator</option>
                    <option value="viceowner">Vice owner</option>
                  </select>
                </div>
                <div class="col-12">
                  <select id="createLiveChatPriority" class="form-select">
                    <option value="normal" selected>Primary</option>
                    <option value="last">Last</option>
                  </select>
                </div>`
              : `<div class="col-12">
                  <select id="createHelpDeskRole" class="form-select">
                    <option value="normal" selected>Normal</option>
                    <option value="viewer">Viewer</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
                <div class="col-12">
                  <input id="createHelpDeskJobTitle" class="form-control" type="text" placeholder="Job title" />
                </div>
                <div class="col-12">
                  <input id="createHelpDeskAvatar" class="form-control" type="url" placeholder="Avatar URL" />
                </div>`
          }
          <div class="col-12 d-grid">
            <button type="submit" class="btn btn-primary">${isLiveChat ? "Create LiveChat user" : "Create HelpDesk user"}</button>
          </div>
        </form>
      </div>
      <div class="editor-shell">
        ${renderBulkEditor({
          title: "Assign groups",
          searchId: isLiveChat ? "livechatCreateSearchInput" : "helpdeskCreateSearchInput",
          searchValue,
          searchPlaceholder: "Search groups",
          items,
          checkboxName,
          selectAllId: isLiveChat ? "livechatCreateSelectAllBtn" : "helpdeskCreateSelectAllBtn",
          clearId: isLiveChat ? "livechatCreateClearBtn" : "helpdeskCreateClearBtn",
          primaryActionId: `${type}CreateInfoBtn`,
          primaryLabel: "Review selection",
          secondaryActionId: `${type}CreateResetBtn`,
          secondaryLabel: "Clear selection",
        })}
      </div>
    </div>
  `;
}

function renderAdminUsers() {
  const credentialsText = state.generatedAdminPassword
    ? `App: ${APP_URL}\nUsername: ${document.getElementById("adminUsername")?.value || ""}\nPassword: ${state.generatedAdminPassword}`
    : "";

  return `
    ${renderStats([
      { label: "Admin users", value: state.adminUsers.length, meta: "App login accounts" },
      { label: "Logs", value: state.logs.length, meta: "Recent actions loaded" },
      { label: "App URL", value: "LC", meta: APP_URL },
      { label: "Mode", value: "D1", meta: "Managed in database" },
    ])}
    <div class="section-grid admin-users-grid">
      <div class="card-shell">
        <div class="section-title">Create admin user</div>
        <form id="createAdminUserForm" class="row g-2">
          <div class="col-12">
            <input id="adminUsername" class="form-control" type="text" placeholder="Username" required />
          </div>
          <div class="col-12">
            <input id="adminPassword" class="form-control" type="text" placeholder="Password" required value="${escapeHtml(state.generatedAdminPassword)}" />
          </div>
          <div class="col-12 d-flex gap-2 flex-wrap">
            <button type="button" id="generateAdminPasswordBtn" class="btn btn-outline-secondary">Generate password</button>
            <button type="button" id="copyAdminCredentialsBtn" class="btn btn-outline-secondary">Copy credentials</button>
          </div>
          <div class="col-12">
            <label class="analytics-check-option">
              <input id="adminCanManageUsers" class="form-check-input" type="checkbox" />
              <span><strong>Can delete/deactivate users</strong><small>Allows LiveChat suspend and HelpDesk delete actions</small></span>
            </label>
          </div>
          <div class="col-12">
            <label class="analytics-check-option">
              <input id="adminCanManageAdmins" class="form-check-input" type="checkbox" />
              <span><strong>Can manage admin accounts</strong><small>Allows permission changes and 2FA resets for others</small></span>
            </label>
          </div>
          <div class="col-12 d-grid">
            <button type="submit" class="btn btn-primary">Create admin</button>
          </div>
        </form>
        <div class="credentials-box mt-3">${escapeHtml(credentialsText || "Generated credentials will appear here for quick copy.")}</div>
      </div>
      <div class="card-shell">
        <div class="section-title">HelpDesk analytics cache</div>
        <p class="subtle mb-3">Clear only the cached HelpDesk analytics tables in D1. Admin users, logs, agents, and teams are not touched.</p>
        <button type="button" id="clearHelpdeskAnalyticsCacheBtn" class="btn btn-outline-danger">Clear HelpDesk analytics cache</button>
      </div>
      <div class="table-shell admin-users-table-shell">
        ${
          state.adminUsers.length
            ? `<div class="table-responsive">
                <table class="table admin-table">
                  <thead><tr><th>Username</th><th>2FA</th><th>Login reset</th><th>Permissions</th><th>Created at</th><th>Created by</th><th></th></tr></thead>
                  <tbody>
                    ${state.adminUsers
                      .map(
                        (user) => `
                          <tr>
                            <td>${escapeHtml(user.username)}</td>
                            <td>${Number(user.totp_enabled) ? "Enabled" : "Setup required"}</td>
                            <td>${Number(user.password_reset_required) ? "Required" : "No"}</td>
                            <td>
                              <label class="permission-check">
                                <input class="form-check-input" type="checkbox" data-admin-permission="canManageUsers" data-admin-username="${escapeHtml(user.username)}" ${Number(user.can_manage_users) ? "checked" : ""} ${canManageAdmins() ? "" : "disabled"} />
                                Users
                              </label>
                              <label class="permission-check">
                                <input class="form-check-input" type="checkbox" data-admin-permission="canManageAdmins" data-admin-username="${escapeHtml(user.username)}" ${Number(user.can_manage_admins) ? "checked" : ""} ${canManageAdmins() ? "" : "disabled"} />
                                Admins
                              </label>
                            </td>
                            <td>${new Date(user.created_at).toLocaleString()}</td>
                            <td>${escapeHtml(user.created_by || "-")}</td>
                            <td>
                              ${(canManageAdmins() || user.username === state.user) ? `<button class="btn btn-sm btn-outline-danger" type="button" data-reset-admin-2fa="${escapeHtml(user.username)}">Reset 2FA</button>` : ""}
                            </td>
                          </tr>
                        `,
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>`
            : '<div class="empty-state">No admin users created in D1 yet. You can still log in with the secret-based fallback admin.</div>'
        }
      </div>
    </div>
  `;
}

function renderNamedList(items, emptyLabel = "None") {
  if (!items?.length) {
    return `<span class="subtle">${emptyLabel}</span>`;
  }

  return items
    .map((item) => {
      const name = item.name || item.email || item.id || "-";
      const priority = item.priority ? ` (${priorityLabel(item.priority)})` : "";
      return `<span class="chip">${escapeHtml(`${name}${priority}`)}</span>`;
    })
    .join("");
}

function formatProfileValue(value, fallback = "Not set") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return `${value}`;
}

function roleLabel(role) {
  if (role === "administrator") {
    return "Administrator";
  }
  if (role === "viceowner") {
    return "Vice owner";
  }
  if (role === "owner") {
    return "Owner";
  }
  if (role === "viewer") {
    return "Viewer";
  }
  return "Normal";
}

function roleBadgeLabel(role) {
  if (role === "administrator") {
    return "Admin";
  }
  if (role === "viceowner") {
    return "Vice owner";
  }
  return "Agent";
}

function initials(value) {
  return `${value || ""}`
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function renderLiveChatProfileCard(agent, currentMembershipMarkup) {
  const avatar = agent.avatar
    ? `<img src="${escapeHtml(agent.avatar)}" alt="" />`
    : `<span>${escapeHtml(initials(agent.name || agent.email) || "LC")}</span>`;

  return `
    <div class="card-shell">
      <div class="section-title">Profile</div>
      <div class="profile-card">
        <div class="profile-hero">
          <div class="profile-photo">${avatar}</div>
          <div>
            <span class="chip">${escapeHtml(roleBadgeLabel(agent.role))}</span>
            <div class="profile-name">${escapeHtml(formatProfileValue(agent.name, agent.email))}</div>
            <div class="subtle">${escapeHtml(formatProfileValue(agent.jobTitle, ""))}</div>
          </div>
        </div>
        <form id="livechatProfileForm" class="profile-form">
          <div>
            <label class="profile-label" for="livechatProfileName">Full name</label>
            <input id="livechatProfileName" class="form-control" type="text" value="${escapeHtml(formatProfileValue(agent.name, ""))}" required />
          </div>
          <div>
            <label class="profile-label" for="livechatProfileEmail">Email</label>
            <input id="livechatProfileEmail" class="form-control" type="email" value="${escapeHtml(agent.email)}" disabled />
          </div>
          <div>
            <label class="profile-label" for="livechatProfileRole">Role</label>
            <select id="livechatProfileRole" class="form-select">
              <option value="normal" ${agent.role === "normal" ? "selected" : ""}>Agent</option>
              <option value="administrator" ${agent.role === "administrator" ? "selected" : ""}>Administrator</option>
              <option value="viceowner" ${agent.role === "viceowner" ? "selected" : ""}>Vice owner</option>
            </select>
          </div>
          <div>
            <label class="profile-label" for="livechatProfileJobTitle">Job title</label>
            <input id="livechatProfileJobTitle" class="form-control" type="text" value="${escapeHtml(formatProfileValue(agent.jobTitle, ""))}" />
          </div>
          <div>
            <label class="profile-label" for="livechatProfileChatLimit">Chat limit</label>
            <input id="livechatProfileChatLimit" class="form-control" type="number" min="0" max="20" step="1" value="${escapeHtml(formatProfileValue(agent.chatLimit, "0"))}" />
          </div>
          <div>
            <label class="profile-label" for="livechatProfileAvatar">Photo URL</label>
            <input id="livechatProfileAvatar" class="form-control" type="url" value="${escapeHtml(formatProfileValue(agent.avatar, ""))}" placeholder="https://..." />
          </div>
          <div class="profile-actions">
            <button class="btn btn-primary" type="submit">Save profile</button>
            ${canManageUsers() ? `<button id="suspendModalLiveChatBtn" class="btn btn-outline-danger" type="button" ${agent.suspended ? "disabled" : ""}>Suspend user</button>` : ""}
          </div>
        </form>
      </div>
      <div class="section-title mt-3">Current memberships</div>
      ${currentMembershipMarkup}
    </div>
  `;
}

function renderLogMetadata(entry) {
  const metadata = entry.metadata || {};
  const rows = [];

  if (entry.actor) {
    rows.push(`
      <div class="log-row">
        <div class="log-label">Changed by</div>
        <div class="log-value">${escapeHtml(entry.actor)}</div>
      </div>
    `);
  }

  if (metadata.groups?.length) {
    rows.push(`
      <div class="log-row">
        <div class="log-label">Groups</div>
        <div class="log-value chip-list">${renderNamedList(metadata.groups)}</div>
      </div>
    `);
  }

  if (metadata.teams?.length) {
    rows.push(`
      <div class="log-row">
        <div class="log-label">Teams</div>
        <div class="log-value chip-list">${renderNamedList(metadata.teams)}</div>
      </div>
    `);
  }

  if (metadata.createdGroups?.length) {
    rows.push(`
      <div class="log-row">
        <div class="log-label">Assigned groups</div>
        <div class="log-value chip-list">${renderNamedList(metadata.createdGroups)}</div>
      </div>
    `);
  }

  if (metadata.createdTeams?.length) {
    rows.push(`
      <div class="log-row">
        <div class="log-label">Assigned teams</div>
        <div class="log-value chip-list">${renderNamedList(metadata.createdTeams)}</div>
      </div>
    `);
  }

  if (metadata.before || metadata.after) {
    rows.push(`
      <div class="log-grid-two">
        <div class="log-row">
          <div class="log-label">Before</div>
          <div class="log-value chip-list">${renderNamedList(metadata.before, "Empty")}</div>
        </div>
        <div class="log-row">
          <div class="log-label">After</div>
          <div class="log-value chip-list">${renderNamedList(metadata.after, "Empty")}</div>
        </div>
      </div>
    `);
  }

  if (metadata.changedAgents?.length) {
    rows.push(`
      <div class="log-row">
        <div class="log-label">Changed users</div>
        <div class="log-value log-stack">
          ${metadata.changedAgents
            .map(
              (agent) => `
                <div class="log-agent-card">
                  <div class="log-agent-email">${escapeHtml(agent.email || agent.id)}</div>
                  <div class="log-grid-two">
                    <div class="log-row">
                      <div class="log-label">Before</div>
                      <div class="log-value chip-list">${renderNamedList(agent.before, "Empty")}</div>
                    </div>
                    <div class="log-row">
                      <div class="log-label">After</div>
                      <div class="log-value chip-list">${renderNamedList(agent.after, "Empty")}</div>
                    </div>
                  </div>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
    `);
  }

  if (metadata.priority) {
    rows.push(`
      <div class="log-row">
        <div class="log-label">Priority</div>
        <div class="log-value">${escapeHtml(priorityLabel(metadata.priority))}</div>
      </div>
    `);
  }

  return rows.length ? `<div class="log-details">${rows.join("")}</div>` : "";
}

function renderLogs() {
  return `
    ${renderStats([
      { label: "Rows", value: state.logs.length, meta: "Loaded from D1" },
      { label: "Status", value: state.logsWarning ? "Warn" : "OK", meta: state.logsWarning || "Logs available" },
      { label: "Area", value: "Audit", meta: "Latest events" },
      { label: "Mode", value: "Read", meta: "Newest first" },
    ])}
    <div class="table-shell">
      ${
        state.logs.length
          ? state.logs
              .map(
                (entry) => `
                  <div class="card-shell mb-2">
                    <div class="chip-list mb-2">
                      <span class="chip">${escapeHtml(entry.area)}</span>
                      <span class="chip">${escapeHtml(entry.action)}</span>
                      <span class="chip">${escapeHtml(entry.status)}</span>
                      <span class="chip">${new Date(entry.created_at).toLocaleString()}</span>
                    </div>
                    <div class="log-target">${escapeHtml(entry.target || "")}</div>
                    <div class="subtle mt-1">${escapeHtml(entry.details || "")}</div>
                    ${renderLogMetadata(entry)}
                  </div>
                `,
              )
              .join("")
          : `<div class="empty-state">${escapeHtml(state.logsWarning || "No logs available.")}</div>`
      }
    </div>
  `;
}

function analyticsPresetLabel(value) {
  const labels = {
    today: "Today",
    yesterday: "Yesterday",
    last_7_days: "Last 7 days",
    last_30_days: "Last 30 days",
    this_week: "This week",
    last_week: "Last week",
    this_month: "This month",
    last_month: "Last month",
    custom: "Custom range",
  };
  return labels[value] || "Last 7 days";
}

function renderAnalyticsFilterBar() {
  const filters = state.analytics.filters;
  const presets = ["today", "yesterday", "last_7_days", "last_30_days", "this_week", "last_week", "this_month", "last_month", "custom"];
  const agentOptions = (state.livechat.agents || [])
    .map((agent) => ({
      id: String(agent.id),
      email: agent.email || agent.id,
      name: agent.name || agent.email || agent.id,
      search: `${agent.email || ""} ${agent.name || ""} ${agent.id || ""}`.toLowerCase(),
    }))
    .sort((left, right) => left.email.localeCompare(right.email));
  const includeSearch = filters.includeSearch.trim().toLowerCase();
  const excludeSearch = filters.excludeSearch.trim().toLowerCase();
  const includeOptions = agentOptions.filter((agent) => !includeSearch || agent.search.includes(includeSearch));
  const excludeOptions = agentOptions.filter((agent) => !excludeSearch || agent.search.includes(excludeSearch));
  const optionMarkup = (agents, selected) =>
    agents
      .map(
        (agent) =>
          `<option value="${escapeHtml(agent.id)}" ${selected.includes(agent.id) ? "selected" : ""}>${escapeHtml(agent.name)} · ${escapeHtml(agent.email)}</option>`,
      )
      .join("");

  return `
    <div class="card-shell analytics-filter-bar">
      <div class="analytics-filter-grid">
        <label>
          <span>Preset</span>
          <select id="analyticsPreset" class="form-select">
            ${presets.map((preset) => `<option value="${preset}" ${filters.preset === preset ? "selected" : ""}>${analyticsPresetLabel(preset)}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>From</span>
          <input id="analyticsFrom" class="form-control" type="date" value="${escapeHtml(isoToDateInput(filters.from))}" />
        </label>
        <label>
          <span>To</span>
          <input id="analyticsTo" class="form-control" type="date" value="${escapeHtml(isoToDateInput(filters.to))}" />
        </label>
        <label>
          <span>Search agents to include</span>
          <input id="analyticsIncludeSearch" class="form-control" type="search" placeholder="Search full name or email" value="${escapeHtml(filters.includeSearch)}" />
        </label>
        <label>
          <span>Include agents</span>
          <select id="analyticsAgents" class="form-select" multiple>
            ${optionMarkup(includeOptions, filters.agents)}
          </select>
        </label>
        <label>
          <span>Search agents to exclude</span>
          <input id="analyticsExcludeSearch" class="form-control" type="search" placeholder="Search full name or email" value="${escapeHtml(filters.excludeSearch)}" />
        </label>
        <label>
          <span>Exclude agents</span>
          <select id="analyticsExcludeAgents" class="form-select" multiple>
            ${optionMarkup(excludeOptions, filters.excludeAgents)}
          </select>
        </label>
      </div>
      <div class="analytics-actions">
        <button id="analyticsPrevBtn" class="btn btn-outline-secondary" type="button">Previous period</button>
        <button id="analyticsNextBtn" class="btn btn-outline-secondary" type="button">Next period</button>
        <button id="analyticsReloadBtn" class="btn btn-primary" type="button">Reload analytics</button>
        <label class="analytics-switch">
          <input id="analyticsCompare" class="form-check-input" type="checkbox" ${filters.compare ? "checked" : ""} />
          <span>Compare</span>
        </label>
      </div>
    </div>
  `;
}

function analyticsDelta(current, previous, { lowerIsBetter = false, formatter = (value) => value } = {}) {
  if (current === null || current === undefined || previous === null || previous === undefined) {
    return { label: "—", tone: "neutral" };
  }
  const diff = Number(current) - Number(previous);
  if (!diff) {
    return { label: "±0", tone: "neutral" };
  }
  const better = lowerIsBetter ? diff < 0 : diff > 0;
  const prefix = diff > 0 ? "+" : "−";
  return {
    label: `${prefix}${formatter(Math.abs(diff))}`,
    tone: better ? "good" : "bad",
  };
}

function renderAnalyticsCard(label, value, previousLabel, delta) {
  const compare = state.analytics.filters.compare;
  return `
    <div class="analytics-card">
      <div class="stats-label">${escapeHtml(label)}</div>
      <div class="stats-value">${value}</div>
      ${
        compare
          ? `<div class="analytics-card-prev">
              <span>prev: ${previousLabel}</span>
              <span class="analytics-delta ${delta.tone}">${escapeHtml(delta.label)}</span>
            </div>`
          : ""
      }
    </div>
  `;
}

function renderAnalyticsCards() {
  const data = state.analytics.data;
  if (!data) {
    return "";
  }
  const summary = data.summary;
  const previous = summary.prev_period || {};

  return `
    <div class="analytics-card-grid">
      ${renderAnalyticsCard(
        "Total chats",
        summary.total_tickets,
        previous.total_tickets ?? "—",
        analyticsDelta(summary.total_tickets, previous.total_tickets),
      )}
      ${renderAnalyticsCard(
        "Avg FTR",
        formatDuration(summary.avg_ftr_ms),
        formatDuration(previous.avg_ftr_ms),
        analyticsDelta(summary.avg_ftr_ms, previous.avg_ftr_ms, { lowerIsBetter: true, formatter: formatDuration }),
      )}
      ${renderAnalyticsCard(
        "Avg CSAT",
        formatCsat(summary.avg_csat),
        formatCsat(previous.avg_csat),
        analyticsDelta(summary.avg_csat, previous.avg_csat, { formatter: formatCsatDelta }),
      )}
      ${renderAnalyticsCard(
        "Active agents",
        summary.active_agents,
        previous.active_agents ?? "—",
        analyticsDelta(summary.active_agents, previous.active_agents),
      )}
    </div>
  `;
}

function renderAnalyticsTop5() {
  const agents = state.analytics.data?.agents || [];
  const medals = ["1", "2", "3", "4", "5"];
  const byChats = [...agents].sort((left, right) => right.total_tickets - left.total_tickets).slice(0, 5);
  const byFtr = [...agents]
    .filter((agent) => agent.avg_ftr_ms !== null && agent.avg_ftr_ms !== undefined)
    .sort((left, right) => left.avg_ftr_ms - right.avg_ftr_ms)
    .slice(0, 5);

  const panel = (title, rows, value) => `
    <div class="top5-panel">
      <div class="section-title">${escapeHtml(title)}</div>
      ${
        rows.length
          ? rows
              .map(
                (agent, index) => `
                  <div class="top5-row">
                    <span class="top5-rank">${medals[index]}</span>
                    <span class="top5-agent">
                      <span class="top5-name">${escapeHtml(analyticsAgentLabel(agent))}</span>
                      ${
                        analyticsAgentSubLabel(agent)
                          ? `<span class="top5-sub">${escapeHtml(analyticsAgentSubLabel(agent))}</span>`
                          : ""
                      }
                    </span>
                    <span class="top5-value">${value(agent)}</span>
                  </div>
                `,
              )
              .join("")
          : '<div class="empty-state">No analytics data for this period.</div>'
      }
    </div>
  `;

  return `
    <div class="analytics-top-grid">
      ${panel("Top 5 by chats", byChats, (agent) => `${agent.total_tickets} chats`)}
      ${panel("Top 5 by fastest Avg FTR", byFtr, (agent) => formatDuration(agent.avg_ftr_ms))}
    </div>
  `;
}

function isoWeekKey(date) {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((copy - yearStart) / 86400000 + 1) / 7);
  return `${copy.getUTCFullYear()} W${padDatePart(weekNo)}`;
}

function analyticsTimelineGroups() {
  const timeline = state.analytics.data?.timeline || [];
  const from = new Date(state.analytics.data?.period?.from || state.analytics.filters.from);
  const to = new Date(state.analytics.data?.period?.to || state.analytics.filters.to);
  const dayCount = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;

  if (dayCount <= 31) {
    return timeline.map((item) => ({
      key: item.date,
      label: new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      chats: item.tickets,
      avg_ftr_ms: item.avg_ftr_ms,
      avg_csat: item.avg_csat,
    }));
  }

  const grouped = new Map();
  timeline.forEach((item) => {
    const key = isoWeekKey(new Date(`${item.date}T12:00:00`));
    const current = grouped.get(key) || { key, label: key, tickets: 0, ftrSum: 0, ftrCount: 0, csatSum: 0, csatCount: 0 };
    current.tickets += item.tickets || 0;
    if (item.avg_ftr_ms !== null && item.first_response_chats) {
      current.ftrSum += item.avg_ftr_ms * item.first_response_chats;
      current.ftrCount += item.first_response_chats;
    }
    if (item.avg_csat !== null && item.rated_chats) {
      current.csatSum += item.avg_csat * item.rated_chats;
      current.csatCount += item.rated_chats;
    }
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).map((item) => ({
    key: item.key,
    label: item.label,
    chats: item.tickets,
    avg_ftr_ms: item.ftrCount ? Math.round(item.ftrSum / item.ftrCount) : null,
    avg_csat: item.csatCount ? Math.round((item.csatSum / item.csatCount) * 10) / 10 : null,
  }));
}

function analyticsAgentGroupCells(agent, groups) {
  const dayMap = new Map((agent.days || []).map((day) => [day.date, day]));
  const weekly = new Map();

  (agent.days || []).forEach((day) => {
    const key = isoWeekKey(new Date(`${day.date}T12:00:00`));
    const current = weekly.get(key) || { chats: 0, ftrSum: 0, ftrCount: 0, csatSum: 0, csatCount: 0 };
    current.chats += day.chats || 0;
    if (day.avg_ftr_ms !== null && day.avg_ftr_ms !== undefined && day.chats) {
      current.ftrSum += day.avg_ftr_ms * day.chats;
      current.ftrCount += day.chats;
    }
    if (day.avg_csat !== null && day.avg_csat !== undefined) {
      current.csatSum += day.avg_csat;
      current.csatCount += 1;
    }
    weekly.set(key, current);
  });

  return groups
    .map((group) => {
      let day = dayMap.get(group.key);
      if (!day && weekly.has(group.key)) {
        const item = weekly.get(group.key);
        day = {
          chats: item.chats,
          avg_ftr_ms: item.ftrCount ? Math.round(item.ftrSum / item.ftrCount) : null,
          avg_csat: item.csatCount ? Math.round((item.csatSum / item.csatCount) * 10) / 10 : null,
        };
      }

      return `
        <td>${day?.chats || "—"}</td>
        <td>${formatDuration(day?.avg_ftr_ms)}</td>
        <td>${formatCsat(day?.avg_csat)}</td>
      `;
    })
    .join("");
}

function sortedAnalyticsAgents() {
  const agents = [...(state.analytics.data?.agents || [])];
  if (state.analytics.sort === "ftr") {
    return agents.sort((left, right) => (left.avg_ftr_ms ?? Number.MAX_SAFE_INTEGER) - (right.avg_ftr_ms ?? Number.MAX_SAFE_INTEGER));
  }
  if (state.analytics.sort === "csat") {
    return agents.sort((left, right) => (right.avg_csat ?? -1) - (left.avg_csat ?? -1));
  }
  return agents.sort((left, right) => right.total_tickets - left.total_tickets || left.email.localeCompare(right.email));
}

function renderAnalyticsLeaderboard() {
  const data = state.analytics.data;
  if (!data) {
    return "";
  }
  const groups = analyticsTimelineGroups();
  const agents = sortedAnalyticsAgents();
  const accountCells = groups
    .map(
      (group) => `
        <td>${group.chats || "—"}</td>
        <td>${formatDuration(group.avg_ftr_ms)}</td>
        <td>${formatCsat(group.avg_csat)}</td>
      `,
    )
    .join("");

  return `
    <div class="table-shell analytics-table-shell">
      <div class="analytics-table-note">
        Daily agent columns are loaded from per-date agents/performance reports and cached in D1; the account timeline row uses account-level report totals.
      </div>
      <div class="table-responsive analytics-leaderboard-wrap">
        <table class="table admin-table analytics-table">
          <thead>
            <tr>
              <th rowspan="2">#</th>
              <th rowspan="2">Agent</th>
              <th rowspan="2"><button type="button" data-analytics-sort="tickets">Total chats</button></th>
              <th rowspan="2"><button type="button" data-analytics-sort="ftr">Avg FTR</button></th>
              <th rowspan="2"><button type="button" data-analytics-sort="csat">Avg CSAT</button></th>
              ${groups.map((group) => `<th colspan="3">${escapeHtml(group.label)}</th>`).join("")}
            </tr>
            <tr>
              ${groups.map(() => "<th>Chats</th><th>FTR</th><th>CSAT</th>").join("")}
            </tr>
          </thead>
          <tbody>
            <tr class="analytics-account-row">
              <td>—</td>
              <td>Account timeline</td>
              <td>${data.summary.total_tickets}</td>
              <td>${formatDuration(data.summary.avg_ftr_ms)}</td>
              <td>${formatCsat(data.summary.avg_csat)}</td>
              ${accountCells}
            </tr>
            ${
              agents.length
                ? agents
                    .map(
                      (agent, index) => `
                        <tr>
                          <td>${index + 1}</td>
                          <td>
                            <div class="analytics-agent-cell">
                              <div class="analytics-agent-copy">
                                <div class="analytics-agent-main">${escapeHtml(analyticsAgentLabel(agent))}</div>
                                ${
                                  analyticsAgentSubLabel(agent)
                                    ? `<div class="analytics-agent-sub">${escapeHtml(analyticsAgentSubLabel(agent))}</div>`
                                    : ""
                                }
                              </div>
                              <button class="btn btn-outline-danger analytics-exclude-btn" type="button" data-analytics-exclude-agent="${escapeHtml(agent.id || agent.email || agent.record_key)}">Exclude</button>
                            </div>
                          </td>
                          <td>${agent.total_tickets}</td>
                          <td>${formatDuration(agent.avg_ftr_ms)}</td>
                          <td>${formatCsat(agent.avg_csat)}</td>
                          ${analyticsAgentGroupCells(agent, groups)}
                        </tr>
                      `,
                    )
                    .join("")
                : `<tr><td colspan="${5 + groups.length * 3}"><div class="empty-state">No agent analytics for this period.</div></td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAnalytics() {
  ensureAnalyticsRange();
  const data = state.analytics.data;
  return `
    ${renderAnalyticsFilterBar()}
    ${
      state.analytics.error
        ? `<div class="empty-state analytics-error">${escapeHtml(state.analytics.error)}</div>`
        : ""
    }
    ${
      state.analytics.loading
        ? `<div class="empty-state">Loading analytics...</div>`
        : data
          ? `
              ${renderAnalyticsCards()}
              ${renderAnalyticsTop5()}
              ${renderAnalyticsLeaderboard()}
            `
          : `<div class="empty-state">Analytics will load automatically.</div>`
    }
  `;
}

// Task 7: Date Helper Functions
function getDateRange(preset) {
  const now = new Date();
  const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nextDayStart = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  const startOfWeek = (date) => {
    const copy = startOfDay(date);
    const day = copy.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    copy.setDate(copy.getDate() + diff);
    return copy;
  };
  let from, to;

  switch (preset) {
    case "today":
      from = startOfDay(now);
      to = now;
      break;
    case "yesterday":
      from = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
      to = nextDayStart(from);
      break;
    case "last_7_days":
      from = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
      to = now;
      break;
    case "last_30_days":
      from = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29));
      to = now;
      break;
    case "this_week":
      from = startOfWeek(now);
      to = now;
      break;
    case "last_week": {
      const thisWeekStart = startOfWeek(now);
      from = new Date(thisWeekStart);
      from.setDate(from.getDate() - 7);
      to = new Date(thisWeekStart);
      break;
    }
    case "this_month":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = now;
      break;
    case "last_month":
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      from = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
      to = now;
  }

  return { from, to };
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function formatDurationHelpdesk(milliseconds) {
  if (!milliseconds || milliseconds <= 0) return "0m";

  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDelta(current, previous) {
  if (previous === 0) return current === 0 ? "0%" : "∞";
  const delta = ((current - previous) / previous) * 100;
  return `${delta > 0 ? "+" : ""}${Math.round(delta)}%`;
}

function helpdeskAgentLabel(agent) {
  const id = String(agent.agent_id || agent.id || "");
  const dashboardAgent = state.helpdesk.agents.find((item) => String(item.id) === id);
  return agent.name || dashboardAgent?.name || agent.email || dashboardAgent?.email || id;
}

function helpdeskAgentSubLabel(agent) {
  const id = String(agent.agent_id || agent.id || "");
  const dashboardAgent = state.helpdesk.agents.find((item) => String(item.id) === id);
  const email = agent.email || dashboardAgent?.email || "";
  const main = helpdeskAgentLabel(agent);
  return email && email !== main ? email : id && id !== main ? id : "";
}

function helpdeskFilterText(item) {
  return `${item.name || ""} ${item.email || ""} ${item.id || ""}`.toLowerCase();
}

function normalizeAgentName(value) {
  return `${value || ""}`.trim().toLowerCase();
}

function defaultHelpdeskAnalyticsAgentIds() {
  const allowed = new Set(DEFAULT_HELPDESK_ANALYTICS_AGENT_NAMES.map(normalizeAgentName));
  const allowedEmails = new Set(DEFAULT_HELPDESK_ANALYTICS_AGENT_EMAILS.map(normalizeAgentName));
  const excludedEmails = new Set(EXCLUDED_DEFAULT_HELPDESK_ANALYTICS_AGENT_EMAILS.map(normalizeAgentName));
  return (state.helpdesk.agents || [])
    .filter((agent) => {
      const email = normalizeAgentName(agent.email);
      return !excludedEmails.has(email) && (allowed.has(normalizeAgentName(agent.name)) || allowedEmails.has(email));
    })
    .map((agent) => String(agent.id));
}

function applyDefaultHelpdeskAnalyticsAgents(force = false) {
  if (!force && state.helpdesk_analytics.defaultAgentsApplied) return;
  const ids = defaultHelpdeskAnalyticsAgentIds();
  if (!ids.length) return;
  state.helpdesk_analytics.filters.agents = ids;
  state.helpdesk_analytics.appliedFilters = cloneHelpdeskAnalyticsFilters();
  state.helpdesk_analytics.defaultAgentsApplied = true;
}

function helpdeskAnalyticsAgentDayMap(agent) {
  return new Map((agent.days || []).map((day) => [day.date, day]));
}

function helpdeskAnalyticsPeriodLabel(filters = activeHelpdeskAnalyticsFilters()) {
  if (!filters.from || !filters.to) return "Selected period";
  return `${localDateValue(filters.from)} to ${localEndDateValue(filters.to)}`;
}

function helpdeskAnalyticsExportDays(filters = activeHelpdeskAnalyticsFilters()) {
  if (!filters.from || !filters.to) return [];
  const days = [];
  const cursor = new Date(filters.from.getFullYear(), filters.from.getMonth(), filters.from.getDate());

  while (cursor < filters.to) {
    days.push(localDateValue(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function helpdeskAnalyticsExportRows() {
  const analytics = state.helpdesk_analytics.data;
  if (!analytics) return { days: [], rows: [], summary: [] };

  const days = helpdeskAnalyticsExportDays();
  const timelineByDate = new Map((analytics.timeline || []).map((day) => [day.date, Number(day.tickets || 0)]));
  const rows = [...(analytics.agents || [])]
    .sort((left, right) => Number(right.total_tickets || 0) - Number(left.total_tickets || 0))
    .map((agent, index) => {
      const dayMap = helpdeskAnalyticsAgentDayMap(agent);
      return {
        rank: index + 1,
        agent: helpdeskAgentLabel(agent),
        email: helpdeskAgentSubLabel(agent),
        total: Number(agent.total_tickets || 0),
        days: days.map((date) => Number(dayMap.get(date)?.tickets || 0)),
      };
    });
  const summary = days.map((date) => Number(timelineByDate.get(date) || 0));

  return { days, rows, summary };
}

function escapeSpreadsheetCell(value) {
  const text = `${value ?? ""}`;
  if (/^[=+\-@]/.test(text)) return `'${text}`;
  return text;
}

function htmlTableForHelpdeskAnalyticsExport() {
  const { days, rows, summary } = helpdeskAnalyticsExportRows();
  const totalTickets = state.helpdesk_analytics.data?.summary?.total_tickets || 0;
  const periodLabel = helpdeskAnalyticsPeriodLabel();
  const headerCells = ["Rank", "Agent", "Email / ID", "Period tickets", ...days]
    .map((value) => `<th>${escapeHtml(value)}</th>`)
    .join("");
  const summaryCells = [
    `<td colspan="3"><strong>Account summary</strong></td>`,
    `<td><strong>${Number(totalTickets || 0)}</strong></td>`,
    ...summary.map((value) => `<td><strong>${value}</strong></td>`),
  ].join("");
  const rowMarkup = rows
    .map((row) => {
      const cells = [
        row.rank,
        escapeSpreadsheetCell(row.agent),
        escapeSpreadsheetCell(row.email),
        row.total,
        ...row.days,
      ];
      return `<tr>${cells.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`;
    })
    .join("");

  return `
    <table>
      <caption>HelpDesk Analytics - ${escapeHtml(periodLabel)}</caption>
      <thead><tr>${headerCells}</tr></thead>
      <tbody>
        <tr>${summaryCells}</tr>
        ${rowMarkup}
      </tbody>
    </table>
  `;
}

function helpdeskAnalyticsExportFilename(extension) {
  return `helpdesk-analytics-${helpdeskAnalyticsPeriodLabel().replaceAll(" ", "-")}.${extension}`;
}

function downloadTextFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function exportHelpdeskAnalyticsExcel() {
  if (!state.helpdesk_analytics.data) {
    setMessage(statusMessage, "Load HelpDesk analytics before exporting.", "error");
    return;
  }

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      table { border-collapse: collapse; font-family: Arial, sans-serif; }
      caption { font-size: 18px; font-weight: 700; padding: 12px; text-align: left; }
      th, td { border: 1px solid #d7deea; padding: 8px 10px; white-space: nowrap; }
      th { background: #eef3ff; font-weight: 700; }
      tbody tr:first-child td { background: #f5f0ff; font-weight: 700; }
    </style>
  </head>
  <body>${htmlTableForHelpdeskAnalyticsExport()}</body>
</html>`;

  downloadTextFile(
    helpdeskAnalyticsExportFilename("xls"),
    `\ufeff${html}`,
    "application/vnd.ms-excel;charset=utf-8",
  );
  setMessage(statusMessage, "HelpDesk analytics Excel export downloaded.");
}

function exportHelpdeskAnalyticsPdf() {
  if (!state.helpdesk_analytics.data) {
    setMessage(statusMessage, "Load HelpDesk analytics before exporting.", "error");
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    setMessage(statusMessage, "Allow pop-ups to export the HelpDesk analytics PDF.", "error");
    return;
  }

  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>HelpDesk Analytics ${escapeHtml(helpdeskAnalyticsPeriodLabel())}</title>
    <style>
      @page { size: landscape; margin: 12mm; }
      body { color: #172033; font-family: Arial, sans-serif; margin: 0; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      .meta { color: #667085; font-size: 12px; margin-bottom: 14px; }
      table { border-collapse: collapse; font-size: 10px; width: 100%; }
      caption { display: none; }
      th, td { border: 1px solid #d7deea; padding: 5px 6px; text-align: left; }
      th { background: #eef3ff; font-weight: 700; }
      tbody tr:first-child td { background: #f5f0ff; font-weight: 700; }
    </style>
  </head>
  <body>
    <h1>HelpDesk Analytics</h1>
    <div class="meta">${escapeHtml(helpdeskAnalyticsPeriodLabel())}</div>
    ${htmlTableForHelpdeskAnalyticsExport()}
    <script>
      window.addEventListener("load", () => {
        window.print();
      });
    <\/script>
  </body>
</html>`);
  printWindow.document.close();
  setMessage(statusMessage, "HelpDesk analytics PDF export opened.");
}

function formatHelpdeskDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatHelpdeskSyncStatus(sync = state.helpdeskSync) {
  if (!sync) return "HelpDesk auto sync: loading...";
  const lastRun = sync.last_success_at || sync.last_finished_at || sync.last_started_at;
  if (!lastRun) return "HelpDesk auto sync: not run yet";
  const date = new Date(lastRun);
  const label = Number.isNaN(date.getTime()) ? lastRun : date.toLocaleString();
  const status = sync.last_status === "error" ? `failed: ${sync.last_error || "unknown error"}` : sync.last_status || "unknown";
  const rows = Number(sync.last_detail_rows || 0);
  return `HelpDesk auto sync: ${label} (${status}, ${rows} ticket rows)`;
}

function renderHelpdeskSyncStatus() {
  if (!syncStatusMessage) return;
  syncStatusMessage.textContent = formatHelpdeskSyncStatus();
  syncStatusMessage.dataset.tone = state.helpdeskSync?.last_status === "error" ? "error" : "info";
}

function plainMessageText(value) {
  return `${value || ""}`.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function cloneHelpdeskAnalyticsFilters(filters = state.helpdesk_analytics.filters) {
  return {
    preset: filters.preset,
    from: filters.from ? new Date(filters.from) : null,
    to: filters.to ? new Date(filters.to) : null,
    agents: [...filters.agents],
    excludeAgents: [...filters.excludeAgents],
    groups: [...filters.groups],
    agentSearch: filters.agentSearch,
    excludeAgentSearch: filters.excludeAgentSearch,
    groupSearch: filters.groupSearch,
  };
}

function activeHelpdeskAnalyticsFilters() {
  return state.helpdesk_analytics.appliedFilters || cloneHelpdeskAnalyticsFilters();
}

function resetHelpdeskAnalyticsFilters() {
  const range = getDateRange("this_month");
  const defaultAgents = defaultHelpdeskAnalyticsAgentIds();
  state.helpdesk_analytics.filters = {
    preset: "this_month",
    from: range.from,
    to: range.to,
    agents: defaultAgents,
    excludeAgents: [],
    groups: [],
    agentSearch: "",
    excludeAgentSearch: "",
    groupSearch: "",
  };
  state.helpdesk_analytics.defaultAgentsApplied = Boolean(defaultAgents.length);
  state.helpdesk_analytics.appliedFilters = cloneHelpdeskAnalyticsFilters();
  fetchHelpdeskAnalytics();
}

function helpdeskAnalyticsDayRanges(from, to) {
  const ranges = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  while (cursor < to) {
    const dayStart = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 0, 0, 0);
    const nextDayStart = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1, 0, 0, 0);
    ranges.push({
      from: new Date(Math.max(dayStart.getTime(), from.getTime())),
      to: new Date(Math.min(nextDayStart.getTime(), to.getTime())),
      cacheFullDay: from <= dayStart && to >= nextDayStart,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return ranges;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mergeHelpdeskAnalyticsResponses(responses, filters) {
  const responseByDate = new Map();
  for (const response of responses) {
    responseByDate.set(response.cache?.date || response.period?.from || String(responseByDate.size), response);
  }

  const agentsById = new Map();
  const timelineByDate = new Map();
  let missingDays = 0;
  let importedDays = 0;
  let cachedDays = 0;

  for (const response of responseByDate.values()) {
    if (response.cache?.missing) missingDays += 1;
    if (response.cache?.saved || response.cache?.source === "helpdesk_import") importedDays += 1;
    if (response.cache?.hit) cachedDays += 1;

    for (const day of response.timeline || []) {
      if (!timelineByDate.has(day.date)) timelineByDate.set(day.date, { date: day.date, tickets: 0 });
      timelineByDate.get(day.date).tickets += Number(day.tickets || 0);
    }

    for (const agent of response.agents || []) {
      const key = String(agent.agent_id || agent.id);
      if (!agentsById.has(key)) {
        agentsById.set(key, {
          ...agent,
          total_tickets: 0,
          days: [],
          tickets: [],
        });
      }
      const current = agentsById.get(key);
      current.name = current.name || agent.name;
      current.email = current.email || agent.email;
      current.total_tickets += Number(agent.total_tickets || 0);
      current.days.push(...(agent.days || []));
      current.tickets.push(...(agent.tickets || []));
    }
  }

  const agents = Array.from(agentsById.values()).sort((left, right) => right.total_tickets - left.total_tickets);
  const totalTickets = agents.reduce((sum, agent) => sum + agent.total_tickets, 0);

  return {
    period: { from: filters.from.toISOString(), to: filters.to.toISOString() },
    summary: {
      total_tickets: totalTickets,
      active_agents: agents.filter((agent) => agent.total_tickets > 0).length,
      prev_period: { total_tickets: 0, active_agents: 0 },
    },
    agents,
    timeline: Array.from(timelineByDate.values()).sort((left, right) => left.date.localeCompare(right.date)),
    cache: { missing_days: missingDays, imported_days: importedDays, cached_days: cachedDays },
    capabilities: responses[0]?.capabilities || {},
  };
}

async function fetchHelpdeskAnalyticsRange(range, filters, depth = 0, importMode = false, rateRetry = 0) {
  if (importMode && depth === 0 && range.cacheFullDay) {
    return importHelpdeskAnalyticsFullDay(range, filters);
  }

  const params = new URLSearchParams();
  params.append("from", dateWithOffset(range.from));
  params.append("to", dateWithOffset(range.to));
  if (filters.agents.length > 0) params.append("agents", filters.agents.join(","));
  if (filters.excludeAgents.length > 0) params.append("exclude_agents", filters.excludeAgents.join(","));
  if (filters.groups.length > 0) params.append("groups", filters.groups.join(","));
  if (range.cacheFullDay) params.append("cache_full_day", "1");
  if (importMode) params.append("import", "1");
  if (importMode && (range.resetDate || (depth === 0 && range.resetDate !== false))) params.append("reset_date", "1");
  params.append("tz_offset", String(new Date().getTimezoneOffset()));

  const dayLabel = range.from.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (importMode) {
    state.helpdesk_analytics.loadStatus = `Importing ${dayLabel} from HelpDesk...`;
    renderHelpdeskAnalytics();
  }

  try {
    const response = await api(`/api/helpdesk/analytics?${params.toString()}`);
    const progress = state.helpdesk_analytics.loadProgress;
    if (progress && depth === 0) {
      if (response.cache?.hit) {
        progress.cacheHits += 1;
      } else if (response.cache?.saved) {
        progress.savedDays += 1;
      } else {
        progress.liveDays += 1;
      }
    }
    return [response];
  } catch (error) {
    const duration = range.to.getTime() - range.from.getTime();
    const isRateLimited = /too many requests|rate limit|429/i.test(error.message || "");
    if (importMode && isRateLimited && rateRetry < 4) {
      const waitMs = 3500 * (rateRetry + 1);
      state.helpdesk_analytics.loadStatus = `HelpDesk is rate limiting imports. Waiting ${Math.round(waitMs / 1000)}s before retry...`;
      renderHelpdeskAnalytics();
      await sleep(waitMs);
      return fetchHelpdeskAnalyticsRange(range, filters, depth, importMode, rateRetry + 1);
    }

    const canRetrySmaller = importMode && /too many tickets|503|service unavailable/i.test(error.message || "");
    if (!canRetrySmaller || duration <= 5 * 1000 || depth >= 20) {
      throw error;
    }

    const middle = new Date(range.from.getTime() + Math.floor(duration / 2));
    state.helpdesk_analytics.loadStatus = "HelpDesk request was too large. Loading a smaller portion...";
    renderHelpdeskAnalytics();
    await sleep(500);
    const first = await fetchHelpdeskAnalyticsRange(
      { from: range.from, to: middle, cacheFullDay: false },
      filters,
      depth + 1,
      importMode,
    );
    await sleep(500);
    const second = await fetchHelpdeskAnalyticsRange(
      { from: middle, to: range.to, cacheFullDay: false },
      filters,
      depth + 1,
      importMode,
    );
    if (depth === 0 && state.helpdesk_analytics.loadProgress) {
      state.helpdesk_analytics.loadProgress.liveDays += 1;
    }
    return [...first, ...second];
  }
}

async function finalizeHelpdeskAnalyticsDay(range, filters) {
  const params = new URLSearchParams();
  params.append("from", dateWithOffset(range.from));
  params.append("to", dateWithOffset(range.to));
  if (filters.agents.length > 0) params.append("agents", filters.agents.join(","));
  if (filters.excludeAgents.length > 0) params.append("exclude_agents", filters.excludeAgents.join(","));
  if (filters.groups.length > 0) params.append("groups", filters.groups.join(","));
  params.append("cache_full_day", "1");
  params.append("finalize_date", "1");
  params.append("tz_offset", String(new Date().getTimezoneOffset()));
  return api(`/api/helpdesk/analytics?${params.toString()}`);
}

function helpdeskImportSliceMs() {
  const minutes = Number(state.helpdesk_analytics.importOptions.sliceMinutes || 10);
  const safeMinutes = [1, 5, 10, 15, 30, 60].includes(minutes) ? minutes : 10;
  return safeMinutes * 60 * 1000;
}

function helpdeskImportConcurrency() {
  const concurrency = Number(state.helpdesk_analytics.importOptions.concurrency || 1);
  return Math.min(6, Math.max(1, Number.isFinite(concurrency) ? Math.floor(concurrency) : 1));
}

async function runHelpdeskImportChunkBatch(chunks, filters, dayLabel, completedOffset = 0) {
  const concurrency = helpdeskImportConcurrency();
  for (let index = 0; index < chunks.length; index += concurrency) {
    const batch = chunks.slice(index, index + concurrency);
    const completed = completedOffset + index;
    state.helpdesk_analytics.loadStatus = `Importing ${dayLabel} from HelpDesk (${completed + 1}-${completed + batch.length}/${completedOffset + chunks.length})...`;
    renderHelpdeskAnalytics();
    await Promise.all(batch.map((chunk) => fetchHelpdeskAnalyticsRange(chunk, filters, 0, true)));
    if (index + concurrency < chunks.length) await sleep(150);
  }
}

async function importHelpdeskAnalyticsFullDay(range, filters) {
  const chunks = [];
  const chunkMs = helpdeskImportSliceMs();
  for (let start = range.from.getTime(); start < range.to.getTime(); start += chunkMs) {
    chunks.push({
      from: new Date(start),
      to: new Date(Math.min(start + chunkMs, range.to.getTime())),
      cacheFullDay: false,
      resetDate: chunks.length === 0,
    });
  }

  const dayLabel = range.from.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const firstChunk = chunks.shift();
  if (firstChunk) {
    state.helpdesk_analytics.loadStatus = `Importing ${dayLabel} from HelpDesk (1/${chunks.length + 1})...`;
    renderHelpdeskAnalytics();
    await fetchHelpdeskAnalyticsRange(firstChunk, filters, 0, true);
  }
  await runHelpdeskImportChunkBatch(chunks, filters, dayLabel, firstChunk ? 1 : 0);

  state.helpdesk_analytics.loadStatus = `Saving ${dayLabel} analytics...`;
  renderHelpdeskAnalytics();
  return [await finalizeHelpdeskAnalyticsDay(range, filters)];
}

async function fetchHelpdeskAnalyticsDayResponses(filters, importMode = false) {
  const ranges = helpdeskAnalyticsDayRanges(filters.from, filters.to);
  const responses = [];

  if (importMode) {
    state.helpdesk_analytics.loadProgress = {
      current: 0,
      total: ranges.length,
      cacheHits: 0,
      savedDays: 0,
      liveDays: 0,
    };
  }

  for (const [index, range] of ranges.entries()) {
    if (importMode) {
      state.helpdesk_analytics.loadProgress.current = index;
      state.helpdesk_analytics.loadStatus = `Preparing import ${index + 1}/${ranges.length}...`;
      renderHelpdeskAnalytics();
    }

    const result = await fetchHelpdeskAnalyticsRange(range, filters, 0, importMode);
    responses.push(...result);

    if (importMode) {
      state.helpdesk_analytics.loadProgress.current = index + 1;
      renderHelpdeskAnalytics();
    }

    if (importMode && index < ranges.length - 1) {
      await sleep(250);
    }
  }

  return responses;
}

function renderHelpdeskAnalyticsLoading(container) {
  const { loadProgress, loadStatus } = state.helpdesk_analytics;
  const total = loadProgress?.total || 0;
  const current = loadProgress?.current || 0;
  const unit = loadProgress?.unit || "days";
  const percent = total ? Math.min(100, Math.round((current / total) * 100)) : 8;
  const cacheHits = loadProgress?.cacheHits || 0;
  const savedDays = loadProgress?.savedDays || 0;
  const liveDays = loadProgress?.liveDays || 0;

  const loadingDiv = document.createElement("div");
  loadingDiv.className = "alert alert-info helpdesk-analytics-loading";
  loadingDiv.innerHTML = `
    <div class="helpdesk-analytics-loading-head">
      <strong>${escapeHtml(loadStatus || "Loading HelpDesk data...")}</strong>
      ${total ? `<span>${current}/${total} ${escapeHtml(unit)}</span>` : ""}
    </div>
    <div class="progress helpdesk-analytics-progress" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100">
      <div class="progress-bar" style="width: ${percent}%"></div>
    </div>
    <div class="helpdesk-analytics-loading-meta">
      <span>D1 hits: ${cacheHits}</span>
      <span>Fetched and saved: ${savedDays}</span>
      <span>Live only: ${liveDays}</span>
    </div>
  `;
  container.appendChild(loadingDiv);
}

// Task 8: Create fetchAnalytics Function for HelpDesk
async function fetchHelpdeskAnalytics() {
  const filters = cloneHelpdeskAnalyticsFilters();
  state.helpdesk_analytics.appliedFilters = filters;
  state.helpdesk_analytics.loading = true;
  state.helpdesk_analytics.error = null;
  state.helpdesk_analytics.data = null;
  state.helpdesk_analytics.loadStatus = "";
  state.helpdesk_analytics.loadProgress = null;
  renderHelpdeskAnalytics();

  try {
    const responses = await fetchHelpdeskAnalyticsDayResponses(filters);
    state.helpdesk_analytics.data = mergeHelpdeskAnalyticsResponses(responses, filters);
    renderHelpdeskAnalytics();
  } catch (error) {
    console.error("Fetch analytics error:", error);
    state.helpdesk_analytics.error = error.message;
    state.helpdesk_analytics.loadStatus = "";
    state.helpdesk_analytics.loadProgress = null;
    renderHelpdeskAnalytics();
  } finally {
    state.helpdesk_analytics.loading = false;
    state.helpdesk_analytics.loadStatus = "";
    state.helpdesk_analytics.loadProgress = null;
    renderHelpdeskAnalytics();
  }
}

async function importHelpdeskAnalytics() {
  const filters = cloneHelpdeskAnalyticsFilters();
  state.helpdesk_analytics.appliedFilters = filters;
  state.helpdesk_analytics.loading = true;
  state.helpdesk_analytics.error = null;
  state.helpdesk_analytics.data = null;
  state.helpdesk_analytics.loadStatus = "Starting HelpDesk import...";
  state.helpdesk_analytics.loadProgress = null;
  renderHelpdeskAnalytics();

  try {
    const responses = await fetchHelpdeskAnalyticsDayResponses(filters, true);
    state.helpdesk_analytics.data = mergeHelpdeskAnalyticsResponses(responses, filters);
    renderHelpdeskAnalytics();
  } catch (error) {
    console.error("Import analytics error:", error);
    state.helpdesk_analytics.error = error.message;
    state.helpdesk_analytics.loadStatus = "";
    state.helpdesk_analytics.loadProgress = null;
    renderHelpdeskAnalytics();
  } finally {
    state.helpdesk_analytics.loading = false;
    state.helpdesk_analytics.loadStatus = "";
    state.helpdesk_analytics.loadProgress = null;
    renderHelpdeskAnalytics();
  }
}

async function openHelpdeskAnalyticsTicket(ticket) {
  try {
    setMessage(statusMessage, "Loading ticket conversation...");
    const params = new URLSearchParams({
      date: ticket.date,
      agent_id: ticket.agent_id,
      short_id: ticket.short_id,
    });
    const response = await api(`/api/helpdesk/analytics-ticket?${params.toString()}`);
    openModal("helpdesk-ticket", response.ticket);
    setMessage(statusMessage, "");
  } catch (error) {
    setMessage(statusMessage, error.message, "error");
  }
}

// Task 9: Create renderAnalytics Function with Filter Bar
function renderHelpdeskAnalytics() {
  const container = document.getElementById("appContent");
  const filterBarContainer = document.getElementById("filterBar");
  const { filters, loading, error, data } = state.helpdesk_analytics;

  if (!filters.from || !filters.to) {
    const range = getDateRange(filters.preset);
    filters.from = range.from;
    filters.to = range.to;
  }

  container.innerHTML = "";
  filterBarContainer.innerHTML = "";
  filterBarContainer.classList.remove("d-none");

  const filterBar = document.createElement("div");
  filterBar.className = "helpdesk-analytics-filters";

  // Preset dropdown
  const presetGroup = document.createElement("div");
  presetGroup.className = "filter-group";
  const presetLabel = document.createElement("label");
  presetLabel.htmlFor = "preset-select";
  presetLabel.className = "form-label";
  presetLabel.textContent = "Period";
  const presetSelect = document.createElement("select");
  presetSelect.id = "preset-select";
  presetSelect.className = "form-select";
  const presets = [
    ["today", "Today"],
    ["yesterday", "Yesterday"],
    ["last_7_days", "Last 7 days"],
    ["last_30_days", "Last 30 days"],
    ["this_week", "This week"],
    ["last_week", "Last week"],
    ["this_month", "This month"],
    ["last_month", "Last month"],
    ["custom", "Custom range"],
  ];
  presetSelect.innerHTML = presets
    .map(([value, label]) => `<option value="${value}" ${filters.preset === value ? "selected" : ""}>${label}</option>`)
    .join("");
  presetGroup.appendChild(presetLabel);
  presetGroup.appendChild(presetSelect);
  filterBar.appendChild(presetGroup);

  // Custom date inputs
  const customDatesDiv = document.createElement("div");
  customDatesDiv.id = "custom-dates";
  customDatesDiv.className = "d-none filter-group";
  const fromLabel = document.createElement("label");
  fromLabel.htmlFor = "from-date";
  fromLabel.className = "form-label";
  fromLabel.textContent = "From";
  const fromInput = document.createElement("input");
  fromInput.type = "date";
  fromInput.id = "from-date";
  fromInput.className = "form-control";
  fromInput.value = filters.from ? localDateValue(filters.from) : "";
  customDatesDiv.appendChild(fromLabel);
  customDatesDiv.appendChild(fromInput);
  filterBar.appendChild(customDatesDiv);

  const customDatesToDiv = document.createElement("div");
  customDatesToDiv.id = "custom-dates-to";
  customDatesToDiv.className = "d-none filter-group";
  const toLabel = document.createElement("label");
  toLabel.htmlFor = "to-date";
  toLabel.className = "form-label";
  toLabel.textContent = "To";
  const toInput = document.createElement("input");
  toInput.type = "date";
  toInput.id = "to-date";
  toInput.className = "form-control";
  toInput.value = filters.to ? localEndDateValue(filters.to) : "";
  customDatesToDiv.appendChild(toLabel);
  customDatesToDiv.appendChild(toInput);
  filterBar.appendChild(customDatesToDiv);

  // Groups filter
  const groupsFilter = document.createElement("div");
  groupsFilter.id = "groups-filter";
  groupsFilter.className = "filter-group";
  const groupsLabel = document.createElement("label");
  groupsLabel.className = "form-label";
  groupsLabel.textContent = "Groups";
  const groupsCheckboxes = document.createElement("div");
  groupsCheckboxes.id = "groups-checkboxes";
  groupsCheckboxes.className = "checkbox-group";
  groupsFilter.appendChild(groupsLabel);
  groupsFilter.appendChild(groupsCheckboxes);
  filterBar.appendChild(groupsFilter);

  // Agents filter
  const agentsFilter = document.createElement("div");
  agentsFilter.id = "agents-filter";
  agentsFilter.className = "filter-group";
  const agentsLabel = document.createElement("label");
  agentsLabel.className = "form-label";
  agentsLabel.textContent = "Agents";
  const agentsCheckboxes = document.createElement("div");
  agentsCheckboxes.id = "agents-checkboxes";
  agentsCheckboxes.className = "checkbox-group";
  agentsFilter.appendChild(agentsLabel);
  agentsFilter.appendChild(agentsCheckboxes);
  filterBar.appendChild(agentsFilter);

  // Exclude agents filter
  const excludeAgentsFilter = document.createElement("div");
  excludeAgentsFilter.id = "exclude-agents-filter";
  excludeAgentsFilter.className = "filter-group";
  const excludeAgentsLabel = document.createElement("label");
  excludeAgentsLabel.className = "form-label";
  excludeAgentsLabel.textContent = "Exclude agents";
  const excludeAgentsCheckboxes = document.createElement("div");
  excludeAgentsCheckboxes.id = "exclude-agents-checkboxes";
  excludeAgentsCheckboxes.className = "checkbox-group";
  excludeAgentsFilter.appendChild(excludeAgentsLabel);
  excludeAgentsFilter.appendChild(excludeAgentsCheckboxes);
  filterBar.appendChild(excludeAgentsFilter);

  filterBarContainer.appendChild(filterBar);

  const actionBar = document.createElement("div");
  actionBar.className = "helpdesk-analytics-actions";
  const importOptions = state.helpdesk_analytics.importOptions;
  actionBar.innerHTML = `
    <button id="helpdeskAnalyticsApplyBtn" class="btn btn-primary" type="button">Filter</button>
    <button id="helpdeskAnalyticsImportBtn" class="btn btn-outline-primary" type="button">Import from HelpDesk</button>
    <label class="helpdesk-import-option">
      <span>Slice</span>
      <select id="helpdeskImportSlice" class="form-select form-select-sm">
        ${[1, 5, 10, 15, 30, 60]
          .map((minutes) => `<option value="${minutes}" ${Number(importOptions.sliceMinutes) === minutes ? "selected" : ""}>${minutes} min</option>`)
          .join("")}
      </select>
    </label>
    <label class="helpdesk-import-option">
      <span>At once</span>
      <select id="helpdeskImportConcurrency" class="form-select form-select-sm">
        ${[1, 2, 3, 4, 5, 6]
          .map((count) => `<option value="${count}" ${Number(importOptions.concurrency) === count ? "selected" : ""}>${count}</option>`)
          .join("")}
      </select>
    </label>
    <button id="helpdeskAnalyticsPdfBtn" class="btn btn-outline-secondary" type="button" ${data ? "" : "disabled"}>Export PDF</button>
    <button id="helpdeskAnalyticsExcelBtn" class="btn btn-outline-secondary" type="button" ${data ? "" : "disabled"}>Export Excel</button>
    <button id="helpdeskAnalyticsResetBtn" class="btn btn-outline-secondary" type="button">Reset filters</button>
  `;
  filterBarContainer.appendChild(actionBar);

  // Wire up event handlers
  presetSelect.addEventListener("change", (e) => {
    filters.preset = e.target.value;
    const customDates = document.getElementById("custom-dates");
    const customDatesTo = document.getElementById("custom-dates-to");
    if (e.target.value === "custom") {
      customDates.classList.remove("d-none");
      customDatesTo.classList.remove("d-none");
    } else {
      customDates.classList.add("d-none");
      customDatesTo.classList.add("d-none");
      const range = getDateRange(e.target.value);
      filters.from = range.from;
      filters.to = range.to;
      renderHelpdeskAnalytics();
    }
  });

  document.getElementById("from-date")?.addEventListener("change", (e) => {
    filters.from = e.target.value ? new Date(`${e.target.value}T00:00:00`) : null;
    renderHelpdeskAnalytics();
  });

  document.getElementById("to-date")?.addEventListener("change", (e) => {
    if (e.target.value) {
      const selected = new Date(`${e.target.value}T00:00:00`);
      selected.setDate(selected.getDate() + 1);
      filters.to = selected;
    } else {
      filters.to = null;
    }
    renderHelpdeskAnalytics();
  });

  if (filters.preset === "custom") {
    customDatesDiv.classList.remove("d-none");
    customDatesToDiv.classList.remove("d-none");
  }

  document.getElementById("helpdeskAnalyticsApplyBtn")?.addEventListener("click", () => {
    fetchHelpdeskAnalytics();
  });
  document.getElementById("helpdeskAnalyticsImportBtn")?.addEventListener("click", () => {
    importHelpdeskAnalytics();
  });
  document.getElementById("helpdeskImportSlice")?.addEventListener("change", (event) => {
    state.helpdesk_analytics.importOptions.sliceMinutes = Number(event.target.value || 10);
  });
  document.getElementById("helpdeskImportConcurrency")?.addEventListener("change", (event) => {
    state.helpdesk_analytics.importOptions.concurrency = Number(event.target.value || 1);
  });
  document.getElementById("helpdeskAnalyticsPdfBtn")?.addEventListener("click", () => {
    exportHelpdeskAnalyticsPdf();
  });
  document.getElementById("helpdeskAnalyticsExcelBtn")?.addEventListener("click", () => {
    exportHelpdeskAnalyticsExcel();
  });
  document.getElementById("helpdeskAnalyticsResetBtn")?.addEventListener("click", () => {
    resetHelpdeskAnalyticsFilters();
  });

  renderFiltersConditional();

  if (loading) {
    if (state.helpdesk_analytics.loadProgress) {
      renderHelpdeskAnalyticsLoading(container);
    }
  }

  // Render data sections if available
  if (data) {
    if (!loading && data.cache?.missing_days) {
      const missingDiv = document.createElement("div");
      missingDiv.className = "alert alert-warning";
      missingDiv.textContent = `${data.cache.missing_days} selected day(s) are not imported into D1 yet. Click "Import from HelpDesk" to load and save them.`;
      container.appendChild(missingDiv);
    }
    renderMetricsAndPanels();
    renderLeaderboard();
  } else if (loading) {
  } else if (error) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "alert alert-danger";
    errorDiv.textContent = `Error: ${error}`;
    container.appendChild(errorDiv);
  }
}

function renderFiltersConditional() {
  const agentsFilter = document.getElementById("agents-filter");
  const excludeAgentsFilter = document.getElementById("exclude-agents-filter");
  const groupsFilter = document.getElementById("groups-filter");
  const {
    agents: selectedAgents,
    excludeAgents: selectedExcludeAgents,
    groups: selectedGroups,
    agentSearch,
    excludeAgentSearch,
    groupSearch,
  } = state.helpdesk_analytics.filters;

  agentsFilter.classList.remove("d-none");
  excludeAgentsFilter.classList.remove("d-none");
  groupsFilter.classList.remove("d-none");

  const renderChecklist = ({ rootId, searchId, searchValue, items, selected, emptyText, nameFor, subFor }) => {
    const root = document.getElementById(rootId);
    root.innerHTML = `
      <input id="${searchId}" class="form-control form-control-sm analytics-filter-search" type="search" placeholder="Search" value="${escapeHtml(searchValue)}" />
      <div class="analytics-checklist">
        ${
          items.length
            ? items
                .map((item) => `
                  <label class="analytics-check-option">
                    <input class="form-check-input" type="checkbox" value="${escapeHtml(item.id)}" ${selected.includes(String(item.id)) ? "checked" : ""} />
                    <span>
                      <strong>${escapeHtml(nameFor(item))}</strong>
                      ${subFor(item) ? `<small>${escapeHtml(subFor(item))}</small>` : ""}
                    </span>
                  </label>
                `)
                .join("")
            : `<div class="empty-state analytics-filter-empty">${escapeHtml(emptyText)}</div>`
        }
      </div>
    `;
  };

  const normalizedAgentSearch = agentSearch.trim().toLowerCase();
  const visibleAgents = (state.helpdesk.agents || []).filter((agent) =>
    !normalizedAgentSearch || helpdeskFilterText(agent).includes(normalizedAgentSearch),
  );
  renderChecklist({
    rootId: "agents-checkboxes",
    searchId: "helpdeskAnalyticsAgentSearch",
    searchValue: agentSearch,
    items: visibleAgents,
    selected: selectedAgents,
    emptyText: "No agents match this search.",
    nameFor: (agent) => agent.name || agent.email || agent.id,
    subFor: (agent) => agent.email && agent.email !== agent.name ? agent.email : "",
  });

  const normalizedExcludeAgentSearch = excludeAgentSearch.trim().toLowerCase();
  const visibleExcludeAgents = (state.helpdesk.agents || []).filter((agent) =>
    !normalizedExcludeAgentSearch || helpdeskFilterText(agent).includes(normalizedExcludeAgentSearch),
  );
  renderChecklist({
    rootId: "exclude-agents-checkboxes",
    searchId: "helpdeskAnalyticsExcludeAgentSearch",
    searchValue: excludeAgentSearch,
    items: visibleExcludeAgents,
    selected: selectedExcludeAgents,
    emptyText: "No agents match this search.",
    nameFor: (agent) => agent.name || agent.email || agent.id,
    subFor: (agent) => agent.email && agent.email !== agent.name ? agent.email : "",
  });

  const normalizedGroupSearch = groupSearch.trim().toLowerCase();
  const visibleGroups = (state.helpdesk.teams || []).filter((group) =>
    !normalizedGroupSearch || helpdeskFilterText(group).includes(normalizedGroupSearch),
  );
  renderChecklist({
    rootId: "groups-checkboxes",
    searchId: "helpdeskAnalyticsGroupSearch",
    searchValue: groupSearch,
    items: visibleGroups,
    selected: selectedGroups,
    emptyText: "No groups match this search.",
    nameFor: (group) => group.name || group.id,
    subFor: () => "",
  });

  document.getElementById("helpdeskAnalyticsAgentSearch")?.addEventListener("input", (event) => {
    state.helpdesk_analytics.filters.agentSearch = event.target.value;
    rerenderPreservingInput("helpdeskAnalyticsAgentSearch");
  });
  document.getElementById("helpdeskAnalyticsExcludeAgentSearch")?.addEventListener("input", (event) => {
    state.helpdesk_analytics.filters.excludeAgentSearch = event.target.value;
    rerenderPreservingInput("helpdeskAnalyticsExcludeAgentSearch");
  });
  document.getElementById("helpdeskAnalyticsGroupSearch")?.addEventListener("input", (event) => {
    state.helpdesk_analytics.filters.groupSearch = event.target.value;
    rerenderPreservingInput("helpdeskAnalyticsGroupSearch");
  });

  document.querySelectorAll("#agents-checkboxes input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const visibleSelected = Array.from(document.querySelectorAll("#agents-checkboxes input[type='checkbox']:checked")).map(
        (input) => input.value,
      );
      const hiddenSelected = selectedAgents.filter((id) => !visibleAgents.some((agent) => String(agent.id) === String(id)));
      state.helpdesk_analytics.filters.agents = [...new Set([...hiddenSelected, ...visibleSelected])];
      renderHelpdeskAnalytics();
    });
  });

  document.querySelectorAll("#exclude-agents-checkboxes input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const visibleSelected = Array.from(document.querySelectorAll("#exclude-agents-checkboxes input[type='checkbox']:checked")).map(
        (input) => input.value,
      );
      const hiddenSelected = selectedExcludeAgents.filter((id) =>
        !visibleExcludeAgents.some((agent) => String(agent.id) === String(id)),
      );
      state.helpdesk_analytics.filters.excludeAgents = [...new Set([...hiddenSelected, ...visibleSelected])];
      renderHelpdeskAnalytics();
    });
  });

  document.querySelectorAll("#groups-checkboxes input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const visibleSelected = Array.from(document.querySelectorAll("#groups-checkboxes input[type='checkbox']:checked")).map(
        (input) => input.value,
      );
      const hiddenSelected = selectedGroups.filter((id) => !visibleGroups.some((group) => String(group.id) === String(id)));
      state.helpdesk_analytics.filters.groups = [...new Set([...hiddenSelected, ...visibleSelected])];
      renderHelpdeskAnalytics();
    });
  });
}

function renderMetricsAndPanels() {
  if (!state.helpdesk_analytics.data) return;

  const { summary } = state.helpdesk_analytics.data;
  const container = document.getElementById("appContent");

  const currentSummary = summary;

  const metricsRow = document.createElement("div");
  metricsRow.className = "metrics-row d-flex gap-4 mb-5 flex-wrap";

  function createMetricCard(title, value) {
    const card = document.createElement("div");
    card.className = "analytics-card";

    const cardValue = document.createElement("div");
    cardValue.className = "card-value";
    cardValue.textContent = value;

    const divider = document.createElement("hr");
    divider.className = "card-divider";

    const cardTitle = document.createElement("div");
    cardTitle.className = "card-title";
    cardTitle.textContent = title;

    card.appendChild(cardValue);
    card.appendChild(divider);
    card.appendChild(cardTitle);
    return card;
  }

  metricsRow.appendChild(createMetricCard(
    "Processed Tickets",
    currentSummary.total_tickets
  ));
  metricsRow.appendChild(createMetricCard(
    "Active Agents",
    currentSummary.active_agents
  ));

  const metricsSection = document.createElement("div");
  metricsSection.className = "metrics-section";
  container.appendChild(metricsSection);
  metricsSection.appendChild(metricsRow);

  const top5Row = document.createElement("div");
  top5Row.className = "top5-row d-flex gap-4 mb-5 flex-wrap";

  const top5TicketsPanel = document.createElement("div");
  top5TicketsPanel.className = "top5-panel";
  const top5TicketsTitle = document.createElement("h6");
  top5TicketsTitle.textContent = "Top 5 by Processed Tickets";
  top5TicketsPanel.appendChild(top5TicketsTitle);

  const top5TicketsList = document.createElement("ul");
  top5TicketsList.className = "list-unstyled";
  state.helpdesk_analytics.data.agents
    .sort((a, b) => b.total_tickets - a.total_tickets)
    .slice(0, 5)
    .forEach((agent) => {
      const li = document.createElement("li");
      li.textContent = `${helpdeskAgentLabel(agent)} — ${agent.total_tickets} tickets`;
      top5TicketsList.appendChild(li);
    });
  top5TicketsPanel.appendChild(top5TicketsList);
  top5Row.appendChild(top5TicketsPanel);

  metricsSection.appendChild(top5Row);
}

function renderLeaderboard() {
  if (!state.helpdesk_analytics.data) return;

  const { data: analytics } = state.helpdesk_analytics;
  const filters = activeHelpdeskAnalyticsFilters();
  const container = document.getElementById("appContent");
  const timelineByDate = new Map((analytics.timeline || []).map((day) => [day.date, day]));
  const from = filters.from || new Date(analytics.period.from);
  const to = filters.to || new Date(analytics.period.to);
  const rangeDays = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  while (cursor < to) {
    const key = localDateValue(cursor);
    rangeDays.push({
      date: key,
      label: cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const useWeekly = rangeDays.length > 31;
  const columnHeaders = useWeekly
    ? Array.from(
        rangeDays.reduce((weeks, day) => {
          const date = new Date(`${day.date}T00:00:00`);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7));
          const key = localDateValue(weekStart);
          if (!weeks.has(key)) {
            weeks.set(key, { label: `Week of ${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`, days: [] });
          }
          weeks.get(key).days.push(timelineByDate.get(day.date) || { date: day.date, tickets: 0 });
          return weeks;
        }, new Map()).values(),
      )
    : rangeDays.map((day) => ({
        label: day.label,
        days: [timelineByDate.get(day.date) || { date: day.date, tickets: 0 }],
      }));

  const sortedAgents = [...(analytics.agents || [])].sort((a, b) => b.total_tickets - a.total_tickets);
  const summarizeDays = (days) => {
    const tickets = days.reduce((sum, day) => sum + (day.tickets || 0), 0);
    return { tickets };
  };
  const tableColumnCount = 4 + columnHeaders.length;

  const wrapper = document.createElement("div");
  wrapper.className = "leaderboard-wrapper helpdesk-leaderboard-wrapper";

  const table = document.createElement("table");
  table.className = "leaderboard-table helpdesk-leaderboard-table";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  const th0 = document.createElement("th");
  th0.className = "col-action sticky-left";
  th0.rowSpan = 2;
  th0.textContent = "Action";
  const th1 = document.createElement("th");
  th1.className = "col-rank sticky-left";
  th1.rowSpan = 2;
  th1.textContent = "Rank";
  const th2 = document.createElement("th");
  th2.className = "col-agent sticky-left";
  th2.rowSpan = 2;
  th2.textContent = "Agent";
  const th3 = document.createElement("th");
  th3.className = "col-tickets sticky-left";
  th3.rowSpan = 2;
  th3.textContent = "Processed Tickets";

  headerRow.appendChild(th0);
  headerRow.appendChild(th1);
  headerRow.appendChild(th2);
  headerRow.appendChild(th3);

  columnHeaders.forEach((col) => {
    const th = document.createElement("th");
    th.className = "col-period";
    th.colSpan = 1;
    th.textContent = col.label;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  const subHeaderRow = document.createElement("tr");
  columnHeaders.forEach(() => {
    const th = document.createElement("th");
    th.className = "col-period-sub";
    th.textContent = "Tickets";
    subHeaderRow.appendChild(th);
  });
  thead.appendChild(subHeaderRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  const summaryRow = document.createElement("tr");
  summaryRow.className = "summary-row";
  const summaryCell = document.createElement("td");
  summaryCell.colSpan = 4;
  summaryCell.style.fontWeight = "600";
  summaryCell.textContent = "Account Summary";
  summaryRow.appendChild(summaryCell);

  columnHeaders.forEach((col) => {
    const dayData = summarizeDays(col.days);
    const td = document.createElement("td");
    td.className = "col-period";
    td.textContent = dayData.tickets;
    summaryRow.appendChild(td);
  });
  tbody.appendChild(summaryRow);

  sortedAgents.forEach((agent, index) => {
    const rank = index + 1;
    const rankLabel = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : String(rank);

    const row = document.createElement("tr");
    const expanded = state.helpdesk_analytics.expandedAgents.has(String(agent.agent_id || agent.id));

    const actionCell = document.createElement("td");
    actionCell.className = "col-action sticky-left";
    actionCell.innerHTML = `
      <button class="btn btn-sm btn-outline-secondary analytics-agent-toggle" type="button" data-helpdesk-agent-toggle="${escapeHtml(agent.agent_id || agent.id)}">
        ${expanded ? "Hide" : "Open"}
      </button>
    `;
    row.appendChild(actionCell);

    const rankCell = document.createElement("td");
    rankCell.className = "col-rank sticky-left";
    rankCell.textContent = rankLabel;
    row.appendChild(rankCell);

    const agentCell = document.createElement("td");
    agentCell.className = "col-agent sticky-left";
    agentCell.innerHTML = `
      <div class="analytics-agent-cell">
        <div class="analytics-agent-copy">
          <div class="analytics-agent-main">${escapeHtml(helpdeskAgentLabel(agent))}</div>
          ${helpdeskAgentSubLabel(agent) ? `<div class="analytics-agent-sub">${escapeHtml(helpdeskAgentSubLabel(agent))}</div>` : ""}
        </div>
      </div>
    `;
    row.appendChild(agentCell);

    const ticketsCell = document.createElement("td");
    ticketsCell.className = "col-tickets sticky-left";
    const ticketsBold = document.createElement("strong");
    ticketsBold.textContent = agent.total_tickets;
    ticketsCell.appendChild(ticketsBold);
    row.appendChild(ticketsCell);

    const dayMap = helpdeskAnalyticsAgentDayMap(agent);
    columnHeaders.forEach((col) => {
      const agentDays = col.days.map((day) => dayMap.get(day.date)).filter(Boolean);
      const dayData = summarizeDays(agentDays);
      const td = document.createElement("td");
      td.className = "col-period";
      td.textContent = dayData.tickets || "—";
      row.appendChild(td);
    });

    tbody.appendChild(row);

    if (expanded) {
      const detailRow = document.createElement("tr");
      detailRow.className = "analytics-agent-detail-row";
      const detailCell = document.createElement("td");
      detailCell.colSpan = tableColumnCount;
      detailCell.innerHTML = renderHelpdeskAgentTicketDetails(agent);
      detailRow.appendChild(detailCell);
      tbody.appendChild(detailRow);
    }
  });

  table.appendChild(tbody);
  wrapper.appendChild(table);
  let leaderboardSection = container.querySelector(".leaderboard-section");
  if (!leaderboardSection) {
    leaderboardSection = document.createElement("div");
    leaderboardSection.className = "leaderboard-section";
    container.appendChild(leaderboardSection);
  }
  leaderboardSection.appendChild(wrapper);

  leaderboardSection.querySelectorAll("[data-helpdesk-agent-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const agentId = String(button.dataset.helpdeskAgentToggle || "");
      if (state.helpdesk_analytics.expandedAgents.has(agentId)) {
        state.helpdesk_analytics.expandedAgents.delete(agentId);
      } else {
        state.helpdesk_analytics.expandedAgents.add(agentId);
      }
      renderHelpdeskAnalytics();
    });
  });

  leaderboardSection.querySelectorAll("[data-helpdesk-ticket-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const agent = sortedAgents.find((item) => String(item.agent_id || item.id) === String(button.dataset.agentId));
      const ticket = (agent?.tickets || []).find(
        (item) => item.date === button.dataset.date && item.short_id === button.dataset.shortId,
      );
      if (ticket) openHelpdeskAnalyticsTicket(ticket);
    });
  });
}

function renderHelpdeskAgentTicketDetails(agent) {
  const tickets = [...(agent.tickets || [])].sort((left, right) =>
    (right.last_public_reply_at || "").localeCompare(left.last_public_reply_at || ""),
  );

  if (!tickets.length) {
    return `<div class="empty-state">No cached ticket details for this agent. Import the selected period from HelpDesk to load evidence rows.</div>`;
  }

  return `
    <div class="analytics-ticket-detail">
      <div class="analytics-ticket-detail-title">${escapeHtml(helpdeskAgentLabel(agent))} handled tickets</div>
      <div class="analytics-ticket-table-wrap">
        <table class="analytics-ticket-table">
          <thead>
            <tr>
              <th>Open</th>
              <th>Ticket</th>
              <th>Agent replies</th>
              <th>Incoming messages</th>
              <th>Created</th>
              <th>Solved</th>
              <th>Closed</th>
              <th>Last agent reply</th>
            </tr>
          </thead>
          <tbody>
            ${tickets
              .map(
                (ticket) => `
                  <tr>
                    <td>
                      <button
                        class="btn btn-sm btn-outline-primary"
                        type="button"
                        data-helpdesk-ticket-open="${escapeHtml(ticket.short_id)}"
                        data-agent-id="${escapeHtml(ticket.agent_id)}"
                        data-date="${escapeHtml(ticket.date)}"
                        data-short-id="${escapeHtml(ticket.short_id)}"
                      >Chat</button>
                    </td>
                    <td>
                      <a href="${escapeHtml(ticket.ticket_link || "#")}" target="_blank" rel="noreferrer">${escapeHtml(ticket.short_id || ticket.ticket_id || "-")}</a>
                      ${ticket.subject ? `<div class="analytics-agent-sub">${escapeHtml(ticket.subject)}</div>` : ""}
                    </td>
                    <td>${Number(ticket.agent_reply_count || 0)}</td>
                    <td>${Number(ticket.incoming_message_count || 0)}</td>
                    <td>${escapeHtml(formatHelpdeskDateTime(ticket.ticket_created_at))}</td>
                    <td>${escapeHtml(formatHelpdeskDateTime(ticket.ticket_solved_at))}</td>
                    <td>${escapeHtml(formatHelpdeskDateTime(ticket.ticket_closed_at))}</td>
                    <td>${escapeHtml(formatHelpdeskDateTime(ticket.last_public_reply_at))}</td>
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

async function fetchAnalytics() {
  ensureAnalyticsRange();
  state.analytics.loading = true;
  state.analytics.error = null;
  renderApp();

  const filters = state.analytics.filters;
  const params = new URLSearchParams({
    from: filters.from,
    to: filters.to,
  });
  if (filters.agents.length) {
    params.set("agents", filters.agents.join(","));
  }
  if (filters.excludeAgents.length) {
    params.set("exclude_agents", filters.excludeAgents.join(","));
  }

  try {
    state.analytics.data = await api(`/api/livechat/analytics?${params}`);
  } catch (error) {
    state.analytics.error = error.message;
  } finally {
    state.analytics.loading = false;
    renderApp();
  }
}

async function fetchHelpdeskSyncStatus() {
  const response = await api("/api/helpdesk/analytics-sync");
  state.helpdeskSync = response.sync || null;
  renderHelpdeskSyncStatus();
}

async function runHelpdeskAutoSync({ force = false } = {}) {
  if (state.helpdeskSyncInFlight) return;
  const lastRun = state.helpdeskSync?.last_started_at || state.helpdeskSync?.last_finished_at || state.helpdeskSync?.last_success_at;
  const lastRunDate = lastRun ? new Date(lastRun) : null;
  const isDue = force || !lastRunDate || Number.isNaN(lastRunDate.getTime()) || Date.now() - lastRunDate.getTime() >= 30 * 60 * 1000;
  if (!isDue) return;

  state.helpdeskSyncInFlight = true;
  try {
    const response = await api("/api/helpdesk/analytics-sync", {
      method: "POST",
      body: {
        windowMinutes: 35,
        overlapMinutes: 5,
        tzOffset: new Date().getTimezoneOffset(),
      },
    });
    state.helpdeskSync = response.sync || null;
  } catch (error) {
    state.helpdeskSync = {
      ...(state.helpdeskSync || {}),
      last_status: "error",
      last_error: error.message,
      last_finished_at: new Date().toISOString(),
    };
  } finally {
    state.helpdeskSyncInFlight = false;
    renderHelpdeskSyncStatus();
  }
}

function startHelpdeskAutoSync() {
  if (state.helpdeskSyncTimer) return;
  state.helpdeskSyncTimer = setInterval(() => {
    runHelpdeskAutoSync();
  }, 30 * 60 * 1000);
}

function currentSectionTitle() {
  const titles = {
    "livechat-users": "LiveChat Users",
    "livechat-groups": "LiveChat Groups",
    "create-livechat-user": "Create LiveChat User",
    "livechat-analytics": "LiveChat Analytics",
    "helpdesk-users": "HelpDesk Users",
    "helpdesk-groups": "HelpDesk Groups",
    "create-helpdesk-user": "Create HelpDesk User",
    "helpdesk-analytics": "HelpDesk Analytics",
    "admin-users": "Admin Users",
    logs: "Logs",
  };
  return titles[state.section] || "LC Admin";
}

function renderModal() {
  if (!state.modalOpen || !state.modalAgent) {
    modalRoot.innerHTML = "";
    return;
  }

  if (state.modalType === "helpdesk-ticket") {
    const ticket = state.modalAgent;
    const events = ticket.conversation || [];
    modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card helpdesk-chat-modal">
          <div class="modal-head">
            <div>
              <div class="modal-title">Ticket ${escapeHtml(ticket.short_id || ticket.ticket_id || "")}</div>
              <div class="subtle">
                ${escapeHtml(ticket.subject || "Conversation evidence")}
                ${ticket.ticket_link ? ` · <a href="${escapeHtml(ticket.ticket_link)}" target="_blank" rel="noreferrer">Open ticket</a>` : ""}
              </div>
            </div>
            <button id="closeModalBtn" class="btn btn-sm btn-outline-secondary" type="button">Close</button>
          </div>
          <div class="helpdesk-ticket-summary">
            <span>Agent replies: <strong>${Number(ticket.agent_reply_count || 0)}</strong></span>
            <span>Incoming messages: <strong>${Number(ticket.incoming_message_count || 0)}</strong></span>
            <span>Created: <strong>${escapeHtml(formatHelpdeskDateTime(ticket.ticket_created_at))}</strong></span>
            <span>Solved: <strong>${escapeHtml(formatHelpdeskDateTime(ticket.ticket_solved_at))}</strong></span>
            <span>Closed: <strong>${escapeHtml(formatHelpdeskDateTime(ticket.ticket_closed_at))}</strong></span>
          </div>
          <div class="helpdesk-chat-thread">
            ${
              events.length
                ? events
                    .map((event) => {
                      const authorType = event.author_type || "system";
                      const isAgent = authorType === "agent";
                      const isPrivate = Boolean(event.is_private);
                      const isSystem = authorType === "system" || (!event.text && !event.html);
                      const message = plainMessageText(event.text || event.html) || event.status || event.type || "System event";
                      return `
                        <div class="helpdesk-chat-event ${isAgent ? "agent" : ""} ${isPrivate ? "private" : ""} ${isSystem ? "system" : ""}">
                          <div class="helpdesk-chat-meta">
                            <strong>${escapeHtml(event.author_name || authorType)}</strong>
                            <span>${escapeHtml(authorType)}${isPrivate ? " · internal/private" : ""}</span>
                            <span>${escapeHtml(formatHelpdeskDateTime(event.date))}</span>
                          </div>
                          <div class="helpdesk-chat-bubble">${escapeHtml(message)}</div>
                        </div>
                      `;
                    })
                    .join("")
                : '<div class="empty-state">No conversation events were stored for this ticket.</div>'
            }
          </div>
        </div>
      </div>
    `;
    return;
  }

  const isLiveChatUser = state.modalType === "livechat";
  const isHelpDeskUser = state.modalType === "helpdesk";
  const isLiveChatGroup = state.modalType === "livechat-group";
  const isHelpDeskGroup = state.modalType === "helpdesk-group";
  const isGroupModal = isLiveChatGroup || isHelpDeskGroup;
  const allItems = isLiveChatUser ? state.livechat.groups : isHelpDeskUser ? state.helpdesk.teams : [];
  const filteredItems = filterByName(allItems, state.modalSearch);
  const selectedMap = isLiveChatUser
    ? new Map(state.modalAgent.groups.map((group) => [String(group.id), group.priority]))
    : isHelpDeskUser
      ? new Set(state.modalAgent.teams.map((team) => String(team.id)))
      : null;
  const filteredMembers = isGroupModal
    ? state.modalAgent.members.filter((member) =>
        `${member.email} ${member.priority || ""}`.toLowerCase().includes(state.modalSearch.trim().toLowerCase()),
      )
    : [];
  const currentMembershipMarkup = isLiveChatUser
    ? renderMembershipTable(
        state.modalAgent.groups.map(
          (group) => `
            <tr>
              <td>${escapeHtml(group.name)}</td>
              <td>${priorityLabel(group.priority)}</td>
            </tr>
          `,
        ),
        ["Group", "Priority"],
        "No active groups on this user.",
      )
    : isHelpDeskUser
      ? renderMembershipTable(
          state.modalAgent.teams.map(
            (team) => `
              <tr>
                <td>${escapeHtml(team.name)}</td>
              </tr>
            `,
          ),
          ["Group"],
          "No active groups on this user.",
        )
      : isLiveChatGroup
        ? renderMembershipTable(
            filteredMembers.map(
              (member) => `
                <tr>
                  <td><input type="checkbox" class="form-check-input" name="modal-livechat-agent" value="${member.id}" /></td>
                  <td>${escapeHtml(member.email)}</td>
                  <td>
                    <select class="form-select form-select-sm" data-group-member-priority="${member.id}">
                      <option value="normal" ${member.priority !== "last" ? "selected" : ""}>Primary</option>
                      <option value="last" ${member.priority === "last" ? "selected" : ""}>Last</option>
                    </select>
                  </td>
                </tr>
              `,
            ),
            ["", "User", "Priority"],
            "No users match this search.",
          )
        : renderMembershipTable(
            filteredMembers.map(
              (member) => `
                <tr>
                  <td><input type="checkbox" class="form-check-input" name="modal-helpdesk-agent" value="${member.id}" /></td>
                  <td>${escapeHtml(member.email)}</td>
                </tr>
              `,
            ),
            ["", "User"],
            "No users match this search.",
          );

  modalRoot.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-card">
        <div class="modal-head">
          <div>
            <div class="modal-title">${escapeHtml(isGroupModal ? state.modalAgent.name : state.modalAgent.email)}</div>
            <div class="subtle">${
              isLiveChatUser
                ? "LiveChat profile"
                : isHelpDeskUser
                  ? "HelpDesk profile"
                  : isLiveChatGroup
                    ? "LiveChat group members"
                    : "HelpDesk group members"
            }</div>
          </div>
          <button id="closeModalBtn" class="btn btn-sm btn-outline-secondary" type="button">Close</button>
        </div>
        <div class="modal-layout">
          ${
            isGroupModal
              ? `
                <div class="editor-shell">
                  <div class="section-title">Manage members</div>
                  <div class="toolbar-row">
                    <input id="modalSearchInput" class="form-control" type="search" placeholder="Search users" value="${escapeHtml(state.modalSearch)}" />
                    <button id="modalSelectAllBtn" class="btn btn-outline-secondary" type="button">Select shown</button>
                    <button id="modalClearBtn" class="btn btn-outline-secondary" type="button">Clear shown</button>
                    <div class="subtle d-flex align-items-center px-2">${filteredMembers.length} shown</div>
                  </div>
                  ${currentMembershipMarkup}
                  <div class="action-row mt-3">
                    ${isLiveChatGroup ? '<button id="changePriorityModalBtn" class="btn btn-primary" type="button">Change priority</button>' : ""}
                    <button id="removeModalBtn" class="btn btn-outline-danger" type="button">Remove selected</button>
                  </div>
                </div>
                <div class="card-shell">
                  <div class="section-title">Group summary</div>
                  <div class="chip-list">
                    <span class="chip">${escapeHtml(state.modalAgent.name)}</span>
                    <span class="chip">${state.modalAgent.members.length} users</span>
                  </div>
                </div>
              `
              : `
                <div class="editor-shell">
                  <div class="section-title">Change memberships</div>
                  <div class="toolbar-row">
                    <input id="modalSearchInput" class="form-control" type="search" placeholder="Search groups" value="${escapeHtml(state.modalSearch)}" />
                    <button id="modalSelectAllBtn" class="btn btn-outline-secondary" type="button">Select shown</button>
                    <button id="modalClearBtn" class="btn btn-outline-secondary" type="button">Clear shown</button>
                    <div class="subtle d-flex align-items-center px-2">${filteredItems.length} shown</div>
                  </div>
                  <div class="checkbox-grid">
                    ${
                      filteredItems.length
                        ? filteredItems
                            .map((item) => {
                              const checked = selectedMap.has(String(item.id));
                              const priority = isLiveChatUser
                                ? selectedMap.get(String(item.id)) || "normal"
                                : "";

                              return `
                                <label class="check-pill">
                                  <input type="checkbox" name="${isLiveChatUser ? "modal-livechat-group" : "modal-helpdesk-team"}" value="${item.id}" ${checked ? "checked" : ""} />
                                  <span>${escapeHtml(item.name)}</span>
                                  ${
                                    isLiveChatUser
                                      ? `<select class="form-select form-select-sm modal-priority-select" data-group-priority="${item.id}">
                                          <option value="normal" ${priority !== "last" ? "selected" : ""}>Primary</option>
                                          <option value="last" ${priority === "last" ? "selected" : ""}>Last</option>
                                        </select>`
                                      : ""
                                  }
                                </label>
                              `;
                            })
                            .join("")
                        : '<div class="empty-state">Nothing matches the current search.</div>'
                    }
                  </div>
                  <div class="action-row mt-3">
                    <button id="saveModalBtn" class="btn btn-primary" type="button">Save</button>
                  </div>
                </div>
                ${
                  isLiveChatUser
                    ? renderLiveChatProfileCard(state.modalAgent, currentMembershipMarkup)
                    : `<div class="card-shell">
                        <div class="section-title">Current memberships</div>
                        ${currentMembershipMarkup}
                      </div>`
                }
              `
          }
        </div>
      </div>
    </div>
  `;
}

function renderApp() {
  const filterBar = document.getElementById("filterBar");
  pageTitle.textContent = currentSectionTitle();
  document.querySelectorAll(".sidebar-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.section === state.section);
  });

  if (state.section === "livechat-users") {
    appContent.innerHTML = renderLiveChatUsers();
    filterBar.classList.add("d-none");
  } else if (state.section === "livechat-groups") {
    appContent.innerHTML = renderLiveChatGroups();
    filterBar.classList.add("d-none");
  } else if (state.section === "create-livechat-user") {
    appContent.innerHTML = renderCreateUserForm("livechat");
    filterBar.classList.add("d-none");
  } else if (state.section === "livechat-analytics") {
    appContent.innerHTML = renderAnalytics();
    filterBar.classList.add("d-none");
  } else if (state.section === "helpdesk-analytics") {
    filterBar.classList.add("d-none");
    renderHelpdeskAnalytics();
  } else if (state.section === "helpdesk-users") {
    appContent.innerHTML = renderHelpDeskUsers();
    filterBar.classList.add("d-none");
  } else if (state.section === "helpdesk-groups") {
    appContent.innerHTML = renderHelpDeskGroups();
    filterBar.classList.add("d-none");
  } else if (state.section === "create-helpdesk-user") {
    appContent.innerHTML = renderCreateUserForm("helpdesk");
    filterBar.classList.add("d-none");
  } else if (state.section === "admin-users") {
    appContent.innerHTML = renderAdminUsers();
    filterBar.classList.add("d-none");
  } else {
    appContent.innerHTML = renderLogs();
    filterBar.classList.add("d-none");
  }

  renderModal();
  bindAppEvents();

  if (state.section === "livechat-analytics" && !state.analytics.loading && !state.analytics.data && !state.analytics.error) {
    fetchAnalytics();
  }

  if (state.section === "helpdesk-analytics" && !state.helpdesk_analytics.loading && !state.helpdesk_analytics.data && !state.helpdesk_analytics.error) {
    const range = getDateRange(state.helpdesk_analytics.filters.preset);
    state.helpdesk_analytics.filters.from = range.from;
    state.helpdesk_analytics.filters.to = range.to;
    fetchHelpdeskAnalytics();
  }
}

async function refreshData() {
  setMessage(statusMessage, "Refreshing...");

  const [livechatResult, helpdeskResult, adminUsersResult, logsResult, syncResult] = await Promise.allSettled([
    api("/api/livechat/dashboard"),
    api("/api/helpdesk/dashboard"),
    api("/api/admin-users"),
    api("/api/logs"),
    fetchHelpdeskSyncStatus(),
  ]);

  if (livechatResult.status === "fulfilled") {
    state.livechat = livechatResult.value;
  }
  if (helpdeskResult.status === "fulfilled") {
    state.helpdesk = helpdeskResult.value;
    applyDefaultHelpdeskAnalyticsAgents();
  }
  if (adminUsersResult.status === "fulfilled") {
    state.adminUsers = adminUsersResult.value.adminUsers || [];
  }
  state.logs = logsResult.status === "fulfilled" ? logsResult.value.logs || [] : [];
  state.logsWarning = logsResult.status === "fulfilled" ? logsResult.value.warning || "" : "Logs unavailable.";

  renderApp();

  const warnings = [
    livechatResult.status !== "fulfilled" ? `LiveChat: ${livechatResult.reason.message}` : "",
    helpdeskResult.status !== "fulfilled" ? `HelpDesk: ${helpdeskResult.reason.message}` : "",
    adminUsersResult.status !== "fulfilled" ? `Admin users: ${adminUsersResult.reason.message}` : "",
    state.logsWarning,
    syncResult.status !== "fulfilled" ? `HelpDesk sync: ${syncResult.reason.message}` : "",
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

function openModal(type, agent) {
  state.modalType = type;
  state.modalAgent = agent;
  state.modalSearch = "";
  state.modalOpen = true;
  renderModal();
  bindAppEvents();
}

async function openLiveChatModal(agentId) {
  const fallbackAgent = state.livechat.agents.find((item) => item.id === agentId);

  try {
    const result = await api(`/api/livechat/agent?id=${encodeURIComponent(agentId)}`);
    const mergedAgent =
      fallbackAgent && (!result.agent.groups || !result.agent.groups.length)
        ? { ...result.agent, groups: fallbackAgent.groups }
        : result.agent;
    openModal("livechat", mergedAgent);
  } catch (error) {
    if (fallbackAgent) {
      openModal("livechat", fallbackAgent);
      setMessage(statusMessage, `${error.message} Showing cached memberships.`, "info");
      return;
    }
    setMessage(statusMessage, error.message, "error");
  }
}

function openHelpDeskModal(agentId) {
  const agent = state.helpdesk.agents.find((item) => item.id === agentId);
  if (agent) {
    openModal("helpdesk", agent);
  }
}

function openLiveChatGroupModal(groupId) {
  const group = state.livechat.groups.find((item) => String(item.id) === String(groupId));
  if (!group) {
    return;
  }

  const members = state.livechat.agents
    .filter((agent) => agent.groups.some((item) => String(item.id) === String(groupId)))
    .map((agent) => {
      const membership = agent.groups.find((item) => String(item.id) === String(groupId));
      return {
        id: agent.id,
        email: agent.email,
        priority: membership?.priority || "normal",
      };
    })
    .sort((left, right) => left.email.localeCompare(right.email));

  openModal("livechat-group", { ...group, members });
}

function openHelpDeskGroupModal(groupId) {
  const group = state.helpdesk.teams.find((item) => String(item.id) === String(groupId));
  if (!group) {
    return;
  }

  const members = state.helpdesk.agents
    .filter((agent) => agent.teams.some((item) => String(item.id) === String(groupId)))
    .map((agent) => ({
      id: agent.id,
      email: agent.email,
    }))
    .sort((left, right) => left.email.localeCompare(right.email));

  openModal("helpdesk-group", { ...group, members });
}

function buildModalLiveChatPayload() {
  const selectedIds = selectedValues("modal-livechat-group");
  ensureSelection(selectedIds, "group");

  const groupPriorities = selectedIds.map((id) => {
    const select = document.querySelector(`[data-group-priority="${CSS.escape(id)}"]`);
    return {
      id,
      priority: select?.value === "last" ? "last" : "normal",
    };
  });

  return groupPriorities;
}

function buildCopyCredentialsText(username, password) {
  return `App: ${APP_URL}\nUsername: ${username}\nPassword: ${password}`;
}

function bindClick(id, handler) {
  const element = document.getElementById(id);
  if (element) {
    element.onclick = handler;
  }
}

function rerenderPreservingInput(inputId) {
  const input = inputId ? document.getElementById(inputId) : null;
  const value = input?.value || "";
  const selectionStart = input?.selectionStart ?? value.length;
  const selectionEnd = input?.selectionEnd ?? value.length;
  const scrollY = window.scrollY;

  renderApp();

  if (inputId) {
    const nextInput = document.getElementById(inputId);
    if (nextInput) {
      nextInput.focus();
      nextInput.value = value;
      nextInput.setSelectionRange(selectionStart, selectionEnd);
    }
  }

  window.scrollTo(0, scrollY);
}

function bindAppEvents() {
  document.querySelectorAll(".sidebar-link").forEach((button) => {
    button.onclick = () => {
      state.section = button.dataset.section;
      renderApp();
    };
  });

  const bindSearch = (id, stateKey) => {
    document.getElementById(id)?.addEventListener("input", (event) => {
      state[stateKey] = event.target.value;
      rerenderPreservingInput(id);
    });
  };

  bindSearch("livechatSearchInput", "livechatSearch");
  bindSearch("helpdeskSearchInput", "helpdeskSearch");
  bindSearch("livechatGroupSearchInput", "livechatGroupSearch");
  bindSearch("helpdeskTeamSearchInput", "helpdeskTeamSearch");
  bindSearch("livechatCreateSearchInput", "livechatCreateSearch");
  bindSearch("helpdeskCreateSearchInput", "helpdeskCreateSearch");
  bindSearch("modalSearchInput", "modalSearch");

  document.getElementById("analyticsPreset")?.addEventListener("change", (event) => {
    state.analytics.filters.preset = event.target.value;
    state.analytics.data = null;
    fetchAnalytics();
  });
  document.getElementById("analyticsFrom")?.addEventListener("change", (event) => {
    if (!event.target.value) {
      return;
    }
    const offset = offsetForDate(new Date(`${event.target.value}T00:00:00`));
    state.analytics.filters.from = dateInputToReportDate(event.target.value, false, offset);
    if (state.analytics.filters.to) {
      state.analytics.filters.to = dateInputToReportDate(isoToDateInput(state.analytics.filters.to), true, offset);
    }
    state.analytics.filters.preset = "custom";
    state.analytics.data = null;
    fetchAnalytics();
  });
  document.getElementById("analyticsTo")?.addEventListener("change", (event) => {
    if (!event.target.value) {
      return;
    }
    const fromValue = isoToDateInput(state.analytics.filters.from) || event.target.value;
    const offset = offsetForDate(new Date(`${fromValue}T00:00:00`));
    state.analytics.filters.to = dateInputToReportDate(event.target.value, true, offset);
    state.analytics.filters.preset = "custom";
    state.analytics.data = null;
    fetchAnalytics();
  });
  document.getElementById("analyticsIncludeSearch")?.addEventListener("input", (event) => {
    state.analytics.filters.includeSearch = event.target.value;
    rerenderPreservingInput("analyticsIncludeSearch");
  });
  document.getElementById("analyticsAgents")?.addEventListener("change", (event) => {
    state.analytics.filters.agents = Array.from(event.target.selectedOptions).map((option) => option.value);
    state.analytics.data = null;
    fetchAnalytics();
  });
  document.getElementById("analyticsExcludeSearch")?.addEventListener("input", (event) => {
    state.analytics.filters.excludeSearch = event.target.value;
    rerenderPreservingInput("analyticsExcludeSearch");
  });
  document.getElementById("analyticsExcludeAgents")?.addEventListener("change", (event) => {
    state.analytics.filters.excludeAgents = Array.from(event.target.selectedOptions).map((option) => option.value);
    state.analytics.data = null;
    fetchAnalytics();
  });
  document.getElementById("analyticsCompare")?.addEventListener("change", (event) => {
    state.analytics.filters.compare = event.target.checked;
    renderApp();
  });
  bindClick("analyticsPrevBtn", () => {
    shiftAnalyticsPeriod(-1);
    state.analytics.data = null;
    fetchAnalytics();
  });
  bindClick("analyticsNextBtn", () => {
    shiftAnalyticsPeriod(1);
    state.analytics.data = null;
    fetchAnalytics();
  });
  bindClick("analyticsReloadBtn", () => {
    state.analytics.data = null;
    fetchAnalytics();
  });
  document.querySelectorAll("[data-analytics-sort]").forEach((button) => {
    button.onclick = () => {
      state.analytics.sort = button.dataset.analyticsSort;
      renderApp();
    };
  });
  document.querySelectorAll("[data-analytics-exclude-agent]").forEach((button) => {
    button.onclick = () => {
      const agentId = button.dataset.analyticsExcludeAgent;
      if (agentId && !state.analytics.filters.excludeAgents.includes(agentId)) {
        state.analytics.filters.excludeAgents.push(agentId);
      }
      state.analytics.data = null;
      fetchAnalytics();
    };
  });

  document.querySelectorAll("[data-livechat-group-filter]").forEach((button) => {
    button.onclick = () => {
      state.livechatGroupQuickFilter = button.dataset.livechatGroupFilter || "";
      renderApp();
    };
  });

  document.querySelectorAll("[data-livechat-priority-filter]").forEach((button) => {
    button.onclick = () => {
      state.livechatGroupPriorityFilter = button.dataset.livechatPriorityFilter || "";
      renderApp();
    };
  });

  bindClick("livechatToggleSelectedGroupsBtn", () => {
    state.livechatSelectedGroupsCollapsed = !state.livechatSelectedGroupsCollapsed;
    renderApp();
  });

  refreshBtn.onclick = async () => {
    await withBusyState(async () => refreshData(), "Updated.");
  };

  logoutBtn.onclick = async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } finally {
      state.user = null;
      state.permissions = {};
      showLogin();
    }
  };

  bindClick("livechatSelectAllAgentsBtn", () => {
    state.livechat.agents.forEach((agent) => state.livechatSelectedAgentIds.add(String(agent.id)));
    selectLiveChatAgentGroups(state.livechat.agents.map((agent) => String(agent.id)));
    setVisibleSelection("livechat-agent", true);
    renderApp();
  });
  bindClick("livechatClearAgentsBtn", () => {
    state.livechatSelectedAgentIds.clear();
    state.livechatSelectedGroupIds.clear();
    state.livechatGroupPriorityFilter = "";
    renderApp();
  });
  bindClick("helpdeskSelectAllAgentsBtn", () => {
    state.helpdesk.agents.forEach((agent) => state.helpdeskSelectedAgentIds.add(String(agent.id)));
    selectHelpDeskAgentTeams(state.helpdesk.agents.map((agent) => String(agent.id)));
    setVisibleSelection("helpdesk-agent", true);
    renderApp();
  });
  bindClick("helpdeskClearAgentsBtn", () => {
    state.helpdeskSelectedAgentIds.clear();
    state.helpdeskSelectedTeamIds.clear();
    renderApp();
  });
  bindClick("livechatSelectAllGroupsBtn", () => {
    setVisibleSelection("livechat-group", true);
  });
  bindClick("livechatClearGroupsBtn", () => {
    setVisibleSelection("livechat-group", false);
  });
  bindClick("helpdeskSelectAllTeamsBtn", () => {
    setVisibleSelection("helpdesk-team", true);
  });
  bindClick("helpdeskClearTeamsBtn", () => {
    setVisibleSelection("helpdesk-team", false);
  });
  bindClick("livechatSelectVisibleBtn", () => {
    setVisibleSelection("livechat-agent", true);
    selectLiveChatAgentGroups(selectedValues("livechat-agent"));
    renderApp();
  });
  bindClick("livechatClearVisibleBtn", () => {
    setVisibleSelection("livechat-agent", false);
    syncLiveChatGroupsFromSelectedAgents();
    if (!state.livechatSelectedAgentIds.size) {
      state.livechatGroupPriorityFilter = "";
    }
    renderApp();
  });
  bindClick("helpdeskSelectVisibleBtn", () => {
    setVisibleSelection("helpdesk-agent", true);
    selectHelpDeskAgentTeams(selectedValues("helpdesk-agent"));
    renderApp();
  });
  bindClick("helpdeskClearVisibleBtn", () => {
    setVisibleSelection("helpdesk-agent", false);
    syncHelpDeskTeamsFromSelectedAgents();
    renderApp();
  });

  document.querySelectorAll('input[name="livechat-agent"]').forEach((input) => {
    input.onchange = () => {
      setSelection("livechat-agent", input.value, input.checked);
      if (input.checked) {
        selectLiveChatAgentGroups([input.value]);
        renderApp();
      } else {
        syncLiveChatGroupsFromSelectedAgents();
        if (!state.livechatSelectedAgentIds.size) {
          state.livechatGroupPriorityFilter = "";
        }
        renderApp();
      }
    };
  });

  document.querySelectorAll('input[name="helpdesk-agent"]').forEach((input) => {
    input.onchange = () => {
      setSelection("helpdesk-agent", input.value, input.checked);
      if (input.checked) {
        selectHelpDeskAgentTeams([input.value]);
        renderApp();
      } else {
        syncHelpDeskTeamsFromSelectedAgents();
        renderApp();
      }
    };
  });

  ["livechat-group", "helpdesk-team"].forEach((name) => {
    document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
      input.onchange = () => {
        setSelection(name, input.value, input.checked);
      };
    });
  });

  bindClick("livechatAssignBtn", async () => {
    await withBusyState(async () => {
      const agentIds = selectedValues("livechat-agent");
      const groupIds = selectedLiveChatGroupIdsForAction();
      ensureSelection(agentIds, "agent");
      ensureSelection(groupIds, "group");
      await api("/api/livechat/memberships", {
        method: "POST",
        body: {
          agentIds,
          groupIds,
          mode: "assign",
          priority: document.getElementById("livechatBulkPriority").value,
        },
      });
    }, "LiveChat groups updated.");
  });

  bindClick("livechatChangePriorityBtn", async () => {
    await withBusyState(async () => {
      const agentIds = selectedValues("livechat-agent");
      const groupIds = selectedLiveChatGroupIdsForAction();
      ensureSelection(agentIds, "agent");
      ensureSelection(groupIds, "group");
      await api("/api/livechat/memberships", {
        method: "POST",
        body: {
          agentIds,
          groupIds,
          mode: "assign",
          priority: document.getElementById("livechatBulkPriority").value,
        },
      });
    }, "LiveChat priority updated.");
  });

  bindClick("livechatRemoveBtn", async () => {
    await withBusyState(async () => {
      const agentIds = selectedValues("livechat-agent");
      const groupIds = selectedLiveChatGroupIdsForAction();
      ensureSelection(agentIds, "agent");
      ensureSelection(groupIds, "group");
      await api("/api/livechat/memberships", {
        method: "POST",
        body: { agentIds, groupIds, mode: "remove" },
      });
    }, "LiveChat groups removed.");
  });

  bindClick("helpdeskAssignBtn", async () => {
    await withBusyState(async () => {
      const agentIds = selectedValues("helpdesk-agent");
      const teamIds = selectedValues("helpdesk-team");
      ensureSelection(agentIds, "agent");
      ensureSelection(teamIds, "group");
      await api("/api/helpdesk/memberships", {
        method: "POST",
        body: { agentIds, teamIds, mode: "assign" },
      });
    }, "HelpDesk groups updated.");
  });

  bindClick("helpdeskRemoveBtn", async () => {
    await withBusyState(async () => {
      const agentIds = selectedValues("helpdesk-agent");
      const teamIds = selectedValues("helpdesk-team");
      ensureSelection(agentIds, "agent");
      ensureSelection(teamIds, "group");
      await api("/api/helpdesk/memberships", {
        method: "POST",
        body: { agentIds, teamIds, mode: "remove" },
      });
    }, "HelpDesk groups removed.");
  });

  document.querySelectorAll("[data-open-livechat]").forEach((button) => {
    button.onclick = () => openLiveChatModal(button.dataset.openLivechat);
  });
  document.querySelectorAll("[data-open-helpdesk]").forEach((button) => {
    button.onclick = () => openHelpDeskModal(button.dataset.openHelpdesk);
  });
  document.querySelectorAll("[data-open-livechat-group]").forEach((button) => {
    button.onclick = () => openLiveChatGroupModal(button.dataset.openLivechatGroup);
  });
  document.querySelectorAll("[data-open-helpdesk-group]").forEach((button) => {
    button.onclick = () => openHelpDeskGroupModal(button.dataset.openHelpdeskGroup);
  });
  document.querySelectorAll("[data-livechat-suspend]").forEach((button) => {
    button.onclick = async () => {
      await withBusyState(async () => {
        await api("/api/livechat/agents/suspend", {
          method: "POST",
          body: { agentId: button.dataset.livechatSuspend },
        });
      }, `LiveChat user ${button.dataset.livechatSuspend} deactivated.`);
    };
  });
  bindClick("suspendModalLiveChatBtn", async () => {
    const agentId = state.modalAgent?.id;
    if (!agentId) {
      return;
    }

    await withBusyState(async () => {
      await api("/api/livechat/agents/suspend", {
        method: "POST",
        body: { agentId },
      });
    }, `LiveChat user ${agentId} suspended.`);

    state.modalOpen = false;
    state.modalAgent = null;
    renderModal();
  });
  document.getElementById("livechatProfileForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const agentId = state.modalAgent?.id;
    if (!agentId) {
      return;
    }

    await withBusyState(async () => {
      await api("/api/livechat/agent-profile", {
        method: "POST",
        body: {
          agentId,
          name: document.getElementById("livechatProfileName").value.trim(),
          role: document.getElementById("livechatProfileRole").value,
          jobTitle: document.getElementById("livechatProfileJobTitle").value.trim(),
          chatLimit: document.getElementById("livechatProfileChatLimit").value,
          avatarPath: document.getElementById("livechatProfileAvatar").value.trim(),
        },
      });
    }, "LiveChat profile updated.");

    await openLiveChatModal(agentId);
  });
  document.querySelectorAll("[data-helpdesk-deactivate]").forEach((button) => {
    button.onclick = async () => {
      await withBusyState(async () => {
        await api("/api/helpdesk/agents/deactivate", {
          method: "POST",
          body: { agentId: button.dataset.helpdeskDeactivate },
        });
      }, `HelpDesk user ${button.dataset.helpdeskDeactivate} deactivated.`);
    };
  });

  document.getElementById("createLiveChatForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await withBusyState(async () => {
      const groupIds = selectedValues("create-livechat-group");
      await api("/api/livechat/agents", {
        method: "POST",
        body: {
          name: document.getElementById("createLiveChatName").value.trim(),
          email: document.getElementById("createLiveChatEmail").value.trim(),
          role: document.getElementById("createLiveChatRole").value,
          groupIds,
          priority: document.getElementById("createLiveChatPriority").value,
        },
      });
    }, "LiveChat user created.");
  });

  document.getElementById("createHelpDeskForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await withBusyState(async () => {
      const teamIds = selectedValues("create-helpdesk-team");
      await api("/api/helpdesk/agents", {
        method: "POST",
        body: {
          name: document.getElementById("createHelpDeskName").value.trim(),
          email: document.getElementById("createHelpDeskEmail").value.trim(),
          role: document.getElementById("createHelpDeskRole").value,
          jobTitle: document.getElementById("createHelpDeskJobTitle").value.trim(),
          avatar: document.getElementById("createHelpDeskAvatar").value.trim(),
          teamIds,
        },
      });
    }, "HelpDesk user created.");
  });

  bindClick("livechatCreateSelectAllBtn", () => {
    document.querySelectorAll('input[name="create-livechat-group"]').forEach((input) => (input.checked = true));
  });
  bindClick("livechatCreateClearBtn", () => {
    document.querySelectorAll('input[name="create-livechat-group"]').forEach((input) => (input.checked = false));
  });
  bindClick("helpdeskCreateSelectAllBtn", () => {
    document.querySelectorAll('input[name="create-helpdesk-team"]').forEach((input) => (input.checked = true));
  });
  bindClick("helpdeskCreateClearBtn", () => {
    document.querySelectorAll('input[name="create-helpdesk-team"]').forEach((input) => (input.checked = false));
  });
  bindClick("livechatCreateInfoBtn", () => {});
  bindClick("helpdeskCreateInfoBtn", () => {});
  bindClick("livechatCreateResetBtn", () => {
    document.querySelectorAll('input[name="create-livechat-group"]').forEach((input) => (input.checked = false));
  });
  bindClick("helpdeskCreateResetBtn", () => {
    document.querySelectorAll('input[name="create-helpdesk-team"]').forEach((input) => (input.checked = false));
  });

  bindClick("generateAdminPasswordBtn", () => {
    state.generatedAdminPassword = generatePassword();
    renderApp();
  });

  bindClick("copyAdminCredentialsBtn", async () => {
    const username = document.getElementById("adminUsername")?.value || "";
    const password = document.getElementById("adminPassword")?.value || "";
    await navigator.clipboard.writeText(buildCopyCredentialsText(username, password));
    setMessage(statusMessage, "Credentials copied.", "success");
  });

  bindClick("clearHelpdeskAnalyticsCacheBtn", async () => {
    const confirmed = window.confirm("Clear only the HelpDesk analytics cache from D1?");
    if (!confirmed) return;
    await withBusyState(async () => {
      await api("/api/helpdesk/analytics-cache", { method: "DELETE" });
      state.helpdesk_analytics.data = null;
      state.helpdesk_analytics.error = null;
      state.helpdesk_analytics.loadStatus = "";
      state.helpdesk_analytics.loadProgress = null;
    }, "HelpDesk analytics cache cleared.");
  });
  document.querySelectorAll("[data-reset-admin-2fa]").forEach((button) => {
    button.onclick = async () => {
      const username = button.dataset.resetAdmin2fa;
      if (!username || !window.confirm(`Reset 2FA for ${username}? They will need to set a new password and Google Authenticator on next login.`)) {
        return;
      }
      await withBusyState(async () => {
        await api("/api/admin-users", {
          method: "PATCH",
          body: {
            action: "reset_2fa",
            username,
          },
        });
      }, `2FA reset for ${username}.`);
    };
  });

  document.getElementById("createAdminUserForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await withBusyState(async () => {
      await api("/api/admin-users", {
        method: "POST",
        body: {
          username: document.getElementById("adminUsername").value.trim(),
          password: document.getElementById("adminPassword").value,
          canManageUsers: document.getElementById("adminCanManageUsers")?.checked || false,
          canManageAdmins: document.getElementById("adminCanManageAdmins")?.checked || false,
        },
      });
      state.generatedAdminPassword = document.getElementById("adminPassword").value;
    }, "Admin user created.");
  });
  document.querySelectorAll("[data-admin-permission]").forEach((input) => {
    input.onchange = async () => {
      const username = input.dataset.adminUsername;
      const user = state.adminUsers.find((item) => item.username === username);
      if (!username || !user) return;
      await withBusyState(async () => {
        await api("/api/admin-users", {
          method: "PATCH",
          body: {
            action: "update_permissions",
            username,
            canManageUsers:
              input.dataset.adminPermission === "canManageUsers"
                ? input.checked
                : Boolean(Number(user.can_manage_users)),
            canManageAdmins:
              input.dataset.adminPermission === "canManageAdmins"
                ? input.checked
                : Boolean(Number(user.can_manage_admins)),
          },
        });
      }, `Permissions updated for ${username}.`);
    };
  });

  bindClick("closeModalBtn", () => {
    state.modalOpen = false;
    state.modalAgent = null;
    renderModal();
  });
  bindClick("modalSelectAllBtn", () => {
    const selector =
      state.modalType === "livechat"
        ? 'input[name="modal-livechat-group"]'
        : state.modalType === "helpdesk"
          ? 'input[name="modal-helpdesk-team"]'
          : state.modalType === "livechat-group"
            ? 'input[name="modal-livechat-agent"]'
            : 'input[name="modal-helpdesk-agent"]';
    document.querySelectorAll(selector).forEach((input) => (input.checked = true));
  });
  bindClick("modalClearBtn", () => {
    const selector =
      state.modalType === "livechat"
        ? 'input[name="modal-livechat-group"]'
        : state.modalType === "helpdesk"
          ? 'input[name="modal-helpdesk-team"]'
          : state.modalType === "livechat-group"
            ? 'input[name="modal-livechat-agent"]'
            : 'input[name="modal-helpdesk-agent"]';
    document.querySelectorAll(selector).forEach((input) => (input.checked = false));
  });
  bindClick("saveModalBtn", async () => {
    if (state.modalType === "livechat") {
      await withBusyState(async () => {
        const groupPriorities = buildModalLiveChatPayload();
        await api("/api/livechat/agent-groups", {
          method: "POST",
          body: {
            agentId: state.modalAgent.id,
            groupPriorities,
          },
        });
      }, "LiveChat profile updated.");
    } else if (state.modalType === "helpdesk") {
      await withBusyState(async () => {
        const teamIds = selectedValues("modal-helpdesk-team");
        await api("/api/helpdesk/agent-teams", {
          method: "POST",
          body: {
            agentId: state.modalAgent.id,
            teamIds,
          },
        });
      }, "HelpDesk profile updated.");
    }

    state.modalOpen = false;
    state.modalAgent = null;
    renderModal();
  });
  bindClick("changePriorityModalBtn", async () => {
    await withBusyState(async () => {
      const agentIds = selectedValues("modal-livechat-agent");
      ensureSelection(agentIds, "user");
      const priorityBuckets = new Map();

      agentIds.forEach((agentId) => {
        const select = document.querySelector(`[data-group-member-priority="${CSS.escape(agentId)}"]`);
        const priority = select?.value === "last" ? "last" : "normal";
        const current = priorityBuckets.get(priority) || [];
        current.push(agentId);
        priorityBuckets.set(priority, current);
      });

      for (const [priority, ids] of priorityBuckets.entries()) {
        await api("/api/livechat/memberships", {
          method: "POST",
          body: {
            agentIds: ids,
            groupIds: [state.modalAgent.id],
            mode: "assign",
            priority,
          },
        });
      }
    }, "Group priority updated.");

    state.modalOpen = false;
    state.modalAgent = null;
    renderModal();
  });
  bindClick("removeModalBtn", async () => {
    const agentIds =
      state.modalType === "livechat-group"
        ? selectedValues("modal-livechat-agent")
        : selectedValues("modal-helpdesk-agent");

    await withBusyState(async () => {
      ensureSelection(agentIds, "user");
      if (state.modalType === "livechat-group") {
        await api("/api/livechat/memberships", {
          method: "POST",
          body: {
            agentIds,
            groupIds: [state.modalAgent.id],
            mode: "remove",
          },
        });
      } else {
        await api("/api/helpdesk/memberships", {
          method: "POST",
          body: {
            agentIds,
            teamIds: [state.modalAgent.id],
            mode: "remove",
          },
        });
      }
    }, "Selected users removed from group.");

    state.modalOpen = false;
    state.modalAgent = null;
    renderModal();
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
        newPassword: `${formData.get("newPassword") || ""}`,
        otp: `${formData.get("otp") || ""}`,
        setupSecret: `${formData.get("setupSecret") || ""}`,
      },
    });

    if (!result.ok && (result.requiresOtp || result.requiresTotpSetup || result.requiresPasswordChange)) {
      state.loginChallenge = result;
      renderLoginChallenge();
      setMessage(loginMessage, result.message || "Continue sign in.", "info");
      return;
    }

    state.loginChallenge = null;
    renderLoginChallenge();
    state.user = result.user;
    state.permissions = result.permissions || {};
    showApp();
    await refreshData();
    runHelpdeskAutoSync();
  } catch (error) {
    setMessage(loginMessage, error.message, "error");
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
    state.permissions = session.permissions || {};
    showApp();
    await refreshData();
    runHelpdeskAutoSync();
  } catch {
    showLogin();
  }
}

bootstrap();
