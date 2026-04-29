const APP_URL = "https://lc-admin.pages.dev/";

const state = {
  user: null,
  section: "livechat-users",
  livechat: { agents: [], groups: [] },
  helpdesk: { agents: [], teams: [] },
  adminUsers: [],
  logs: [],
  logsWarning: "",
  livechatSearch: "",
  helpdeskSearch: "",
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
    filters: {
      preset: "last_7_days",
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
    data: null,
  },
};

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const statusMessage = document.getElementById("statusMessage");
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
    <div class="section-grid">
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
          <div class="col-12 d-grid">
            <button type="submit" class="btn btn-primary">Create admin</button>
          </div>
        </form>
        <div class="credentials-box mt-3">${escapeHtml(credentialsText || "Generated credentials will appear here for quick copy.")}</div>
      </div>
      <div class="table-shell">
        ${
          state.adminUsers.length
            ? `<div class="table-responsive">
                <table class="table admin-table">
                  <thead><tr><th>Username</th><th>Created at</th><th>Created by</th></tr></thead>
                  <tbody>
                    ${state.adminUsers
                      .map(
                        (user) => `
                          <tr>
                            <td>${escapeHtml(user.username)}</td>
                            <td>${new Date(user.created_at).toLocaleString()}</td>
                            <td>${escapeHtml(user.created_by || "-")}</td>
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
            <button id="suspendModalLiveChatBtn" class="btn btn-outline-danger" type="button" ${agent.suspended ? "disabled" : ""}>Suspend user</button>
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
  let from, to;

  switch (preset) {
    case "today":
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      to = new Date(from.getTime() + 24 * 60 * 60 * 1000 - 1);
      break;
    case "yesterday":
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      from = new Date(to.getTime() - 24 * 60 * 60 * 1000 + 1);
      break;
    case "last_7_days":
      to = new Date(now.getTime() - 1000);
      from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "last_30_days":
      to = new Date(now.getTime() - 1000);
      from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "this_week":
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      from = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate());
      to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      break;
    case "last_week":
      const endOfLastWeek = new Date(now);
      endOfLastWeek.setDate(now.getDate() - now.getDay() - 1);
      to = new Date(endOfLastWeek.getFullYear(), endOfLastWeek.getMonth(), endOfLastWeek.getDate() + 1, 23, 59, 59);
      from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "this_month":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case "last_month":
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    default:
      to = new Date(now.getTime() - 1000);
      from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
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

function helpdeskAnalyticsAgentDayMap(agent) {
  return new Map((agent.days || []).map((day) => [day.date, day]));
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
  const range = getDateRange("last_7_days");
  state.helpdesk_analytics.filters = {
    preset: "last_7_days",
    from: range.from,
    to: range.to,
    agents: [],
    excludeAgents: [],
    groups: [],
    agentSearch: "",
    excludeAgentSearch: "",
    groupSearch: "",
  };
  state.helpdesk_analytics.appliedFilters = cloneHelpdeskAnalyticsFilters();
  fetchHelpdeskAnalytics();
}

function helpdeskAnalyticsDayRanges(from, to) {
  const ranges = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());

  while (cursor <= end) {
    const dayStart = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 0, 0, 0);
    const dayEnd = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 23, 59, 59, 999);
    ranges.push({
      from: new Date(Math.max(dayStart.getTime(), from.getTime())),
      to: new Date(Math.min(dayEnd.getTime(), to.getTime())),
      cacheFullDay: from <= dayStart && to >= dayEnd,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return ranges;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mergeHelpdeskAnalyticsResponses(responses, filters) {
  const agentsById = new Map();
  const timelineByDate = new Map();

  for (const response of responses) {
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
        });
      }
      const current = agentsById.get(key);
      current.name = current.name || agent.name;
      current.email = current.email || agent.email;
      current.total_tickets += Number(agent.total_tickets || 0);
      current.days.push(...(agent.days || []));
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
    capabilities: responses[0]?.capabilities || {},
  };
}

async function fetchHelpdeskAnalyticsRange(range, filters, depth = 0) {
  const params = new URLSearchParams();
  params.append("from", range.from.toISOString());
  params.append("to", range.to.toISOString());
  if (filters.agents.length > 0) params.append("agents", filters.agents.join(","));
  if (filters.excludeAgents.length > 0) params.append("exclude_agents", filters.excludeAgents.join(","));
  if (filters.groups.length > 0) params.append("groups", filters.groups.join(","));
  if (range.cacheFullDay) params.append("cache_full_day", "1");
  params.append("tz_offset", String(new Date().getTimezoneOffset()));

  try {
    return [await api(`/api/helpdesk/analytics?${params.toString()}`)];
  } catch (error) {
    const duration = range.to.getTime() - range.from.getTime();
    if (!/too many/i.test(error.message || "") || duration <= 30 * 60 * 1000 || depth >= 8) {
      throw error;
    }

    const middle = new Date(range.from.getTime() + Math.floor(duration / 2));
    state.helpdesk_analytics.loadStatus = "HelpDesk rate limit hit. Loading smaller portions...";
    renderHelpdeskAnalytics();
    await sleep(500);
    const first = await fetchHelpdeskAnalyticsRange({ from: range.from, to: middle, cacheFullDay: false }, filters, depth + 1);
    await sleep(500);
    const second = await fetchHelpdeskAnalyticsRange({ from: new Date(middle.getTime() + 1), to: range.to, cacheFullDay: false }, filters, depth + 1);
    return [...first, ...second];
  }
}

