const APP_URL = "https://lc-admin.pages.dev/";
const HELPDESK_ANALYTICS_TIME_ZONE = "Europe/Nicosia";
const HELPDESK_ANALYTICS_DEFAULT_METRIC = "public_replies";
const HELPDESK_ANALYTICS_METRICS = {
  public_replies: {
    id: "public_replies",
    tabLabel: "Public replies report",
    totalLabel: "Public Replies",
    periodLabel: "Period replies",
    itemSingular: "reply",
    itemPlural: "replies",
    detailTitle: "reply points",
    detailEmpty: "No reply details for this agent in the selected range.",
    timeLabel: "Reply time",
    exportSlug: "public-replies",
  },
  comments: {
    id: "comments",
    tabLabel: "Comments count report",
    totalLabel: "Comments",
    periodLabel: "Period comments",
    itemSingular: "comment",
    itemPlural: "comments",
    detailTitle: "comment points",
    detailEmpty: "No comment details for this agent in the selected range.",
    timeLabel: "Comment time",
    exportSlug: "comments-count",
  },
};
const DEFAULT_HELPDESK_ANALYTICS_AGENT_EMAILS = [
  "aleksandr.lavrushkin@boomerang-partners.com",
  "aleksandr.b@playcare.tech",
  "valerii.b@playcare.tech",
  "ryhor.a@playcare.tech",
  "tamazi.m@playcare.tech",
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
  "Oswald",
  "Stan",
  "Freya",
  "Rachel",
];

const HELPDESK_TICKET_STATUSES = [
  { id: "open", label: "Open" },
  { id: "pending", label: "Pending" },
  { id: "onhold", label: "On hold" },
  { id: "solved", label: "Solved" },
  { id: "closed", label: "Closed" },
];
const HELPDESK_TICKET_FOLDERS = [
  { id: "archive", label: "Archive" },
  { id: "spam", label: "Spam" },
  { id: "trash", label: "Trash" },
];
const HELPDESK_TICKET_PRIORITIES = [
  { value: "", label: "Any priority" },
  { value: "-10", label: "Low" },
  { value: "0", label: "Medium" },
  { value: "10", label: "High" },
  { value: "20", label: "Urgent" },
];
const HELPDESK_TICKET_SORTS = [
  { value: "createdAt", label: "Creation date" },
  { value: "requester", label: "Requester" },
  { value: "assignedAgent", label: "Assigned agent" },
  { value: "priority", label: "Priority" },
  { value: "updatedAt", label: "Last activity" },
  { value: "lastMessageAt", label: "Last message" },
];
const HELPDESK_TICKET_TEXT_SORTS = new Set(["requester", "assignedAgent"]);
const HELPDESK_TICKET_DATE_SORTS = new Set(["createdAt", "updatedAt", "lastMessageAt"]);
const LIVECHAT_GROUP_BUCKETS = ["VIP", "SS", "TL", "S2B"];
const ACCOUNT_STORAGE_KEY = "lc-admin-selected-account";
const ACCOUNT_OPTIONS = [
  { id: "default", label: "Playcare" },
  { id: "playtraffpartners", label: "playtraffpartners" },
];
const LIVECHAT_PRIORITY_OPTIONS = [
  { value: "normal", label: "Primary" },
  { value: "last", label: "Last" },
  { value: "first", label: "First" },
];
const HELPDESK_AUTO_REPLY_DEFAULT_MESSAGE = [
  "Dear player,",
  "",
  "Thank you for reaching out to us. This email confirms that we have received your request and will get back to you as soon as possible. Please note that our response time may be longer than usual due to a high volume of incoming requests.",
  "",
  "We appreciate your patience in the meantime.",
  "",
  "Best regards,",
  "",
  "Customer Support Team",
].join("\n");
const HELPDESK_MARKETING_SPAM_DEFAULT_KEYWORDS = [
  "partnership",
  "SEO",
  "link",
  "high-quality websites",
  "Boost Your Rankings",
  "guest post",
  "opportunities",
  "streamer",
  "affiliates",
];

function defaultHelpdeskWorkflowForm() {
  return {
    type: "auto_resolve_requester",
    title: "",
    requesterEmail: "",
    status: "solved",
    tags: "",
    senderName: "Axel",
    messageText: HELPDESK_AUTO_REPLY_DEFAULT_MESSAGE,
  };
}

function normalizeAccountId(value) {
  if (["2", "second", "secondary", "playtraffpartners"].includes(`${value || ""}`.trim().toLowerCase())) {
    return "playtraffpartners";
  }
  return ACCOUNT_OPTIONS.some((account) => account.id === value) ? value : "default";
}

function storedAccountId() {
  try {
    return normalizeAccountId(localStorage.getItem(ACCOUNT_STORAGE_KEY));
  } catch (_error) {
    return "default";
  }
}

function accountLabel(accountId = state.accountId) {
  return ACCOUNT_OPTIONS.find((account) => account.id === accountId)?.label || "Playcare";
}

