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
  return `${value || ""}`
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
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
  extraControl = "",
  quickFilters = [],
  activeQuickFilter = "",
  quickFilterPrefix = "",
  priorityFilters = [],
  activePriorityFilter = "",
  selectedItems = [],
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
              <span class="subtle">${selectedItems.length} selected</span>
              <div class="chip-list">${selectedItems
                .map((item) => `<span class="chip">${escapeHtml(item.name)}</span>`)
                .join("")}</div>
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
        <button id="${secondaryActionId}" class="btn btn-outline-secondary" type="button">${secondaryLabel}</button>
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
                  <select id="createLiveChatPriority" class="form-select">
                    <option value="normal" selected>Primary</option>
                    <option value="last">Last</option>
                  </select>
                </div>`
              : ""
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

function currentSectionTitle() {
  const titles = {
    "livechat-users": "LiveChat Users",
    "livechat-groups": "LiveChat Groups",
    "create-livechat-user": "Create LiveChat User",
    "helpdesk-users": "HelpDesk Users",
    "helpdesk-groups": "HelpDesk Groups",
    "create-helpdesk-user": "Create HelpDesk User",
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
                <div class="card-shell">
                  <div class="section-title">Current memberships</div>
                  ${currentMembershipMarkup}
                </div>
              `
          }
        </div>
      </div>
    </div>
  `;
}

function renderApp() {
  pageTitle.textContent = currentSectionTitle();
  document.querySelectorAll(".sidebar-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.section === state.section);
  });

  if (state.section === "livechat-users") {
    appContent.innerHTML = renderLiveChatUsers();
  } else if (state.section === "livechat-groups") {
    appContent.innerHTML = renderLiveChatGroups();
  } else if (state.section === "create-livechat-user") {
    appContent.innerHTML = renderCreateUserForm("livechat");
  } else if (state.section === "helpdesk-users") {
    appContent.innerHTML = renderHelpDeskUsers();
  } else if (state.section === "helpdesk-groups") {
    appContent.innerHTML = renderHelpDeskGroups();
  } else if (state.section === "create-helpdesk-user") {
    appContent.innerHTML = renderCreateUserForm("helpdesk");
  } else if (state.section === "admin-users") {
    appContent.innerHTML = renderAdminUsers();
  } else {
    appContent.innerHTML = renderLogs();
  }

  renderModal();
  bindAppEvents();
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