async function fetchHelpdeskAnalyticsDayResponses(ranges, filters) {
  const responses = [];
  for (let index = 0; index < ranges.length; index += 1) {
    state.helpdesk_analytics.loadStatus = `Loading HelpDesk data ${index + 1}/${ranges.length} day${ranges.length === 1 ? "" : "s"}...`;
    renderHelpdeskAnalytics();
    responses.push(...(await fetchHelpdeskAnalyticsRange(ranges[index], filters)));
    await sleep(250);
  }
  return responses;
}

// Task 8: Create fetchAnalytics Function for HelpDesk
async function fetchHelpdeskAnalytics() {
  const filters = cloneHelpdeskAnalyticsFilters();
  state.helpdesk_analytics.appliedFilters = filters;
  state.helpdesk_analytics.loading = true;
  state.helpdesk_analytics.error = null;
  state.helpdesk_analytics.loadStatus = "";
  renderHelpdeskAnalytics();

  try {
    const responses = await fetchHelpdeskAnalyticsDayResponses(helpdeskAnalyticsDayRanges(filters.from, filters.to), filters);
    state.helpdesk_analytics.data = mergeHelpdeskAnalyticsResponses(responses, filters);
    renderHelpdeskAnalytics();
  } catch (error) {
    console.error("Fetch analytics error:", error);
    state.helpdesk_analytics.error = error.message;
    state.helpdesk_analytics.loadStatus = "";
    renderHelpdeskAnalytics();
  } finally {
    state.helpdesk_analytics.loading = false;
    state.helpdesk_analytics.loadStatus = "";
    renderHelpdeskAnalytics();
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
  toInput.value = filters.to ? localDateValue(filters.to) : "";
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
  actionBar.innerHTML = `
    <button id="helpdeskAnalyticsApplyBtn" class="btn btn-primary" type="button">Filter</button>
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
    filters.to = e.target.value ? new Date(`${e.target.value}T23:59:59`) : null;
    renderHelpdeskAnalytics();
  });

  if (filters.preset === "custom") {
    customDatesDiv.classList.remove("d-none");
    customDatesToDiv.classList.remove("d-none");
  }

  document.getElementById("helpdeskAnalyticsApplyBtn")?.addEventListener("click", () => {
    fetchHelpdeskAnalytics();
  });
  document.getElementById("helpdeskAnalyticsResetBtn")?.addEventListener("click", () => {
    resetHelpdeskAnalyticsFilters();
  });

  renderFiltersConditional();

  // Render data sections if available
  if (data) {
    renderMetricsAndPanels();
    renderLeaderboard();
  } else if (loading) {
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "alert alert-info";
    loadingDiv.textContent = state.helpdesk_analytics.loadStatus || "Loading HelpDesk data...";
    container.appendChild(loadingDiv);
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
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());

  while (cursor <= end) {
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

  const wrapper = document.createElement("div");
  wrapper.className = "leaderboard-wrapper helpdesk-leaderboard-wrapper";

  const table = document.createElement("table");
  table.className = "leaderboard-table helpdesk-leaderboard-table";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

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
  summaryCell.colSpan = 3;
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

    const rankCell = document.createElement("td");
    rankCell.className = "col-rank sticky-left";
    rankCell.textContent = rankLabel;
    row.appendChild(rankCell);

    const agentCell = document.createElement("td");
    agentCell.className = "col-agent sticky-left";
    agentCell.innerHTML = `
      <div class="analytics-agent-copy">
        <div class="analytics-agent-main">${escapeHtml(helpdeskAgentLabel(agent))}</div>
        ${helpdeskAgentSubLabel(agent) ? `<div class="analytics-agent-sub">${escapeHtml(helpdeskAgentSubLabel(agent))}</div>` : ""}
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

  const [livechatResult, helpdeskResult, adminUsersResult, logsResult] = await Promise.allSettled([
    api("/api/livechat/dashboard"),
    api("/api/helpdesk/dashboard"),
    api("/api/admin-users"),
    api("/api/logs"),
  ]);

  if (livechatResult.status === "fulfilled") {
    state.livechat = livechatResult.value;
  }
  if (helpdeskResult.status === "fulfilled") {
    state.helpdesk = helpdeskResult.value;
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

  document.getElementById("createAdminUserForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await withBusyState(async () => {
      await api("/api/admin-users", {
        method: "POST",
        body: {
          username: document.getElementById("adminUsername").value.trim(),
          password: document.getElementById("adminPassword").value,
        },
      });
      state.generatedAdminPassword = document.getElementById("adminPassword").value;
    }, "Admin user created.");
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
      },
    });

    state.user = result.user;
    showApp();
    await refreshData();
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
    showApp();
    await refreshData();
  } catch {
    showLogin();
  }
}

bootstrap();