const state = {
  user: null,
  permissions: {},
  csrfToken: "",
  accountId: storedAccountId(),
  loginChallenge: null,
  section: "livechat-users",
  livechat: { agents: [], groups: [] },
  helpdesk: { agents: [], teams: [] },
  adminUsers: [],
  logs: [],
  logsWarning: "",
  livechatSearch: "",
  helpdeskSearch: "",
  helpdeskWorkflows: {
    loading: false,
    error: null,
    workflows: [],
    runs: [],
    runsFor: "",
    runningWorkflowId: "",
    savingWorkflowId: "",
    timer: null,
    webhookStats: {
      total: 0,
      receivedLast24h: 0,
      receivedLast10m: 0,
      recent: [],
    },
    analytics: {
      loading: false,
      error: null,
      data: null,
      filters: {
        preset: "last_7_days",
        from: "",
        to: "",
      },
    },
    form: defaultHelpdeskWorkflowForm(),
  },
  helpdeskTickets: {
    loading: false,
    error: null,
    inFlight: false,
    queuedRefresh: null,
    tickets: [],
    counts: { statuses: {} },
    tags: [],
    mergeLogs: [],
    filters: {
      status: "open",
      silo: "tickets",
      pageSize: 40,
      sortBy: "lastMessageAt",
      order: "desc",
      createdDateFrom: "",
      createdDateTo: "",
      updatedDateFrom: "",
      updatedDateTo: "",
      lastMessageFrom: "",
      lastMessageTo: "",
      priority: "",
      tagId: "",
    },
    page: {
      pageIndex: 0,
      totalResults: 0,
      totalPages: 0,
      nextCursor: null,
      prevCursor: null,
      cursorPagination: true,
      cursorStack: [],
    },
    updatedAt: "",
    timer: null,
    sidebarCollapsed: false,
  },
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
  modalLiveChatSelectedGroupIds: new Set(),
  livechatPriorityDialog: null,
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
      pendingAgents: null,
      pendingExcludeAgents: null,
      includeSearch: "",
      excludeSearch: "",
      compare: true,
    },
  },
  helpdesk_analytics: {
    view: "report",
    metric: HELPDESK_ANALYTICS_DEFAULT_METRIC,
    loading: false,
    error: null,
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
    data: null,
    webhookStats: null,
    webhookStatsLoading: false,
    rawWebhooks: {
      loading: false,
      error: null,
      events: null,
    },
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
const sessionBadge = document.getElementById("sessionBadge");
const accountSelect = document.getElementById("accountSelect");
const pageTitle = document.getElementById("pageTitle");
const appContent = document.getElementById("appContent");
const modalRoot = document.getElementById("modalRoot");
const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");

function setMessage(element, message, tone = "info") {
  element.textContent = message || "";
  element.dataset.tone = message ? tone : "";
}

function accountRequestHeaders() {
  return { "X-LC-Account": normalizeAccountId(state.accountId) };
}

async function api(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = {
    ...accountRequestHeaders(),
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };
  if (state.csrfToken && !["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers["X-CSRF-Token"] = state.csrfToken;
  }

  const response = await fetch(path, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const nextCsrfToken = response.headers.get("X-CSRF-Token");
  if (nextCsrfToken) {
    state.csrfToken = nextCsrfToken;
  }

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
  if (nextCsrfToken && payload && typeof payload === "object" && !Array.isArray(payload)) {
    payload.csrfToken = nextCsrfToken;
  }

  if (!response.ok) {
    throw new Error(payload.error || `Request failed with ${response.status}.`);
  }

  return payload;
}

function showApp() {
  loginView.classList.add("d-none");
  appView.classList.remove("d-none");
  syncAccountSwitcher();
}

function showLogin() {
  state.user = null;
  state.permissions = {};
  state.csrfToken = "";
  appView.classList.add("d-none");
  loginView.classList.remove("d-none");
  stopHelpdeskTicketsRealtime();
}

function syncAccountSwitcher() {
  if (accountSelect) {
    accountSelect.value = normalizeAccountId(state.accountId);
  }
  sessionBadge.textContent = `Signed in as ${state.user} · ${accountLabel()}`;
}

function resetAccountScopedState() {
  stopHelpdeskTicketsRealtime();
  stopHelpdeskWorkflowsRealtime();
  state.livechat = { agents: [], groups: [] };
  state.helpdesk = { agents: [], teams: [] };
  state.logs = [];
  state.logsWarning = "";
  state.livechatSearch = "";
  state.helpdeskSearch = "";
  state.helpdeskWorkflows.workflows = [];
  state.helpdeskWorkflows.runs = [];
  state.helpdeskWorkflows.runsFor = "";
  state.helpdeskWorkflows.webhookStats = { total: 0, receivedLast24h: 0, receivedLast10m: 0, recent: [] };
  state.helpdeskWorkflows.analytics.data = null;
  state.helpdeskTickets.tickets = [];
  state.helpdeskTickets.counts = { statuses: {} };
  state.helpdeskTickets.tags = [];
  state.helpdeskTickets.mergeLogs = [];
  state.helpdeskTickets.updatedAt = "";
  state.helpdeskTickets.page = {
    pageIndex: 0,
    totalResults: 0,
    totalPages: 0,
    nextCursor: null,
    prevCursor: null,
    cursorPagination: true,
    cursorStack: [],
  };
  state.analytics.data = null;
  state.helpdesk_analytics.data = null;
  state.helpdesk_analytics.webhookStats = null;
  state.livechatSelectedAgentIds.clear();
  state.livechatSelectedGroupIds.clear();
  state.helpdeskSelectedAgentIds.clear();
  state.helpdeskSelectedTeamIds.clear();
  state.modalOpen = false;
  state.modalAgent = null;
  state.modalType = null;
}

async function switchAccount(accountId) {
  const nextAccountId = normalizeAccountId(accountId);
  if (nextAccountId === state.accountId) return;
  state.accountId = nextAccountId;
  try {
    localStorage.setItem(ACCOUNT_STORAGE_KEY, nextAccountId);
  } catch (_error) {}
  resetAccountScopedState();
  syncAccountSwitcher();
  setMessage(statusMessage, `Switching to ${accountLabel(nextAccountId)}...`);
  await refreshData();
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
        ? `<input id="newPassword" name="newPassword" type="password" class="form-control" placeholder="New password (12+ chars, Aa1!)" autocomplete="new-password" required />`
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

const DOMPURIFY_TEXT_CONFIG = {
  ALLOWED_ATTR: [],
  ALLOWED_TAGS: [],
  KEEP_CONTENT: true,
  RETURN_TRUSTED_TYPE: false,
};

const SAFE_URL_PROTOCOLS = new Set(["http:", "https:"]);

function escapeHtml(value) {
  const raw = `${value ?? ""}`;
  if (!raw) return "";

  const textNodeHost = document.createElement("div");
  textNodeHost.textContent = raw;
  const sanitized = window.DOMPurify.sanitize(textNodeHost.innerHTML, DOMPURIFY_TEXT_CONFIG);
  return `${sanitized}`
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("`", "&#096;");
}

function safeUrlAttribute(value, fallback = "") {
  const raw = `${value ?? ""}`.trim();
  if (!raw) return fallback;

  try {
    const url = new URL(raw, window.location.origin);
    if (!SAFE_URL_PROTOCOLS.has(url.protocol)) return fallback;
    return escapeHtml(url.href);
  } catch {
    return fallback;
  }
}

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function localDateValue(date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function localTimeValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
}

function combineLocalDateAndTime(dateValue, timeValue, fallbackTime = "00:00") {
  if (!dateValue) return null;
  const safeTime = /^\d{2}:\d{2}$/.test(timeValue || "") ? timeValue : fallbackTime;
  const date = new Date(`${dateValue}T${safeTime}:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function offsetForDate(date) {
  const offsetMinutes = -date.getTimezoneOffset();
  return offsetForOffsetMinutes(offsetMinutes);
}

function offsetForOffsetMinutes(offsetMinutes) {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  return `${sign}${padDatePart(Math.floor(absolute / 60))}:${padDatePart(absolute % 60)}`;
}

function offsetMinutesForTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = values.hour === "24" ? 0 : Number(values.hour);
  const zonedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    hour,
    Number(values.minute),
    Number(values.second),
  );
  return Math.round((zonedAsUtc - date.getTime()) / 60000);
}

function dateWithOffset(date, offset = offsetForDate(date)) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}:${padDatePart(date.getSeconds())}${offset}`;
}

function helpdeskAnalyticsTimeZoneOffsetMinutes(date = new Date()) {
  return offsetMinutesForTimeZone(date, HELPDESK_ANALYTICS_TIME_ZONE);
}

function helpdeskAnalyticsOffset(date = new Date()) {
  return offsetForOffsetMinutes(helpdeskAnalyticsTimeZoneOffsetMinutes(date));
}

function dateWithHelpdeskAnalyticsOffset(date) {
  return dateWithOffset(date, helpdeskAnalyticsOffset(date));
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
    "modal-livechat-group": state.modalLiveChatSelectedGroupIds,
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
    "modal-livechat-group": state.modalLiveChatSelectedGroupIds,
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

function liveChatGroupBucket(group) {
  const name = `${group?.name || ""}`.toUpperCase();
  return LIVECHAT_GROUP_BUCKETS.find((bucket) => name.includes(bucket)) || "Other";
}

function liveChatGroupsForBucket(bucket) {
  if (!bucket || bucket === "All") {
    return state.livechat.groups;
  }

  return state.livechat.groups.filter((group) => liveChatGroupBucket(group) === bucket);
}

function liveChatPrioritySelectOptions(selectedPriority = "normal") {
  return LIVECHAT_PRIORITY_OPTIONS.map(
    (option) => `<option value="${option.value}" ${selectedPriority === option.value ? "selected" : ""}>${option.label}</option>`,
  ).join("");
}

function selectedLiveChatGroupsById(groupIds) {
  const groupById = new Map(state.livechat.groups.map((group) => [String(group.id), group]));
  return groupIds
    .map((groupId) => groupById.get(String(groupId)))
    .filter(Boolean)
    .sort((left, right) => liveChatGroupBucket(left).localeCompare(liveChatGroupBucket(right)) || left.name.localeCompare(right.name));
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

function generatePassword(length = 16) {
  const groups = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%"];
  const alphabet = groups.join("");
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  const chars = Array.from(bytes, (value) => alphabet[value % alphabet.length]);
  groups.forEach((group, index) => {
    chars[index] = group[bytes[index] % group.length];
  });
  return chars.join("");
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
            <input id="adminPassword" class="form-control" type="text" placeholder="Password (12+ chars, Aa1!)" required value="${escapeHtml(state.generatedAdminPassword)}" />
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
                  <thead><tr><th>Username</th><th>Status</th><th>2FA</th><th>Login reset</th><th>Permissions</th><th>Created at</th><th>Created by</th><th></th></tr></thead>
                  <tbody>
                    ${state.adminUsers
                      .map(
                        (user) => `
                          <tr>
                            <td>${escapeHtml(user.username)}</td>
                            <td>${user.disabled_at ? '<span class="chip last">Disabled</span>' : '<span class="chip primary">Active</span>'}</td>
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
                            <td class="admin-actions-cell">
                              ${(canManageAdmins() || user.username === state.user) ? `<button class="btn btn-sm btn-outline-danger" type="button" data-reset-admin-2fa="${encodeURIComponent(user.username)}">Reset 2FA</button>` : ""}
                              ${
                                canManageAdmins() && user.username !== state.user
                                  ? `<button class="btn btn-sm btn-outline-secondary" type="button" data-toggle-admin-disabled="${encodeURIComponent(user.username)}" data-disabled="${user.disabled_at ? "0" : "1"}">${user.disabled_at ? "Reactivate" : "Deactivate"}</button>
                                     <button class="btn btn-sm btn-outline-danger" type="button" data-delete-admin-user="${encodeURIComponent(user.username)}">Delete</button>`
                                  : ""
                              }
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
      const name = typeof item === "string" ? item : item.name || item.email || item.id || "-";
      const priority = typeof item === "string" ? "" : item.priority ? ` (${priorityLabel(item.priority)})` : "";
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
  const avatarUrl = safeUrlAttribute(agent.avatar);
  const avatar = avatarUrl
    ? `<img src="${avatarUrl}" alt="" />`
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

  if (metadata.from || metadata.to) {
    rows.push(`
      <div class="log-grid-two">
        <div class="log-row">
          <div class="log-label">From</div>
          <div class="log-value">${escapeHtml(metadata.from || "n/a")}</div>
        </div>
        <div class="log-row">
          <div class="log-label">To</div>
          <div class="log-value">${escapeHtml(metadata.to || "n/a")}</div>
        </div>
      </div>
    `);
  }

  if (metadata.detailRows !== undefined || metadata.windowMinutes !== undefined || metadata.delayMinutes !== undefined) {
    rows.push(`
      <div class="log-grid-three">
        <div class="log-row">
          <div class="log-label">Ticket events</div>
          <div class="log-value">${escapeHtml(String(metadata.detailRows ?? 0))}</div>
        </div>
        <div class="log-row">
          <div class="log-label">Window</div>
          <div class="log-value">${escapeHtml(String(metadata.windowMinutes ?? "n/a"))} min</div>
        </div>
        <div class="log-row">
          <div class="log-label">Delay</div>
          <div class="log-value">${escapeHtml(String(metadata.delayMinutes ?? "n/a"))} min</div>
        </div>
      </div>
    `);
  }

  if (metadata.dates?.length) {
    rows.push(`
      <div class="log-row">
        <div class="log-label">Dates</div>
        <div class="log-value chip-list">${renderNamedList(metadata.dates)}</div>
      </div>
    `);
  }

  if (metadata.error) {
    rows.push(`
      <div class="log-row">
        <div class="log-label">Error</div>
        <div class="log-value">${escapeHtml(metadata.error)}</div>
      </div>
    `);
  }

  return rows.length ? `<div class="log-details">${rows.join("")}</div>` : "";
}

function renderLogCards(entries, emptyText) {
  return entries.length
    ? entries
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
    : `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
}

function renderLogs() {
  const visibleLogs = state.logs;
  const emptyText = state.logsWarning || "No audit logs available.";

  return `
    ${renderStats([
      { label: "Rows", value: visibleLogs.length, meta: "Loaded from D1" },
      { label: "Status", value: state.logsWarning ? "Warn" : "OK", meta: state.logsWarning || "Logs available" },
      { label: "Area", value: "Audit", meta: "Latest events" },
      { label: "Mode", value: "Read", meta: "Newest first" },
    ])}
    <div class="table-shell">
      ${renderLogCards(visibleLogs, emptyText)}
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
    .filter((agent) => `${agent.email || agent.id || ""}`.includes("@") || `${agent.id || ""}`.includes("@"))
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
  const selectedAgents = filters.pendingAgents ?? filters.agents;
  const selectedExcludeAgents = filters.pendingExcludeAgents ?? filters.excludeAgents;
  const checkboxMarkup = (agents, selected, name) => `
    <div class="analytics-checklist livechat-analytics-checklist">
      ${
        agents.length
          ? agents
              .map(
                (agent) => `
                  <label class="analytics-check-option">
                    <input class="form-check-input" type="checkbox" name="${name}" value="${escapeHtml(agent.id)}" ${selected.includes(agent.id) ? "checked" : ""} />
                    <span class="analytics-agent-option-grid">
                      <strong>${escapeHtml(agent.name)}</strong>
                      <small>${escapeHtml(agent.email)}</small>
                    </span>
                  </label>
                `,
              )
              .join("")
          : `<div class="empty-state analytics-filter-empty">No agents match this search.</div>`
      }
    </div>
  `;

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
        <div class="analytics-agent-filter-matrix">
          <label class="analytics-agent-filter-search-include">
            <span>Search agents to include</span>
            <input id="analyticsIncludeSearch" class="form-control" type="search" placeholder="Search full name or email" value="${escapeHtml(filters.includeSearch)}" />
          </label>
          <label class="analytics-agent-filter-search-exclude">
            <span>Search agents to exclude</span>
            <input id="analyticsExcludeSearch" class="form-control" type="search" placeholder="Search full name or email" value="${escapeHtml(filters.excludeSearch)}" />
          </label>
          <div class="analytics-filter-group analytics-agent-filter-list-include">
            <span>Include agents</span>
            ${checkboxMarkup(includeOptions, selectedAgents, "analyticsAgents")}
          </div>
          <div class="analytics-filter-group analytics-agent-filter-list-exclude">
            <span>Exclude agents</span>
            ${checkboxMarkup(excludeOptions, selectedExcludeAgents, "analyticsExcludeAgents")}
          </div>
        </div>
      </div>
      <div class="analytics-actions">
        <button id="analyticsPrevBtn" class="btn btn-outline-secondary" type="button">Previous period</button>
        <button id="analyticsNextBtn" class="btn btn-outline-secondary" type="button">Next period</button>
        <button id="analyticsFilterBtn" class="btn btn-primary" type="button">Filter</button>
        <button id="analyticsReloadBtn" class="btn btn-outline-secondary" type="button">Reload analytics</button>
        <button class="btn btn-outline-secondary" type="button" data-livechat-raw-export="raw_csv">Raw CSV</button>
        <button class="btn btn-outline-secondary" type="button" data-livechat-raw-export="raw_excel">Raw Excel</button>
        <label class="analytics-switch">
          <input id="analyticsCompare" class="form-check-input" type="checkbox" ${filters.compare ? "checked" : ""} />
          <span>Compare</span>
        </label>
      </div>
    </div>
  `;
}

function stagedLiveChatAnalyticsSelection(name, currentSelected) {
  const visibleValues = Array.from(document.querySelectorAll(`input[name='${name}']`)).map((input) => input.value);
  const visibleSelected = Array.from(document.querySelectorAll(`input[name='${name}']:checked`)).map((input) => input.value);
  const hiddenSelected = currentSelected.filter((agentId) => !visibleValues.includes(agentId));
  return [...new Set([...hiddenSelected, ...visibleSelected])];
}

function applyLiveChatAnalyticsFilters() {
  const filters = state.analytics.filters;
  filters.agents = filters.pendingAgents ?? stagedLiveChatAnalyticsSelection("analyticsAgents", filters.agents);
  filters.excludeAgents = filters.pendingExcludeAgents ?? stagedLiveChatAnalyticsSelection("analyticsExcludeAgents", filters.excludeAgents);
  filters.pendingAgents = null;
  filters.pendingExcludeAgents = null;
  state.analytics.data = null;
  fetchAnalytics();
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
        Daily agent columns are loaded from per-date agents/performance reports and cached in D1; chatbot records without an email-style identifier are excluded.
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

function helpdeskAnalyticsMetricConfig(metric = state.helpdesk_analytics.metric) {
  return HELPDESK_ANALYTICS_METRICS[metric] || HELPDESK_ANALYTICS_METRICS[HELPDESK_ANALYTICS_DEFAULT_METRIC];
}

function helpdeskAgentReplyDetails(agent) {
  return [...(agent.reply_details || [])].sort((left, right) => {
    const dateOrder = `${left.date || ""}`.localeCompare(`${right.date || ""}`);
    return dateOrder || `${left.event_date || ""}`.localeCompare(`${right.event_date || ""}`) || `${left.short_id || ""}`.localeCompare(`${right.short_id || ""}`);
  });
}

function renderHelpdeskAgentReplyDetail(agent, colSpan) {
  const metric = helpdeskAnalyticsMetricConfig();
  const details = helpdeskAgentReplyDetails(agent);
  const rows = details.length
    ? details
        .map(
          (detail) => `
            <tr>
              <td>${escapeHtml(detail.date || "-")}</td>
              <td><strong>${escapeHtml(detail.short_id || detail.ticket_id || "-")}</strong></td>
              <td>${escapeHtml(formatHelpdeskDateTime(detail.event_date))}</td>
              <td>${Number(detail.points || 1)}</td>
            </tr>
          `,
        )
        .join("")
    : `<tr><td colspan="4"><div class="empty-state">${escapeHtml(metric.detailEmpty)}</div></td></tr>`;

  return `
    <tr class="analytics-agent-detail-row">
      <td colspan="${colSpan}">
        <div class="analytics-ticket-detail">
          <div class="analytics-ticket-detail-title">${escapeHtml(helpdeskAgentLabel(agent))} ${escapeHtml(metric.detailTitle)}</div>
          <div class="analytics-ticket-table-wrap">
            <table class="analytics-ticket-table">
              <thead>
                <tr>
                  <th>Counted date</th>
                  <th>Ticket short ID</th>
                  <th>${escapeHtml(metric.timeLabel)}</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </td>
    </tr>
  `;
}

function helpdeskAnalyticsPeriodLabel(filters = activeHelpdeskAnalyticsFilters()) {
  if (!filters.from || !filters.to) return "Selected period";
  return `${localDateValue(filters.from)} to ${localDateValue(filters.to)}`;
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
  const metric = helpdeskAnalyticsMetricConfig();
  const { days, rows, summary } = helpdeskAnalyticsExportRows();
  const totalTickets = state.helpdesk_analytics.data?.summary?.total_tickets || 0;
  const periodLabel = helpdeskAnalyticsPeriodLabel();
  const headerCells = ["Rank", "Agent", "Email / ID", metric.periodLabel, ...days]
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
      <caption>HelpDesk Analytics - ${escapeHtml(metric.tabLabel)} - ${escapeHtml(periodLabel)}</caption>
      <thead><tr>${headerCells}</tr></thead>
      <tbody>
        <tr>${summaryCells}</tr>
        ${rowMarkup}
      </tbody>
    </table>
  `;
}

function helpdeskAnalyticsExportFilename(extension) {
  const metric = helpdeskAnalyticsMetricConfig();
  return `helpdesk-analytics-${metric.exportSlug}-${helpdeskAnalyticsPeriodLabel().replaceAll(" ", "-")}.${extension}`;
}

function xmlEscape(value) {
  return `${value ?? ""}`
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function xlsxColumnName(index) {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function xlsxCellXml(value, rowIndex, columnIndex) {
  const ref = `${xlsxColumnName(columnIndex)}${rowIndex + 1}`;
  if (typeof value === "number" && Number.isFinite(value)) return `<c r="${ref}"><v>${value}</v></c>`;
  const text = `${value ?? ""}`;
  const preserve = text.trim() !== text ? ' xml:space="preserve"' : "";
  return `<c r="${ref}" t="inlineStr"><is><t${preserve}>${xmlEscape(text)}</t></is></c>`;
}

function xlsxWorksheetXml(rows) {
  const rowXml = rows
    .map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((value, columnIndex) => xlsxCellXml(value, rowIndex, columnIndex)).join("")}</row>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${rowXml}</sheetData>
</worksheet>`;
}

function safeXlsxSheetName(value, fallback) {
  const name = `${value || fallback || "Sheet"}`
    .replace(/[\\/?*:[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^'+|'+$/g, "");
  return (name || fallback || "Sheet").slice(0, 31);
}

function uniqueXlsxSheetName(value, usedNames, fallback) {
  const base = safeXlsxSheetName(value, fallback);
  let name = base;
  let index = 2;
  while (usedNames.has(name.toLowerCase())) {
    const suffix = ` ${index}`;
    name = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    index += 1;
  }
  usedNames.add(name.toLowerCase());
  return name;
}

function helpdeskAnalyticsWorkbookSheets() {
  const metric = helpdeskAnalyticsMetricConfig();
  const analytics = state.helpdesk_analytics.data;
  const { days, rows, summary } = helpdeskAnalyticsExportRows();
  const totalReplies = Number(analytics?.summary?.total_tickets || 0);
  const usedNames = new Set();
  const sheets = [
    {
      name: uniqueXlsxSheetName("Summary", usedNames),
      rows: [
        ["HelpDesk Analytics", helpdeskAnalyticsPeriodLabel()],
        ["Report", metric.tabLabel],
        [],
        ["Rank", "Agent", "Email / ID", metric.periodLabel, ...days],
        ["", "Account summary", "", totalReplies, ...summary],
        ...rows.map((row) => [row.rank, row.agent, row.email, row.total, ...row.days]),
      ],
    },
  ];

  [...(analytics?.agents || [])]
    .sort((left, right) => Number(right.total_tickets || 0) - Number(left.total_tickets || 0))
    .forEach((agent) => {
      const details = helpdeskAgentReplyDetails(agent);
      const detailRows = details.length
        ? details.map((detail) => [
            detail.date || "",
            detail.short_id || detail.ticket_id || "",
            formatHelpdeskDateTime(detail.event_date),
            Number(detail.points || 1),
          ])
        : [[metric.detailEmpty, "", "", ""]];
      sheets.push({
        name: uniqueXlsxSheetName(helpdeskAgentLabel(agent), usedNames, "Agent"),
        rows: [
          ["Agent", helpdeskAgentLabel(agent)],
          ["Email / ID", helpdeskAgentSubLabel(agent)],
          [metric.periodLabel, Number(agent.total_tickets || 0)],
          [],
          ["Counted date", "Ticket short ID", metric.timeLabel, "Points"],
          ...detailRows,
        ],
      });
    });

  return sheets;
}

function crc32Bytes(bytes) {
  if (!crc32Bytes.table) {
    crc32Bytes.table = Array.from({ length: 256 }, (_, index) => {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      return value >>> 0;
    });
  }
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crc32Bytes.table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

function bytesConcat(parts) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function uint16(value) {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
}

function uint32(value) {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]);
}

function zipStore(files) {
  const encoder = new TextEncoder();
  const { time, date } = dosDateTime();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const contentBytes = typeof file.content === "string" ? encoder.encode(file.content) : file.content;
    const crc = crc32Bytes(contentBytes);
    const localHeader = bytesConcat([
      uint32(0x04034b50),
      uint16(20),
      uint16(0),
      uint16(0),
      uint16(time),
      uint16(date),
      uint32(crc),
      uint32(contentBytes.length),
      uint32(contentBytes.length),
      uint16(nameBytes.length),
      uint16(0),
      nameBytes,
    ]);
    localParts.push(localHeader, contentBytes);

    centralParts.push(
      bytesConcat([
        uint32(0x02014b50),
        uint16(20),
        uint16(20),
        uint16(0),
        uint16(0),
        uint16(time),
        uint16(date),
        uint32(crc),
        uint32(contentBytes.length),
        uint32(contentBytes.length),
        uint16(nameBytes.length),
        uint16(0),
        uint16(0),
        uint16(0),
        uint16(0),
        uint32(0),
        uint32(offset),
        nameBytes,
      ]),
    );
    offset += localHeader.length + contentBytes.length;
  }

  const centralDirectory = bytesConcat(centralParts);
  const endRecord = bytesConcat([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(files.length),
    uint16(files.length),
    uint32(centralDirectory.length),
    uint32(offset),
    uint16(0),
  ]);

  return bytesConcat([...localParts, centralDirectory, endRecord]);
}

function xlsxWorkbookBlob(sheets) {
  const worksheetOverrides = sheets
    .map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
    .join("");
  const sheetRefs = sheets
    .map((sheet, index) => `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`)
    .join("");
  const relationships = sheets
    .map(
      (_, index) =>
        `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
    )
    .join("");
  const files = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${worksheetOverrides}
</Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheetRefs}</sheets>
</workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships}</Relationships>`,
    },
    ...sheets.map((sheet, index) => ({
      name: `xl/worksheets/sheet${index + 1}.xml`,
      content: xlsxWorksheetXml(sheet.rows),
    })),
  ];

  return new Blob([zipStore(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

function downloadTextFile(filename, content, type) {
  downloadBlobFile(filename, new Blob([content], { type }));
}

function downloadBlobFile(filename, blob) {
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

  downloadBlobFile(helpdeskAnalyticsExportFilename("xlsx"), xlsxWorkbookBlob(helpdeskAnalyticsWorkbookSheets()));
  setMessage(statusMessage, "HelpDesk analytics XLSX export downloaded.");
}

function exportHelpdeskAnalyticsPdf() {
  if (!state.helpdesk_analytics.data) {
    setMessage(statusMessage, "Load HelpDesk analytics before exporting.", "error");
    return;
  }

  const metric = helpdeskAnalyticsMetricConfig();
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    setMessage(statusMessage, "Allow pop-ups to export the HelpDesk analytics PDF.", "error");
    return;
  }

  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>HelpDesk Analytics ${escapeHtml(metric.tabLabel)} ${escapeHtml(helpdeskAnalyticsPeriodLabel())}</title>
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
    <div class="meta">${escapeHtml(metric.tabLabel)}</div>
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
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: HELPDESK_ANALYTICS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function helpdeskTicketRequesterLabel(ticket) {
  return ticket.requesterEmail || ticket.requester?.email || ticket.requesterName || ticket.requester?.name || "-";
}

function helpdeskTicketAgentLabel(ticket) {
  const agent = ticket.assignedAgent || ticket.assignment?.agent || {};
  const name = agent.name || "";
  const email = agent.email || "";
  if (name && email && name !== email) return `${name} <${email}>`;
  return name || email || "Unassigned";
}

function helpdeskTicketAgentMarkup(ticket) {
  const agent = ticket.assignedAgent || ticket.assignment?.agent || {};
  const name = agent.name || "";
  const email = agent.email || "";
  if (!name && !email) return `<span class="subtle">Unassigned</span>`;

  return `
    <div class="ticket-agent-cell">
      <strong>${escapeHtml(name || email)}</strong>
      ${email && email !== name ? `<small>${escapeHtml(email)}</small>` : ""}
    </div>
  `;
}

function helpdeskTicketSortButton(sortBy, label) {
  const filters = state.helpdeskTickets.filters;
  const active = filters.sortBy === sortBy;
  const icon = active ? (filters.order === "asc" ? "bi-arrow-up" : "bi-arrow-down") : "bi-arrow-down-up";
  return `
    <button
      class="tickets-sort-button ${active ? "active" : ""}"
      type="button"
      data-helpdesk-ticket-sort="${escapeHtml(sortBy)}"
      aria-label="Sort tickets by ${escapeHtml(label)}"
    >
      <span>${escapeHtml(label)}</span>
      <i class="bi ${icon}"></i>
    </button>
  `;
}

function helpdeskTicketPriorityLabel(value) {
  return HELPDESK_TICKET_PRIORITIES.find((priority) => priority.value === `${value}`)?.label || "Medium";
}

function helpdeskTicketTagsMarkup(ticket) {
  const tagMap = new Map((state.helpdeskTickets.tags || []).map((tag) => [String(tag.id), tag.name]));
  const tags = (ticket.tagIDs || []).map((tagId) => tagMap.get(String(tagId))).filter(Boolean);
  if (!tags.length) return "";
  return `
    <div class="ticket-tag-list">
      ${tags.map((tag) => `<span class="chip ticket-tag">${escapeHtml(tag)}</span>`).join("")}
    </div>
  `;
}

function helpdeskTicketSortValue(ticket, sortBy) {
  if (sortBy === "requester") {
    return helpdeskTicketRequesterLabel(ticket).toLowerCase();
  }
  if (sortBy === "assignedAgent") {
    return helpdeskTicketAgentLabel(ticket).toLowerCase();
  }
  if (sortBy === "priority") {
    return Number(ticket.priority ?? 0);
  }
  if (HELPDESK_TICKET_DATE_SORTS.has(sortBy)) {
    return new Date(ticket[sortBy] || 0).getTime() || 0;
  }
  return `${ticket[sortBy] || ""}`.toLowerCase();
}

function sortHelpdeskTicketRows(tickets) {
  const { sortBy, order } = state.helpdeskTickets.filters;
  const direction = order === "asc" ? 1 : -1;
  return [...tickets]
    .map((ticket, index) => ({ ticket, index }))
    .sort((left, right) => {
      const leftValue = helpdeskTicketSortValue(left.ticket, sortBy);
      const rightValue = helpdeskTicketSortValue(right.ticket, sortBy);
      let result = 0;
      if (typeof leftValue === "number" && typeof rightValue === "number") {
        result = leftValue - rightValue;
      } else {
        result = `${leftValue}`.localeCompare(`${rightValue}`);
      }
      return result === 0 ? left.index - right.index : result * direction;
    })
    .map((item) => item.ticket);
}

function defaultHelpdeskTicketSortOrder(sortBy) {
  return HELPDESK_TICKET_TEXT_SORTS.has(sortBy) ? "asc" : "desc";
}

function ticketCountLabel(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? String(number) : "0";
}

function activeHelpdeskTicketViewLabel() {
  const filters = state.helpdeskTickets.filters;
  if (filters.silo !== "tickets") {
    return HELPDESK_TICKET_FOLDERS.find((folder) => folder.id === filters.silo)?.label || "Tickets";
  }
  return HELPDESK_TICKET_STATUSES.find((status) => status.id === filters.status)?.label || "Open";
}

function resetHelpdeskTicketPagination() {
  state.helpdeskTickets.page.pageIndex = 0;
  state.helpdeskTickets.page.nextCursor = null;
  state.helpdeskTickets.page.prevCursor = null;
  state.helpdeskTickets.page.cursorStack = [];
}

function renderHelpdeskTicketsSidebar() {
  const { counts, filters, sidebarCollapsed } = state.helpdeskTickets;
  return `
    <aside class="tickets-left-rail ${sidebarCollapsed ? "collapsed" : ""}">
      <div class="tickets-left-rail-head">
        <span>${sidebarCollapsed ? "" : "Queues"}</span>
        <button
          id="helpdeskTicketsSidebarToggle"
          class="tickets-rail-toggle"
          type="button"
          aria-label="${sidebarCollapsed ? "Expand ticket menu" : "Collapse ticket menu"}"
        >
          <i class="bi ${sidebarCollapsed ? "bi-chevron-right" : "bi-chevron-left"}"></i>
        </button>
      </div>
      ${
        sidebarCollapsed
          ? ""
          : `
            <div class="tickets-rail-section">
              <div class="tickets-rail-label">Statuses</div>
              ${HELPDESK_TICKET_STATUSES.map(
                (status) => `
                  <button
                    class="tickets-rail-item ${filters.silo === "tickets" && filters.status === status.id ? "active" : ""}"
                    type="button"
                    data-helpdesk-ticket-status="${status.id}"
                  >
                    <span>${escapeHtml(status.label)}</span>
                    <span class="tickets-rail-count">${ticketCountLabel(counts.statuses?.[status.id])}</span>
                  </button>
                `,
              ).join("")}
            </div>
            <div class="tickets-rail-section">
              <div class="tickets-rail-label">Folders</div>
              ${HELPDESK_TICKET_FOLDERS.map(
                (folder) => `
                  <button
                    class="tickets-rail-item ${filters.silo === folder.id ? "active" : ""}"
                    type="button"
                    data-helpdesk-ticket-folder="${folder.id}"
                  >
                    <span>${escapeHtml(folder.label)}</span>
                  </button>
                `,
              ).join("")}
            </div>
            ${renderHelpdeskTicketMergeLogs()}
          `
      }
    </aside>
  `;
}

function mergeLogSummary(entry) {
  const metadata = entry.metadata || {};
  const child =
    metadata.childShortId ||
    metadata.childTicketId ||
    metadata.mergedTickets?.[0]?.childShortId ||
    metadata.mergedTickets?.[0]?.childTicketId ||
    "ticket";
  const parent = metadata.parentShortId || metadata.parentTicketId || entry.target || "parent";
  return `${child} -> ${parent}`;
}

function mergeLogSubtext(entry) {
  const metadata = entry.metadata || {};
  const requester = metadata.requesterEmail || "";
  const criteria = metadata.duplicateContentPreview ? "matching content" : metadata.createdDate || "";
  const mode = metadata.mode === "automatic_6h_rule" ? "Auto 6h" : metadata.mode === "automatic" ? "Auto" : "Manual";
  return [mode, requester, criteria].filter(Boolean).join(" · ");
}

function renderHelpdeskTicketMergeLogs() {
  const logs = state.helpdeskTickets.mergeLogs || [];
  return `
    <div class="tickets-rail-section tickets-merge-log-section">
      <div class="tickets-rail-label">Merge logs</div>
      ${
        logs.length
          ? `<div class="tickets-merge-log-list">
              ${logs
                .map(
                  (entry) => `
                    <div class="tickets-merge-log-item">
                      <strong>${escapeHtml(mergeLogSummary(entry))}</strong>
                      <span>${escapeHtml(mergeLogSubtext(entry))}</span>
                      <small>${escapeHtml(formatHelpdeskDateTime(entry.created_at))}</small>
                    </div>
                  `,
                )
                .join("")}
            </div>`
          : `<div class="tickets-merge-log-empty">No merges logged yet.</div>`
      }
    </div>
  `;
}

function renderHelpdeskTicketsFilterBar() {
  const { filters, tags } = state.helpdeskTickets;
  return `
    <div class="tickets-filter-bar">
      <label class="tickets-filter-group">
        <span>Creation date</span>
        <div class="tickets-date-pair">
          <input id="helpdeskTicketCreatedFrom" class="form-control" type="date" value="${escapeHtml(filters.createdDateFrom)}" />
          <input id="helpdeskTicketCreatedTo" class="form-control" type="date" value="${escapeHtml(filters.createdDateTo)}" />
        </div>
      </label>
      <label class="tickets-filter-group">
        <span>Last activity</span>
        <div class="tickets-date-pair">
          <input id="helpdeskTicketUpdatedFrom" class="form-control" type="date" value="${escapeHtml(filters.updatedDateFrom)}" />
          <input id="helpdeskTicketUpdatedTo" class="form-control" type="date" value="${escapeHtml(filters.updatedDateTo)}" />
        </div>
      </label>
      <label class="tickets-filter-group">
        <span>Last message</span>
        <div class="tickets-date-pair">
          <input id="helpdeskTicketLastMessageFrom" class="form-control" type="date" value="${escapeHtml(filters.lastMessageFrom)}" />
          <input id="helpdeskTicketLastMessageTo" class="form-control" type="date" value="${escapeHtml(filters.lastMessageTo)}" />
        </div>
      </label>
      <label class="tickets-filter-group">
        <span>Priority</span>
        <select id="helpdeskTicketPriority" class="form-select">
          ${HELPDESK_TICKET_PRIORITIES.map(
            (priority) =>
              `<option value="${escapeHtml(priority.value)}" ${filters.priority === priority.value ? "selected" : ""}>${escapeHtml(priority.label)}</option>`,
          ).join("")}
        </select>
      </label>
      <label class="tickets-filter-group">
        <span>Tag</span>
        <select id="helpdeskTicketTag" class="form-select">
          <option value="" ${filters.tagId ? "" : "selected"}>Any tag</option>
          ${tags
            .map(
              (tag) =>
                `<option value="${escapeHtml(tag.id)}" ${filters.tagId === tag.id ? "selected" : ""}>${escapeHtml(tag.name)} (${ticketCountLabel(tag.count)})</option>`,
            )
            .join("")}
        </select>
      </label>
      <label class="tickets-filter-group">
        <span>Sort</span>
        <select id="helpdeskTicketSortBy" class="form-select">
          ${HELPDESK_TICKET_SORTS.map(
            (sort) =>
              `<option value="${escapeHtml(sort.value)}" ${filters.sortBy === sort.value ? "selected" : ""}>${escapeHtml(sort.label)}</option>`,
          ).join("")}
        </select>
      </label>
      <div class="tickets-filter-actions">
        <button id="helpdeskTicketsFilterBtn" class="btn btn-primary" type="button">Filter</button>
        <button id="helpdeskTicketsResetFiltersBtn" class="btn btn-outline-secondary" type="button">Reset</button>
        <button id="helpdeskTicketsReloadBtn" class="btn btn-outline-secondary" type="button">
          ${state.helpdeskTickets.loading ? "Loading..." : "Reload"}
        </button>
      </div>
      <div class="tickets-filter-group">
        <span>Export</span>
        <div class="tickets-export-actions">
          <button class="btn btn-outline-secondary" type="button" data-helpdesk-ticket-export="2000">Download tickets</button>
        </div>
      </div>
    </div>
  `;
}

function renderHelpdeskTicketsPager() {
  const { page, tickets } = state.helpdeskTickets;
  const pageSize = Number(state.helpdeskTickets.filters.pageSize || 40);
  const pageIndex = Number(page.pageIndex || 0);
  const totalResults = Number(page.totalResults || tickets.length || 0);
  const from = totalResults && tickets.length ? pageIndex * pageSize + 1 : 0;
  const to = totalResults && tickets.length ? Math.min(totalResults, pageIndex * pageSize + tickets.length) : 0;
  const hasPrev = page.cursorPagination && page.cursorStack.length > 0;
  const hasNext = page.cursorPagination
    ? page.nextCursor && (!totalResults || pageIndex * pageSize + tickets.length < totalResults)
    : false;

  return `
    <div class="tickets-pager">
      <div class="subtle">
        ${totalResults ? `${from}-${to} of ${ticketCountLabel(totalResults)}` : "No matching tickets"}
      </div>
      <div class="tickets-pager-actions">
        <button class="btn btn-sm btn-outline-secondary" type="button" data-helpdesk-ticket-page="prev" ${hasPrev ? "" : "disabled"}>Previous</button>
        <span class="tickets-page-chip">Page ${pageIndex + 1}${page.totalPages ? ` of ${page.totalPages}` : ""}</span>
        <button class="btn btn-sm btn-outline-secondary" type="button" data-helpdesk-ticket-page="next" ${hasNext ? "" : "disabled"}>Next</button>
      </div>
    </div>
  `;
}

function helpdeskTicketReceivedDate(ticket) {
  const date = new Date(ticket.createdAt || ticket.ticket_created_at || "");
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameLocalDay(left, right) {
  return (
    left &&
    right &&
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function helpdeskTicketMonthLabel(ticket) {
  const date = helpdeskTicketReceivedDate(ticket);
  if (!date) return "No received date";
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function splitRequesterTicketsByDate(tickets) {
  const now = new Date();
  const today = [];
  const months = new Map();

  for (const ticket of tickets || []) {
    const date = helpdeskTicketReceivedDate(ticket);
    if (date && isSameLocalDay(date, now)) {
      today.push(ticket);
      continue;
    }

    const month = helpdeskTicketMonthLabel(ticket);
    if (!months.has(month)) months.set(month, []);
    months.get(month).push(ticket);
  }

  const sortByCreated = (items) =>
    [...items].sort((left, right) => (left.createdAt || "").localeCompare(right.createdAt || ""));

  return {
    today: sortByCreated(today),
    months: Array.from(months.entries()).map(([label, items]) => ({
      label,
      tickets: sortByCreated(items),
    })),
  };
}

function renderRequesterTicketList(tickets, currentTicketId) {
  if (!tickets.length) {
    return `<div class="empty-state">No tickets in this group.</div>`;
  }

  return `
    <div class="requester-ticket-list">
      ${tickets
        .map((ticket) => {
          const isCurrent = String(ticket.id) === String(currentTicketId);
          return `
            <button
              class="requester-ticket-link ${isCurrent ? "current" : ""}"
              type="button"
              data-helpdesk-related-ticket-open="${escapeHtml(ticket.id)}"
            >
              <span>
                <strong>${escapeHtml(ticket.short_id || ticket.shortID || ticket.id || "-")}</strong>
                ${isCurrent ? `<small>Current ticket</small>` : ""}
              </span>
              <span>${escapeHtml(ticket.subject || "No subject")}</span>
              <small>${escapeHtml(formatHelpdeskDateTime(ticket.createdAt))}</small>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderHelpdeskRequesterTicketSidebar(ticket) {
  const requesterTickets = ticket.requesterTickets || [];
  const currentTicketId = ticket.id || ticket.ticket_id;
  const groups = splitRequesterTicketsByDate(requesterTickets);
  const todayParent = groups.today[0] || null;
  const todayChildren = todayParent
    ? groups.today
        .slice(1)
        .filter((item) => String(item.id) !== String(todayParent.id) && !item.parentTicket)
        .map((item) => item.id)
    : [];

  return `
    <aside class="ticket-sidebar">
      <div class="ticket-sidebar-head">
        <div class="section-title">Requester tickets</div>
        <div class="subtle">${escapeHtml(helpdeskTicketRequesterLabel(ticket))}</div>
      </div>
      <div class="ticket-sidebar-group">
        <div class="ticket-sidebar-group-head">
          <strong>Received today</strong>
          <span>${groups.today.length}</span>
        </div>
        <button
          id="helpdeskMergeTodayBtn"
          class="btn btn-sm btn-outline-primary"
          type="button"
          ${todayChildren.length ? "" : "disabled"}
          data-parent-ticket-id="${escapeHtml(todayParent?.id || "")}"
          data-child-ticket-ids="${escapeHtml(todayChildren.join(","))}"
        >
          Merge today into first ticket
        </button>
        ${renderRequesterTicketList(groups.today, currentTicketId)}
      </div>
      ${
        groups.months.length
          ? groups.months
              .map(
                (group) => `
                  <div class="ticket-sidebar-group">
                    <div class="ticket-sidebar-group-head">
                      <strong>${escapeHtml(group.label)}</strong>
                      <span>${group.tickets.length}</span>
                    </div>
                    ${renderRequesterTicketList(group.tickets, currentTicketId)}
                  </div>
                `,
              )
              .join("")
          : `<div class="empty-state">No older requester tickets loaded.</div>`
      }
    </aside>
  `;
}

function renderHelpdeskTickets() {
  const { tickets, loading, error, updatedAt, counts } = state.helpdeskTickets;
  const currentLabel = activeHelpdeskTicketViewLabel();

  return `
    <div class="tickets-workspace ${state.helpdeskTickets.sidebarCollapsed ? "tickets-workspace-collapsed" : ""}">
      ${renderHelpdeskTicketsSidebar()}
      <section class="tickets-main">
        ${renderStats([
          { label: currentLabel, value: state.helpdeskTickets.page.totalResults || tickets.length, meta: "Matching tickets" },
          { label: "Open", value: ticketCountLabel(counts.statuses?.open), meta: "Open queue total" },
          { label: "Pending", value: ticketCountLabel(counts.statuses?.pending), meta: "Pending queue total" },
          { label: "On hold", value: ticketCountLabel(counts.statuses?.onhold), meta: updatedAt ? `Updated ${formatHelpdeskDateTime(updatedAt)}` : "Auto-refreshing" },
        ])}
        ${renderHelpdeskTicketsFilterBar()}
        <div class="table-shell tickets-table-shell">
          <div class="tickets-toolbar">
            <div>
              <div class="section-title">${escapeHtml(currentLabel)} tickets</div>
              <div class="subtle">40 tickets per page. Live table refreshes every 30 seconds.</div>
            </div>
            ${renderHelpdeskTicketsPager()}
          </div>
          ${
            error
              ? `<div class="empty-state analytics-error">${escapeHtml(error)}</div>`
              : tickets.length
                ? `<div class="table-responsive">
                    <table class="table admin-table tickets-table">
                      <thead>
                        <tr>
                          <th>Open</th>
                          <th>${helpdeskTicketSortButton("requester", "Requester (email)")}</th>
                          <th>Subject</th>
                          <th>${helpdeskTicketSortButton("assignedAgent", "Assigned agent")}</th>
                          <th>${helpdeskTicketSortButton("priority", "Priority")}</th>
                          <th>${helpdeskTicketSortButton("updatedAt", "Last activity")}</th>
                          <th>${helpdeskTicketSortButton("lastMessageAt", "Last message")}</th>
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
                                    data-helpdesk-ticket-open-live="${escapeHtml(ticket.id)}"
                                  >Open</button>
                                </td>
                                <td>
                                  <strong>${escapeHtml(helpdeskTicketRequesterLabel(ticket))}</strong>
                                  ${ticket.requesterName ? `<div class="analytics-agent-sub">${escapeHtml(ticket.requesterName)}</div>` : ""}
                                </td>
                                <td>
                                  <div class="ticket-subject-cell">
                                    <strong>${escapeHtml(ticket.subject || "No subject")}</strong>
                                    <span class="chip">${escapeHtml(ticket.status || "unknown")}</span>
                                    ${ticket.short_id ? `<small>${escapeHtml(ticket.short_id)}</small>` : ""}
                                    ${helpdeskTicketTagsMarkup(ticket)}
                                  </div>
                                </td>
                                <td>${helpdeskTicketAgentMarkup(ticket)}</td>
                                <td>${escapeHtml(helpdeskTicketPriorityLabel(ticket.priority))}</td>
                                <td>${escapeHtml(formatHelpdeskDateTime(ticket.updatedAt))}</td>
                                <td>${escapeHtml(formatHelpdeskDateTime(ticket.lastMessageAt))}</td>
                              </tr>
                            `,
                          )
                          .join("")}
                      </tbody>
                    </table>
                  </div>`
                : `<div class="empty-state">${loading ? "Loading HelpDesk tickets..." : "No HelpDesk tickets returned."}</div>`
          }
          ${renderHelpdeskTicketsPager()}
        </div>
      </section>
    </div>
  `;
}

function helpdeskWorkflowTypeLabel(type) {
  if (type === "auto_merge_duplicates") return "Auto-merge";
  if (type === "auto_merge_6h_rule") return "Auto-merge 6h";
  if (type === "auto_resolve_requester") return "Auto-resolve";
  if (type === "auto_resolve_marketing_spam") return "Auto-spam";
  if (type === "auto_reply_empty_requester_ticket") return "Empty-ticket reply";
  if (type === "auto_reply_new_requester_ticket") return "Auto-reply";
  return type ? type.replaceAll("_", " ") : "Workflow";
}

function helpdeskWorkflowConfigText(workflow) {
  const config = workflow.config || {};
  if (workflow.type === "auto_merge_duplicates") {
    return "Duplicate open tickets from the same requester with matching email content.";
  }
  if (workflow.type === "auto_merge_6h_rule") {
    return `Open tickets from the same requester created within ${config.windowHours || 6}h of their latest ticket; oldest remains open.`;
  }
  if (workflow.type === "auto_resolve_requester") {
    const tags = (config.tagNames || []).length ? ` · tags: ${(config.tagNames || []).join(", ")}` : "";
    return `${config.requesterEmail || "requester"} -> ${config.status || "solved"}${tags}`;
  }
  if (workflow.type === "auto_reply_new_requester_ticket") {
    return `sender: ${config.senderName || config.senderAgentId || "agent"} · first author: ${config.firstAuthorType || "client"}`;
  }
  if (workflow.type === "auto_reply_empty_requester_ticket") {
    return `empty requester message -> ${config.status || "solved"} · sender: ${config.senderName || config.senderEmail || config.senderAgentId || "agent"}`;
  }
  if (workflow.type === "auto_resolve_marketing_spam") {
    const keywordText = workflowMarketingSpamKeywordsValue(workflow);
    const keywords = keywordText ? ` · keywords: ${keywordText.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 6).join(", ")}` : "";
    return `Marketing/SEO solicitations -> ${config.status || "solved"} · tags: ${(config.tagNames || ["wf_spam"]).join(", ")}${keywords}`;
  }
  return "";
}

function workflowMarketingSpamKeywordsValue(workflow) {
  const keywords = workflow?.config?.keywords;
  const source = Array.isArray(keywords) && keywords.length ? keywords : HELPDESK_MARKETING_SPAM_DEFAULT_KEYWORDS;
  return source.join(", ");
}

function workflowAnalyticsPresetLabel(value) {
  const labels = {
    last_7_days: "Last 7 days",
    this_month: "Current month",
    last_month: "Previous month",
    custom: "Custom range",
  };
  return labels[value] || "Last 7 days";
}

function ensureWorkflowAnalyticsRange() {
  const filters = state.helpdeskWorkflows.analytics.filters;
  if (filters.preset === "custom" && filters.from && filters.to) {
    return;
  }
  const range = analyticsPresetRange(filters.preset || "last_7_days");
  filters.from = localDateValue(range.from);
  filters.to = localDateValue(range.to);
}

function renderWorkflowAnalyticsFilters() {
  ensureWorkflowAnalyticsRange();
  const filters = state.helpdeskWorkflows.analytics.filters;
  const presets = ["last_7_days", "this_month", "last_month", "custom"];
  return `
    <div class="table-shell workflow-analytics-filter-shell">
      <div class="workflow-analytics-filter-grid">
        <label class="tickets-filter-group">
          <span>Period</span>
          <select id="workflowAnalyticsPreset" class="form-select">
            ${presets.map((preset) => `<option value="${preset}" ${filters.preset === preset ? "selected" : ""}>${workflowAnalyticsPresetLabel(preset)}</option>`).join("")}
          </select>
        </label>
        <label class="tickets-filter-group">
          <span>From</span>
          <input id="workflowAnalyticsFrom" class="form-control" type="date" value="${escapeHtml(filters.from)}" />
        </label>
        <label class="tickets-filter-group">
          <span>To</span>
          <input id="workflowAnalyticsTo" class="form-control" type="date" value="${escapeHtml(filters.to)}" />
        </label>
        <div class="workflow-form-actions">
          <button id="workflowAnalyticsReloadBtn" class="btn btn-outline-secondary" type="button">Reload analytics</button>
        </div>
      </div>
    </div>
  `;
}

function renderWorkflowAnalyticsCards() {
  const analytics = state.helpdeskWorkflows.analytics;
  const summary = analytics.data?.summary || {};
  const openTickets = analytics.data?.openTickets || {};
  const period = analytics.data?.period;
  const meta = period ? `${period.from} to ${period.to}` : workflowAnalyticsPresetLabel(analytics.filters.preset);
  const openCountLabel = (value) => (value === null || value === undefined ? "—" : ticketCountLabel(value));
  return renderStats([
    { label: "Open today", value: openCountLabel(openTickets.today?.count), meta: `Open queue snapshot · ${openTickets.today?.date || "today"}` },
    { label: "Open yesterday", value: openCountLabel(openTickets.yesterday?.count), meta: `Saved open queue snapshot · ${openTickets.yesterday?.date || "yesterday"}` },
    { label: "Solved", value: Number(summary.ticketsSolved || 0), meta: `Workflow ticket solves · ${meta}` },
    { label: "Empty replies", value: Number(summary.emptyTicketReplies || 0), meta: "Auto-reply empty requester tickets" },
    { label: "Auto-merged", value: Number(summary.ticketsMerged || 0), meta: "Duplicate + 6h merge rules" },
  ]);
}

function renderWorkflowAnalyticsDailyRows() {
  const daily = state.helpdeskWorkflows.analytics.data?.daily || [];
  if (!daily.length) {
    return `<tr><td colspan="5"><div class="empty-state">No workflow analytics for this period.</div></td></tr>`;
  }
  return daily
    .map(
      (day) => `
        <tr>
          <td>${escapeHtml(day.date)}</td>
          <td>${day.openTickets === null || day.openTickets === undefined ? "—" : ticketCountLabel(day.openTickets)}</td>
          <td>${Number(day.ticketsSolved || 0)}</td>
          <td>${Number(day.emptyTicketReplies || 0)}</td>
          <td>${Number(day.ticketsMerged || 0)}</td>
        </tr>
      `,
    )
    .join("");
}

function renderWorkflowAnalyticsTable() {
  const analytics = state.helpdeskWorkflows.analytics;
  return `
    <div class="table-shell workflow-analytics-shell">
      <div class="tickets-toolbar">
        <div>
          <div class="section-title">Workflow analytics</div>
          <div class="subtle">${analytics.loading ? "Loading analytics..." : "Workflow counts and open queue snapshots are persisted in D1."}</div>
        </div>
      </div>
      ${
        analytics.error
          ? `<div class="empty-state analytics-error">${escapeHtml(analytics.error)}</div>`
          : `<div class="table-responsive">
              <table class="table admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Open tickets</th>
                    <th>Solved</th>
                    <th>Empty replies</th>
                    <th>Auto-merged</th>
                  </tr>
                </thead>
                <tbody>${renderWorkflowAnalyticsDailyRows()}</tbody>
              </table>
            </div>`
      }
    </div>
  `;
}

function renderHelpdeskWorkflowRows() {
  const workflows = state.helpdeskWorkflows.workflows || [];
  if (!workflows.length) {
    return `<tr><td colspan="4"><div class="empty-state">No HelpDesk workflows yet.</div></td></tr>`;
  }

  return workflows
    .map((workflow) => {
      const canRun = ["auto_merge_duplicates", "auto_merge_6h_rule", "auto_resolve_requester", "auto_resolve_marketing_spam", "auto_reply_empty_requester_ticket"].includes(workflow.type);
      const isRunning = state.helpdeskWorkflows.runningWorkflowId === workflow.id;
      const isSaving = state.helpdeskWorkflows.savingWorkflowId === workflow.id;
      const isMarketingSpam = workflow.type === "auto_resolve_marketing_spam";
      return `
        <tr>
          <td>
            <div class="workflow-name-cell">
              <strong>${escapeHtml(workflow.title)}</strong>
              <span>${escapeHtml(helpdeskWorkflowConfigText(workflow))}</span>
              ${
                isMarketingSpam
                  ? `<div class="workflow-inline-config">
                      <label for="workflowSpamKeywords-${escapeHtml(workflow.id)}">Keywords/phrases</label>
                      <div class="workflow-inline-config-row">
                        <input
                          id="workflowSpamKeywords-${escapeHtml(workflow.id)}"
                          class="form-control"
                          type="text"
                          value="${escapeHtml(workflowMarketingSpamKeywordsValue(workflow))}"
                          placeholder="partnership, SEO, guest post"
                          data-helpdesk-spam-keywords="${escapeHtml(workflow.id)}"
                        />
                        <button
                          class="btn btn-sm btn-primary"
                          type="button"
                          data-helpdesk-spam-keywords-save="${escapeHtml(workflow.id)}"
                          ${isSaving ? "disabled" : ""}
                        >${isSaving ? "Saving..." : "Save"}</button>
                      </div>
                    </div>`
                  : ""
              }
            </div>
          </td>
          <td><span class="chip">${escapeHtml(helpdeskWorkflowTypeLabel(workflow.type))}</span></td>
          <td>
            <div class="workflow-actions">
              ${
                canRun
                  ? `<button
                      class="btn btn-sm btn-primary"
                      type="button"
                      data-helpdesk-workflow-run="${escapeHtml(workflow.id)}"
                      ${isRunning ? "disabled" : ""}
                    >${isRunning ? "Running..." : "Run"}</button>`
                  : ""
              }
            </div>
          </td>
          <td>
            <label class="workflow-switch">
              <input
                type="checkbox"
                data-helpdesk-workflow-toggle="${escapeHtml(workflow.id)}"
                ${workflow.enabled ? "checked" : ""}
              />
              <span></span>
            </label>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderHelpdeskWorkflowWebhookRows() {
  const daily = state.helpdeskWorkflows.webhookStats?.daily || [];
  if (!daily.length) {
    return `<tr><td colspan="7"><div class="empty-state">No create-ticket webhook stats recorded yet.</div></td></tr>`;
  }

  return daily
    .map(
      (day) => `
        <tr>
          <td>${escapeHtml(day.date)}</td>
          <td>${Number(day.webhooksReceived || 0)}</td>
          <td>${Number(day.workflowRuns || 0)}</td>
          <td>${Number(day.ticketsSolved || 0)}</td>
          <td>${Number(day.ticketsAutoReplied || 0)}</td>
          <td>${Number(day.ticketsMerged || 0)}</td>
          <td>${Number(day.errors || 0)}</td>
        </tr>
      `,
    )
    .join("");
}

function renderHelpdeskWorkflowWebhookActivity() {
  return `
    <div class="table-shell workflow-webhook-shell">
      <div class="tickets-toolbar">
        <div>
          <div class="section-title">Create-ticket webhook activity</div>
          <div class="subtle">Daily counters from /webhooks/create-ticket/ are refreshed live while this page is open.</div>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Webhooks</th>
              <th>Workflow runs</th>
              <th>Solved</th>
              <th>Auto-replied</th>
              <th>Merged</th>
              <th>Errors</th>
            </tr>
          </thead>
          <tbody>${renderHelpdeskWorkflowWebhookRows()}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderHelpdeskWorkflowRuns() {
  const workflowId = state.helpdeskWorkflows.runsFor;
  if (!workflowId) return "";

  const workflow = (state.helpdeskWorkflows.workflows || []).find((item) => item.id === workflowId);
  const runs = state.helpdeskWorkflows.runs || [];
  return `
    <div class="table-shell workflow-runs-shell">
      <div class="tickets-toolbar">
        <div>
          <div class="section-title">Runs${workflow ? ` · ${escapeHtml(workflow.title)}` : ""}</div>
          <div class="subtle">Most recent workflow executions.</div>
        </div>
      </div>
      ${
        runs.length
          ? `<div class="table-responsive">
              <table class="table admin-table">
                <thead>
                  <tr>
                    <th>Started</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  ${runs
                    .map(
                      (run) => `
                        <tr>
                          <td>${escapeHtml(formatHelpdeskDateTime(run.startedAt))}</td>
                          <td><span class="chip">${escapeHtml(run.status)}</span></td>
                          <td>${escapeHtml(run.details || "No details.")}</td>
                        </tr>
                      `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>`
          : `<div class="empty-state">No runs recorded for this workflow.</div>`
      }
    </div>
  `;
}

function renderHelpdeskWorkflowCreateForm() {
  const form = state.helpdeskWorkflows.form;
  const type = form.type || "auto_resolve_requester";
  const isAutoReply = type === "auto_reply_new_requester_ticket";
  return `
    <div class="table-shell workflow-form-shell">
      <div class="tickets-toolbar">
        <div>
          <div class="section-title">New workflow</div>
          <div class="subtle">Enabled workflows run when a create-ticket webhook is received.</div>
        </div>
      </div>
      <div class="workflow-form-grid">
        <label class="tickets-filter-group">
          <span>Type</span>
          <select id="workflowTypeInput" class="form-select">
            <option value="auto_resolve_requester" ${type === "auto_resolve_requester" ? "selected" : ""}>Auto-resolve</option>
            <option value="auto_reply_new_requester_ticket" ${isAutoReply ? "selected" : ""}>Auto-reply</option>
          </select>
        </label>
        <label class="tickets-filter-group ${isAutoReply ? "workflow-field-wide" : ""}">
          <span>Title</span>
          <input id="workflowTitleInput" class="form-control" type="text" value="${escapeHtml(form.title)}" />
        </label>
        ${
          isAutoReply
            ? `<label class="tickets-filter-group">
                <span>Sender</span>
                <input id="workflowSenderInput" class="form-control" type="text" value="${escapeHtml(form.senderName)}" />
              </label>
              <label class="tickets-filter-group workflow-message-group">
                <span>Message</span>
                <textarea id="workflowMessageInput" class="form-control workflow-message-input">${escapeHtml(form.messageText)}</textarea>
              </label>`
            : `<label class="tickets-filter-group">
                <span>Requester email</span>
                <input id="workflowRequesterInput" class="form-control" type="email" value="${escapeHtml(form.requesterEmail)}" />
              </label>
              <label class="tickets-filter-group">
                <span>Status</span>
                <select id="workflowStatusInput" class="form-select">
                  ${HELPDESK_TICKET_STATUSES
                    .map((status) => `<option value="${status.id}" ${form.status === status.id ? "selected" : ""}>${escapeHtml(status.label)}</option>`)
                    .join("")}
                </select>
              </label>
              <label class="tickets-filter-group">
                <span>Tags to add</span>
                <input id="workflowTagsInput" class="form-control" type="text" value="${escapeHtml(form.tags)}" placeholder="other, complaint" />
              </label>`
        }
        <div class="workflow-form-actions">
          <button id="workflowSaveBtn" class="btn btn-primary" type="button">Save workflow</button>
        </div>
      </div>
    </div>
  `;
}

function renderHelpdeskWorkflows() {
  const { loading, error, workflows } = state.helpdeskWorkflows;
  const webhookStats = state.helpdeskWorkflows.webhookStats || {};
  const enabledCount = workflows.filter((workflow) => workflow.enabled).length;
  const todayWebhookStats = webhookStats.daily?.[0] || {};
  const workflowRunsToday = Number(todayWebhookStats.workflowRuns || 0);
  const actionsToday = Number(todayWebhookStats.actions || 0);

  return `
    <section class="workflows-page">
      ${renderStats([
        { label: "Workflows", value: workflows.length, meta: "Configured rules" },
        { label: "Enabled", value: enabledCount, meta: "Currently active" },
        { label: "Webhooks today", value: Number(webhookStats.receivedLast24h || 0), meta: `${Number(webhookStats.total || 0)} total received` },
        { label: "Workflow runs", value: workflowRunsToday, meta: "Today" },
        { label: "Actions", value: actionsToday, meta: "Today" },
      ])}
      ${renderHelpdeskWorkflowWebhookActivity()}
      ${renderWorkflowAnalyticsFilters()}
      ${renderWorkflowAnalyticsCards()}
      ${renderWorkflowAnalyticsTable()}
      <div class="table-shell workflows-table-shell">
        <div class="tickets-toolbar">
          <div>
            <div class="section-title">HelpDesk workflows</div>
            <div class="subtle">${loading ? "Loading workflows..." : "Switch workflows on or off. Run counts are stored in daily stats above."}</div>
          </div>
          <button id="workflowsReloadBtn" class="btn btn-sm btn-outline-secondary" type="button">Reload</button>
        </div>
        ${
          error
            ? `<div class="empty-state analytics-error">${escapeHtml(error)}</div>`
            : `<div class="table-responsive">
                <table class="table admin-table workflows-table">
                  <thead>
                    <tr>
                      <th>Workflow</th>
                      <th>Kind</th>
                      <th>Action</th>
                      <th>Enabled</th>
                    </tr>
                  </thead>
                  <tbody>${renderHelpdeskWorkflowRows()}</tbody>
                </table>
              </div>`
        }
      </div>
      ${renderHelpdeskWorkflowCreateForm()}
    </section>
  `;
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

async function fetchHelpdeskAnalyticsCachedRange(filters) {
  const params = new URLSearchParams();
  params.append("metric", helpdeskAnalyticsMetricConfig().id);
  params.append("from", dateWithHelpdeskAnalyticsOffset(filters.from));
  params.append("to", dateWithHelpdeskAnalyticsOffset(filters.to));
  if (filters.agents.length > 0) params.append("agents", filters.agents.join(","));
  if (filters.excludeAgents.length > 0) params.append("exclude_agents", filters.excludeAgents.join(","));
  if (filters.groups.length > 0) params.append("groups", filters.groups.join(","));
  params.append("tz_offset", String(-helpdeskAnalyticsTimeZoneOffsetMinutes(filters.from)));
  return api(`/api/helpdesk/analytics?${params.toString()}`);
}

// Task 8: Create fetchAnalytics Function for HelpDesk
async function refreshHelpdeskAnalyticsWebhookStats({ render = false } = {}) {
  if (state.helpdesk_analytics.webhookStatsLoading) return;
  state.helpdesk_analytics.webhookStatsLoading = true;
  try {
    state.helpdesk_analytics.webhookStats = await api("/api/helpdesk/analytics-webhooks");
    if (render && state.section === "helpdesk-analytics") {
      renderHelpdeskAnalytics();
    }
  } catch (error) {
    console.warn("Failed to load HelpDesk analytics webhook stats.", error);
  } finally {
    state.helpdesk_analytics.webhookStatsLoading = false;
  }
}

function renderHelpdeskAnalyticsWebhookMetrics(container) {
  const stats = state.helpdesk_analytics.webhookStats;
  const metricsRow = document.createElement("div");
  metricsRow.className = "metrics-row d-flex gap-4 mb-4 flex-wrap";
  metricsRow.innerHTML = `
    <div class="analytics-card">
      <div class="card-value">${stats ? Number(stats.received24h || 0).toLocaleString() : "..."}</div>
      <hr class="card-divider" />
      <div class="card-title">Webhooks Received · Last 24 Hours</div>
    </div>
    <div class="analytics-card">
      <div class="card-value">${stats ? Number(stats.assignedPoints24h || 0).toLocaleString() : "..."}</div>
      <hr class="card-divider" />
      <div class="card-title">Analytics Points Assigned · Last 24 Hours</div>
    </div>
  `;
  container.appendChild(metricsRow);
}

async function fetchHelpdeskAnalyticsRawWebhooks({ render = true } = {}) {
  state.helpdesk_analytics.rawWebhooks.loading = true;
  state.helpdesk_analytics.rawWebhooks.error = null;
  if (render && state.section === "helpdesk-analytics") {
    renderHelpdeskAnalytics();
  }

  try {
    const response = await api("/api/helpdesk/analytics-raw-webhooks?limit=20");
    state.helpdesk_analytics.rawWebhooks.events = response.events || [];
  } catch (error) {
    console.error("Failed to load raw HelpDesk analytics webhooks.", error);
    state.helpdesk_analytics.rawWebhooks.error = error.message;
    state.helpdesk_analytics.rawWebhooks.events = [];
  } finally {
    state.helpdesk_analytics.rawWebhooks.loading = false;
    if (render && state.section === "helpdesk-analytics") {
      renderHelpdeskAnalytics();
    }
  }
}

async function fetchHelpdeskAnalytics() {
  const filters = cloneHelpdeskAnalyticsFilters();
  if (!filters.from || !filters.to || filters.to <= filters.from) {
    state.helpdesk_analytics.error = "Select a valid HelpDesk analytics range.";
    state.helpdesk_analytics.data = null;
    state.helpdesk_analytics.loading = false;
    renderHelpdeskAnalytics();
    return;
  }
  state.helpdesk_analytics.appliedFilters = filters;
  state.helpdesk_analytics.loading = true;
  state.helpdesk_analytics.error = null;
  state.helpdesk_analytics.data = null;
  renderHelpdeskAnalytics();

  try {
    const analyticsResponse = await fetchHelpdeskAnalyticsCachedRange(filters);
    state.helpdesk_analytics.data = analyticsResponse;
    renderHelpdeskAnalytics();
  } catch (error) {
    console.error("Fetch analytics error:", error);
    state.helpdesk_analytics.error = error.message;
    renderHelpdeskAnalytics();
  } finally {
    state.helpdesk_analytics.loading = false;
    renderHelpdeskAnalytics();
  }
}

function renderHelpdeskAnalyticsViewTabs(filterBarContainer) {
  const currentMetric = helpdeskAnalyticsMetricConfig().id;
  const tabs = document.createElement("div");
  tabs.className = "analytics-view-tabs";
  tabs.innerHTML = `
    ${Object.values(HELPDESK_ANALYTICS_METRICS)
      .map(
        (metric) =>
          `<button class="filter-chip ${currentMetric === metric.id ? "active" : ""}" type="button" data-helpdesk-analytics-metric="${escapeHtml(metric.id)}">${escapeHtml(metric.tabLabel)}</button>`,
      )
      .join("")}
  `;
  filterBarContainer.appendChild(tabs);
  tabs.querySelectorAll("[data-helpdesk-analytics-metric]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextMetric = HELPDESK_ANALYTICS_METRICS[button.dataset.helpdeskAnalyticsMetric]?.id || HELPDESK_ANALYTICS_DEFAULT_METRIC;
      if (nextMetric === state.helpdesk_analytics.metric) return;
      state.helpdesk_analytics.metric = nextMetric;
      state.helpdesk_analytics.data = null;
      state.helpdesk_analytics.error = null;
      state.helpdesk_analytics.expandedAgents.clear();
      fetchHelpdeskAnalytics();
    });
  });
}

function renderHelpdeskAnalyticsRawWebhooks(container, filterBarContainer) {
  const debugUrl = `${window.location.origin}/webhooks/helpdesk-analytics-message`;
  const { loading, error, events } = state.helpdesk_analytics.rawWebhooks;
  const actionBar = document.createElement("div");
  actionBar.className = "helpdesk-analytics-actions";
  actionBar.innerHTML = `
    <button id="helpdeskRawWebhookRefreshBtn" class="btn btn-primary" type="button" ${loading ? "disabled" : ""}>Refresh</button>
    <code class="raw-webhook-url">${escapeHtml(debugUrl)}</code>
  `;
  filterBarContainer.appendChild(actionBar);

  document.getElementById("helpdeskRawWebhookRefreshBtn")?.addEventListener("click", () => {
    fetchHelpdeskAnalyticsRawWebhooks();
  });

  const page = document.createElement("div");
  page.className = "raw-webhook-page";
  page.innerHTML = `
    <div class="alert alert-info">
      Active HelpDesk webhook endpoint. Stores the latest 50 incoming requests for inspection.
    </div>
  `;
  container.appendChild(page);

  if (loading) {
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "empty-state";
    loadingDiv.textContent = "Loading raw webhook requests...";
    page.appendChild(loadingDiv);
    return;
  }

  if (error) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "alert alert-danger";
    errorDiv.textContent = `Error: ${error}`;
    page.appendChild(errorDiv);
  }

  if (!events || !events.length) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "empty-state";
    emptyDiv.textContent = "No raw webhook requests recorded yet.";
    page.appendChild(emptyDiv);
    return;
  }

  const list = document.createElement("div");
  list.className = "raw-webhook-list";
  list.innerHTML = events
    .map((event) => {
      const headersText = JSON.stringify(event.headers || {}, null, 2);
      return `
        <article class="raw-webhook-entry">
          <div class="raw-webhook-entry-head">
            <div>
              <strong>${escapeHtml(event.eventType || "No eventType")}</strong>
              <div class="subtle">${escapeHtml(formatHelpdeskDateTime(event.receivedAt))}</div>
            </div>
            <div class="raw-webhook-entry-meta">
              <span class="chip">${escapeHtml(event.method || "POST")}</span>
              <span class="chip">${Number(event.bodySize || 0).toLocaleString()} bytes${event.bodyTruncated ? " truncated" : ""}</span>
              ${event.webhookId ? `<span class="chip">${escapeHtml(event.webhookId)}</span>` : ""}
            </div>
          </div>
          <div class="raw-webhook-url-line">${escapeHtml(event.url || "")}</div>
          <details open>
            <summary>Raw body</summary>
            <pre class="raw-webhook-pre">${escapeHtml(event.bodyText || "")}</pre>
          </details>
          <details>
            <summary>Headers</summary>
            <pre class="raw-webhook-pre">${escapeHtml(headersText)}</pre>
          </details>
        </article>
      `;
    })
    .join("");
  page.appendChild(list);
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
  renderHelpdeskAnalyticsViewTabs(filterBarContainer);
  renderHelpdeskAnalyticsWebhookMetrics(container);

  if (state.helpdesk_analytics.view === "raw") {
    renderHelpdeskAnalyticsRawWebhooks(container, filterBarContainer);
    if (!state.helpdesk_analytics.rawWebhooks.loading && state.helpdesk_analytics.rawWebhooks.events === null) {
      fetchHelpdeskAnalyticsRawWebhooks({ render: true });
    }
    return;
  }

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

  const syncCustomHelpdeskRange = () => {
    const fromDate = document.getElementById("from-date")?.value || "";
    const toDate = document.getElementById("to-date")?.value || "";
    filters.from = combineLocalDateAndTime(fromDate, "00:00", "00:00");
    filters.to = combineLocalDateAndTime(toDate, "23:59", "23:59");
    renderHelpdeskAnalytics();
  };

  document.getElementById("from-date")?.addEventListener("change", syncCustomHelpdeskRange);
  document.getElementById("to-date")?.addEventListener("change", syncCustomHelpdeskRange);

  if (filters.preset === "custom") {
    customDatesDiv.classList.remove("d-none");
    customDatesToDiv.classList.remove("d-none");
  }

  document.getElementById("helpdeskAnalyticsApplyBtn")?.addEventListener("click", () => {
    fetchHelpdeskAnalytics();
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

  // Render data sections if available
  if (data) {
    if (!loading && data.cache?.missing_days) {
      const missingDiv = document.createElement("div");
      missingDiv.className = "alert alert-warning";
      missingDiv.textContent = `${data.cache.missing_days} selected day(s) are missing from D1 cache.`;
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
  } else if (!loading) {
    const hint = document.createElement("div");
    hint.className = "empty-state";
    hint.textContent = 'No data loaded. Click "Filter" to read from D1 cache.';
    container.appendChild(hint);
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

  const metric = helpdeskAnalyticsMetricConfig();
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
    metric.totalLabel,
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
  top5TicketsTitle.textContent = `Top 5 by ${metric.totalLabel}`;
  top5TicketsPanel.appendChild(top5TicketsTitle);

  const top5TicketsList = document.createElement("ul");
  top5TicketsList.className = "list-unstyled";
  state.helpdesk_analytics.data.agents
    .sort((a, b) => b.total_tickets - a.total_tickets)
    .slice(0, 5)
    .forEach((agent) => {
      const li = document.createElement("li");
      li.textContent = `${helpdeskAgentLabel(agent)} - ${agent.total_tickets} ${agent.total_tickets === 1 ? metric.itemSingular : metric.itemPlural}`;
      top5TicketsList.appendChild(li);
    });
  top5TicketsPanel.appendChild(top5TicketsList);
  top5Row.appendChild(top5TicketsPanel);

  metricsSection.appendChild(top5Row);
}

function renderLeaderboard() {
  if (!state.helpdesk_analytics.data) return;

  const metric = helpdeskAnalyticsMetricConfig();
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
  th3.textContent = metric.totalLabel;

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
    th.textContent = metric.itemPlural[0].toUpperCase() + metric.itemPlural.slice(1);
    subHeaderRow.appendChild(th);
  });
  thead.appendChild(subHeaderRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  const summaryRow = document.createElement("tr");
  summaryRow.className = "summary-row";
  const summaryRankCell = document.createElement("td");
  summaryRankCell.className = "col-rank sticky-left";
  summaryRankCell.textContent = "";
  summaryRow.appendChild(summaryRankCell);

  const summaryAgentCell = document.createElement("td");
  summaryAgentCell.className = "col-agent sticky-left";
  summaryAgentCell.style.fontWeight = "600";
  summaryAgentCell.textContent = "Account Summary";
  summaryRow.appendChild(summaryAgentCell);

  const summaryTicketsCell = document.createElement("td");
  summaryTicketsCell.className = "col-tickets sticky-left";
  summaryTicketsCell.textContent = "";
  summaryRow.appendChild(summaryTicketsCell);

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
    const agentKey = String(agent.agent_id || agent.id || "");
    const isExpanded = state.helpdesk_analytics.expandedAgents.has(agentKey);
    const detailCount = helpdeskAgentReplyDetails(agent).length;

    const row = document.createElement("tr");

    const rankCell = document.createElement("td");
    rankCell.className = "col-rank sticky-left";
    rankCell.textContent = rankLabel;
    row.appendChild(rankCell);

    const agentCell = document.createElement("td");
    agentCell.className = "col-agent sticky-left";
    agentCell.innerHTML = `
      <div class="analytics-agent-cell">
          <button
            class="btn btn-sm btn-outline-secondary analytics-agent-toggle"
            type="button"
            data-helpdesk-agent-toggle="${escapeHtml(agentKey)}"
            title="${isExpanded ? `Hide ${metric.itemSingular} tickets` : `Show ${metric.itemSingular} tickets`}"
            aria-label="${isExpanded ? `Hide ${metric.itemSingular} tickets` : `Show ${metric.itemSingular} tickets`}"
          >${isExpanded ? "-" : "+"}</button>
        <div class="analytics-agent-copy">
          <div class="analytics-agent-main">${escapeHtml(helpdeskAgentLabel(agent))}</div>
          ${helpdeskAgentSubLabel(agent) ? `<div class="analytics-agent-sub">${escapeHtml(helpdeskAgentSubLabel(agent))}</div>` : ""}
            <div class="analytics-agent-sub">${detailCount} ${metric.itemSingular} point${detailCount === 1 ? "" : "s"}</div>
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
    if (isExpanded) {
      tbody.insertAdjacentHTML("beforeend", renderHelpdeskAgentReplyDetail(agent, 3 + columnHeaders.length));
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
  wrapper.querySelectorAll("[data-helpdesk-agent-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const agentId = button.getAttribute("data-helpdesk-agent-toggle") || "";
      if (!agentId) return;
      if (state.helpdesk_analytics.expandedAgents.has(agentId)) {
        state.helpdesk_analytics.expandedAgents.delete(agentId);
      } else {
        state.helpdesk_analytics.expandedAgents.add(agentId);
      }
      renderHelpdeskAnalytics();
    });
  });
}

async function fetchAnalytics() {
  ensureAnalyticsRange();
  state.analytics.loading = true;
  state.analytics.error = null;
  renderApp();

  const params = liveChatAnalyticsQueryParams();

  try {
    state.analytics.data = await api(`/api/livechat/analytics?${params}`);
  } catch (error) {
    state.analytics.error = error.message;
  } finally {
    state.analytics.loading = false;
    renderApp();
  }
}

function liveChatAnalyticsQueryParams({ exportFormat = "", filtersOverride = null } = {}) {
  const filters = filtersOverride || state.analytics.filters;
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
  if (exportFormat) {
    params.set("export", exportFormat);
  }

  return params;
}

function liveChatAnalyticsExportFilters() {
  const filters = state.analytics.filters;
  return {
    ...filters,
    agents: filters.pendingAgents ?? stagedLiveChatAnalyticsSelection("analyticsAgents", filters.agents),
    excludeAgents: filters.pendingExcludeAgents ?? stagedLiveChatAnalyticsSelection("analyticsExcludeAgents", filters.excludeAgents),
  };
}

const LIVECHAT_RAW_EXPORT_HEADERS = [
  "ticket_link",
  "created_date",
  "user_email",
  "wait_in_queue_seconds",
  "group",
  "assignee",
  "tags",
  "thread_id",
];

function liveChatRawExportGroupLabel(groupIds = [], groupNameById = new Map()) {
  return (groupIds || [])
    .map((groupId) => groupNameById.get(String(groupId)) || `Group ${groupId}`)
    .join("; ");
}

function liveChatRawExportRow(record, groupNameById = new Map()) {
  const tags = Array.isArray(record.tags) ? record.tags.join("; ") : record.tags || "";
  return [
    record.ticket_link || "",
    record.created_date || "",
    record.user_email || "",
    record.wait_in_queue_seconds ?? "",
    liveChatRawExportGroupLabel(record.group_ids, groupNameById),
    record.assignee || "",
    tags,
    record.thread_id || "",
  ];
}

function liveChatRawExportRows(records) {
  const groupNameById = new Map((state.livechat.groups || []).map((group) => [String(group.id), group.name]));
  return records.map((record) => liveChatRawExportRow(record, groupNameById));
}

function spreadsheetText(value) {
  const text = `${value ?? ""}`.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return /^[=+\-@]/.test(text.trimStart()) ? `'${text}` : text;
}

function spreadsheetCell(value) {
  return `"${spreadsheetText(value).replaceAll('"', '""')}"`;
}

function liveChatRawCsv(records) {
  const rows = [LIVECHAT_RAW_EXPORT_HEADERS, ...liveChatRawExportRows(records)];
  return rows.map((row) => row.map(spreadsheetCell).join(",")).join("\r\n") + "\r\n";
}

function liveChatRawExcelHtml(records, filters) {
  const escapeXmlText = (value) =>
    `${value ?? ""}`
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  const rows = [LIVECHAT_RAW_EXPORT_HEADERS, ...liveChatRawExportRows(records)];
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
    th { background: #1f2937; color: #ffffff; font-weight: 700; }
    th, td { border: 1px solid #d1d5db; padding: 6px; vertical-align: top; mso-number-format:"\\@"; }
    caption { text-align: left; font-weight: 700; margin-bottom: 8px; }
  </style>
</head>
<body>
  <table>
    <caption>LiveChat raw chats ${escapeXmlText(filters.from)} to ${escapeXmlText(filters.to)}</caption>
    ${rows
      .map((row, index) => {
        const tag = index === 0 ? "th" : "td";
        return `<tr>${row.map((cell) => `<${tag}>${escapeXmlText(spreadsheetText(cell))}</${tag}>`).join("")}</tr>`;
      })
      .join("")}
  </table>
</body>
</html>`;
}

function liveChatRawExportFilename(filters, extension) {
  const from = `${filters.from || ""}`.slice(0, 10) || "from";
  const to = `${filters.to || ""}`.slice(0, 10) || "to";
  return `livechat-raw-chats-${from}-to-${to}.${extension}`;
}

async function fetchLiveChatRawExportPage(filters, pageId = "") {
  const params = liveChatAnalyticsQueryParams({
    exportFormat: "raw_page",
    filtersOverride: filters,
  });
  if (pageId) {
    params.set("page_id", pageId);
  }

  const response = await fetch(`/api/livechat/analytics?${params.toString()}`, {
    headers: accountRequestHeaders(),
  });
  const nextCsrfToken = response.headers.get("X-CSRF-Token");
  if (nextCsrfToken) {
    state.csrfToken = nextCsrfToken;
  }
  const text = await response.text();
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (_error) {
      payload = {};
    }
  }
  if (!response.ok) {
    throw new Error(payload.error || text || `LiveChat raw export failed with ${response.status}.`);
  }

  return payload;
}

async function downloadLiveChatRawAnalytics(format) {
  ensureAnalyticsRange();
  const filters = liveChatAnalyticsExportFilters();
  const isExcel = format === "raw_excel";
  const records = [];
  let nextPageId = "";
  let page = 0;
  let foundChats = 0;

  do {
    page += 1;
    setMessage(statusMessage, `Preparing LiveChat raw ${isExcel ? "Excel" : "CSV"} export... ${records.length} chat(s) loaded.`);
    const payload = await fetchLiveChatRawExportPage(filters, nextPageId);
    records.push(...(payload.records || []));
    foundChats = payload.foundChats || foundChats;
    nextPageId = payload.nextPageId || "";
    if (page > 10000) {
      throw new Error("LiveChat raw export stopped after 10,000 archive pages.");
    }
  } while (nextPageId);

  const blob = isExcel
    ? new Blob([liveChatRawExcelHtml(records, filters)], { type: "application/vnd.ms-excel; charset=utf-8" })
    : new Blob([liveChatRawCsv(records)], { type: "text/csv; charset=utf-8" });
  downloadBlobFile(liveChatRawExportFilename(filters, isExcel ? "xls" : "csv"), blob);
  if (foundChats && records.length < foundChats) {
    setMessage(statusMessage, `Downloaded ${records.length} LiveChat raw chat row(s). LiveChat estimated ${foundChats} match(es).`, "info");
    return;
  }
  setMessage(statusMessage, `Downloaded ${records.length} LiveChat raw chat row(s).`, "success");
}

function stopHelpdeskTicketsRealtime() {
  if (!state.helpdeskTickets.timer) return;
  clearInterval(state.helpdeskTickets.timer);
  state.helpdeskTickets.timer = null;
}

function stopHelpdeskWorkflowsRealtime() {
  if (!state.helpdeskWorkflows.timer) return;
  clearInterval(state.helpdeskWorkflows.timer);
  state.helpdeskWorkflows.timer = null;
}

function startHelpdeskTicketsRealtime() {
  if (state.helpdeskTickets.timer) return;
  state.helpdeskTickets.timer = setInterval(() => {
    if (state.section === "helpdesk-tickets") {
      fetchHelpdeskTickets({ silent: true });
    }
  }, 30 * 1000);
}

function startHelpdeskWorkflowsRealtime() {
  if (state.helpdeskWorkflows.timer) return;
  state.helpdeskWorkflows.timer = setInterval(() => {
    if (state.section === "helpdesk-workflows") {
      fetchHelpdeskWorkflows({ silent: true });
    }
  }, 5 * 1000);
}

function syncHelpdeskWorkflowFormFromDom() {
  const senderInput = document.getElementById("workflowSenderInput");
  const messageInput = document.getElementById("workflowMessageInput");
  state.helpdeskWorkflows.form = {
    type: document.getElementById("workflowTypeInput")?.value || state.helpdeskWorkflows.form.type || "auto_resolve_requester",
    title: document.getElementById("workflowTitleInput")?.value || "",
    requesterEmail: document.getElementById("workflowRequesterInput")?.value || "",
    status: document.getElementById("workflowStatusInput")?.value || "solved",
    tags: document.getElementById("workflowTagsInput")?.value || "",
    senderName: senderInput ? senderInput.value : state.helpdeskWorkflows.form.senderName || "Axel",
    messageText: messageInput ? messageInput.value : state.helpdeskWorkflows.form.messageText || HELPDESK_AUTO_REPLY_DEFAULT_MESSAGE,
  };
}

async function fetchHelpdeskWorkflows({ runsFor = state.helpdeskWorkflows.runsFor || "", silent = false } = {}) {
  if (!silent) state.helpdeskWorkflows.loading = true;
  state.helpdeskWorkflows.error = null;
  if (!silent && state.section === "helpdesk-workflows") renderApp();

  try {
    const params = new URLSearchParams();
    if (runsFor) params.set("runsFor", runsFor);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const response = await api(`/api/helpdesk/workflows${suffix}`);
    state.helpdeskWorkflows.workflows = response.workflows || [];
    state.helpdeskWorkflows.runs = response.runs || [];
    state.helpdeskWorkflows.runsFor = response.runsFor || runsFor || "";
    state.helpdeskWorkflows.webhookStats = response.webhookStats || state.helpdeskWorkflows.webhookStats;
  } catch (error) {
    state.helpdeskWorkflows.error = error.message;
  } finally {
    if (!silent) state.helpdeskWorkflows.loading = false;
    if (state.section === "helpdesk-workflows") renderApp();
  }
}

async function fetchHelpdeskWorkflowAnalytics() {
  ensureWorkflowAnalyticsRange();
  const analytics = state.helpdeskWorkflows.analytics;
  analytics.loading = true;
  analytics.error = null;
  if (state.section === "helpdesk-workflows") renderApp();

  try {
    const params = new URLSearchParams({
      from: analytics.filters.from,
      to: analytics.filters.to,
      tzOffset: String(new Date().getTimezoneOffset()),
    });
    analytics.data = await api(`/api/helpdesk/workflow-analytics?${params.toString()}`);
  } catch (error) {
    analytics.error = error.message;
  } finally {
    analytics.loading = false;
    if (state.section === "helpdesk-workflows") renderApp();
  }
}

async function toggleHelpdeskWorkflow(workflowId, enabled) {
  try {
    setMessage(statusMessage, `${enabled ? "Enabling" : "Disabling"} workflow...`);
    const response = await api("/api/helpdesk/workflows", {
      method: "PATCH",
      body: { id: workflowId, enabled },
    });
    state.helpdeskWorkflows.workflows = response.workflows || [];
    setMessage(statusMessage, `Workflow ${enabled ? "enabled" : "disabled"}.`, "success");
    renderApp();
  } catch (error) {
    setMessage(statusMessage, error.message, "error");
    fetchHelpdeskWorkflows();
  }
}

async function runHelpdeskWorkflow(workflowId) {
  state.helpdeskWorkflows.runningWorkflowId = workflowId;
  setMessage(statusMessage, "Running workflow...");
  if (state.section === "helpdesk-workflows") renderApp();

  try {
    const response = await api("/api/helpdesk/workflows", {
      method: "POST",
      body: {
        action: "run",
        id: workflowId,
        tzOffset: new Date().getTimezoneOffset(),
      },
    });
    const run = response.run || {};
    state.helpdeskWorkflows.workflows = response.workflows || state.helpdeskWorkflows.workflows;
    state.helpdeskWorkflows.runs = response.runs || state.helpdeskWorkflows.runs;
    state.helpdeskWorkflows.runsFor = response.runsFor || workflowId;
    setMessage(
      statusMessage,
      run.details || "Workflow run finished.",
      run.status === "error" ? "error" : "success",
    );
    await fetchHelpdeskWorkflowAnalytics();
  } catch (error) {
    setMessage(statusMessage, error.message, "error");
  } finally {
    state.helpdeskWorkflows.runningWorkflowId = "";
    if (state.section === "helpdesk-workflows") renderApp();
  }
}

function helpdeskSpamKeywordsInput(workflowId) {
  return Array.from(document.querySelectorAll("[data-helpdesk-spam-keywords]")).find((input) => {
    return input.dataset.helpdeskSpamKeywords === workflowId;
  });
}

async function saveHelpdeskSpamWorkflowKeywords(workflowId) {
  const input = helpdeskSpamKeywordsInput(workflowId);
  const keywords = input ? input.value : "";
  state.helpdeskWorkflows.savingWorkflowId = workflowId;
  setMessage(statusMessage, "Saving workflow keywords...");
  if (state.section === "helpdesk-workflows") renderApp();

  try {
    const response = await api("/api/helpdesk/workflows", {
      method: "PATCH",
      body: {
        action: "update_marketing_spam_keywords",
        id: workflowId,
        keywords,
      },
    });
    state.helpdeskWorkflows.workflows = response.workflows || [];
    setMessage(statusMessage, "Workflow keywords saved.", "success");
  } catch (error) {
    setMessage(statusMessage, error.message, "error");
  } finally {
    state.helpdeskWorkflows.savingWorkflowId = "";
    if (state.section === "helpdesk-workflows") renderApp();
  }
}

async function saveHelpdeskWorkflow() {
  syncHelpdeskWorkflowFormFromDom();
  const form = state.helpdeskWorkflows.form;

  try {
    setMessage(statusMessage, "Saving workflow...");
    const response = await api("/api/helpdesk/workflows", {
      method: "POST",
      body: {
        type: form.type,
        title: form.title,
        requesterEmail: form.requesterEmail,
        status: form.status,
        tags: form.tags,
        senderName: form.senderName,
        messageText: form.messageText,
      },
    });
    state.helpdeskWorkflows.workflows = response.workflows || [];
    state.helpdeskWorkflows.form = defaultHelpdeskWorkflowForm();
    setMessage(statusMessage, "Workflow saved.", "success");
    renderApp();
  } catch (error) {
    setMessage(statusMessage, error.message, "error");
    renderApp();
  }
}

function helpdeskTicketsCurrentCursor() {
  return state.helpdeskTickets.page.cursorStack.at(-1) || null;
}

function helpdeskTicketsQueryParams({ includeCounts = true, includeCursor = true, filtersOverride = null } = {}) {
  const filters = filtersOverride || state.helpdeskTickets.filters;
  const params = new URLSearchParams({
    pageSize: String(filters.pageSize || 40),
    status: filters.silo === "tickets" ? filters.status || "open" : "all",
    silo: filters.silo || "tickets",
    sortBy: filters.sortBy || "lastMessageAt",
    order: filters.order || "desc",
    includeCounts: includeCounts ? "1" : "0",
    autoMerge: "0",
  });
  const cursor = includeCursor ? helpdeskTicketsCurrentCursor() : null;
  if (cursor) {
    params.set("cursorDirection", cursor.direction);
    params.set("cursorValue", cursor.value);
    params.set("cursorId", cursor.id);
  }
  [
    "createdDateFrom",
    "createdDateTo",
    "updatedDateFrom",
    "updatedDateTo",
    "lastMessageFrom",
    "lastMessageTo",
    "priority",
    "tagId",
  ].forEach((key) => {
    if (filters[key]) params.set(key, filters[key]);
  });
  return params;
}

function helpdeskTicketFiltersFromDom() {
  const current = state.helpdeskTickets.filters;
  const nextSortBy = document.getElementById("helpdeskTicketSortBy")?.value || current.sortBy || "lastMessageAt";
  return {
    ...current,
    createdDateFrom: document.getElementById("helpdeskTicketCreatedFrom")?.value || "",
    createdDateTo: document.getElementById("helpdeskTicketCreatedTo")?.value || "",
    updatedDateFrom: document.getElementById("helpdeskTicketUpdatedFrom")?.value || "",
    updatedDateTo: document.getElementById("helpdeskTicketUpdatedTo")?.value || "",
    lastMessageFrom: document.getElementById("helpdeskTicketLastMessageFrom")?.value || "",
    lastMessageTo: document.getElementById("helpdeskTicketLastMessageTo")?.value || "",
    priority: document.getElementById("helpdeskTicketPriority")?.value || "",
    tagId: document.getElementById("helpdeskTicketTag")?.value || "",
    sortBy: nextSortBy,
    order: current.sortBy !== nextSortBy ? defaultHelpdeskTicketSortOrder(nextSortBy) : current.order,
  };
}

function contentDispositionFilename(value, fallback) {
  const match = `${value || ""}`.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
  return match ? decodeURIComponent(match[1].replaceAll('"', "")) : fallback;
}

async function downloadHelpdeskTicketsCsv(limit) {
  const safeLimit = 2000;
  const filters = {
    ...helpdeskTicketFiltersFromDom(),
    sortBy: "createdAt",
    order: "desc",
  };
  const params = helpdeskTicketsQueryParams({
    includeCounts: false,
    includeCursor: false,
    filtersOverride: filters,
  });
  params.set("export", "first_messages_csv");
  params.set("limit", String(safeLimit));

  setMessage(statusMessage, `Preparing HelpDesk CSV for last ${safeLimit} ticket(s)...`);
  const response = await fetch(`/api/helpdesk/tickets?${params.toString()}`, {
    headers: accountRequestHeaders(),
  });
  const nextCsrfToken = response.headers.get("X-CSRF-Token");
  if (nextCsrfToken) {
    state.csrfToken = nextCsrfToken;
  }
  if (!response.ok) {
    const text = await response.text();
    let message = `CSV export failed with ${response.status}.`;
    try {
      message = JSON.parse(text).error || message;
    } catch (_error) {
      message = text || message;
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const filename = contentDispositionFilename(
    response.headers.get("Content-Disposition"),
    `helpdesk-tickets-last-${safeLimit}.csv`,
  );
  downloadBlobFile(filename, blob);
  setMessage(statusMessage, `Downloaded HelpDesk CSV for last ${safeLimit} ticket(s).`, "success");
}

async function fetchHelpdeskTickets({ silent = false } = {}) {
  if (state.helpdeskTickets.inFlight) {
    state.helpdeskTickets.queuedRefresh = {
      silent: state.helpdeskTickets.queuedRefresh ? state.helpdeskTickets.queuedRefresh.silent && silent : silent,
    };
    return;
  }
  state.helpdeskTickets.inFlight = true;
  state.helpdeskTickets.queuedRefresh = null;
  state.helpdeskTickets.loading = !silent || !state.helpdeskTickets.tickets.length;
  state.helpdeskTickets.error = null;
  if (state.section === "helpdesk-tickets") renderApp();

  try {
    const response = await api(`/api/helpdesk/tickets?${helpdeskTicketsQueryParams({ includeCounts: !silent }).toString()}`);
    state.helpdeskTickets.tickets = sortHelpdeskTicketRows(response.tickets || []);
    if (response.counts) {
      state.helpdeskTickets.counts = response.counts;
    }
    if (response.tags) {
      state.helpdeskTickets.tags = response.tags;
    }
    if (response.mergeLogs) {
      state.helpdeskTickets.mergeLogs = response.mergeLogs;
    }
    state.helpdeskTickets.page = {
      ...state.helpdeskTickets.page,
      ...(response.page || {}),
      pageIndex: state.helpdeskTickets.page.cursorStack.length,
    };
    state.helpdeskTickets.updatedAt = response.updatedAt || new Date().toISOString();
  } catch (error) {
    state.helpdeskTickets.error = error.message;
  } finally {
    state.helpdeskTickets.loading = false;
    state.helpdeskTickets.inFlight = false;
    if (state.helpdeskTickets.queuedRefresh) {
      const queuedRefresh = state.helpdeskTickets.queuedRefresh;
      state.helpdeskTickets.queuedRefresh = null;
      fetchHelpdeskTickets({ silent: queuedRefresh.silent });
    } else if (state.section === "helpdesk-tickets") {
      renderApp();
    }
  }
}

function selectHelpdeskTicketStatus(status) {
  state.helpdeskTickets.filters.silo = "tickets";
  state.helpdeskTickets.filters.status = status;
  resetHelpdeskTicketPagination();
  fetchHelpdeskTickets();
}

function selectHelpdeskTicketFolder(silo) {
  state.helpdeskTickets.filters.silo = silo;
  state.helpdeskTickets.filters.status = "all";
  resetHelpdeskTicketPagination();
  fetchHelpdeskTickets();
}

function applyHelpdeskTicketFiltersFromDom() {
  state.helpdeskTickets.filters = helpdeskTicketFiltersFromDom();
  resetHelpdeskTicketPagination();
  fetchHelpdeskTickets();
}

function sortHelpdeskTicketColumn(sortBy) {
  const filters = state.helpdeskTickets.filters;
  if (filters.sortBy === sortBy) {
    filters.order = filters.order === "asc" ? "desc" : "asc";
  } else {
    filters.sortBy = sortBy;
    filters.order = defaultHelpdeskTicketSortOrder(sortBy);
  }
  resetHelpdeskTicketPagination();
  fetchHelpdeskTickets();
}

function resetHelpdeskTicketFilters() {
  state.helpdeskTickets.filters = {
    status: "open",
    silo: "tickets",
    pageSize: 40,
    sortBy: "lastMessageAt",
    order: "desc",
    createdDateFrom: "",
    createdDateTo: "",
    updatedDateFrom: "",
    updatedDateTo: "",
    lastMessageFrom: "",
    lastMessageTo: "",
    priority: "",
    tagId: "",
  };
  resetHelpdeskTicketPagination();
  fetchHelpdeskTickets();
}

function goHelpdeskTicketPage(direction) {
  const page = state.helpdeskTickets.page;
  if (direction === "next" && page.nextCursor) {
    page.cursorStack.push({ direction: "next", ...page.nextCursor });
    fetchHelpdeskTickets();
  } else if (direction === "prev" && page.cursorStack.length) {
    page.cursorStack.pop();
    fetchHelpdeskTickets();
  }
}

async function openHelpdeskTicket(ticketId) {
  if (!ticketId) return;

  try {
    setMessage(statusMessage, "Loading HelpDesk ticket...");
    const response = await api(`/api/helpdesk/ticket?id=${encodeURIComponent(ticketId)}`);
    openModal("helpdesk-ticket", response.ticket);
    setMessage(statusMessage, "");
  } catch (error) {
    setMessage(statusMessage, error.message, "error");
  }
}

async function mergeHelpdeskTodayTickets(parentTicketId, childTicketIds) {
  const childIds = childTicketIds.filter(Boolean);
  if (!parentTicketId || !childIds.length) return;
  const confirmed = window.confirm(`Merge ${childIds.length} ticket(s) into the first ticket received today?`);
  if (!confirmed) return;

  await withBusyState(async () => {
    await api("/api/helpdesk/tickets", {
      method: "POST",
      body: {
        parentTicketId,
        childTicketIds: childIds,
      },
    });
    await fetchHelpdeskTickets();
    await openHelpdeskTicket(parentTicketId);
  }, "HelpDesk tickets merged.");
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
    "helpdesk-tickets": "HelpDesk Tickets",
    "helpdesk-workflows": "HelpDesk Workflows",
    "helpdesk-analytics": "HelpDesk Analytics",
    "admin-users": "Admin Users",
    logs: "Logs",
  };
  return titles[state.section] || "LC Admin";
}

function renderLiveChatPriorityDialog() {
  const dialog = state.livechatPriorityDialog;
  if (!dialog) {
    return "";
  }

  const groups = selectedLiveChatGroupsById(dialog.groupIds || []);
  const grouped = new Map();
  groups.forEach((group) => {
    const bucket = liveChatGroupBucket(group);
    const current = grouped.get(bucket) || [];
    current.push(group);
    grouped.set(bucket, current);
  });

  const bucketNames = [...LIVECHAT_GROUP_BUCKETS, "Other"].filter((bucket) => grouped.has(bucket));

  return `
    <div class="modal-overlay modal-overlay-nested">
      <div class="modal-card livechat-priority-modal">
        <div class="modal-head">
          <div>
            <div class="modal-title">Add LiveChat groups</div>
            <div class="subtle">${groups.length} selected group${groups.length === 1 ? "" : "s"}</div>
          </div>
          <button id="closeLiveChatPriorityDialogBtn" class="btn btn-sm btn-outline-secondary" type="button">Close</button>
        </div>
        <div class="priority-bucket-list">
          ${
            bucketNames.length
              ? bucketNames
                  .map((bucket) => {
                    const bucketGroups = grouped.get(bucket) || [];
                    return `
                      <div class="priority-bucket" data-livechat-priority-bucket="${escapeHtml(bucket)}">
                        <div class="priority-bucket-head">
                          <div>
                            <div class="section-title">${escapeHtml(bucket)}</div>
                            <div class="subtle">${bucketGroups.length} group${bucketGroups.length === 1 ? "" : "s"}</div>
                          </div>
                          <select class="form-select form-select-sm" data-livechat-priority-select="${escapeHtml(bucket)}">
                            ${liveChatPrioritySelectOptions("normal")}
                          </select>
                        </div>
                        <div class="chip-list">
                          ${bucketGroups.map((group) => `<span class="chip">${escapeHtml(group.name)}</span>`).join("")}
                        </div>
                      </div>
                    `;
                  })
                  .join("")
              : '<div class="empty-state">Select at least one group before adding.</div>'
          }
        </div>
        <div class="action-row mt-3">
          <button id="confirmLiveChatPriorityDialogBtn" class="btn btn-primary" type="button" ${groups.length ? "" : "disabled"}>Add</button>
          <button id="cancelLiveChatPriorityDialogBtn" class="btn btn-outline-secondary" type="button">Cancel</button>
        </div>
      </div>
    </div>
  `;
}

function renderModal() {
  const priorityDialogMarkup = renderLiveChatPriorityDialog();
  if (!state.modalOpen || !state.modalAgent) {
    modalRoot.innerHTML = priorityDialogMarkup;
    return;
  }

  if (state.modalType === "helpdesk-ticket") {
    const ticket = state.modalAgent;
    const events = ticket.conversation || [];
    const ticketHref = safeUrlAttribute(ticket.ticket_link || ticket.link);
    modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card helpdesk-chat-modal live-ticket-modal">
          <div class="modal-head">
            <div>
              <div class="modal-title">Ticket ${escapeHtml(ticket.short_id || ticket.shortID || ticket.ticket_id || ticket.id || "")}</div>
              <div class="subtle">
                ${escapeHtml(ticket.subject || "No subject")}
                ${ticketHref ? ` · <a href="${ticketHref}" target="_blank" rel="noreferrer">Open in HelpDesk</a>` : ""}
              </div>
            </div>
            <button id="closeModalBtn" class="btn btn-sm btn-outline-secondary" type="button">Close</button>
          </div>
          <div class="ticket-modal-layout">
            <main class="ticket-thread-panel">
              <div class="helpdesk-ticket-summary">
                <span>Requester: <strong>${escapeHtml(helpdeskTicketRequesterLabel(ticket))}</strong></span>
                <span>Assigned: <strong>${escapeHtml(helpdeskTicketAgentLabel(ticket))}</strong></span>
                <span>Status: <strong>${escapeHtml(ticket.status || "unknown")}</strong></span>
                <span>Created: <strong>${escapeHtml(formatHelpdeskDateTime(ticket.createdAt || ticket.ticket_created_at))}</strong></span>
                <span>Last message: <strong>${escapeHtml(formatHelpdeskDateTime(ticket.lastMessageAt || ticket.last_public_reply_at))}</strong></span>
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
                          const message =
                            plainMessageText(event.text || event.html) ||
                            event.activity ||
                            event.status ||
                            event.type ||
                            "System event";
                          return `
                            <div class="helpdesk-chat-event ${isAgent ? "agent" : ""} ${isPrivate ? "private" : ""} ${isSystem ? "system" : ""}">
                              <div class="helpdesk-chat-meta">
                                <strong>${escapeHtml(event.author_name || event.author_email || authorType)}</strong>
                                <span>${escapeHtml(isPrivate ? "internal comment" : authorType)}</span>
                                <span>${escapeHtml(formatHelpdeskDateTime(event.date))}</span>
                              </div>
                              <div class="helpdesk-chat-bubble">${escapeHtml(message)}</div>
                            </div>
                          `;
                        })
                        .join("")
                    : '<div class="empty-state">No conversation events were returned for this ticket.</div>'
                }
              </div>
            </main>
            ${renderHelpdeskRequesterTicketSidebar(ticket)}
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
  const existingLiveChatGroupIds = isLiveChatUser ? new Set(state.modalAgent.groups.map((group) => String(group.id))) : new Set();
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
              <td>
                <button class="btn btn-sm btn-outline-danger" type="button" data-remove-livechat-profile-group="${escapeHtml(group.id)}">Remove</button>
              </td>
            </tr>
          `,
        ),
        ["Group", "Priority", ""],
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
                  <div class="section-title">${isLiveChatUser ? "Add groups" : "Change memberships"}</div>
                  <div class="toolbar-row">
                    <input id="modalSearchInput" class="form-control" type="search" placeholder="Search groups" value="${escapeHtml(state.modalSearch)}" />
                    <button id="modalSelectAllBtn" class="btn btn-outline-secondary" type="button">Select shown</button>
                    <button id="modalClearBtn" class="btn btn-outline-secondary" type="button">Clear shown</button>
                    <div class="subtle d-flex align-items-center px-2">${filteredItems.length} shown</div>
                  </div>
                  ${
                    isLiveChatUser
                      ? `<div class="filter-row">
                          ${LIVECHAT_GROUP_BUCKETS.map(
                            (bucket) => `<button class="filter-chip" type="button" data-modal-livechat-group-select="${bucket}">${bucket}</button>`,
                          ).join("")}
                          <button class="filter-chip" type="button" data-modal-livechat-group-select="All">All</button>
                        </div>`
                      : ""
                  }
                  <div class="checkbox-grid">
                    ${
                      filteredItems.length
                        ? filteredItems
                            .map((item) => {
                              const checked = isLiveChatUser
                                ? state.modalLiveChatSelectedGroupIds.has(String(item.id))
                                : selectedMap.has(String(item.id));
                              const priority = isLiveChatUser
                                ? selectedMap.get(String(item.id)) || "normal"
                                : "";
                              const existing = isLiveChatUser && existingLiveChatGroupIds.has(String(item.id));

                              return `
                                <label class="check-pill ${existing ? "check-pill-muted" : ""}">
                                  <input type="checkbox" name="${isLiveChatUser ? "modal-livechat-group" : "modal-helpdesk-team"}" value="${item.id}" ${checked ? "checked" : ""} ${existing ? "disabled" : ""} />
                                  <span>${escapeHtml(item.name)}${existing ? ' <small class="subtle">Current</small>' : ""}</span>
                                  ${
                                    isLiveChatUser
                                      ? `<span class="chip">${escapeHtml(priorityLabel(priority))}</span>`
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
                    <button id="saveModalBtn" class="btn btn-primary" type="button">${isLiveChatUser ? "Add groups" : "Save"}</button>
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
    ${priorityDialogMarkup}
  `;
}

function renderApp() {
  const filterBar = document.getElementById("filterBar");
  pageTitle.textContent = currentSectionTitle();
  if (state.section !== "helpdesk-tickets") {
    stopHelpdeskTicketsRealtime();
  }
  if (state.section !== "helpdesk-workflows") {
    stopHelpdeskWorkflowsRealtime();
  }
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
  } else if (state.section === "helpdesk-tickets") {
    appContent.innerHTML = renderHelpdeskTickets();
    filterBar.classList.add("d-none");
  } else if (state.section === "helpdesk-workflows") {
    appContent.innerHTML = renderHelpdeskWorkflows();
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

  if (
    state.section === "helpdesk-analytics" &&
    state.helpdesk_analytics.view !== "raw" &&
    !state.helpdesk_analytics.loading &&
    !state.helpdesk_analytics.data &&
    !state.helpdesk_analytics.error
  ) {
    const range = getDateRange(state.helpdesk_analytics.filters.preset);
    state.helpdesk_analytics.filters.from = range.from;
    state.helpdesk_analytics.filters.to = range.to;
    fetchHelpdeskAnalytics();
  }
  if (
    state.section === "helpdesk-analytics" &&
    !state.helpdesk_analytics.webhookStats &&
    !state.helpdesk_analytics.webhookStatsLoading
  ) {
    refreshHelpdeskAnalyticsWebhookStats({ render: true });
  }

  if (state.section === "helpdesk-tickets") {
    startHelpdeskTicketsRealtime();
    if (
      !state.helpdeskTickets.loading &&
      !state.helpdeskTickets.tickets.length &&
      !state.helpdeskTickets.error &&
      !state.helpdeskTickets.updatedAt
    ) {
      fetchHelpdeskTickets();
    }
  }

  if (state.section === "helpdesk-workflows" && !state.helpdeskWorkflows.loading && !state.helpdeskWorkflows.workflows.length && !state.helpdeskWorkflows.error) {
    fetchHelpdeskWorkflows();
  }
  if (state.section === "helpdesk-workflows") {
    startHelpdeskWorkflowsRealtime();
  }
  if (
    state.section === "helpdesk-workflows" &&
    !state.helpdeskWorkflows.analytics.loading &&
    !state.helpdeskWorkflows.analytics.data &&
    !state.helpdeskWorkflows.analytics.error
  ) {
    fetchHelpdeskWorkflowAnalytics();
  }
}

async function refreshData() {
  setMessage(statusMessage, "Refreshing...");

  const [livechatResult, helpdeskResult, adminUsersResult, logsResult, workflowsResult, helpdeskAnalyticsWebhookStatsResult] = await Promise.allSettled([
    api("/api/livechat/dashboard"),
    api("/api/helpdesk/dashboard"),
    api("/api/admin-users"),
    api("/api/logs"),
    api("/api/helpdesk/workflows"),
    api("/api/helpdesk/analytics-webhooks"),
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
  if (workflowsResult.status === "fulfilled") {
    state.helpdeskWorkflows.workflows = workflowsResult.value.workflows || [];
    state.helpdeskWorkflows.webhookStats = workflowsResult.value.webhookStats || state.helpdeskWorkflows.webhookStats;
  }
  if (helpdeskAnalyticsWebhookStatsResult.status === "fulfilled") {
    state.helpdesk_analytics.webhookStats = helpdeskAnalyticsWebhookStatsResult.value;
  }
  state.logs = logsResult.status === "fulfilled" ? logsResult.value.logs || [] : [];
  state.logsWarning = logsResult.status === "fulfilled" ? logsResult.value.warning || "" : "Logs unavailable.";

  renderApp();

  const warnings = [
    livechatResult.status !== "fulfilled" ? `LiveChat: ${livechatResult.reason.message}` : "",
    helpdeskResult.status !== "fulfilled" ? `HelpDesk: ${helpdeskResult.reason.message}` : "",
    adminUsersResult.status !== "fulfilled" ? `Admin users: ${adminUsersResult.reason.message}` : "",
    state.logsWarning,
    workflowsResult.status !== "fulfilled" ? `Workflows: ${workflowsResult.reason.message}` : "",
    helpdeskAnalyticsWebhookStatsResult.status !== "fulfilled"
      ? `HelpDesk analytics webhooks: ${helpdeskAnalyticsWebhookStatsResult.reason.message}`
      : "",
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
  state.modalLiveChatSelectedGroupIds = new Set();
  state.livechatPriorityDialog = null;
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

function buildCopyCredentialsText(username, password) {
  return `App: ${APP_URL}\nUsername: ${username}\nPassword: ${password}`;
}

function openLiveChatPriorityDialog(source, agentIds, groupIds) {
  ensureSelection(agentIds, "agent");
  ensureSelection(groupIds, "group");
  state.livechatPriorityDialog = {
    source,
    agentIds: [...new Set(agentIds.map(String))],
    groupIds: [...new Set(groupIds.map(String))],
  };
  renderModal();
  bindAppEvents();
}

async function submitLiveChatPriorityDialog() {
  const dialog = state.livechatPriorityDialog;
  if (!dialog) {
    return;
  }

  const groups = selectedLiveChatGroupsById(dialog.groupIds || []);
  const buckets = new Map();
  groups.forEach((group) => {
    const bucket = liveChatGroupBucket(group);
    const current = buckets.get(bucket) || [];
    current.push(String(group.id));
    buckets.set(bucket, current);
  });

  for (const [bucket, groupIds] of buckets.entries()) {
    const select = document.querySelector(`[data-livechat-priority-select="${CSS.escape(bucket)}"]`);
    const priority = LIVECHAT_PRIORITY_OPTIONS.some((option) => option.value === select?.value) ? select.value : "normal";
    await api("/api/livechat/memberships", {
      method: "POST",
      body: {
        agentIds: dialog.agentIds,
        groupIds,
        mode: "assign",
        priority,
      },
    });
  }

  const source = dialog.source;
  const profileAgentId = source === "profile" ? dialog.agentIds[0] : null;
  state.livechatPriorityDialog = null;
  state.modalLiveChatSelectedGroupIds.clear();

  if (profileAgentId) {
    await refreshData();
    await openLiveChatModal(profileAgentId);
  }
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
  if (accountSelect) {
    accountSelect.value = normalizeAccountId(state.accountId);
    accountSelect.onchange = () => switchAccount(accountSelect.value);
  }

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
    const currentSelected = state.analytics.filters.pendingAgents ?? state.analytics.filters.agents;
    state.analytics.filters.pendingAgents = stagedLiveChatAnalyticsSelection("analyticsAgents", currentSelected);
    state.analytics.filters.includeSearch = event.target.value;
    rerenderPreservingInput("analyticsIncludeSearch");
  });
  document.querySelectorAll("input[name='analyticsAgents']").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const currentSelected = state.analytics.filters.pendingAgents ?? state.analytics.filters.agents;
      state.analytics.filters.pendingAgents = stagedLiveChatAnalyticsSelection("analyticsAgents", currentSelected);
    });
  });
  document.getElementById("analyticsExcludeSearch")?.addEventListener("input", (event) => {
    const currentSelected = state.analytics.filters.pendingExcludeAgents ?? state.analytics.filters.excludeAgents;
    state.analytics.filters.pendingExcludeAgents = stagedLiveChatAnalyticsSelection("analyticsExcludeAgents", currentSelected);
    state.analytics.filters.excludeSearch = event.target.value;
    rerenderPreservingInput("analyticsExcludeSearch");
  });
  document.querySelectorAll("input[name='analyticsExcludeAgents']").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const currentSelected = state.analytics.filters.pendingExcludeAgents ?? state.analytics.filters.excludeAgents;
      state.analytics.filters.pendingExcludeAgents = stagedLiveChatAnalyticsSelection("analyticsExcludeAgents", currentSelected);
    });
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
  bindClick("analyticsFilterBtn", () => {
    applyLiveChatAnalyticsFilters();
  });
  bindClick("analyticsReloadBtn", () => {
    state.analytics.data = null;
    fetchAnalytics();
  });
  document.querySelectorAll("[data-livechat-raw-export]").forEach((button) => {
    button.onclick = async () => {
      try {
        await downloadLiveChatRawAnalytics(button.dataset.livechatRawExport);
      } catch (error) {
        setMessage(statusMessage, error.message, "error");
      }
    };
  });
  document.querySelectorAll("[data-analytics-sort]").forEach((button) => {
    button.onclick = () => {
      state.analytics.sort = button.dataset.analyticsSort;
      renderApp();
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
    const agentIds = selectedValues("livechat-agent");
    const groupIds = selectedLiveChatGroupIdsForAction();
    openLiveChatPriorityDialog("bulk", agentIds, groupIds);
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
  bindClick("helpdeskTicketsReloadBtn", () => {
    fetchHelpdeskTickets();
  });
  bindClick("helpdeskTicketsFilterBtn", () => {
    applyHelpdeskTicketFiltersFromDom();
  });
  bindClick("helpdeskTicketsResetFiltersBtn", () => {
    resetHelpdeskTicketFilters();
  });
  document.querySelectorAll("[data-helpdesk-ticket-export]").forEach((button) => {
    button.onclick = async () => {
      try {
        await downloadHelpdeskTicketsCsv(Number(button.dataset.helpdeskTicketExport));
      } catch (error) {
        setMessage(statusMessage, error.message, "error");
      }
    };
  });
  document.querySelectorAll("[data-helpdesk-ticket-page]").forEach((button) => {
    button.onclick = () => goHelpdeskTicketPage(button.dataset.helpdeskTicketPage);
  });
  document.querySelectorAll("[data-helpdesk-ticket-sort]").forEach((button) => {
    button.onclick = () => sortHelpdeskTicketColumn(button.dataset.helpdeskTicketSort);
  });
  bindClick("helpdeskTicketsSidebarToggle", () => {
    state.helpdeskTickets.sidebarCollapsed = !state.helpdeskTickets.sidebarCollapsed;
    renderApp();
  });
  document.querySelectorAll("[data-helpdesk-ticket-status]").forEach((button) => {
    button.onclick = () => selectHelpdeskTicketStatus(button.dataset.helpdeskTicketStatus);
  });
  document.querySelectorAll("[data-helpdesk-ticket-folder]").forEach((button) => {
    button.onclick = () => selectHelpdeskTicketFolder(button.dataset.helpdeskTicketFolder);
  });
  document.querySelectorAll("[data-helpdesk-ticket-open-live]").forEach((button) => {
    button.onclick = () => openHelpdeskTicket(button.dataset.helpdeskTicketOpenLive);
  });
  document.querySelectorAll("[data-helpdesk-related-ticket-open]").forEach((button) => {
    button.onclick = () => openHelpdeskTicket(button.dataset.helpdeskRelatedTicketOpen);
  });
  bindClick("helpdeskMergeTodayBtn", () => {
    const button = document.getElementById("helpdeskMergeTodayBtn");
    const parentTicketId = button?.dataset.parentTicketId || "";
    const childTicketIds = (button?.dataset.childTicketIds || "").split(",").filter(Boolean);
    mergeHelpdeskTodayTickets(parentTicketId, childTicketIds);
  });
  document.getElementById("workflowTypeInput")?.addEventListener("change", () => {
    syncHelpdeskWorkflowFormFromDom();
    renderApp();
  });
  ["workflowTitleInput", "workflowRequesterInput", "workflowStatusInput", "workflowTagsInput", "workflowSenderInput", "workflowMessageInput"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", syncHelpdeskWorkflowFormFromDom);
    document.getElementById(id)?.addEventListener("change", syncHelpdeskWorkflowFormFromDom);
  });
  bindClick("workflowsReloadBtn", () => {
    fetchHelpdeskWorkflows();
    fetchHelpdeskWorkflowAnalytics();
  });
  document.getElementById("workflowAnalyticsPreset")?.addEventListener("change", (event) => {
    state.helpdeskWorkflows.analytics.filters.preset = event.target.value;
    state.helpdeskWorkflows.analytics.data = null;
    fetchHelpdeskWorkflowAnalytics();
  });
  document.getElementById("workflowAnalyticsFrom")?.addEventListener("change", (event) => {
    state.helpdeskWorkflows.analytics.filters.from = event.target.value;
    state.helpdeskWorkflows.analytics.filters.preset = "custom";
    state.helpdeskWorkflows.analytics.data = null;
    fetchHelpdeskWorkflowAnalytics();
  });
  document.getElementById("workflowAnalyticsTo")?.addEventListener("change", (event) => {
    state.helpdeskWorkflows.analytics.filters.to = event.target.value;
    state.helpdeskWorkflows.analytics.filters.preset = "custom";
    state.helpdeskWorkflows.analytics.data = null;
    fetchHelpdeskWorkflowAnalytics();
  });
  bindClick("workflowAnalyticsReloadBtn", () => {
    fetchHelpdeskWorkflowAnalytics();
  });
  bindClick("workflowSaveBtn", () => {
    saveHelpdeskWorkflow();
  });
  document.querySelectorAll("[data-helpdesk-workflow-runs]").forEach((button) => {
    button.onclick = () => fetchHelpdeskWorkflows({ runsFor: button.dataset.helpdeskWorkflowRuns });
  });
  document.querySelectorAll("[data-helpdesk-workflow-run]").forEach((button) => {
    button.onclick = () => runHelpdeskWorkflow(button.dataset.helpdeskWorkflowRun);
  });
  document.querySelectorAll("[data-helpdesk-spam-keywords-save]").forEach((button) => {
    button.onclick = () => saveHelpdeskSpamWorkflowKeywords(button.dataset.helpdeskSpamKeywordsSave);
  });
  document.querySelectorAll("[data-helpdesk-workflow-toggle]").forEach((input) => {
    input.onchange = () => toggleHelpdeskWorkflow(input.dataset.helpdeskWorkflowToggle, input.checked);
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
    }, "HelpDesk analytics cache cleared.");
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
    state.modalLiveChatSelectedGroupIds.clear();
    state.livechatPriorityDialog = null;
    renderModal();
  });
  bindClick("closeLiveChatPriorityDialogBtn", () => {
    state.livechatPriorityDialog = null;
    renderModal();
    bindAppEvents();
  });
  bindClick("cancelLiveChatPriorityDialogBtn", () => {
    state.livechatPriorityDialog = null;
    renderModal();
    bindAppEvents();
  });
  bindClick("confirmLiveChatPriorityDialogBtn", async () => {
    await withBusyState(async () => {
      await submitLiveChatPriorityDialog();
    }, "LiveChat groups updated.");
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
    document.querySelectorAll(selector).forEach((input) => {
      if (input.disabled) return;
      input.checked = true;
      setSelection(input.name, input.value, true);
    });
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
    document.querySelectorAll(selector).forEach((input) => {
      if (input.disabled) return;
      input.checked = false;
      setSelection(input.name, input.value, false);
    });
  });
  document.querySelectorAll('input[name="modal-livechat-group"]').forEach((input) => {
    input.onchange = () => {
      setSelection("modal-livechat-group", input.value, input.checked);
    };
  });
  document.querySelectorAll("[data-modal-livechat-group-select]").forEach((button) => {
    button.onclick = () => {
      const existingGroupIds = new Set((state.modalAgent?.groups || []).map((group) => String(group.id)));
      liveChatGroupsForBucket(button.dataset.modalLivechatGroupSelect).forEach((group) => {
        if (existingGroupIds.has(String(group.id))) return;
        state.modalLiveChatSelectedGroupIds.add(String(group.id));
      });
      renderModal();
      bindAppEvents();
    };
  });
  document.querySelectorAll("[data-remove-livechat-profile-group]").forEach((button) => {
    button.onclick = async () => {
      const agentId = state.modalAgent?.id;
      const groupId = button.dataset.removeLivechatProfileGroup;
      if (!agentId || !groupId) return;

      await withBusyState(async () => {
        await api("/api/livechat/memberships", {
          method: "POST",
          body: {
            agentIds: [agentId],
            groupIds: [groupId],
            mode: "remove",
          },
        });
        await openLiveChatModal(agentId);
      }, "LiveChat group removed.");
    };
  });
  bindClick("saveModalBtn", async () => {
    if (state.modalType === "livechat") {
      const groupIds = selectedValues("modal-livechat-group");
      openLiveChatPriorityDialog("profile", [state.modalAgent.id], groupIds);
      return;
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

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-reset-admin-2fa]");
  if (!button || !document.body.contains(button)) return;
  event.preventDefault();
  event.stopPropagation();

  const encodedUsername = button.getAttribute("data-reset-admin-2fa") || "";
  const username = encodedUsername
    ? decodeURIComponent(encodedUsername)
    : button.closest("tr")?.querySelector("td")?.textContent.trim() || "";
  setMessage(statusMessage, username ? `Preparing 2FA reset for ${username}...` : "Missing admin username.", username ? "info" : "error");
  if (!username || !window.confirm(`Reset 2FA for ${username}? They will need to set a new password and Google Authenticator on next login.`)) {
    return;
  }

  button.disabled = true;
  try {
    setMessage(statusMessage, `Resetting 2FA for ${username}...`);
    await api("/api/admin-users", {
      method: "PATCH",
      body: {
        action: "reset_2fa",
        username,
      },
    });
    await refreshData();
    setMessage(statusMessage, `2FA reset for ${username}.`, "success");
  } catch (error) {
    button.disabled = false;
    setMessage(statusMessage, error.message, "error");
  }
});

document.addEventListener("click", async (event) => {
  const toggleButton = event.target.closest("[data-toggle-admin-disabled]");
  const deleteButton = event.target.closest("[data-delete-admin-user]");
  const button = toggleButton || deleteButton;
  if (!button || !document.body.contains(button)) return;
  event.preventDefault();
  event.stopPropagation();

  const encodedUsername = button.getAttribute(toggleButton ? "data-toggle-admin-disabled" : "data-delete-admin-user") || "";
  const username = encodedUsername
    ? decodeURIComponent(encodedUsername)
    : button.closest("tr")?.querySelector("td")?.textContent.trim() || "";
  if (!username) {
    setMessage(statusMessage, "Missing admin username.", "error");
    return;
  }

  const isDelete = Boolean(deleteButton);
  const disabled = toggleButton ? toggleButton.dataset.disabled === "1" : false;
  const label = isDelete ? "delete" : disabled ? "deactivate" : "reactivate";
  if (!window.confirm(`${label[0].toUpperCase()}${label.slice(1)} admin user ${username}?`)) return;

  button.disabled = true;
  try {
    setMessage(statusMessage, `${label[0].toUpperCase()}${label.slice(1)}ing ${username}...`);
    await api("/api/admin-users", {
      method: "PATCH",
      body: isDelete
        ? {
            action: "delete_admin",
            username,
          }
        : {
            action: "set_disabled",
            username,
            disabled,
          },
    });
    await refreshData();
    setMessage(statusMessage, `Admin user ${username} ${isDelete ? "deleted" : disabled ? "deactivated" : "reactivated"}.`, "success");
  } catch (error) {
    button.disabled = false;
    setMessage(statusMessage, error.message, "error");
  }
});

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
    state.csrfToken = result.csrfToken || "";
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
    state.permissions = session.permissions || {};
    state.csrfToken = session.csrfToken || "";
    showApp();
    await refreshData();
  } catch {
    showLogin();
  }
}

bootstrap();
