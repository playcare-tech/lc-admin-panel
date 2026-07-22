const APP_URL = "https://lc-admin-panel.pages.dev/";
const LIVECHAT_AI_QA_WEBHOOK_URL = "https://lc-admin-panel.pages.dev/webhooks/livechat-ai-qa-tagging";
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
    tabLabel: "Internal notes report",
    totalLabel: "Internal Notes",
    periodLabel: "Period notes",
    itemSingular: "note",
    itemPlural: "notes",
    detailTitle: "internal note points",
    detailEmpty: "No internal note details for this agent in the selected range.",
    timeLabel: "Note time",
    exportSlug: "internal-notes-count",
  },
  combined: {
    id: "combined",
    tabLabel: "Public + internal report",
    totalLabel: "Total activity",
    periodLabel: "Period activity",
    itemSingular: "activity",
    itemPlural: "activities",
    detailTitle: "activity points",
    detailEmpty: "No activity for this agent in the selected range.",
    timeLabel: "Activity time",
    exportSlug: "public-internal",
  },
};
const DEFAULT_HELPDESK_ANALYTICS_AGENT_EMAILS = [
  "maryia.kavalchuk@boomerang-partners.com",
  "alina.savchuk@boomerang-partners.com",
  "matvey.ivanov@boomerang-partners.com",
  "kateryna.brezhneva@boomerang-partners.com",
  "daniil.yermakovich@boomerang-partners.com",
  "naima.voloshina@boomerang-partners.com",
  "oleg.fadeev@boomerang-partners.com",
  "valeriya.ilhan@boomerang-partners.com",
  "garnik.makvetsyan@boomerang-partners.com",
  "aleksandr.lavrushkin@boomerang-partners.com",
  "daria.potapova@boomerang-partners.com",
  "andrey.solovyev@boomerang-partners.com",
  "victoria.namupala@boomerang-partners.com",
  "mariia.priakhina@boomerang-partners.com",
  "yehor.starchev@boomerang-partners.com",
  "mikhail.desiatov@boomerang-partners.com",
  "elgin.bakhishov@boomerang-partners.com",
  "yury.rybakov@boomerang-partners.com",
  "irada.muxtarova@boomerang-partners.com",
  "arslan.abubikirov@boomerang-partners.com",
  "zhomart.adanbekov@boomerang-partners.com",
  "maksim.yerdenov@boomerang-partners.com",
  "elizaveta.kozlovskaya@boomerang-partners.com",
  "tamerlan.aghamaliyev@boomerang-partners.com",
  "nikolay.baranchuk@boomerang-partners.com",
  "arman.harutyunyan@boomerang-partners.com",
  "ilya.pantsiukhou@boomerang-partners.com",
  "hanna.mashchytskaya@boomerang-partners.com",
  "khushnur.turgunbaev@boomerang-partners.com",
  "ivan.sakovich@boomerang-partners.com",
  "vladislav.kholkin@boomerang-partners.com",
  "mikhail.kipel@boomerang-partners.com",
  "ihar.filonik@boomerang-partners.com",
  "anatoliy.tolstov@boomerang-partners.com",
  "anastasiia.amelkina@boomerang-partners.com",
  "alisa.maisiuk@boomerang-partners.com",
  "anastasiia.kozlova@boomerang-partners.com",
  "gurgen.a@playcare.tech",
  "oleh.v@playcare.tech",
  "nikita.t@playcare.tech",
  "anastasiya.l@playcare.tech",
  "sofia.k@playcare.tech",
  "viktoria.z@playcare.tech",
  "aleksandr.b@playcare.tech",
  "ryhor.a@playcare.tech",
  "tamazi.m@playcare.tech",
  "kyril.ch@playcare.tech",
  "elijah.b@playcare.tech",
  "mikhail.g@playcare.tech",
  "aytun.m@playcare.tech",
  "yuri.p@playcare.tech",
  "marina.g@playcare.tech",
  "ivo.k@playcare.tech",
  "hanna.k@playcare.tech",
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
  "Mikhail G",
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
const AI_QA_CONTENT_TAGS = [
  "Bonus_request",
  "VIP",
  "Withdrawal_hold",
  "No_communication",
  "Sportsbook",
  "Closure_other",
  "Bonus_info",
  "account",
  "kyc",
  "bonus_problem",
  "deposit_problem",
  "deposit_info",
  "withdrawal_problem",
  "other",
  "rg_closure",
  "reopen",
  "product_info",
  "esc",
  "product_problem",
  "tech_issue",
  "truspilot",
  "refund",
  "loyalty_bonus",
  "Сashback",
  "promo_bonus",
];
const AGENT_QA_RULES = [
  { rule: "q0x", title: "No human agent interaction", tags: ["q0x"] },
  { rule: "q0l", title: "Customer left after greeting", tags: ["q0l"] },
  { rule: "q0m", title: "Manual review needed", tags: ["q0m"] },
  { rule: "q1", title: "Closure Reason", tags: ["q1a", "q1b"] },
  { rule: "q2", title: "Closure Retention", tags: ["q2a", "q2b"] },
  { rule: "q3", title: "Closure Final Clarification", tags: ["q3a", "q3b"] },
  { rule: "q4", title: "GA Closure Non-VIP", tags: ["q4a", "q4b"] },
  { rule: "q5", title: "GA Closure VIP licensed project", tags: ["q5a", "q5b"] },
  { rule: "q6", title: "GA Closure VIP non-license project", tags: ["q6a", "q6b"] },
  { rule: "q7", title: "Technical Issue Website", tags: ["q7a", "q7b"] },
  { rule: "q8", title: "Technical Issue Game", tags: ["q8a", "q8b"] },
  { rule: "q9", title: "Rude Communication", tags: ["q9a", "q9b"] },
  { rule: "q10", title: "Explanation quality", tags: ["q10a", "q10b"] },
  { rule: "q11", title: "Tone of Voice", tags: ["q11a", "q11b"] },
];
const AGENT_QA_TAGS = AGENT_QA_RULES.flatMap((rule) => rule.tags);
const HELPDESK_TICKET_TEXT_SORTS = new Set(["requester", "assignedAgent"]);
const HELPDESK_TICKET_DATE_SORTS = new Set(["createdAt", "updatedAt", "lastMessageAt"]);
const LIVECHAT_GROUP_BUCKETS = ["VIP", "SS", "TL", "S2B"];
const HELPDESK_ANALYTICS_AGENT_DEFAULTS_STORAGE_KEY = "lc-admin-helpdesk-analytics-agent-defaults-v2";
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
  return "default";
}

const state = {
  user: null,
  permissions: {},
  csrfToken: "",
  accountId: "default",
  loginChallenge: null,
  inviteSetup: null,
  section: "livechat-users",
  sidebarCollapsed: window.localStorage.getItem("mainSidebarCollapsed") === "1",
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
  lastAdminInvite: null,
  adminInviteWizard: null,
  qaDashboard: {
    loading: false,
    loaded: false,
    error: null,
    data: null,
  },
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
  livechatAiQa: {
    loading: false,
    loaded: false,
    error: null,
    rows: [],
    total: 0,
    page: 1,
    pageSize: 50,
    sort: "date",
    order: "desc",
    expanded: new Set(),
    filters: {
      from: "",
      to: "",
      agent: "",
      tag: "",
      chatId: "",
      transferred: "",
      reason: "",
      hasQueue: "",
      customerLanguage: "",
      chatbotLanguage: "",
    },
  },
  livechatAiQaReview: {
    loading: false,
    detailLoading: false,
    actionLoading: false,
    loaded: false,
    error: null,
    actionError: null,
    rows: [],
    detail: null,
    selectedId: "",
    total: 0,
    page: 1,
    pageSize: 25,
    dirty: false,
    decisionPanel: "auto",
    filters: {
      scope: "mine",
      status: "pending_review",
      aiStatus: "ready",
      chatId: "",
    },
  },
  livechatAgentQaReview: {
    loading: false,
    detailLoading: false,
    actionLoading: false,
    loaded: false,
    error: null,
    actionError: null,
    rows: [],
    detail: null,
    selectedId: "",
    total: 0,
    page: 1,
    pageSize: 25,
    dirty: false,
    filters: {
      scope: "mine",
      status: "pending_review",
      aiStatus: "",
      agent: "",
      tag: "",
      chatId: "",
    },
  },
  livechatAgentQaLeaderboard: {
    loading: false,
    loaded: false,
    error: null,
    rows: [],
    reviewedCount: 0,
    filters: {
      from: "",
      to: "",
      agent: "",
    },
  },
  livechatAiQaPreReviewAnalytics: {
    loading: false,
    loaded: false,
    error: null,
    data: null,
    billingRange: "24h",
    filters: {
      from: "",
      to: "",
      reviewType: "all",
      reviewer: "",
    },
  },
  livechatAiQaManagement: {
    loading: false,
    saving: false,
    error: null,
    data: null,
    username: "",
    from: "",
    to: "",
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
    slackSending: false,
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
  return {};
}

async function api(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const timeoutMs = Number(options.timeoutMs || 0);
  const controller = timeoutMs > 0 ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), timeoutMs)
    : null;
  const headers = {
    ...accountRequestHeaders(),
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };
  if (state.csrfToken && !["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers["X-CSRF-Token"] = state.csrfToken;
  }

  let response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller?.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s.`);
    }
    throw error;
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  }
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
  ensureAllowedSection();
  renderApp();
}

function showLogin() {
  state.user = null;
  state.permissions = {};
  state.csrfToken = "";
  state.inviteSetup = inviteSetupFromLocation();
  appView.classList.add("d-none");
  loginView.classList.remove("d-none");
  renderLoginChallenge();
  if (state.inviteSetup && !state.inviteSetup.setupSecret) {
    fetchInviteSetupChallenge();
  }
  stopHelpdeskTicketsRealtime();
}

function syncAccountSwitcher() {
  sessionBadge.textContent = `Signed in as ${state.user}`;
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
  state.livechatAiQa.rows = [];
  state.livechatAiQa.total = 0;
  state.livechatAiQa.page = 1;
  state.livechatAiQa.loaded = false;
  state.livechatAiQa.error = null;
  state.livechatAiQa.expanded.clear();
  state.livechatAiQaReview.rows = [];
  state.livechatAiQaReview.detail = null;
  state.livechatAiQaReview.selectedId = "";
  state.livechatAiQaReview.total = 0;
  state.livechatAiQaReview.page = 1;
  state.livechatAiQaReview.loaded = false;
  state.livechatAiQaReview.error = null;
  state.livechatAiQaReview.actionError = null;
  state.livechatAgentQaReview.rows = [];
  state.livechatAgentQaReview.detail = null;
  state.livechatAgentQaReview.selectedId = "";
  state.livechatAgentQaReview.total = 0;
  state.livechatAgentQaReview.page = 1;
  state.livechatAgentQaReview.loaded = false;
  state.livechatAgentQaReview.error = null;
  state.livechatAgentQaReview.actionError = null;
  state.livechatAgentQaLeaderboard.rows = [];
  state.livechatAgentQaLeaderboard.reviewedCount = 0;
  state.livechatAgentQaLeaderboard.loaded = false;
  state.livechatAgentQaLeaderboard.error = null;
  state.livechatAiQaPreReviewAnalytics.loading = false;
  state.livechatAiQaPreReviewAnalytics.loaded = false;
  state.livechatAiQaPreReviewAnalytics.error = null;
  state.livechatAiQaPreReviewAnalytics.data = null;
  state.qaDashboard.loading = false;
  state.qaDashboard.loaded = false;
  state.qaDashboard.error = null;
  state.qaDashboard.data = null;
  state.helpdesk_analytics.data = null;
  state.helpdesk_analytics.appliedFilters = null;
  state.helpdesk_analytics.webhookStats = null;
  state.helpdesk_analytics.defaultAgentsApplied = false;
  state.livechatSelectedAgentIds.clear();
  state.livechatSelectedGroupIds.clear();
  state.helpdeskSelectedAgentIds.clear();
  state.helpdeskSelectedTeamIds.clear();
  state.modalOpen = false;
  state.modalAgent = null;
  state.modalType = null;
}

function renderLoginChallenge() {
  if (!loginChallengeFields) return;
  const passwordInput = document.getElementById("password");
  const passwordField = passwordInput?.closest(".col-12");
  if (state.inviteSetup) {
    const setup = state.inviteSetup;
    loginChallengeFields.innerHTML = `
      <input id="inviteNewPassword" name="inviteNewPassword" type="password" class="form-control" placeholder="Create password (12+ chars, Aa1!)" autocomplete="new-password" required />
      <div class="totp-setup-box">
        <div class="subtle">Scan the QR code in Google Authenticator, or use the setup key, then enter the 6-digit code.</div>
        <canvas id="totpQrCanvas" class="totp-qr" aria-label="Google Authenticator QR code"></canvas>
        <div class="credentials-box">${escapeHtml(setup.setupSecret || "Submit once to generate your setup key.")}</div>
        <input type="hidden" name="setupSecret" value="${escapeHtml(setup.setupSecret || "")}" />
      </div>
      <input id="inviteOtp" name="inviteOtp" type="text" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" class="form-control" placeholder="Google Authenticator code" autocomplete="one-time-code" required />
    `;
    document.getElementById("username").value = setup.username || document.getElementById("username").value || "";
    if (passwordInput) {
      passwordInput.required = false;
      passwordInput.disabled = true;
    }
    passwordField?.classList.add("d-none");
    renderTotpQr();
    return;
  }
  if (passwordInput) {
    passwordInput.required = true;
    passwordInput.disabled = false;
  }
  passwordField?.classList.remove("d-none");
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

function isAdminRole() {
  return state.permissions?.role !== "qa_manager";
}

function hasPermission(permission) {
  return Boolean(state.permissions?.[permission] || canManageAdmins());
}

const SECTION_PERMISSIONS = {
  "qa-dashboard": "canViewQaDashboard",
  "livechat-ai-qa-tagging": "canViewLivechatAiQaTagging",
  "livechat-ai-qa-review": "canReviewLivechatAiAutoTags",
  "livechat-agent-qa-review": "canReviewLivechatAgentQa",
  "livechat-agent-qa-leaderboard": "canViewLivechatAgentQaLeaderboard",
  "livechat-ai-qa-pre-review-analytics": "canViewLivechatAgentQaLeaderboard",
  "helpdesk-analytics": "canViewHelpdeskAnalytics",
  "admin-users": "canManageAdmins",
};

const ADMIN_ONLY_SECTIONS = new Set([
  "livechat-users",
  "livechat-groups",
  "create-livechat-user",
  "livechat-analytics",
  "helpdesk-users",
  "helpdesk-groups",
  "create-helpdesk-user",
  "helpdesk-tickets",
  "helpdesk-workflows",
  "logs",
]);

function canAccessSection(section) {
  if (ADMIN_ONLY_SECTIONS.has(section)) return isAdminRole();
  const permission = SECTION_PERMISSIONS[section];
  return permission ? hasPermission(permission) : true;
}

function firstAllowedSection() {
  return [
    "qa-dashboard",
    "livechat-ai-qa-tagging",
    "livechat-ai-qa-review",
    "livechat-agent-qa-review",
    "livechat-agent-qa-leaderboard",
    "livechat-ai-qa-pre-review-analytics",
    "helpdesk-analytics",
    "livechat-users",
  ].find(canAccessSection) || "qa-dashboard";
}

function ensureAllowedSection() {
  if (!canAccessSection(state.section)) {
    state.section = firstAllowedSection();
  }
}

function syncSidebarAccess() {
  document.querySelectorAll(".sidebar-link").forEach((button) => {
    const section = button.dataset.section;
    button.classList.toggle("d-none", !canAccessSection(section));
  });
  document.querySelectorAll(".sidebar-group").forEach((group) => {
    const hasVisibleLink = [...group.querySelectorAll(".sidebar-link")].some((button) => !button.classList.contains("d-none"));
    group.classList.toggle("d-none", !hasVisibleLink);
  });
}

function inviteSetupFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("invite") || "";
  if (!token) return null;
  return {
    token,
    username: params.get("username") || "",
    setupSecret: "",
    otpauthUri: "",
  };
}

async function fetchInviteSetupChallenge() {
  try {
    const result = await api("/api/auth/invite-setup", {
      method: "POST",
      body: {
        token: state.inviteSetup.token,
        username: state.inviteSetup.username,
      },
    });
    if (!result.ok && result.requiresInviteSetup) {
      state.inviteSetup = {
        ...state.inviteSetup,
        setupSecret: result.setupSecret || "",
        otpauthUri: result.otpauthUri || "",
      };
      renderLoginChallenge();
      setMessage(loginMessage, result.message || "Complete account setup.", "info");
    }
  } catch (error) {
    setMessage(loginMessage, error.message, "error");
  }
}

function renderTotpQr() {
  const canvas = document.getElementById("totpQrCanvas");
  const uri = state.inviteSetup?.otpauthUri || state.loginChallenge?.otpauthUri;
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
  const inviteText = state.lastAdminInvite
    ? `Invite link: ${state.lastAdminInvite.inviteLink}\nUsername: ${state.lastAdminInvite.username}\nSlack: ${state.lastAdminInvite.slack?.sent ? "sent" : inviteEmailStatusLabel(state.lastAdminInvite.slack)}\nExpires: ${state.lastAdminInvite.inviteExpiresAt}`
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
        <div class="section-title">Invite a new user</div>
        <p class="subtle mb-3">A short guided setup will collect their details, role, and permissions. Username and invitation email will automatically use their email address.</p>
        <button id="openAdminInviteWizardBtn" type="button" class="btn btn-primary">Invite new user</button>
        <div class="credentials-box mt-3">${escapeHtml(inviteText || "The personal registration link will appear here after creation.")}</div>
        ${state.lastAdminInvite ? '<button type="button" id="copyAdminInviteBtn" class="btn btn-outline-secondary mt-2">Copy invitation link</button>' : ""}
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
                  <thead><tr><th>User</th><th>Role</th><th>Status</th><th>2FA</th><th>Invite</th><th>Permissions</th><th>Created at</th><th>Created by</th><th></th></tr></thead>
                  <tbody>
                    ${state.adminUsers
                      .map(
                        (user) => `
                          <tr>
                            <td>
                              <strong>${escapeHtml([user.first_name, user.last_name].filter(Boolean).join(" ") || user.username)}</strong>
                              <div class="subtle">${escapeHtml(user.invite_email || user.username)}</div>
                              ${user.invite_slack_user_id ? `<div class="subtle">Slack: ${escapeHtml(user.invite_slack_user_id)}</div>` : ""}
                            </td>
                            <td>${escapeHtml(user.user_role === "qa_manager" ? "QA manager" : "Admin")}</td>
                            <td>${user.disabled_at ? '<span class="chip last">Disabled</span>' : '<span class="chip primary">Active</span>'}</td>
                            <td>${Number(user.totp_enabled) ? "Enabled" : "Setup required"}</td>
                            <td>${user.invite_accepted_at ? "Accepted" : user.invite_expires_at ? `Pending until ${new Date(user.invite_expires_at).toLocaleDateString()}` : "-"}</td>
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

function inviteEmailStatusLabel(email = {}) {
  if (email.sent) return "sent";
  if (email.reason === "missing_email_provider") return "not sent - email provider is not configured";
  if (email.reason === "missing_email") return "not sent - missing email";
  if (email.reason === "missing_slack_provider") return "not sent - Slack bot token is not configured";
  if (email.reason === "missing_slack_user_id") return "not sent - missing Slack user ID";
  if (email.reason === "send_failed") return `not sent - ${email.error || "Slack delivery failed"}`;
  return "not sent";
}

async function fetchQaDashboard() {
  state.qaDashboard.loading = true;
  state.qaDashboard.error = null;
  if (state.section === "qa-dashboard") renderApp();
  try {
    state.qaDashboard.data = await api("/api/qa-manager/dashboard");
    state.qaDashboard.loaded = true;
  } catch (error) {
    state.qaDashboard.error = error.message;
    state.qaDashboard.loaded = true;
  } finally {
    state.qaDashboard.loading = false;
    if (state.section === "qa-dashboard") renderApp();
  }
}

function renderQaDashboardList(rows, valueLabel, emptyLabel = "No data yet.") {
  return rows?.length
    ? `<div class="qa-dashboard-list">
        ${rows
          .map(
            (row, index) => `
              <div class="qa-dashboard-row">
                <span class="qa-dashboard-rank">${index + 1}</span>
                <span class="qa-dashboard-agent">${escapeHtml(row.agent || "Unknown")}</span>
                <strong>${escapeHtml(row.score === null || row.score === undefined ? row.total || row.reviews || 0 : `${row.score}%`)}</strong>
                <small>${escapeHtml(valueLabel)}</small>
              </div>
            `,
          )
          .join("")}
      </div>`
    : renderEmptyState(emptyLabel, "bi-bar-chart");
}

function renderLoadingState(label = "Loading…") {
  return `<div class="ui-state ui-state-loading" role="status" aria-live="polite">
    <span class="ui-state-spinner" aria-hidden="true"></span>
    <div><strong>${escapeHtml(label)}</strong><span>Please wait while the latest data is prepared.</span></div>
  </div>`;
}

function renderEmptyState(label, icon = "bi-inbox") {
  return `<div class="ui-state ui-state-empty">
    <span class="ui-state-icon"><i class="bi ${escapeHtml(icon)}"></i></span>
    <div><strong>${escapeHtml(label)}</strong><span>New items will appear here automatically.</span></div>
  </div>`;
}

function renderErrorState(label) {
  return `<div class="ui-state ui-state-error" role="alert">
    <span class="ui-state-icon"><i class="bi bi-exclamation-triangle"></i></span>
    <div><strong>Something went wrong</strong><span>${escapeHtml(label)}</span></div>
  </div>`;
}

function renderQaDashboard() {
  const data = state.qaDashboard.data;
  if (state.qaDashboard.loading && !data) return renderLoadingState("Loading QA dashboard");
  if (state.qaDashboard.error) return renderErrorState(state.qaDashboard.error);
  if (!data) return renderEmptyState("QA dashboard is not loaded yet", "bi-grid-1x2");

  const totalPending = Number(data.pending?.agentQa || 0) + Number(data.pending?.autoTag || 0);

  return `
    <section class="qa-dashboard-hero card-shell">
      <div>
        <span class="ui-eyebrow">Quality operations</span>
        <h1>${totalPending ? `${totalPending.toLocaleString()} reviews need attention` : "Your QA queue is clear"}</h1>
        <p>Prioritize AI corrections, monitor agent quality and keep the review pipeline moving.</p>
      </div>
      <div class="qa-dashboard-hero-actions">
        <button id="qaDashboardOpenCombined" class="btn btn-primary" type="button"><i class="bi bi-stars"></i> Open combined QA</button>
        <button id="qaDashboardReload" class="btn btn-outline-secondary" type="button"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
      </div>
    </section>
    ${renderStats([
      { label: "QA pending", value: Number(data.pending?.agentQa || 0).toLocaleString(), meta: "Manual AI QA Review" },
      { label: "Auto-tag pending", value: Number(data.pending?.autoTag || 0).toLocaleString(), meta: "Manual AI auto-tag review" },
      { label: "My reviews", value: Number(data.reviewedByMeLast7Days || 0).toLocaleString(), meta: "Last 7 days" },
      { label: "Range", value: "7d", meta: `${data.range?.from || "-"} to ${data.range?.to || "-"}` },
    ])}
    <div class="section-grid qa-dashboard-grid">
      <div class="card-shell qa-dashboard-leader-card positive">
        <div class="qa-dashboard-card-head"><div><span class="ui-eyebrow">HelpDesk</span><div class="section-title">Top performers</div></div><i class="bi bi-trophy"></i></div>
        ${renderQaDashboardList(data.helpdesk?.best || [], "handled")}
      </div>
      <div class="card-shell qa-dashboard-leader-card attention">
        <div class="qa-dashboard-card-head"><div><span class="ui-eyebrow">HelpDesk</span><div class="section-title">Needs coaching</div></div><i class="bi bi-activity"></i></div>
        ${renderQaDashboardList(data.helpdesk?.worst || [], "handled")}
      </div>
      <div class="card-shell qa-dashboard-leader-card positive">
        <div class="qa-dashboard-card-head"><div><span class="ui-eyebrow">LiveChat</span><div class="section-title">Top performers</div></div><i class="bi bi-trophy"></i></div>
        ${renderQaDashboardList(data.livechat?.best || [], "score")}
      </div>
      <div class="card-shell qa-dashboard-leader-card attention">
        <div class="qa-dashboard-card-head"><div><span class="ui-eyebrow">LiveChat</span><div class="section-title">Needs coaching</div></div><i class="bi bi-activity"></i></div>
        ${renderQaDashboardList(data.livechat?.worst || [], "score")}
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
    <aside class="card-shell livechat-agent-profile-panel">
      <div class="profile-card">
        <div class="profile-hero">
          <div class="profile-photo">${avatar}</div>
          <div>
            <span class="ui-eyebrow">Agent profile</span>
            <div class="profile-name">${escapeHtml(formatProfileValue(agent.name, agent.email))}</div>
            <div class="profile-identity-line"><span class="chip">${escapeHtml(roleBadgeLabel(agent.role))}</span>${agent.jobTitle ? `<span class="subtle">${escapeHtml(agent.jobTitle)}</span>` : ""}</div>
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
            <button class="btn btn-primary" type="submit"><i class="bi bi-check2"></i> Save changes</button>
            ${canManageUsers() ? `<button id="suspendModalLiveChatBtn" class="btn btn-outline-danger" type="button" ${agent.suspended ? "disabled" : ""}><i class="bi bi-person-slash"></i> Suspend user</button>` : ""}
          </div>
        </form>
      </div>
      <div class="profile-memberships-head"><div><div class="section-title">Current memberships</div><div class="subtle">${Number(agent.groups?.length || 0)} active groups</div></div></div>
      <div class="profile-memberships-list">${currentMembershipMarkup}</div>
    </aside>
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

function livechatAiQaChatKey(row) {
  return `${row.chatId}:${row.threadId}`;
}

function livechatAiQaDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const time = `${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}:${padDatePart(date.getSeconds())}`;
  return `${localDateValue(date)} ${time}`;
}

function livechatArchiveUrl(threadId, chatId = "") {
  const archiveId = `${threadId || chatId || ""}`.trim();
  return archiveId ? `https://my.livechatinc.com/archives/${encodeURIComponent(archiveId)}` : "";
}

function renderLivechatChatLink(chatId, threadId, className = "") {
  const label = threadId || chatId || "-";
  const url = livechatArchiveUrl(threadId, chatId);
  if (!url) return escapeHtml(label);
  return `<a class="livechat-chat-link ${escapeHtml(className)}" data-livechat-chat-link href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" title="Open chat in LiveChat">${escapeHtml(label)}</a>`;
}

function livechatAiQaMetricLabel(value, fallback = "-") {
  return value || fallback;
}

function livechatAiQaTagChips(value, empty = "-") {
  const tags = `${value || ""}`
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  if (!tags.length) return `<span class="subtle">${escapeHtml(empty)}</span>`;
  return `
    <div class="chip-list livechat-ai-qa-chip-list">
      ${tags.map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join("")}
    </div>
  `;
}

function livechatAiQaQueryParams() {
  const filters = state.livechatAiQa.filters;
  const params = new URLSearchParams({
    page: String(state.livechatAiQa.page),
    pageSize: String(state.livechatAiQa.pageSize),
    sort: state.livechatAiQa.sort,
    order: state.livechatAiQa.order,
  });
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params;
}

function syncLivechatAiQaFiltersFromDom() {
  const filters = state.livechatAiQa.filters;
  filters.from = document.getElementById("livechatAiQaFrom")?.value || "";
  filters.to = document.getElementById("livechatAiQaTo")?.value || "";
  filters.agent = document.getElementById("livechatAiQaAgent")?.value.trim() || "";
  filters.tag = document.getElementById("livechatAiQaTag")?.value.trim() || "";
  filters.chatId = document.getElementById("livechatAiQaChatId")?.value.trim() || "";
  filters.transferred = document.getElementById("livechatAiQaTransferred")?.value || "";
  filters.reason = document.getElementById("livechatAiQaReason")?.value || "";
  filters.hasQueue = document.getElementById("livechatAiQaHasQueue")?.value || "";
  filters.customerLanguage = document.getElementById("livechatAiQaCustomerLanguage")?.value.trim() || "";
  filters.chatbotLanguage = document.getElementById("livechatAiQaChatbotLanguage")?.value.trim() || "";
  state.livechatAiQa.page = 1;
}

function resetLivechatAiQaFilters() {
  state.livechatAiQa.filters = {
    from: "",
    to: "",
    agent: "",
    tag: "",
    chatId: "",
    transferred: "",
    reason: "",
    hasQueue: "",
    customerLanguage: "",
    chatbotLanguage: "",
  };
  state.livechatAiQa.page = 1;
}

async function fetchLivechatAiQaTagging() {
  state.livechatAiQa.loading = true;
  state.livechatAiQa.error = null;
  if (state.section === "livechat-ai-qa-tagging") renderApp();

  try {
    const response = await api(`/api/livechat/ai-qa-tagging?${livechatAiQaQueryParams().toString()}`);
    state.livechatAiQa.rows = response.rows || [];
    state.livechatAiQa.total = Number(response.total || 0);
    state.livechatAiQa.page = Number(response.page || state.livechatAiQa.page);
    state.livechatAiQa.pageSize = Number(response.pageSize || state.livechatAiQa.pageSize);
    state.livechatAiQa.loaded = true;
  } catch (error) {
    state.livechatAiQa.error = error.message;
    state.livechatAiQa.rows = [];
    state.livechatAiQa.total = 0;
    state.livechatAiQa.loaded = true;
  } finally {
    state.livechatAiQa.loading = false;
    if (state.section === "livechat-ai-qa-tagging") renderApp();
  }
}

function livechatAiQaSortButton(key, label) {
  const active = state.livechatAiQa.sort === key;
  const direction = active ? state.livechatAiQa.order : "desc";
  return `
    <button class="btn btn-link btn-sm p-0" type="button" data-livechat-ai-qa-sort="${escapeHtml(key)}">
      ${escapeHtml(label)}${active ? ` ${direction === "asc" ? "↑" : "↓"}` : ""}
    </button>
  `;
}

function renderLivechatAiQaFilters() {
  const filters = state.livechatAiQa.filters;
  return `
    <div class="card-shell analytics-filter-bar livechat-ai-qa-filter-shell">
      <div class="tickets-toolbar">
        <div>
          <div class="section-title">Chats pre-AI-analysis</div>
          <div class="subtle">Webhook: <code>${escapeHtml(LIVECHAT_AI_QA_WEBHOOK_URL)}</code></div>
        </div>
        <button id="livechatAiQaReloadBtn" class="btn btn-sm btn-outline-secondary" type="button">Reload</button>
      </div>
      <div class="analytics-filter-grid">
        <label>
          <span>From</span>
          <input id="livechatAiQaFrom" class="form-control" type="date" value="${escapeHtml(filters.from)}" />
        </label>
        <label>
          <span>To</span>
          <input id="livechatAiQaTo" class="form-control" type="date" value="${escapeHtml(filters.to)}" />
        </label>
        <label>
          <span>Agent</span>
          <input id="livechatAiQaAgent" class="form-control" type="search" value="${escapeHtml(filters.agent)}" placeholder="email or name" />
        </label>
        <label>
          <span>Tag</span>
          <input id="livechatAiQaTag" class="form-control" type="search" value="${escapeHtml(filters.tag)}" placeholder="chatbot-transfer" />
        </label>
        <label>
          <span>Chat / Thread</span>
          <input id="livechatAiQaChatId" class="form-control" type="search" value="${escapeHtml(filters.chatId)}" placeholder="TH..." />
        </label>
        <label>
          <span>Transferred</span>
          <select id="livechatAiQaTransferred" class="form-select">
            <option value="" ${filters.transferred === "" ? "selected" : ""}>Any</option>
            <option value="yes" ${filters.transferred === "yes" ? "selected" : ""}>Yes</option>
            <option value="no" ${filters.transferred === "no" ? "selected" : ""}>No</option>
          </select>
        </label>
        <label>
          <span>Reason</span>
          <select id="livechatAiQaReason" class="form-select">
            ${["", "manual", "inactive", "assigned", "unassigned", "other", "manual_archived_customer", "chat_deactivated"]
              .map((value) => `<option value="${escapeHtml(value)}" ${filters.reason === value ? "selected" : ""}>${escapeHtml(value || "Any")}</option>`)
              .join("")}
          </select>
        </label>
        <label>
          <span>Queue</span>
          <select id="livechatAiQaHasQueue" class="form-select">
            <option value="" ${filters.hasQueue === "" ? "selected" : ""}>Any</option>
            <option value="yes" ${filters.hasQueue === "yes" ? "selected" : ""}>Yes</option>
            <option value="no" ${filters.hasQueue === "no" ? "selected" : ""}>No</option>
          </select>
        </label>
        <label>
          <span>User language</span>
          <input id="livechatAiQaCustomerLanguage" class="form-control" type="search" value="${escapeHtml(filters.customerLanguage)}" placeholder="French" />
        </label>
        <label>
          <span>Bot language</span>
          <input id="livechatAiQaChatbotLanguage" class="form-control" type="search" value="${escapeHtml(filters.chatbotLanguage)}" placeholder="English" />
        </label>
      </div>
      <div class="analytics-actions">
        <button id="livechatAiQaFilterBtn" class="btn btn-primary" type="button">Filter</button>
        <button id="livechatAiQaResetBtn" class="btn btn-outline-secondary" type="button">Reset</button>
      </div>
    </div>
  `;
}

function livechatAiQaEventLabel(event) {
  if (event.eventType === "incoming_chat") return "Incoming chat";
  if (event.eventType === "queue_started") return "Queue started";
  if (event.eventType === "tag_added") return "Tag added";
  if (event.eventType === "transfer_to_agent") return "Transfer to agent";
  if (event.eventType === "queued") return "Queue";
  if (event.eventType === "chat_deactivated") return "Chat deactivated";
  if (event.actorType === "chatbot") return "Chatbot message";
  if (event.actorType === "agent") return "Agent message";
  if (event.actorType === "customer") return "Customer message";
  if (event.actorType === "system") return `System${event.eventType ? ` / ${event.eventType}` : ""}`;
  return event.eventType || event.action || "Event";
}

function renderLivechatAiQaTimeline(row) {
  if (!row.events?.length) {
    return `<div class="empty-state">No timeline events recorded for this chat yet.</div>`;
  }
  return `
    <div class="analytics-ticket-detail">
      <div class="analytics-ticket-detail-title">Timeline · ${escapeHtml(row.chatId || "-")} / ${renderLivechatChatLink(row.chatId, row.threadId)}</div>
      <div class="livechat-ai-qa-timeline">
        ${row.events
          .map(
            (event) => `
              <div class="livechat-ai-qa-event">
                <div class="livechat-ai-qa-time">${escapeHtml(livechatAiQaDateTime(event.eventAt))}</div>
                <div>
                  <div>
                    <strong>${escapeHtml(livechatAiQaEventLabel(event))}</strong>
                    ${event.actorId ? `<span class="subtle"> · ${escapeHtml(event.actorId)}</span>` : ""}
                  </div>
                  ${event.messageText ? `<div class="livechat-ai-qa-message">${escapeHtml(event.messageText)}</div>` : ""}
                  ${
                    event.tag
                      ? `<div class="subtle">Tag: <strong>${escapeHtml(event.tag)}</strong></div>`
                      : ""
                  }
                  ${
                    event.transferReason
                      ? `<div class="subtle">Reason: <strong>${escapeHtml(event.transferReason)}</strong></div>`
                      : ""
                  }
                  ${
                    event.languageSignal?.customerLanguage
                      ? `<div class="subtle">Language: ${escapeHtml(event.languageSignal.customerLanguage)} → ${escapeHtml(event.languageSignal.translationTo || "")}</div>`
                      : ""
                  }
                </div>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderLivechatAiQaRows() {
  const rows = state.livechatAiQa.rows || [];
  if (state.livechatAiQa.loading) {
    return `<div class="empty-state">Loading Chats pre-AI-analysis data...</div>`;
  }
  if (state.livechatAiQa.error) {
    return `<div class="empty-state analytics-error">${escapeHtml(state.livechatAiQa.error)}</div>`;
  }
  if (!rows.length) {
    return `<div class="empty-state">No LiveChat AI QA webhook data recorded yet.</div>`;
  }
  return rows
    .map((row) => {
      const key = livechatAiQaChatKey(row);
      const expanded = state.livechatAiQa.expanded.has(key);
      const chatEnded = Boolean(row.deactivatedAt);
      return `
        <article class="livechat-ai-qa-row ${expanded ? "expanded" : ""}" data-livechat-ai-qa-toggle="${escapeHtml(key)}">
          <div class="livechat-ai-qa-row-main">
            <div class="livechat-ai-qa-cell livechat-ai-qa-date">
              <span class="livechat-ai-qa-label">Date</span>
              <strong>${escapeHtml(livechatAiQaDateTime(row.lastEventAt || row.firstSeenAt))}</strong>
            </div>
            <div class="livechat-ai-qa-cell livechat-ai-qa-chat">
              <span class="livechat-ai-qa-label">Chat</span>
              <strong>${renderLivechatChatLink(row.chatId, row.threadId)}</strong>
              <span>${escapeHtml(row.threadId)}</span>
            </div>
            <div class="livechat-ai-qa-cell livechat-ai-qa-agent">
              <span class="livechat-ai-qa-label">Agent</span>
              <span>${escapeHtml(row.agentLabel || row.transferAgentIds?.join(", ") || "-")}</span>
            </div>
            <div class="livechat-ai-qa-cell">
              <span class="livechat-ai-qa-label">Ended</span>
              ${chatEnded ? '<span class="chip chip-success">true</span>' : '<span class="chip chip-warning">false</span>'}
            </div>
            <div class="livechat-ai-qa-cell livechat-ai-qa-metric">
              <span class="livechat-ai-qa-label">FTR</span>
              <strong>${escapeHtml(livechatAiQaMetricLabel(row.ftrLabel, row.transferredToAgent ? "Pending" : "-"))}</strong>
            </div>
            <div class="livechat-ai-qa-cell livechat-ai-qa-metric">
              <span class="livechat-ai-qa-label">CHT</span>
              <strong>${escapeHtml(livechatAiQaMetricLabel(row.chtLabel, row.transferredToAgent ? "In progress" : "-"))}</strong>
            </div>
          </div>
          <div class="livechat-ai-qa-row-meta">
            <div>
              <span class="livechat-ai-qa-label">Transfer</span>
              <div class="livechat-ai-qa-inline">
                ${row.transferredToAgent ? '<span class="chip">Yes</span>' : '<span class="chip">No</span>'}
                <span>${escapeHtml(row.transferReason || "No reason")}</span>
                <span>${escapeHtml(row.queueWaitLabel || (row.queuedAt ? "In queue" : "No queue"))}</span>
              </div>
            </div>
            <div>
              <span class="livechat-ai-qa-label">Languages</span>
              <div class="livechat-ai-qa-inline">
                <span>${escapeHtml(row.customerLanguage || "-")}</span>
                <span>${escapeHtml(row.chatbotLanguage || "-")}</span>
              </div>
            </div>
            <div>
              <span class="livechat-ai-qa-label">Tags</span>
              ${livechatAiQaTagChips(row.tagsLabel)}
            </div>
            <div>
              <span class="livechat-ai-qa-label">System tags</span>
              ${livechatAiQaTagChips(row.systemTagsLabel)}
            </div>
          </div>
          ${expanded ? `<div class="livechat-ai-qa-row-detail">${renderLivechatAiQaTimeline(row)}</div>` : ""}
        </article>
      `;
    })
    .join("");
}

function renderLivechatAiQaTagging() {
  const totalPages = Math.max(1, Math.ceil((state.livechatAiQa.total || 0) / state.livechatAiQa.pageSize));
  return `
    <section class="analytics-page livechat-ai-qa-page">
      ${renderLivechatAiQaFilters()}
      <div class="table-shell livechat-ai-qa-results-shell">
        <div class="tickets-toolbar">
          <div>
            <div class="section-title">Webhook chats</div>
            <div class="subtle">${Number(state.livechatAiQa.total || 0).toLocaleString()} chat(s)</div>
          </div>
          <div class="pagination-controls">
            <button class="btn btn-sm btn-outline-secondary" type="button" data-livechat-ai-qa-page="prev" ${state.livechatAiQa.page <= 1 ? "disabled" : ""}>Previous</button>
            <span class="subtle">Page ${state.livechatAiQa.page} / ${totalPages}</span>
            <button class="btn btn-sm btn-outline-secondary" type="button" data-livechat-ai-qa-page="next" ${state.livechatAiQa.page >= totalPages ? "disabled" : ""}>Next</button>
          </div>
        </div>
        <div class="livechat-ai-qa-table" role="table" aria-label="LiveChat AI QA webhook chats">
          <div class="livechat-ai-qa-header" role="row">
            <div>${livechatAiQaSortButton("date", "Date")}</div>
            <div>Chat</div>
            <div>${livechatAiQaSortButton("agent", "Agent")}</div>
            <div>${livechatAiQaSortButton("ended", "Ended")}</div>
            <div>${livechatAiQaSortButton("ftr", "FTR")}</div>
            <div>${livechatAiQaSortButton("cht", "CHT")}</div>
          </div>
          <div class="livechat-ai-qa-list">${renderLivechatAiQaRows()}</div>
        </div>
      </div>
    </section>
  `;
}

function aiQaReviewQueryParams() {
  const filters = state.livechatAiQaReview.filters;
  const params = new URLSearchParams({
    page: String(state.livechatAiQaReview.page),
    pageSize: String(state.livechatAiQaReview.pageSize),
  });
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params;
}

function syncLivechatAiQaReviewFiltersFromDom() {
  const filters = state.livechatAiQaReview.filters;
  filters.scope = document.getElementById("aiQaReviewScope")?.value || "mine";
  filters.status = document.getElementById("aiQaReviewStatus")?.value || "";
  filters.aiStatus = document.getElementById("aiQaReviewAiStatus")?.value || "";
  filters.chatId = document.getElementById("aiQaReviewChatId")?.value.trim() || "";
  state.livechatAiQaReview.page = 1;
}

function resetLivechatAiQaReviewFilters() {
  state.livechatAiQaReview.filters = {
    scope: "mine",
    status: "pending_review",
    aiStatus: "ready",
    chatId: "",
  };
  state.livechatAiQaReview.page = 1;
}

function aiQaReviewSuggestedTags(detail = state.livechatAiQaReview.detail) {
  const suggestions = detail?.suggestions || [];
  const tags = suggestions.map((item) => canonicalAiQaContentTag(item.tag)).filter(Boolean);
  return tags.length ? tags : (detail?.suggestedTags || []).map(canonicalAiQaContentTag).filter(Boolean);
}

function aiQaReviewFinalTags(detail = state.livechatAiQaReview.detail) {
  if (detail?.finalTags?.length) return detail.finalTags.map(canonicalAiQaContentTag).filter(Boolean);
  return aiQaReviewSuggestedTags(detail);
}

function canonicalAiQaContentTag(value) {
  const tag = `${value || ""}`.trim();
  const aliases = {
    "promo bonus": "promo_bonus",
    "loyalty bonus": "loyalty_bonus",
  };
  return aliases[tag.toLowerCase()] || tag;
}

function aiQaReviewIsClosed(detail = state.livechatAiQaReview.detail) {
  return ["approved", "corrected"].includes(detail?.status);
}

function aiQaReviewConfidence(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `${Math.round(Math.max(0, Math.min(1, number)) * 100)}%`;
}

function aiQaReviewStatusChip(status, aiStatus = "") {
  const value = status || aiStatus || "unknown";
  const tone =
    value === "approved" || value === "corrected" || aiStatus === "completed"
      ? "chip-success"
      : value === "pending_review" || aiStatus === "running" || aiStatus === "pending"
        ? "chip-warning"
        : aiStatus === "failed" || aiStatus === "skipped"
          ? "chip-danger"
          : "";
  return `<span class="chip ${tone}">${escapeHtml(value)}</span>`;
}

function aiQaReviewTagChips(tags, empty = "-") {
  const values = Array.isArray(tags) ? tags : `${tags || ""}`.split(",").map((tag) => tag.trim()).filter(Boolean);
  if (!values.length) return `<span class="subtle">${escapeHtml(empty)}</span>`;
  return `<div class="chip-list">${values.map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join("")}</div>`;
}

async function fetchLivechatAiQaReviewDetail(reviewId, { silent = false } = {}) {
  if (!reviewId) return;
  const selectionChanged = state.livechatAiQaReview.selectedId !== reviewId;
  state.livechatAiQaReview.selectedId = reviewId;
  if (selectionChanged) state.livechatAiQaReview.decisionPanel = "auto";
  state.livechatAiQaReview.detailLoading = true;
  state.livechatAiQaReview.actionError = null;
  state.livechatAiQaReview.dirty = false;
  if (!silent && state.section === "livechat-ai-qa-review") renderApp();

  try {
    state.livechatAiQaReview.detail = await api(`/api/livechat/ai-qa-reviews/${encodeURIComponent(reviewId)}`);
    const row = state.livechatAiQaReview.rows.find((item) => item.id === reviewId);
    state.livechatAgentQaReview.detail = row?.agentQaReviewId
      ? await api(`/api/livechat/ai-agent-qa-reviews/${encodeURIComponent(row.agentQaReviewId)}`)
      : null;
    state.livechatAgentQaReview.selectedId = row?.agentQaReviewId || "";
    state.livechatAgentQaReview.dirty = false;
  } catch (error) {
    state.livechatAiQaReview.actionError = error.message;
    state.livechatAiQaReview.detail = null;
  } finally {
    state.livechatAiQaReview.detailLoading = false;
    if (state.section === "livechat-ai-qa-review") renderApp();
  }
}

async function fetchLivechatAiQaReviews({ keepSelection = false } = {}) {
  state.livechatAiQaReview.loading = true;
  state.livechatAiQaReview.error = null;
  if (state.section === "livechat-ai-qa-review") renderApp();

  try {
    const response = await api(`/api/livechat/ai-qa-reviews?${aiQaReviewQueryParams().toString()}`);
    const rows = response.rows || [];
    state.livechatAiQaReview.rows = rows;
    state.livechatAiQaReview.total = Number(response.total || 0);
    state.livechatAiQaReview.page = Number(response.page || state.livechatAiQaReview.page);
    state.livechatAiQaReview.pageSize = Number(response.pageSize || state.livechatAiQaReview.pageSize);
    state.livechatAiQaReview.loaded = true;
    const previousSelectedId = state.livechatAiQaReview.selectedId;
    const stillVisible = rows.some((row) => row.id === state.livechatAiQaReview.selectedId);
    if (!keepSelection || !stillVisible) {
      state.livechatAiQaReview.selectedId = rows[0]?.id || "";
      state.livechatAiQaReview.detail = null;
    }
    if (state.livechatAiQaReview.selectedId !== previousSelectedId) {
      state.livechatAiQaReview.decisionPanel = "auto";
    }
    if (state.livechatAiQaReview.selectedId) {
      await fetchLivechatAiQaReviewDetail(state.livechatAiQaReview.selectedId, { silent: true });
    }
  } catch (error) {
    state.livechatAiQaReview.error = error.message;
    state.livechatAiQaReview.rows = [];
    state.livechatAiQaReview.total = 0;
    state.livechatAiQaReview.loaded = true;
  } finally {
    state.livechatAiQaReview.loading = false;
    if (state.section === "livechat-ai-qa-review") renderApp();
  }
}

async function processLivechatAiQaReviews({ selected = false, force = false } = {}) {
  state.livechatAiQaReview.actionLoading = true;
  state.livechatAiQaReview.actionError = null;
  renderApp();
  try {
    if (selected) {
      const reviewId = state.livechatAiQaReview.selectedId;
      if (!reviewId) throw new Error("Select a review first.");
      await api(`/api/livechat/ai-qa-reviews/${encodeURIComponent(reviewId)}`, {
        method: "POST",
        body: { action: force ? "retry" : "process" },
      });
      await fetchLivechatAiQaReviewDetail(reviewId, { silent: true });
    } else {
      await api("/api/livechat/ai-qa-reviews", {
        method: "POST",
        body: { action: force ? "retry_pending" : "process_pending", limit: 5, force },
      });
      await fetchLivechatAiQaReviews({ keepSelection: true });
    }
    setMessage(statusMessage, "AI QA review processing updated.", "success");
  } catch (error) {
    state.livechatAiQaReview.actionError = error.message;
    setMessage(statusMessage, error.message, "error");
  } finally {
    state.livechatAiQaReview.actionLoading = false;
    renderApp();
  }
}

function collectAiQaReviewDecision() {
  const detail = state.livechatAiQaReview.detail;
  const suggestedSet = new Set(aiQaReviewSuggestedTags(detail));
  const finalTags = [...document.querySelectorAll('input[name="aiQaFinalTag"]:checked')]
    .map((input) => input.value)
    .filter(Boolean);
  if (!finalTags.length) {
    throw new Error("Select at least one final tag.");
  }

  const finalSet = new Set(finalTags);
  const feedbackByTag = new Map();
  document.querySelectorAll("[data-ai-qa-feedback-tag]").forEach((textarea) => {
    feedbackByTag.set(textarea.dataset.aiQaFeedbackTag, textarea.value.trim());
  });

  const feedback = [];
  const missingComments = [];
  AI_QA_CONTENT_TAGS.forEach((tag) => {
    const aiSuggested = suggestedSet.has(tag);
    const finalSelected = finalSet.has(tag);
    const changed = aiSuggested !== finalSelected;
    const comment = feedbackByTag.get(tag) || "";
    if (changed && !comment) {
      missingComments.push(tag);
    }
    if (!changed && !comment) return;
    feedback.push({
      tag,
      type: changed ? (finalSelected ? "missed_tag" : "wrong_tag") : "comment",
      comment,
      aiSuggested,
      finalSelected,
    });
  });

  if (missingComments.length) {
    throw new Error(`Add AI feedback comment for: ${missingComments.join(", ")}.`);
  }

  return {
    finalTags,
    feedback,
    applyToLiveChat: document.getElementById("aiQaApplyToLiveChat")?.checked !== false,
    note: document.getElementById("aiQaDecisionNote")?.value.trim() || "",
  };
}

async function approveLivechatAiQaReview() {
  const detail = state.livechatAiQaReview.detail;
  if (!detail?.id) return;
  const finalTags = aiQaReviewSuggestedTags(detail);
  if (!finalTags.length) {
    setMessage(statusMessage, "AI did not suggest tags. Use Correct & Apply.", "error");
    return;
  }
  state.livechatAiQaReview.actionLoading = true;
  state.livechatAiQaReview.actionError = null;
  renderApp();
  try {
    const response = await api(`/api/livechat/ai-qa-reviews/${encodeURIComponent(detail.id)}`, {
      method: "PATCH",
      body: {
        action: "approve",
        finalTags,
        applyToLiveChat: document.getElementById("aiQaApplyToLiveChat")?.checked !== false,
      },
    });
    await fetchLivechatAiQaReviewDetail(detail.id, { silent: true });
    state.livechatAiQaReview.decisionPanel = "agent";
    const failedTags = response.applyResult?.failed?.map((item) => item.tag).filter(Boolean) || [];
    setMessage(
      statusMessage,
      failedTags.length
        ? `AI QA tags approved. Failed to apply in LiveChat: ${failedTags.join(", ")}.`
        : "AI QA tags approved and sent to LiveChat.",
      failedTags.length ? "error" : "success",
    );
  } catch (error) {
    state.livechatAiQaReview.actionError = error.message;
    setMessage(statusMessage, error.message, "error");
  } finally {
    state.livechatAiQaReview.actionLoading = false;
    renderApp();
  }
}

async function correctLivechatAiQaReview() {
  const detail = state.livechatAiQaReview.detail;
  if (!detail?.id) return;
  let decision;
  try {
    decision = collectAiQaReviewDecision();
  } catch (error) {
    state.livechatAiQaReview.actionError = error.message;
    setMessage(statusMessage, error.message, "error");
    renderApp();
    return;
  }

  state.livechatAiQaReview.actionLoading = true;
  state.livechatAiQaReview.actionError = null;
  renderApp();
  try {
    const response = await api(`/api/livechat/ai-qa-reviews/${encodeURIComponent(detail.id)}`, {
      method: "PATCH",
      body: {
        action: "correct",
        ...decision,
      },
    });
    await fetchLivechatAiQaReviewDetail(detail.id, { silent: true });
    state.livechatAiQaReview.decisionPanel = "agent";
    const failedTags = response.applyResult?.failed?.map((item) => item.tag).filter(Boolean) || [];
    setMessage(
      statusMessage,
      failedTags.length
        ? `Corrected QA tags saved. Failed to apply in LiveChat: ${failedTags.join(", ")}.`
        : "Corrected QA tags saved and sent to LiveChat.",
      failedTags.length ? "error" : "success",
    );
  } catch (error) {
    state.livechatAiQaReview.actionError = error.message;
    setMessage(statusMessage, error.message, "error");
  } finally {
    state.livechatAiQaReview.actionLoading = false;
    renderApp();
  }
}

function renderAiQaReviewFilters() {
  const filters = state.livechatAiQaReview.filters;
  return `
    <section class="qa-workspace-hero qa-workspace-hero-combined">
      <div><span class="ui-eyebrow">LiveChat quality</span><h1>Combined AI QA Review</h1><p>Review AI auto-tagging and Agent QA in one focused workspace.</p></div>
      <div class="qa-workspace-hero-metric"><strong>${Number(state.livechatAiQaReview.total || 0).toLocaleString()}</strong><span>chats in queue</span></div>
    </section>
    <div class="card-shell ai-qa-review-filter-shell">
      <div class="tickets-toolbar">
        <div>
          <div class="section-title">Queue filters</div>
          <div class="subtle">Auto-tagging and Agent QA are reviewed separately</div>
        </div>
        <div class="analytics-actions">
          ${isAdminRole() ? `<button id="aiQaReviewsProcessBtn" class="btn btn-sm btn-outline-secondary" type="button" ${state.livechatAiQaReview.actionLoading ? "disabled" : ""}>Process pending</button>` : ""}
          ${isAdminRole() ? `<button id="agentQaProcessMissing30Btn" class="btn btn-sm btn-outline-secondary" type="button" ${state.livechatAgentQaReview.actionLoading ? "disabled" : ""}>Run 30 missing Agent QA</button>` : ""}
          <button id="aiQaReviewsReloadBtn" class="btn btn-sm btn-outline-secondary" type="button">Reload</button>
        </div>
      </div>
      <div class="ai-qa-review-filter-grid">
        ${isAdminRole() ? `<label>
          <span>View</span>
          <select id="aiQaReviewScope" class="form-select">
            <option value="mine" ${filters.scope === "mine" ? "selected" : ""}>My queue</option>
            <option value="all" ${filters.scope === "all" ? "selected" : ""}>All reviews</option>
          </select>
        </label>` : ""}
        <label>
          <span>Status</span>
          <select id="aiQaReviewStatus" class="form-select">
            ${[
              ["pending_review", "Pending review"],
              ["approved", "Approved"],
              ["corrected", "Corrected"],
              ["", "Any"],
            ]
              .map(([value, label]) => `<option value="${escapeHtml(value)}" ${filters.status === value ? "selected" : ""}>${escapeHtml(label)}</option>`)
              .join("")}
          </select>
        </label>
        <label>
          <span>AI status</span>
          <select id="aiQaReviewAiStatus" class="form-select">
            ${[
              ["ready", "Ready: both AI checks completed"],
              ["missing_agent_qa", "Missing Agent QA"],
              ["", "Any AI status"],
              ["pending", "Pending in either section"],
              ["running", "Running in either section"],
              ["completed", "Completed in either section"],
              ["failed", "Failed in either section"],
              ["skipped", "Skipped in either section"],
            ]
              .map(([value, label]) => `<option value="${escapeHtml(value)}" ${filters.aiStatus === value ? "selected" : ""}>${escapeHtml(label)}</option>`)
              .join("")}
          </select>
        </label>
        <label>
          <span>Chat / Thread</span>
          <input id="aiQaReviewChatId" class="form-control" type="search" value="${escapeHtml(filters.chatId)}" placeholder="chat or thread id" />
        </label>
        <div class="ai-qa-review-filter-actions">
          <button id="aiQaReviewFilterBtn" class="btn btn-primary" type="button">Filter</button>
          <button id="aiQaReviewResetBtn" class="btn btn-outline-secondary" type="button">Reset</button>
        </div>
      </div>
    </div>
  `;
}

function aiQaManagementDate(daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return localDateValue(date);
}

async function fetchLivechatAiQaManagement() {
  const management = state.livechatAiQaManagement;
  management.loading = true;
  management.error = null;
  management.username ||= state.user || "";
  management.from ||= aiQaManagementDate(30);
  management.to ||= aiQaManagementDate(0);
  try {
    const params = new URLSearchParams({
      username: management.username,
      from: management.from,
      to: management.to,
      allUsers: isAdminRole() ? "1" : "0",
    });
    management.data = await api(`/api/livechat/ai-qa-management?${params.toString()}`);
  } catch (error) {
    management.error = error.message;
  } finally {
    management.loading = false;
    if (["livechat-ai-qa-review", "livechat-agent-qa-review"].includes(state.section)) renderApp();
  }
}

function renderLivechatAiQaManagement() {
  const management = state.livechatAiQaManagement;
  const data = management.data;
  const settings = data?.settings || [];
  const users = isAdminRole() ? (data?.users || [state.user]) : [state.user];
  const settingRow = (type, label) => {
    const setting = settings.find((item) => item.reviewType === type) || { enabled: false, targetQueueSize: 20 };
    const queue = data?.queue?.[type] || { assigned: 0, unassigned: 0 };
    return `
      <div class="qa-queue-setting-row">
        <label class="analytics-check-option">
          <input class="form-check-input" type="checkbox" data-qa-queue-enabled="${type}" ${setting.enabled ? "checked" : ""} />
          <span><strong>${label}</strong><small>${queue.assigned} assigned · ${queue.unassigned} unassigned</small></span>
        </label>
        <label><span>Queue size</span><input class="form-control" type="number" min="1" max="500" data-qa-queue-size="${type}" value="${setting.targetQueueSize}" ${isAdminRole() ? "" : "disabled"} /></label>
        <button class="btn btn-sm btn-outline-secondary" type="button" data-qa-queue-save="${type}">Save</button>
      </div>`;
  };
  return `
    <div class="card-shell qa-management-shell">
      <div class="tickets-toolbar">
        <div><div class="section-title">Queue settings & review statistics</div><div class="subtle">Personal assignments and reviewer activity</div></div>
        ${isAdminRole() ? `<select id="qaManagementUsername" class="form-select">${users.map((user) => `<option value="${escapeHtml(user)}" ${management.username === user ? "selected" : ""}>${escapeHtml(user)}</option>`).join("")}</select>` : ""}
      </div>
      ${management.error ? `<div class="empty-state analytics-error">${escapeHtml(management.error)}</div>` : ""}
      ${management.loading && !data ? '<div class="empty-state">Loading queue settings...</div>' : `
        <div class="qa-queue-settings-grid">
          ${settingRow("auto_tag", "Combined AI QA queue")}
        </div>
        <div class="qa-stat-filter-row">
          <label><span>From</span><input id="qaManagementFrom" class="form-control" type="date" value="${escapeHtml(management.from)}" /></label>
          <label><span>To</span><input id="qaManagementTo" class="form-control" type="date" value="${escapeHtml(management.to)}" /></label>
          <button id="qaManagementFilterBtn" class="btn btn-outline-secondary" type="button">Filter statistics</button>
          <button id="qaManagementReleaseBtn" class="btn btn-outline-danger" type="button">Release pending queue</button>
        </div>
        <div class="table-responsive mt-3">
          <table class="table align-middle"><thead><tr><th>User</th><th>Approved</th><th>Corrected</th><th>Edited</th><th>Processed</th></tr></thead>
          <tbody>${(data?.statistics || []).length ? data.statistics.map((row) => `<tr><td>${escapeHtml(row.reviewer)}</td><td>${row.approved}</td><td>${row.corrected}</td><td>${row.edited}</td><td><strong>${row.processed}</strong></td></tr>`).join("") : '<tr><td colspan="5" class="subtle">No review activity for this period.</td></tr>'}</tbody></table>
        </div>
        <details class="mt-2">
          <summary>Daily breakdown</summary>
          <div class="table-responsive mt-2"><table class="table align-middle"><thead><tr><th>Date</th><th>User</th><th>Approved</th><th>Corrected</th><th>Edited</th><th>Processed</th></tr></thead>
          <tbody>${(data?.dailyStatistics || []).length ? data.dailyStatistics.map((row) => `<tr><td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.reviewer)}</td><td>${row.approved}</td><td>${row.corrected}</td><td>${row.edited}</td><td><strong>${row.processed}</strong></td></tr>`).join("") : '<tr><td colspan="6" class="subtle">No daily activity.</td></tr>'}</tbody></table></div>
      </details>`}
    </div>`;
}

function renderAiQaReviewQueue() {
  const rows = state.livechatAiQaReview.rows || [];
  const totalPages = Math.max(1, Math.ceil((state.livechatAiQaReview.total || 0) / state.livechatAiQaReview.pageSize));
  return `
    <aside class="ai-qa-review-queue">
      <div class="ai-qa-review-panel-head">
        <div>
          <div class="section-title">Review queue</div>
          <div class="subtle">Page ${state.livechatAiQaReview.page} / ${totalPages}</div>
        </div>
        <div class="pagination-controls">
          <button class="btn btn-sm btn-outline-secondary" type="button" data-ai-qa-review-page="prev" ${state.livechatAiQaReview.page <= 1 ? "disabled" : ""}>Prev</button>
          <button class="btn btn-sm btn-outline-secondary" type="button" data-ai-qa-review-page="next" ${state.livechatAiQaReview.page >= totalPages ? "disabled" : ""}>Next</button>
        </div>
      </div>
      ${
        state.livechatAiQaReview.loading
          ? renderLoadingState("Loading review queue")
          : state.livechatAiQaReview.error
            ? renderErrorState(state.livechatAiQaReview.error)
            : rows.length
              ? `<div class="ai-qa-review-list">
                  ${rows
                    .map((row) => {
                      const selected = row.id === state.livechatAiQaReview.selectedId;
                      return `
                        <div class="ai-qa-review-list-item ${selected ? "active" : ""}" role="button" tabindex="0" data-ai-qa-review-open="${escapeHtml(row.id)}">
                          <span class="ai-qa-review-list-top">
                            <strong>${renderLivechatChatLink(row.chatId, row.threadId)}</strong>
                            ${aiQaReviewStatusChip(row.status, row.aiStatus)}
                          </span>
                          <span class="subtle">Agent QA: ${escapeHtml(row.agentQaStatus)} · ${escapeHtml(row.agentQaAiStatus)}</span>
                          <span class="subtle">${escapeHtml(livechatAiQaDateTime(row.deactivatedAt || row.updatedAt))}</span>
                          <span class="ai-qa-review-list-tags">${aiQaReviewTagChips(row.suggestedTags, "No suggestions")}</span>
                          ${row.aiError ? `<span class="ai-qa-review-error">${escapeHtml(row.aiError)}</span>` : ""}
                        </div>
                      `;
                    })
                    .join("")}
                </div>`
              : renderEmptyState("No reviews match the current filters", "bi-funnel")
      }
    </aside>
  `;
}

function renderAiQaReviewTranscript(detail) {
  if (state.livechatAiQaReview.detailLoading) {
    return `<main class="ai-qa-review-thread">${renderLoadingState("Loading selected review")}</main>`;
  }
  if (!detail) {
    return `<main class="ai-qa-review-thread">${renderEmptyState("Select a review to open the conversation", "bi-chat-square-text")}</main>`;
  }
  const transcript = detail.transcript || [];
  return `
    <main class="ai-qa-review-thread">
      <div class="ai-qa-review-thread-head">
        <div>
          <div class="section-title">Chat transcript</div>
          <div class="subtle">${escapeHtml(detail.chatId || "-")} / ${renderLivechatChatLink(detail.chatId, detail.threadId)}</div>
        </div>
        <div class="chip-list">
          ${aiQaReviewStatusChip(detail.status, detail.aiStatus)}
          ${detail.chat?.deactivatedAt ? '<span class="chip chip-success">ended</span>' : '<span class="chip chip-warning">open</span>'}
        </div>
      </div>
      <div class="ai-qa-review-meta-strip">
        <span>Agent: <strong>${escapeHtml(detail.chat?.agentLabel || "-")}</strong></span>
        <span>Language: <strong>${escapeHtml(detail.chat?.customerLanguage || "-")}</strong></span>
        <span>FTR: <strong>${escapeHtml(livechatAiQaMetricLabel(detail.chat?.ftrMs ? `${Math.round(detail.chat.ftrMs / 1000)}s` : ""))}</strong></span>
      </div>
      <div class="ai-qa-review-thread-body">
        ${
          transcript.length
            ? transcript
                .map((event) => {
                  const actorType = event.actorType || "system";
                  const side = actorType === "customer" ? "customer" : "agent";
                  return `
                    <div class="ai-qa-review-message ${side} ${actorType === "system" ? "system" : ""}">
                      <div class="ai-qa-review-message-meta">
                        <strong>${escapeHtml(actorType)}</strong>
                        ${event.actorId ? `<span>${escapeHtml(event.actorId)}</span>` : ""}
                        <span>${escapeHtml(livechatAiQaDateTime(event.at))}</span>
                      </div>
                      <div class="ai-qa-review-bubble">${escapeHtml(event.text || event.eventType || "")}</div>
                    </div>
                  `;
                })
                .join("")
            : '<div class="empty-state">No transcript messages stored for this review.</div>'
        }
      </div>
    </main>
  `;
}

function renderAiQaSuggestionCard(suggestion) {
  return `
    <article class="ai-qa-suggestion-card">
      <div class="ai-qa-suggestion-head">
        <span class="chip primary">${escapeHtml(suggestion.tag)}</span>
        <strong>${escapeHtml(aiQaReviewConfidence(suggestion.confidence))}</strong>
      </div>
      ${suggestion.why ? `<div class="ai-qa-suggestion-why">${escapeHtml(suggestion.why)}</div>` : ""}
      ${
        suggestion.evidence?.length
          ? `<div class="ai-qa-evidence-list">
              ${suggestion.evidence.map((item) => `<blockquote>${escapeHtml(item)}</blockquote>`).join("")}
            </div>`
          : ""
      }
      ${
        suggestion.existingTagsConsidered?.length
          ? `<div class="subtle">Existing: ${escapeHtml(suggestion.existingTagsConsidered.join(", "))}</div>`
          : ""
      }
    </article>
  `;
}

function renderExistingHumanTagsBlock(detail) {
  const tags = detail?.existingTags || [];
  return `
    <div class="ai-qa-existing-tags">
      <div class="section-title">Existing LiveChat tags</div>
      <div class="subtle">Added outside system automation</div>
      <div class="chip-list">${aiQaReviewTagChips(tags, "No existing human tags")}</div>
    </div>
  `;
}

function renderAiQaFinalTagControls(detail) {
  const finalTags = new Set(aiQaReviewFinalTags(detail));
  const suggestedTags = new Set(aiQaReviewSuggestedTags(detail));
  const closed = aiQaReviewIsClosed(detail);
  return `
    <div class="ai-qa-final-tags">
      ${AI_QA_CONTENT_TAGS.map((tag) => {
        const checked = finalTags.has(tag);
        const suggested = suggestedTags.has(tag);
        return `
          <label class="ai-qa-final-tag ${checked ? "selected" : ""} ${suggested ? "suggested" : ""}">
            <input type="checkbox" name="aiQaFinalTag" value="${escapeHtml(tag)}" ${checked ? "checked" : ""} />
            <span>${escapeHtml(tag)}</span>
          </label>
        `;
      }).join("")}
    </div>
  `;
}

function renderAiQaFeedbackControls(detail) {
  const finalTags = new Set(aiQaReviewFinalTags(detail));
  const suggestedTags = new Set(aiQaReviewSuggestedTags(detail));
  const existingTags = new Set((detail?.existingTags || []).map(canonicalAiQaContentTag).filter(Boolean));
  const closed = aiQaReviewIsClosed(detail);
  return `
    <div class="ai-qa-feedback-grid">
      ${AI_QA_CONTENT_TAGS.map((tag) => {
        const suggested = suggestedTags.has(tag);
        const selected = finalTags.has(tag);
        const existing = existingTags.has(tag);
        const visible = suggested || selected || existing;
        const tone = suggested && selected ? "kept" : suggested ? "remove" : selected ? "add" : "";
        return `
          <label class="ai-qa-feedback-row ${tone} ${visible ? "" : "is-hidden"}" data-ai-qa-feedback-row="${escapeHtml(tag)}" data-suggested="${suggested ? "1" : "0"}" data-existing="${existing ? "1" : "0"}">
            <span>
              <strong>${escapeHtml(tag)}</strong>
              <small data-ai-qa-feedback-state="${escapeHtml(tag)}">${suggested ? "AI suggested" : ""}${existing ? `${suggested ? " · " : ""}Existing` : ""}${suggested && selected ? " · kept" : ""}${!suggested && selected ? "Selected" : ""}</small>
            </span>
            <textarea class="form-control" rows="2" data-ai-qa-feedback-tag="${escapeHtml(tag)}" placeholder="Use this tag when… Do not use it when… Evidence from this chat…"></textarea>
          </label>
        `;
      }).join("")}
    </div>
  `;
}

function refreshAiQaFeedbackVisibility() {
  const selected = new Set(
    [...document.querySelectorAll('input[name="aiQaFinalTag"]:checked')]
      .map((input) => input.value)
      .filter(Boolean),
  );
  document.querySelectorAll("[data-ai-qa-feedback-row]").forEach((row) => {
    const tag = row.dataset.aiQaFeedbackRow;
    const suggested = row.dataset.suggested === "1";
    const existing = row.dataset.existing === "1";
    const checked = selected.has(tag);
    row.classList.toggle("is-hidden", !(suggested || existing || checked));
    row.classList.toggle("add", checked && !suggested);
    row.classList.toggle("remove", suggested && !checked);
    row.classList.toggle("kept", suggested && checked);
    const stateLabel = row.querySelector(`[data-ai-qa-feedback-state="${CSS.escape(tag)}"]`);
    if (stateLabel) {
      stateLabel.textContent = [
        suggested ? "AI suggested" : "",
        existing ? "Existing" : "",
        suggested && checked ? "kept" : "",
        !suggested && checked ? "Selected" : "",
      ]
        .filter(Boolean)
        .join(" · ");
    }
  });
}

function markAiQaReviewDirty(type) {
  const isAgent = type === "agent";
  const reviewState = isAgent ? state.livechatAgentQaReview : state.livechatAiQaReview;
  reviewState.dirty = true;
  const approve = document.getElementById(isAgent ? "agentQaApproveBtn" : "aiQaApproveBtn");
  if (approve) approve.disabled = true;
  document.getElementById(isAgent ? "agentQaDirtyHint" : "aiQaDirtyHint")?.classList.remove("d-none");
}

function renderAiQaReviewDecisionPanel(detail) {
  if (state.livechatAiQaReview.detailLoading) {
    return `<aside class="ai-qa-review-decision"><div class="empty-state">Loading AI suggestions...</div></aside>`;
  }
  if (!detail) {
    return `<aside class="ai-qa-review-decision"><div class="empty-state">No review selected.</div></aside>`;
  }
  const closed = aiQaReviewIsClosed(detail);
  const suggestions = detail.suggestions || [];
  return `
    <aside class="ai-qa-review-decision">
      <div class="ai-qa-review-panel-head">
        <div>
          <div class="section-title">AI suggestions</div>
          <div class="subtle">${escapeHtml(detail.aiModel || "Workers AI")} ${detail.aiFallbackModel ? `→ ${escapeHtml(detail.aiFallbackModel)}` : ""}</div>
        </div>
        ${detail.aiOverallConfidence !== null && detail.aiOverallConfidence !== undefined ? `<span class="chip">${escapeHtml(aiQaReviewConfidence(detail.aiOverallConfidence))}</span>` : ""}
      </div>
      ${detail.aiSummary ? `<div class="ai-qa-summary">${escapeHtml(detail.aiSummary)}</div>` : ""}
      ${detail.aiError ? `<div class="empty-state analytics-error">${escapeHtml(detail.aiError)}</div>` : ""}
      ${renderExistingHumanTagsBlock(detail)}
      <div class="ai-qa-suggestions-list">
        ${suggestions.length ? suggestions.map(renderAiQaSuggestionCard).join("") : '<div class="empty-state">No AI suggestions yet.</div>'}
      </div>
      <div class="ai-qa-review-decision-block">
        <div class="section-title">Final tags</div>
        ${renderAiQaFinalTagControls(detail)}
      </div>
      <div class="ai-qa-review-decision-block">
        <div class="section-title">Feedback for AI</div>
        ${renderAiQaFeedbackControls(detail)}
      </div>
      <label class="ai-qa-apply-toggle">
        <input id="aiQaApplyToLiveChat" class="form-check-input" type="checkbox" checked />
        <span>Apply tags to LiveChat</span>
      </label>
      <textarea id="aiQaDecisionNote" class="form-control" rows="2" placeholder="Review note">${escapeHtml(detail.decisionNote || "")}</textarea>
      <div id="aiQaDirtyHint" class="subtle ${state.livechatAiQaReview.dirty ? "" : "d-none"}">The review was changed and must be saved as corrected.</div>
      ${state.livechatAiQaReview.actionError ? `<div class="empty-state analytics-error">${escapeHtml(state.livechatAiQaReview.actionError)}</div>` : ""}
      <div class="ai-qa-review-actions">
        <button id="aiQaApproveBtn" class="btn btn-primary" type="button" ${closed || state.livechatAiQaReview.dirty || state.livechatAiQaReview.actionLoading || detail.aiStatus !== "completed" ? "disabled" : ""}>Approve</button>
        <button id="aiQaCorrectBtn" class="btn btn-outline-secondary" type="button" ${state.livechatAiQaReview.actionLoading ? "disabled" : ""}>${closed ? "Save changes" : "Correct & Apply"}</button>
        <button id="aiQaRetryBtn" class="btn btn-outline-secondary" type="button" ${state.livechatAiQaReview.actionLoading ? "disabled" : ""}>Retry AI</button>
      </div>
      ${
        closed
          ? `<div class="ai-qa-reviewed-box">
              <strong>${escapeHtml(detail.status)}</strong>
              <span>${escapeHtml(detail.reviewer || "")}</span>
              <span>${escapeHtml(livechatAiQaDateTime(detail.reviewedAt))}</span>
              ${aiQaReviewTagChips(detail.finalTags, "No final tags")}
            </div>`
          : ""
      }
    </aside>
  `;
}

function renderLivechatAiQaReview() {
  const detail = state.livechatAiQaReview.detail;
  const agentDetail = state.livechatAgentQaReview.detail;
  const showAgentQa = state.livechatAiQaReview.decisionPanel === "agent";
  return `
    <section class="ai-qa-review-page">
      ${renderLivechatAiQaManagement()}
      ${renderAiQaReviewFilters()}
      <div class="ai-qa-review-workspace">
        ${renderAiQaReviewQueue()}
        ${renderAiQaReviewTranscript(detail)}
        <div class="combined-ai-qa-decisions">
          <div class="combined-ai-qa-section">
            <div class="combined-ai-qa-title">
              <strong>${showAgentQa ? "2. Agent QA" : "1. AI auto-tagging"}</strong>
              <div class="combined-ai-qa-title-actions">
                <button id="combinedAiQaPanelToggle" class="btn btn-sm btn-outline-secondary" type="button">
                  <i class="bi bi-arrow-left-right"></i>
                  ${showAgentQa ? "AI Auto-Tagging" : "QA"}
                </button>
                <span>${escapeHtml(showAgentQa ? agentDetail?.status || "not available" : detail?.status || "not loaded")}</span>
              </div>
            </div>
            ${showAgentQa
              ? agentDetail
                ? renderAgentQaReviewDecisionPanel(agentDetail)
                : `<aside class="ai-qa-review-decision">
                  <div class="empty-state">Agent QA review has not been created for this historical chat.</div>
                  ${state.livechatAgentQaReview.actionError ? `<div class="empty-state analytics-error">${escapeHtml(state.livechatAgentQaReview.actionError)}</div>` : ""}
                  <button id="agentQaCreateAndRunBtn" class="btn btn-primary" type="button" ${state.livechatAgentQaReview.actionLoading ? "disabled" : ""}>
                    ${state.livechatAgentQaReview.actionLoading ? "Running Agent QA..." : "Run Agent QA"}
                  </button>
                </aside>`
              : renderAiQaReviewDecisionPanel(detail)}
          </div>
        </div>
      </div>
    </section>
  `;
}

function agentQaReviewQueryParams() {
  const filters = state.livechatAgentQaReview.filters;
  return new URLSearchParams({
    page: String(state.livechatAgentQaReview.page),
    pageSize: String(state.livechatAgentQaReview.pageSize),
    status: filters.status,
    aiStatus: filters.aiStatus,
    agent: filters.agent,
    tag: filters.tag,
    chatId: filters.chatId,
    scope: filters.scope || "mine",
  });
}

function syncLivechatAgentQaReviewFiltersFromDom() {
  const filters = state.livechatAgentQaReview.filters;
  filters.scope = document.getElementById("agentQaReviewScope")?.value || "mine";
  filters.status = document.getElementById("agentQaReviewStatus")?.value || "";
  filters.aiStatus = document.getElementById("agentQaReviewAiStatus")?.value || "";
  filters.agent = document.getElementById("agentQaReviewAgent")?.value.trim() || "";
  filters.tag = document.getElementById("agentQaReviewTag")?.value.trim() || "";
  filters.chatId = document.getElementById("agentQaReviewChatId")?.value.trim() || "";
  state.livechatAgentQaReview.page = 1;
}

function resetLivechatAgentQaReviewFilters() {
  state.livechatAgentQaReview.filters = {
    scope: "mine",
    status: "pending_review",
    aiStatus: "",
    agent: "",
    tag: "",
    chatId: "",
  };
  state.livechatAgentQaReview.page = 1;
}

function agentQaReviewChecks(detail = state.livechatAgentQaReview.detail) {
  return (Array.isArray(detail?.checks) ? detail.checks : []).filter((check) => AGENT_QA_TAGS.includes(check.selectedTag));
}

function normalizeAgentQaTags(tags = []) {
  return [...new Set((tags || []).filter((tag) => AGENT_QA_TAGS.includes(tag)))];
}

function agentQaReviewSuggestedTags(detail = state.livechatAgentQaReview.detail) {
  const tags = detail?.checkTags?.length ? detail.checkTags : agentQaReviewChecks(detail).map((check) => check.selectedTag);
  return normalizeAgentQaTags(tags);
}

function agentQaReviewFinalTags(detail = state.livechatAgentQaReview.detail) {
  return detail?.finalTags?.length ? normalizeAgentQaTags(detail.finalTags) : agentQaReviewSuggestedTags(detail);
}

function agentQaReviewIsClosed(detail = state.livechatAgentQaReview.detail) {
  return ["approved", "corrected"].includes(detail?.status);
}

function agentQaRuleForTag(tag) {
  return AGENT_QA_RULES.find((rule) => rule.tags.includes(tag)) || null;
}

function agentQaCheckByRule(detail) {
  return new Map(agentQaReviewChecks(detail).map((check) => [check.ruleKey, check]));
}

async function fetchLivechatAgentQaReviewDetail(reviewId, { silent = false } = {}) {
  if (!reviewId) return;
  state.livechatAgentQaReview.selectedId = reviewId;
  state.livechatAgentQaReview.detailLoading = true;
  state.livechatAgentQaReview.actionError = null;
  state.livechatAgentQaReview.dirty = false;
  if (!silent && state.section === "livechat-agent-qa-review") renderApp();
  try {
    state.livechatAgentQaReview.detail = await api(`/api/livechat/ai-agent-qa-reviews/${encodeURIComponent(reviewId)}`);
  } catch (error) {
    state.livechatAgentQaReview.actionError = error.message;
    state.livechatAgentQaReview.detail = null;
  } finally {
    state.livechatAgentQaReview.detailLoading = false;
    if (state.section === "livechat-agent-qa-review") renderApp();
  }
}

async function fetchLivechatAgentQaReviews({ keepSelection = false } = {}) {
  state.livechatAgentQaReview.loading = true;
  state.livechatAgentQaReview.error = null;
  if (state.section === "livechat-agent-qa-review") renderApp();
  try {
    const response = await api(`/api/livechat/ai-agent-qa-reviews?${agentQaReviewQueryParams().toString()}`);
    const rows = response.rows || [];
    state.livechatAgentQaReview.rows = rows;
    state.livechatAgentQaReview.total = Number(response.total || 0);
    state.livechatAgentQaReview.page = Number(response.page || state.livechatAgentQaReview.page);
    state.livechatAgentQaReview.pageSize = Number(response.pageSize || state.livechatAgentQaReview.pageSize);
    state.livechatAgentQaReview.loaded = true;
    const stillVisible = rows.some((row) => row.id === state.livechatAgentQaReview.selectedId);
    if (!keepSelection || !stillVisible) {
      state.livechatAgentQaReview.selectedId = rows[0]?.id || "";
      state.livechatAgentQaReview.detail = null;
    }
    if (state.livechatAgentQaReview.selectedId) {
      await fetchLivechatAgentQaReviewDetail(state.livechatAgentQaReview.selectedId, { silent: true });
    }
  } catch (error) {
    state.livechatAgentQaReview.error = error.message;
    state.livechatAgentQaReview.rows = [];
    state.livechatAgentQaReview.total = 0;
    state.livechatAgentQaReview.loaded = true;
  } finally {
    state.livechatAgentQaReview.loading = false;
    if (state.section === "livechat-agent-qa-review") renderApp();
  }
}

async function processLivechatAgentQaReviews({ selected = false, force = false } = {}) {
  state.livechatAgentQaReview.actionLoading = true;
  state.livechatAgentQaReview.actionError = null;
  renderApp();
  try {
    if (selected) {
      const reviewId = state.livechatAgentQaReview.selectedId;
      if (!reviewId) throw new Error("Select a review first.");
      await api(`/api/livechat/ai-agent-qa-reviews/${encodeURIComponent(reviewId)}`, {
        method: "POST",
        body: { action: force ? "retry" : "process" },
      });
      await fetchLivechatAgentQaReviewDetail(reviewId, { silent: true });
    } else {
      await api("/api/livechat/ai-agent-qa-reviews", {
        method: "POST",
        body: { action: force ? "retry_pending" : "process_pending", limit: 5, force },
      });
      await fetchLivechatAgentQaReviews({ keepSelection: true });
    }
    setMessage(statusMessage, "Agent QA processing updated.", "success");
  } catch (error) {
    state.livechatAgentQaReview.actionError = error.message;
    setMessage(statusMessage, error.message, "error");
  } finally {
    state.livechatAgentQaReview.actionLoading = false;
    renderApp();
  }
}

async function createAndProcessMissingAgentQaReview() {
  const detail = state.livechatAiQaReview.detail;
  if (!detail?.chatId || !detail?.threadId) return;
  state.livechatAgentQaReview.actionLoading = true;
  state.livechatAgentQaReview.actionError = null;
  renderApp();
  try {
    const response = await api("/api/livechat/ai-agent-qa-reviews", {
      method: "POST",
      body: {
        action: "create_and_process",
        chatId: detail.chatId,
        threadId: detail.threadId,
      },
    });
    await fetchLivechatAiQaReviews({ keepSelection: true });
    setMessage(
      statusMessage,
      response.result?.reason === "deterministic_only"
        ? "Agent QA created from deterministic checks."
        : "Agent QA analysis completed.",
      "success",
    );
  } catch (error) {
    state.livechatAgentQaReview.actionError = error.message;
    setMessage(statusMessage, error.message, "error");
  } finally {
    state.livechatAgentQaReview.actionLoading = false;
    renderApp();
  }
}

async function processThirtyMissingAgentQaReviews() {
  state.livechatAgentQaReview.actionLoading = true;
  state.livechatAgentQaReview.actionError = null;
  renderApp();
  try {
    const response = await api("/api/livechat/ai-agent-qa-reviews", {
      method: "POST",
      body: { action: "process_missing_from_auto_tag", limit: 30 },
    });
    await fetchLivechatAiQaReviews({ keepSelection: true });
    setMessage(
      statusMessage,
      `Agent QA batch finished: ${response.processed || 0} processed, ${response.queued || 0} queued.`,
      response.processed ? "success" : "error",
    );
  } catch (error) {
    state.livechatAgentQaReview.actionError = error.message;
    setMessage(statusMessage, error.message, "error");
  } finally {
    state.livechatAgentQaReview.actionLoading = false;
    renderApp();
  }
}

function selectedAgentQaFinalTagsFromDom() {
  return [...document.querySelectorAll('select[name="agentQaFinalTag"]')]
    .map((select) => select.value)
    .filter(Boolean);
}

function collectAgentQaReviewDecision() {
  const detail = state.livechatAgentQaReview.detail;
  const checkByRule = agentQaCheckByRule(detail);
  const finalTags = selectedAgentQaFinalTagsFromDom();
  if (!finalTags.length) {
    throw new Error("Select at least one final QA tag.");
  }

  const feedbackByRule = new Map();
  document.querySelectorAll("[data-agent-qa-feedback-rule]").forEach((textarea) => {
    feedbackByRule.set(textarea.dataset.agentQaFeedbackRule, textarea.value.trim());
  });

  const feedback = [];
  const missingComments = [];
  AGENT_QA_RULES.forEach((rule) => {
    const select = document.querySelector(`select[name="agentQaFinalTag"][data-rule="${CSS.escape(rule.rule)}"]`);
    const finalTag = select?.value || "";
    const aiTag = checkByRule.get(rule.rule)?.selectedTag || "";
    const comment = feedbackByRule.get(rule.rule) || "";
    const changed = aiTag !== finalTag;
    if (changed && !comment) {
      missingComments.push(rule.rule);
    }
    if (!changed && !comment) return;
    feedback.push({
      ruleKey: rule.rule,
      tag: finalTag || aiTag,
      type: changed ? "corrected_tag" : "comment",
      comment,
      aiTag,
      finalTag,
    });
  });

  if (missingComments.length) {
    throw new Error(`Add AI feedback comment for: ${missingComments.join(", ")}.`);
  }

  return {
    finalTags,
    feedback,
    applyToLiveChat: document.getElementById("agentQaApplyToLiveChat")?.checked !== false,
    note: document.getElementById("agentQaDecisionNote")?.value.trim() || "",
  };
}

async function approveLivechatAgentQaReview() {
  const detail = state.livechatAgentQaReview.detail;
  if (!detail?.id) return;
  const finalTags = agentQaReviewSuggestedTags(detail);
  if (!finalTags.length) {
    setMessage(statusMessage, "AI did not produce QA checks. Use Correct & Apply.", "error");
    return;
  }
  state.livechatAgentQaReview.actionLoading = true;
  state.livechatAgentQaReview.actionError = null;
  renderApp();
  try {
    const response = await api(`/api/livechat/ai-agent-qa-reviews/${encodeURIComponent(detail.id)}`, {
      method: "PATCH",
      body: {
        action: "approve",
        finalTags,
        applyToLiveChat: document.getElementById("agentQaApplyToLiveChat")?.checked !== false,
      },
    });
    if (state.section === "livechat-ai-qa-review") {
      await fetchLivechatAiQaReviews({ keepSelection: true });
    } else {
      await fetchLivechatAgentQaReviews({ keepSelection: true });
    }
    await fetchLivechatAgentQaLeaderboard();
    const failedTags = response.applyResult?.failed?.map((item) => item.tag).filter(Boolean) || [];
    setMessage(
      statusMessage,
      failedTags.length
        ? `Agent QA approved. Failed to apply in LiveChat: ${failedTags.join(", ")}.`
        : "Agent QA approved and sent to LiveChat.",
      failedTags.length ? "error" : "success",
    );
  } catch (error) {
    state.livechatAgentQaReview.actionError = error.message;
    setMessage(statusMessage, error.message, "error");
  } finally {
    state.livechatAgentQaReview.actionLoading = false;
    renderApp();
  }
}

async function correctLivechatAgentQaReview() {
  const detail = state.livechatAgentQaReview.detail;
  if (!detail?.id) return;
  let decision;
  try {
    decision = collectAgentQaReviewDecision();
  } catch (error) {
    state.livechatAgentQaReview.actionError = error.message;
    setMessage(statusMessage, error.message, "error");
    renderApp();
    return;
  }

  state.livechatAgentQaReview.actionLoading = true;
  state.livechatAgentQaReview.actionError = null;
  renderApp();
  try {
    const response = await api(`/api/livechat/ai-agent-qa-reviews/${encodeURIComponent(detail.id)}`, {
      method: "PATCH",
      body: {
        action: "correct",
        ...decision,
      },
    });
    if (state.section === "livechat-ai-qa-review") {
      await fetchLivechatAiQaReviews({ keepSelection: true });
    } else {
      await fetchLivechatAgentQaReviews({ keepSelection: true });
    }
    await fetchLivechatAgentQaLeaderboard();
    const failedTags = response.applyResult?.failed?.map((item) => item.tag).filter(Boolean) || [];
    setMessage(
      statusMessage,
      failedTags.length
        ? `Corrected agent QA saved. Failed to apply in LiveChat: ${failedTags.join(", ")}.`
        : "Corrected agent QA saved and sent to LiveChat.",
      failedTags.length ? "error" : "success",
    );
  } catch (error) {
    state.livechatAgentQaReview.actionError = error.message;
    setMessage(statusMessage, error.message, "error");
  } finally {
    state.livechatAgentQaReview.actionLoading = false;
    renderApp();
  }
}

function renderAgentQaReviewFilters() {
  const filters = state.livechatAgentQaReview.filters;
  return `
    <div class="card-shell ai-qa-review-filter-shell">
      <div class="tickets-toolbar">
        <div>
          <div class="section-title">Manual AI QA Review</div>
          <div class="subtle">${Number(state.livechatAgentQaReview.total || 0).toLocaleString()} review(s)</div>
        </div>
        <div class="analytics-actions">
          ${isAdminRole() ? `<button id="agentQaReviewsProcessBtn" class="btn btn-sm btn-outline-secondary" type="button" ${state.livechatAgentQaReview.actionLoading ? "disabled" : ""}>Process pending</button>` : ""}
          <button id="agentQaReviewsReloadBtn" class="btn btn-sm btn-outline-secondary" type="button">Reload</button>
        </div>
      </div>
      <div class="ai-qa-review-filter-grid agent-qa-filter-grid">
        ${isAdminRole() ? `<label>
          <span>View</span>
          <select id="agentQaReviewScope" class="form-select">
            <option value="mine" ${filters.scope === "mine" ? "selected" : ""}>My queue</option>
            <option value="all" ${filters.scope === "all" ? "selected" : ""}>All reviews</option>
          </select>
        </label>` : ""}
        <label>
          <span>Status</span>
          <select id="agentQaReviewStatus" class="form-select">
            ${[
              ["pending_review", "Pending review"],
              ["approved", "Approved"],
              ["corrected", "Corrected"],
              ["", "Any"],
            ]
              .map(([value, label]) => `<option value="${escapeHtml(value)}" ${filters.status === value ? "selected" : ""}>${escapeHtml(label)}</option>`)
              .join("")}
          </select>
        </label>
        <label>
          <span>AI status</span>
          <select id="agentQaReviewAiStatus" class="form-select">
            ${["", "pending", "running", "completed", "failed", "skipped"]
              .map((value) => `<option value="${escapeHtml(value)}" ${filters.aiStatus === value ? "selected" : ""}>${escapeHtml(value || "Any")}</option>`)
              .join("")}
          </select>
        </label>
        <label>
          <span>Agent</span>
          <input id="agentQaReviewAgent" class="form-control" type="search" value="${escapeHtml(filters.agent)}" placeholder="email or name" />
        </label>
        <label>
          <span>Tag</span>
          <input id="agentQaReviewTag" class="form-control" type="search" value="${escapeHtml(filters.tag)}" placeholder="q9b" />
        </label>
        <label>
          <span>Chat / Thread</span>
          <input id="agentQaReviewChatId" class="form-control" type="search" value="${escapeHtml(filters.chatId)}" placeholder="chat or thread id" />
        </label>
        <div class="ai-qa-review-filter-actions">
          <button id="agentQaReviewFilterBtn" class="btn btn-primary" type="button">Filter</button>
          <button id="agentQaReviewResetBtn" class="btn btn-outline-secondary" type="button">Reset</button>
        </div>
      </div>
    </div>
  `;
}

function renderAgentQaReviewQueue() {
  const rows = state.livechatAgentQaReview.rows || [];
  const totalPages = Math.max(1, Math.ceil((state.livechatAgentQaReview.total || 0) / state.livechatAgentQaReview.pageSize));
  return `
    <aside class="ai-qa-review-queue">
      <div class="ai-qa-review-panel-head">
        <div>
          <div class="section-title">Review queue</div>
          <div class="subtle">Page ${state.livechatAgentQaReview.page} / ${totalPages}</div>
        </div>
        <div class="pagination-controls">
          <button class="btn btn-sm btn-outline-secondary" type="button" data-agent-qa-review-page="prev" ${state.livechatAgentQaReview.page <= 1 ? "disabled" : ""}>Prev</button>
          <button class="btn btn-sm btn-outline-secondary" type="button" data-agent-qa-review-page="next" ${state.livechatAgentQaReview.page >= totalPages ? "disabled" : ""}>Next</button>
        </div>
      </div>
      ${
        state.livechatAgentQaReview.loading
          ? '<div class="empty-state">Loading reviews...</div>'
          : state.livechatAgentQaReview.error
            ? `<div class="empty-state analytics-error">${escapeHtml(state.livechatAgentQaReview.error)}</div>`
            : rows.length
              ? `<div class="ai-qa-review-list">
                  ${rows
                    .map((row) => {
                      const selected = row.id === state.livechatAgentQaReview.selectedId;
                      return `
                        <div class="ai-qa-review-list-item ${selected ? "active" : ""}" role="button" tabindex="0" data-agent-qa-review-open="${escapeHtml(row.id)}">
                          <span class="ai-qa-review-list-top">
                            <strong>${renderLivechatChatLink(row.chatId, row.threadId)}</strong>
                            ${aiQaReviewStatusChip(row.status, row.aiStatus)}
                          </span>
                          <span class="subtle">${escapeHtml(row.agentLabel || "No agent")}</span>
                          <span class="subtle">${escapeHtml(livechatAiQaDateTime(row.updatedAt || row.createdAt))}</span>
                          <span class="ai-qa-review-list-tags">${aiQaReviewTagChips(row.checkTags, "No checks")}</span>
                          ${row.aiError ? `<span class="ai-qa-review-error">${escapeHtml(row.aiError)}</span>` : ""}
                        </div>
                      `;
                    })
                    .join("")}
                </div>`
              : '<div class="empty-state">No reviews match the current filters.</div>'
      }
    </aside>
  `;
}

function renderAgentQaReviewTranscript(detail) {
  if (state.livechatAgentQaReview.detailLoading) {
    return `<main class="ai-qa-review-thread"><div class="empty-state">Loading selected review...</div></main>`;
  }
  if (!detail) {
    return `<main class="ai-qa-review-thread"><div class="empty-state">Select a review.</div></main>`;
  }
  const transcript = detail.transcript || [];
  return `
    <main class="ai-qa-review-thread">
      <div class="ai-qa-review-thread-head">
        <div>
          <div class="section-title">Chat transcript</div>
          <div class="subtle">${escapeHtml(detail.chatId || "-")} / ${renderLivechatChatLink(detail.chatId, detail.threadId)}</div>
        </div>
        <div class="chip-list">
          ${aiQaReviewStatusChip(detail.status, detail.aiStatus)}
          <span class="chip chip-success">ended</span>
        </div>
      </div>
      <div class="ai-qa-review-meta-strip">
        <span>Agent: <strong>${escapeHtml(detail.agentLabel || "-")}</strong></span>
        <span>FTR: <strong>${escapeHtml(livechatAiQaMetricLabel(detail.ftrLabel || (Number.isFinite(Number(detail.ftrMs)) ? `${Math.round(Number(detail.ftrMs) / 1000)}s` : "")))}</strong></span>
        <span>System tags: <strong>${escapeHtml((detail.systemTags || []).join(", ") || "-")}</strong></span>
      </div>
      <div class="ai-qa-review-thread-body">
        ${
          transcript.length
            ? transcript
                .map((event) => {
                  const actorType = event.actorType || "system";
                  const side = actorType === "customer" ? "customer" : "agent";
                  return `
                    <div class="ai-qa-review-message ${side} ${actorType === "system" ? "system" : ""} ${actorType === "chatbot" ? "chatbot" : ""}">
                      <div class="ai-qa-review-message-meta">
                        <strong>${escapeHtml(actorType)}</strong>
                        ${event.actorId ? `<span>${escapeHtml(event.actorId)}</span>` : ""}
                        <span>${escapeHtml(livechatAiQaDateTime(event.at))}</span>
                      </div>
                      <div class="ai-qa-review-bubble">${escapeHtml(event.text || event.eventType || "")}</div>
                    </div>
                  `;
                })
                .join("")
            : '<div class="empty-state">No transcript messages stored for this review.</div>'
        }
      </div>
    </main>
  `;
}

function renderAgentQaCheckCard(check) {
  return `
    <article class="ai-qa-suggestion-card agent-qa-check-card">
      <div class="ai-qa-suggestion-head">
        <span class="chip primary">${escapeHtml(check.selectedTag || "-")}</span>
        <strong>${escapeHtml(aiQaReviewConfidence(check.confidence))}</strong>
      </div>
      <div class="agent-qa-check-title">${escapeHtml(check.title || check.ruleKey)}</div>
      ${check.why ? `<div class="ai-qa-suggestion-why">${escapeHtml(check.why)}</div>` : ""}
      ${
        check.evidence?.length
          ? `<div class="ai-qa-evidence-list">
              ${check.evidence.map((item) => `<blockquote>${escapeHtml(item)}</blockquote>`).join("")}
            </div>`
          : ""
      }
    </article>
  `;
}

function renderAgentQaFinalTagControls(detail) {
  const finalTags = new Set(agentQaReviewFinalTags(detail));
  const checkByRule = agentQaCheckByRule(detail);
  const closed = agentQaReviewIsClosed(detail);
  return `
    <div class="agent-qa-final-grid">
      ${AGENT_QA_RULES.map((rule) => {
        const check = checkByRule.get(rule.rule);
        const selected = rule.tags.find((tag) => finalTags.has(tag)) || "";
        return `
          <label class="agent-qa-final-row ${selected ? "selected" : ""} ${check ? "suggested" : ""}">
            <span>
              <strong>${escapeHtml(rule.rule)}</strong>
              <small>${escapeHtml(rule.title)}</small>
            </span>
            <select class="form-select" name="agentQaFinalTag" data-rule="${escapeHtml(rule.rule)}">
              <option value="">Not applicable</option>
              ${rule.tags
                .map((tag) => `<option value="${escapeHtml(tag)}" ${selected === tag ? "selected" : ""}>${escapeHtml(tag)}</option>`)
                .join("")}
            </select>
          </label>
        `;
      }).join("")}
    </div>
  `;
}

function renderAgentQaFeedbackControls(detail) {
  const checkByRule = agentQaCheckByRule(detail);
  const finalTags = new Set(agentQaReviewFinalTags(detail));
  const closed = agentQaReviewIsClosed(detail);
  return `
    <div class="ai-qa-feedback-grid agent-qa-feedback-grid">
      ${AGENT_QA_RULES.map((rule) => {
        const check = checkByRule.get(rule.rule);
        const selected = rule.tags.some((tag) => finalTags.has(tag));
        const visible = Boolean(check || selected);
        return `
          <label class="ai-qa-feedback-row ${visible ? "" : "is-hidden"}" data-agent-qa-feedback-row="${escapeHtml(rule.rule)}" data-ai-tag="${escapeHtml(check?.selectedTag || "")}">
            <span>
              <strong>${escapeHtml(rule.rule)}</strong>
              <small data-agent-qa-feedback-state="${escapeHtml(rule.rule)}">${escapeHtml([check?.selectedTag ? `AI: ${check.selectedTag}` : "", selected ? "Selected" : ""].filter(Boolean).join(" · "))}</small>
            </span>
            <textarea class="form-control" rows="2" data-agent-qa-feedback-rule="${escapeHtml(rule.rule)}" placeholder="Correct outcome and why… What the AI misunderstood… Evidence…"></textarea>
          </label>
        `;
      }).join("")}
    </div>
  `;
}

function refreshAgentQaFeedbackVisibility() {
  const selectedByRule = new Map(
    [...document.querySelectorAll('select[name="agentQaFinalTag"]')].map((select) => [select.dataset.rule, select.value]),
  );
  document.querySelectorAll("[data-agent-qa-feedback-row]").forEach((row) => {
    const rule = row.dataset.agentQaFeedbackRow;
    const aiTag = row.dataset.aiTag || "";
    const finalTag = selectedByRule.get(rule) || "";
    row.classList.toggle("is-hidden", !(aiTag || finalTag));
    const stateLabel = row.querySelector(`[data-agent-qa-feedback-state="${CSS.escape(rule)}"]`);
    if (stateLabel) {
      stateLabel.textContent = [aiTag ? `AI: ${aiTag}` : "", finalTag ? `Final: ${finalTag}` : ""].filter(Boolean).join(" · ");
    }
  });
}

function renderAgentQaReviewDecisionPanel(detail) {
  if (state.livechatAgentQaReview.detailLoading) {
    return `<aside class="ai-qa-review-decision"><div class="empty-state">Loading QA checks...</div></aside>`;
  }
  if (!detail) {
    return `<aside class="ai-qa-review-decision"><div class="empty-state">No review selected.</div></aside>`;
  }
  const closed = agentQaReviewIsClosed(detail);
  const checks = agentQaReviewChecks(detail);
  return `
    <aside class="ai-qa-review-decision">
      <div class="ai-qa-review-panel-head">
        <div>
          <div class="section-title">QA checks</div>
          <div class="subtle">${escapeHtml(detail.aiModel || "Workers AI")} ${detail.aiFallbackModel ? `→ ${escapeHtml(detail.aiFallbackModel)}` : ""}</div>
        </div>
        ${detail.aiOverallConfidence !== null && detail.aiOverallConfidence !== undefined ? `<span class="chip">${escapeHtml(aiQaReviewConfidence(detail.aiOverallConfidence))}</span>` : ""}
      </div>
      ${detail.aiSummary ? `<div class="ai-qa-summary">${escapeHtml(detail.aiSummary)}</div>` : ""}
      ${detail.aiError ? `<div class="empty-state analytics-error">${escapeHtml(detail.aiError)}</div>` : ""}
      <div class="ai-qa-suggestions-list">
        ${checks.length ? checks.map(renderAgentQaCheckCard).join("") : '<div class="empty-state">No QA checks yet.</div>'}
      </div>
      <div class="ai-qa-review-decision-block">
        <div class="section-title">Final QA tags</div>
        ${renderAgentQaFinalTagControls(detail)}
      </div>
      <div class="ai-qa-review-decision-block">
        <div class="section-title">Feedback for AI</div>
        ${renderAgentQaFeedbackControls(detail)}
      </div>
      <label class="ai-qa-apply-toggle">
        <input id="agentQaApplyToLiveChat" class="form-check-input" type="checkbox" checked />
        <span>Apply tags to LiveChat</span>
      </label>
      <textarea id="agentQaDecisionNote" class="form-control" rows="2" placeholder="Review note">${escapeHtml(detail.decisionNote || "")}</textarea>
      <div id="agentQaDirtyHint" class="subtle ${state.livechatAgentQaReview.dirty ? "" : "d-none"}">The review was changed and must be saved as corrected.</div>
      ${state.livechatAgentQaReview.actionError ? `<div class="empty-state analytics-error">${escapeHtml(state.livechatAgentQaReview.actionError)}</div>` : ""}
      <div class="ai-qa-review-actions">
        <button id="agentQaApproveBtn" class="btn btn-primary" type="button" ${closed || state.livechatAgentQaReview.dirty || state.livechatAgentQaReview.actionLoading || detail.aiStatus !== "completed" ? "disabled" : ""}>Approve</button>
        <button id="agentQaCorrectBtn" class="btn btn-outline-secondary" type="button" ${state.livechatAgentQaReview.actionLoading ? "disabled" : ""}>${closed ? "Save changes" : "Correct & Apply"}</button>
        <button id="agentQaRetryBtn" class="btn btn-outline-secondary" type="button" ${state.livechatAgentQaReview.actionLoading ? "disabled" : ""}>Retry AI</button>
      </div>
      ${
        closed
          ? `<div class="ai-qa-reviewed-box">
              <strong>${escapeHtml(detail.status)}</strong>
              <span>${escapeHtml(detail.reviewer || "")}</span>
              <span>${escapeHtml(livechatAiQaDateTime(detail.reviewedAt))}</span>
              ${aiQaReviewTagChips(detail.finalTags, "No final tags")}
            </div>`
          : ""
      }
    </aside>
  `;
}

function renderLivechatAgentQaReview() {
  const detail = state.livechatAgentQaReview.detail;
  return `
    <section class="ai-qa-review-page">
      ${renderLivechatAiQaManagement()}
      ${renderAgentQaReviewFilters()}
      <div class="ai-qa-review-workspace">
        ${renderAgentQaReviewQueue()}
        ${renderAgentQaReviewTranscript(detail)}
        ${renderAgentQaReviewDecisionPanel(detail)}
      </div>
    </section>
  `;
}

function agentQaLeaderboardQueryParams() {
  const filters = state.livechatAgentQaLeaderboard.filters;
  return new URLSearchParams({
    from: filters.from,
    to: filters.to,
    agent: filters.agent,
  });
}

function syncAgentQaLeaderboardFiltersFromDom() {
  const filters = state.livechatAgentQaLeaderboard.filters;
  filters.from = document.getElementById("agentQaLeaderboardFrom")?.value || "";
  filters.to = document.getElementById("agentQaLeaderboardTo")?.value || "";
  filters.agent = document.getElementById("agentQaLeaderboardAgent")?.value.trim() || "";
}

async function fetchLivechatAgentQaLeaderboard() {
  state.livechatAgentQaLeaderboard.loading = true;
  state.livechatAgentQaLeaderboard.error = null;
  if (state.section === "livechat-agent-qa-leaderboard") renderApp();
  try {
    const response = await api(`/api/livechat/ai-agent-qa-leaderboard?${agentQaLeaderboardQueryParams().toString()}`);
    state.livechatAgentQaLeaderboard.rows = response.rows || [];
    state.livechatAgentQaLeaderboard.reviewedCount = Number(response.reviewedCount || 0);
    state.livechatAgentQaLeaderboard.loaded = true;
  } catch (error) {
    state.livechatAgentQaLeaderboard.error = error.message;
    state.livechatAgentQaLeaderboard.rows = [];
    state.livechatAgentQaLeaderboard.loaded = true;
  } finally {
    state.livechatAgentQaLeaderboard.loading = false;
    if (state.section === "livechat-agent-qa-leaderboard") renderApp();
  }
}

function renderAgentQaLeaderboard() {
  const stateSlice = state.livechatAgentQaLeaderboard;
  const filters = stateSlice.filters;
  const rows = stateSlice.rows || [];
  return `
    <section class="ai-qa-review-page">
      <section class="qa-workspace-hero qa-workspace-hero-leaderboard">
        <div><span class="ui-eyebrow">Team performance</span><h1>AI QA leaderboard</h1><p>Compare quality, spot coaching opportunities and recognize consistent performance.</p></div>
        <div class="qa-workspace-hero-metric"><strong>${Number(stateSlice.reviewedCount || 0).toLocaleString()}</strong><span>reviewed chats</span></div>
      </section>
      <div class="card-shell ai-qa-review-filter-shell">
        <div class="tickets-toolbar">
          <div>
            <div class="section-title">Leaderboard filters</div>
            <div class="subtle">Choose a period or find a specific agent</div>
          </div>
          <button id="agentQaLeaderboardReloadBtn" class="btn btn-sm btn-outline-secondary" type="button">Reload</button>
        </div>
        <div class="ai-qa-review-filter-grid">
          <label>
            <span>From</span>
            <input id="agentQaLeaderboardFrom" class="form-control" type="date" value="${escapeHtml(filters.from)}" />
          </label>
          <label>
            <span>To</span>
            <input id="agentQaLeaderboardTo" class="form-control" type="date" value="${escapeHtml(filters.to)}" />
          </label>
          <label>
            <span>Agent</span>
            <input id="agentQaLeaderboardAgent" class="form-control" type="search" value="${escapeHtml(filters.agent)}" placeholder="email or name" />
          </label>
          <div class="ai-qa-review-filter-actions">
            <button id="agentQaLeaderboardFilterBtn" class="btn btn-primary" type="button">Filter</button>
            <button id="agentQaLeaderboardResetBtn" class="btn btn-outline-secondary" type="button">Reset</button>
          </div>
        </div>
      </div>
      <div class="table-shell agent-qa-leaderboard-shell">
        ${
          stateSlice.loading
            ? renderLoadingState("Loading leaderboard")
            : stateSlice.error
              ? renderErrorState(stateSlice.error)
              : rows.length
                ? `<div class="table-responsive">
                    <table class="table align-middle agent-qa-leaderboard-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Agent</th>
                          <th>Score</th>
                          <th>Rated</th>
                          <th>Passed</th>
                          <th>Failed</th>
                          <th>Manual</th>
                          <th>Not rateable</th>
                          <th>Top tags</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${rows
                          .map((row, index) => {
                            const topTags = Object.entries(row.tags || {})
                              .sort((left, right) => right[1] - left[1])
                              .slice(0, 6)
                              .map(([tag, count]) => `${tag} (${count})`);
                            return `
                              <tr>
                                <td>${index + 1}</td>
                                <td><strong>${escapeHtml(row.agent)}</strong><div class="subtle">${Number(row.reviews || 0)} review(s)</div></td>
                                <td><span class="chip ${Number(row.score) >= 90 ? "chip-success" : Number(row.score) >= 75 ? "chip-warning" : "chip-danger"}">${row.score === null ? "-" : `${escapeHtml(row.score)}%`}</span></td>
                                <td>${Number(row.rated || 0)}</td>
                                <td>${Number(row.passed || 0)}</td>
                                <td>${Number(row.failed || 0)}</td>
                                <td>${Number(row.manual || 0)}</td>
                                <td>${Number(row.notRateable || 0)}</td>
                                <td>${escapeHtml(topTags.join(", ") || "-")}</td>
                              </tr>
                            `;
                          })
                          .join("")}
                      </tbody>
                    </table>
                  </div>`
                : renderEmptyState("No reviewed Agent QA data yet", "bi-trophy")
        }
      </div>
    </section>
  `;
}

function aiQaPreReviewAnalyticsQueryParams() {
  const filters = state.livechatAiQaPreReviewAnalytics.filters;
  return new URLSearchParams({
    from: filters.from,
    to: filters.to,
    reviewType: filters.reviewType,
    reviewer: filters.reviewer,
    billingRange: state.livechatAiQaPreReviewAnalytics.billingRange,
  });
}

function syncAiQaPreReviewAnalyticsFiltersFromDom() {
  const filters = state.livechatAiQaPreReviewAnalytics.filters;
  filters.from = document.getElementById("aiQaPreAnalyticsFrom")?.value || "";
  filters.to = document.getElementById("aiQaPreAnalyticsTo")?.value || "";
  filters.reviewType = document.getElementById("aiQaPreAnalyticsType")?.value || "all";
  filters.reviewer = document.getElementById("aiQaPreAnalyticsReviewer")?.value.trim() || "";
}

async function fetchLivechatAiQaPreReviewAnalytics() {
  const analytics = state.livechatAiQaPreReviewAnalytics;
  analytics.filters.from ||= aiQaManagementDate(30);
  analytics.filters.to ||= aiQaManagementDate(0);
  analytics.loading = true;
  analytics.error = null;
  if (state.section === "livechat-ai-qa-pre-review-analytics") renderApp();
  try {
    analytics.data = await api(`/api/livechat/ai-qa-pre-review-analytics?${aiQaPreReviewAnalyticsQueryParams().toString()}`);
    analytics.loaded = true;
  } catch (error) {
    analytics.error = error.message;
    analytics.data = null;
    analytics.loaded = true;
  } finally {
    analytics.loading = false;
    if (state.section === "livechat-ai-qa-pre-review-analytics") renderApp();
  }
}

function aiQaAnalyticsTypeLabel(type) {
  return type === "agent_qa" ? "Agent QA" : type === "auto_tag" ? "Auto-tag" : "All";
}

function renderAiQaPreReviewTable(title, headers, rows, rowRenderer, emptyText) {
  return `
    <div class="table-shell ai-qa-pre-analytics-table-shell">
      <div class="section-title">${escapeHtml(title)}</div>
      ${
        rows.length
          ? `<div class="table-responsive"><table class="table align-middle ai-qa-pre-analytics-table">
              <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
              <tbody>${rows.map(rowRenderer).join("")}</tbody>
            </table></div>`
          : `<div class="empty-state">${escapeHtml(emptyText)}</div>`
      }
    </div>
  `;
}

function formatAiBillingNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 }).format(number);
}

function aiBillingMeterLabel(meter) {
  const labels = {
    input_tokens: "Input tokens",
    output_tokens: "Output tokens",
    neurons: "Neurons",
    text_generation: "Text generation",
    other: "Other",
  };
  return labels[meter?.type] || meter?.id || "Usage";
}

function renderAiBillingChart(billing) {
  const meters = billing?.meters || [];
  const intervals = billing?.intervals || [];
  const maxTotal = Math.max(...intervals.map((item) => Number(item.total || 0)), 1);
  const colors = ["#8b7cf6", "#fb923c", "#38bdf8", "#34d399", "#f472b6", "#facc15"];
  return `
    <div class="ai-billing-legend">
      ${meters.map((meter, index) => `<span><i style="--meter-color:${colors[index % colors.length]}"></i>${escapeHtml(aiBillingMeterLabel(meter))} <strong>${escapeHtml(formatAiBillingNumber(meter.total))}</strong></span>`).join("")}
    </div>
    <div class="ai-billing-chart" role="img" aria-label="Cloudflare billing usage over time">
      ${intervals.map((interval) => {
        const label = new Date(Number(interval.startTime || 0)).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
        return `<div class="ai-billing-bar-wrap" title="${escapeHtml(`${label}: ${formatAiBillingNumber(interval.total)}`)}">
          <div class="ai-billing-bar">
            ${meters.map((meter, index) => {
              const value = Number(interval.values?.[meter.id] || 0);
              const height = Math.max(0, (value / maxTotal) * 100);
              return `<i style="height:${height}%;--meter-color:${colors[index % colors.length]}"></i>`;
            }).join("")}
          </div>
        </div>`;
      }).join("")}
    </div>
    <div class="ai-billing-axis"><span>${escapeHtml(intervals.length ? new Date(intervals[0].startTime).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit" }) : "")}</span><span>${escapeHtml(intervals.length ? new Date(intervals.at(-1).startTime).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit" }) : "")}</span></div>
  `;
}

function renderCloudflareAiBillingDashboard(billing) {
  const range = state.livechatAiQaPreReviewAnalytics.billingRange;
  const rangeLabel = range === "7d" ? "Last 7 days UTC" : range === "30d" ? "Last 30 days UTC" : "Last 24 hours UTC · 30-minute intervals";
  if (!billing?.configured) {
    return `<div class="card-shell ai-billing-shell">
      <div class="ai-billing-head"><div><div class="section-title">Workers AI · real Cloudflare usage</div><div class="subtle">Source: Cloudflare Workers AI Analytics</div></div></div>
      <div class="empty-state analytics-error">${escapeHtml(billing?.message || "Cloudflare Workers AI Analytics is not configured.")} Add a Cloudflare API token with Account Analytics Read permission.</div>
    </div>`;
  }
  if (billing.error) {
    return `<div class="card-shell ai-billing-shell"><div class="section-title">Workers AI · real Cloudflare usage</div><div class="empty-state analytics-error">${escapeHtml(billing.error)}</div></div>`;
  }
  const meters = billing.meters || [];
  const totals = billing.totals || {};
  const neuronTotal = Number(totals.neurons || 0);
  const totalTokens = Number(totals.inputTokens || 0) + Number(totals.outputTokens || 0);
  const dailyLimit = Number(billing.dailyLimit || 10000);
  const todayNeurons = Number(billing.todayNeurons || 0);
  return `<div class="card-shell ai-billing-shell">
    <div class="ai-billing-head">
      <div>
        <div class="section-title">Workers AI · real Cloudflare usage</div>
        <div class="subtle">Cloudflare Workers AI Analytics · updated ${escapeHtml(livechatAiQaDateTime(billing.fetchedAt))}</div>
      </div>
      <div class="ai-billing-range" aria-label="Billing usage range">
        ${[["24h", "24 hours"], ["7d", "7 days"], ["30d", "30 days"]].map(([value, label]) => `<button class="btn btn-sm ${range === value ? "btn-primary" : "btn-outline-secondary"}" type="button" data-ai-billing-range="${value}">${label}</button>`).join("")}
      </div>
    </div>
    <div class="ai-billing-daily"><i class="bi bi-calendar3"></i><span>${escapeHtml(rangeLabel)}</span><strong>Neurons: ${escapeHtml(formatAiBillingNumber(neuronTotal))}</strong></div>
    <div class="ai-billing-summary-grid">
      <div><span>Today UTC neurons</span><strong>${escapeHtml(formatAiBillingNumber(todayNeurons))}</strong></div>
      <div><span>QA daily limit</span><strong>${escapeHtml(formatAiBillingNumber(dailyLimit))}</strong></div>
      <div><span>Daily limit used</span><strong>${escapeHtml(`${Math.min(100, dailyLimit ? (todayNeurons / dailyLimit) * 100 : 0).toFixed(1)}%`)}</strong></div>
      <div><span>Models used</span><strong>${Number(billing.models?.length || 0)}</strong></div>
    </div>
    <div class="ai-billing-chart-card">
      <div class="ai-billing-chart-title"><span>Token usage history</span><strong>${escapeHtml(formatAiBillingNumber(totalTokens))} tokens</strong></div>
      ${meters.length && (billing.intervals || []).length ? renderAiBillingChart(billing) : '<div class="empty-state">Cloudflare returned no Workers AI usage for this range.</div>'}
    </div>
  </div>`;
}

function renderLivechatAiQaPreReviewAnalytics() {
  const analytics = state.livechatAiQaPreReviewAnalytics;
  const filters = analytics.filters;
  const data = analytics.data;
  const overall = data?.overall || {};
  const usage = data?.usageTotals || {};
  const pipeline = data?.pipeline || [];
  return `
    <section class="ai-qa-review-page">
      <section class="qa-workspace-hero qa-workspace-hero-analytics">
        <div><span class="ui-eyebrow">AI quality intelligence</span><h1>Chats pre-AI QA Review</h1><p>Measure the original AI result before a QA manager approves or corrects it.</p></div>
        <div class="qa-workspace-hero-metric"><strong>${Number(overall.reviewed || 0).toLocaleString()}</strong><span>reviewed results</span></div>
      </section>
      <div class="card-shell ai-qa-review-filter-shell">
        <div class="tickets-toolbar">
          <div>
            <div class="section-title">Analytics filters</div>
            <div class="subtle">Refine the reporting period, review type and reviewer</div>
          </div>
          <button id="aiQaPreAnalyticsReloadBtn" class="btn btn-sm btn-outline-secondary" type="button">Reload</button>
        </div>
        <div class="ai-qa-review-filter-grid">
          <label><span>From</span><input id="aiQaPreAnalyticsFrom" class="form-control" type="date" value="${escapeHtml(filters.from)}" /></label>
          <label><span>To</span><input id="aiQaPreAnalyticsTo" class="form-control" type="date" value="${escapeHtml(filters.to)}" /></label>
          <label><span>Review type</span><select id="aiQaPreAnalyticsType" class="form-select">
            ${[["all", "All"], ["auto_tag", "Auto-tag"], ["agent_qa", "Agent QA"]]
              .map(([value, label]) => `<option value="${value}" ${filters.reviewType === value ? "selected" : ""}>${label}</option>`)
              .join("")}
          </select></label>
          <label><span>Reviewer</span><input id="aiQaPreAnalyticsReviewer" class="form-control" type="search" value="${escapeHtml(filters.reviewer)}" placeholder="email" /></label>
          <div class="ai-qa-review-filter-actions">
            <button id="aiQaPreAnalyticsFilterBtn" class="btn btn-primary" type="button">Filter</button>
            <button id="aiQaPreAnalyticsResetBtn" class="btn btn-outline-secondary" type="button">Last 30 days</button>
          </div>
        </div>
      </div>
      ${analytics.error ? `<div class="empty-state analytics-error">${escapeHtml(analytics.error)}</div>` : ""}
      ${
        analytics.loading && !data
          ? renderLoadingState("Loading pre-AI QA analytics")
          : `
            ${renderCloudflareAiBillingDashboard(data?.cloudflareBilling)}
            <div class="stats-grid">
              <div class="card-shell stats-card"><div class="stats-label">Reviewed results</div><div class="stats-value">${Number(overall.reviewed || 0).toLocaleString()}</div></div>
              <div class="card-shell stats-card"><div class="stats-label">Exact AI matches</div><div class="stats-value">${Number(overall.exactMatchRate || 0).toFixed(1)}%</div></div>
              <div class="card-shell stats-card"><div class="stats-label">Correction rate</div><div class="stats-value">${Number(overall.correctionRate || 0).toFixed(1)}%</div></div>
              <div class="card-shell stats-card"><div class="stats-label">Learned guidance</div><div class="stats-value">${Number(data?.knowledge?.total || 0).toLocaleString()}</div><div class="subtle">${Number(data?.knowledge?.autoTag || 0)} auto-tag · ${Number(data?.knowledge?.agentQa || 0)} Agent QA</div></div>
              <div class="card-shell stats-card"><div class="stats-label">AI requests</div><div class="stats-value">${Number(usage.requests || 0).toLocaleString()}</div></div>
              <div class="card-shell stats-card"><div class="stats-label">AI failures</div><div class="stats-value">${Number(usage.failed || 0).toLocaleString()}</div></div>
              <div class="card-shell stats-card"><div class="stats-label">Skipped by limit</div><div class="stats-value">${Number(usage.skipped || 0).toLocaleString()}</div></div>
            </div>
            ${renderAiQaPreReviewTable(
              "Accuracy by review type",
              ["Type", "Reviewed", "Approved", "Corrected", "Exact match", "Avg confidence"],
              data?.types || [],
              (row) => `<tr><td><strong>${aiQaAnalyticsTypeLabel(row.type)}</strong></td><td>${row.reviewed}</td><td>${row.approved}</td><td>${row.corrected}</td><td>${Number(row.exactMatchRate || 0).toFixed(1)}%</td><td>${row.averageConfidence === null ? "-" : `${Number(row.averageConfidence).toFixed(1)}%`}</td></tr>`,
              "No reviewed chats for this period.",
            )}
            <div class="ai-qa-pre-analytics-grid">
              ${renderAiQaPreReviewTable(
                "Most frequent tag errors",
                ["Type", "Tag", "Suggested", "Kept", "Wrong", "Missed", "Precision", "Recall"],
                (data?.tags || []).slice(0, 25),
                (row) => `<tr><td>${aiQaAnalyticsTypeLabel(row.type)}</td><td><strong>${escapeHtml(row.tag)}</strong></td><td>${row.suggested}</td><td>${row.kept}</td><td>${row.wrong}</td><td>${row.missed}</td><td>${Number(row.precision || 0).toFixed(1)}%</td><td>${Number(row.recall || 0).toFixed(1)}%</td></tr>`,
                "No tag errors found.",
              )}
              ${renderAiQaPreReviewTable(
                "AI → manager corrections",
                ["Type", "AI result", "Manager result", "Count"],
                (data?.confusions || []).slice(0, 25),
                (row) => `<tr><td>${aiQaAnalyticsTypeLabel(row.type)}</td><td>${escapeHtml(row.fromTag)}</td><td><strong>${escapeHtml(row.toTag)}</strong></td><td>${row.count}</td></tr>`,
                "No corrections found.",
              )}
            </div>
            ${renderAiQaPreReviewTable(
              "Daily accuracy",
              ["Date", "Type", "Reviewed", "Exact matches", "Corrected", "Accuracy"],
              (data?.daily || []).slice(0, 60),
              (row) => `<tr><td>${escapeHtml(row.date)}</td><td>${aiQaAnalyticsTypeLabel(row.type)}</td><td>${row.reviewed}</td><td>${row.exactMatches}</td><td>${row.corrected}</td><td>${Number(row.exactMatchRate || 0).toFixed(1)}%</td></tr>`,
              "No daily data.",
            )}
            ${renderAiQaPreReviewTable(
              "Performance by model and prompt",
              ["Type", "Model", "Prompt", "Reviewed", "Accuracy", "Correction rate"],
              data?.versions || [],
              (row) => `<tr><td>${aiQaAnalyticsTypeLabel(row.type)}</td><td>${escapeHtml(row.model)}</td><td>${escapeHtml(row.promptVersion)}</td><td>${row.reviewed}</td><td>${Number(row.exactMatchRate || 0).toFixed(1)}%</td><td>${Number(row.correctionRate || 0).toFixed(1)}%</td></tr>`,
              "No model performance data.",
            )}
            <div class="card-shell">
              <div class="section-title">AI pipeline</div>
              <div class="chip-list">${pipeline.length ? pipeline.map((row) => `<span class="chip">${aiQaAnalyticsTypeLabel(row.type)} · ${escapeHtml(row.aiStatus)}: ${Number(row.count || 0).toLocaleString()}</span>`).join("") : '<span class="subtle">No pipeline data.</span>'}</div>
            </div>
            ${renderAiQaPreReviewTable(
              "Latest correction comments",
              ["Time", "Type", "Chat", "AI → final", "Reviewer", "Comment"],
              data?.recentComments || [],
              (row) => `<tr><td>${escapeHtml(livechatAiQaDateTime(row.createdAt))}</td><td>${aiQaAnalyticsTypeLabel(row.type)}</td><td><strong>${renderLivechatChatLink(row.chatId, row.threadId)}</strong><div class="subtle">${escapeHtml(row.chatId)}</div></td><td>${escapeHtml([row.aiTag || row.tag, row.finalTag].filter(Boolean).join(" → ") || row.feedbackType)}</td><td>${escapeHtml(row.reviewer)}</td><td class="ai-qa-comment-cell">${escapeHtml(row.comment)}</td></tr>`,
              "No correction comments for this period.",
            )}
          `
      }
    </section>
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
  const dashboardAgent = helpdeskAnalyticsAgentById(id);
  return agent.email || dashboardAgent?.email || agent.name || dashboardAgent?.name || id;
}

function helpdeskAgentSubLabel(agent) {
  const id = String(agent.agent_id || agent.id || "");
  const dashboardAgent = helpdeskAnalyticsAgentById(id);
  const email = agent.email || dashboardAgent?.email || "";
  const name = agent.name || dashboardAgent?.name || "";
  const main = helpdeskAgentLabel(agent);
  return name && name !== main ? name : email && email !== main ? email : id && id !== main ? id : "";
}

function helpdeskFilterText(item) {
  return `${item.name || ""} ${item.email || ""} ${item.id || ""}`.toLowerCase();
}

function normalizeAgentName(value) {
  return `${value || ""}`.trim().toLowerCase();
}

function helpdeskAnalyticsAgents() {
  const byId = new Map();
  (state.helpdesk.agents || []).forEach((agent) => {
    byId.set(String(agent.id), { ...agent, historical: false });
  });
  (state.helpdesk.analyticsAgents || []).forEach((agent) => {
    const id = String(agent.id || "");
    if (!id || byId.has(id)) return;
    byId.set(id, { ...agent, id, historical: true });
  });
  return [...byId.values()].sort((left, right) => (left.name || left.email || left.id).localeCompare(right.name || right.email || right.id));
}

function helpdeskAnalyticsAgentById(id) {
  return helpdeskAnalyticsAgents().find((agent) => String(agent.id) === String(id));
}

function defaultHelpdeskAnalyticsAgentIds() {
  const allowed = new Set(DEFAULT_HELPDESK_ANALYTICS_AGENT_NAMES.map(normalizeAgentName));
  const allowedEmails = new Set(DEFAULT_HELPDESK_ANALYTICS_AGENT_EMAILS.map(normalizeAgentName));
  const excludedEmails = new Set(EXCLUDED_DEFAULT_HELPDESK_ANALYTICS_AGENT_EMAILS.map(normalizeAgentName));
  return helpdeskAnalyticsAgents()
    .filter((agent) => {
      const email = normalizeAgentName(agent.email);
      return !excludedEmails.has(email) && (allowed.has(normalizeAgentName(agent.name)) || allowedEmails.has(email));
    })
    .map((agent) => String(agent.id));
}

function cleanHelpdeskAnalyticsAgentIds(ids) {
  const availableIds = new Set(helpdeskAnalyticsAgents().map((agent) => String(agent.id)));
  return [...new Set((Array.isArray(ids) ? ids : []).map((id) => String(id)).filter((id) => !availableIds.size || availableIds.has(id)))];
}

function storedHelpdeskAnalyticsAgentDefaults() {
  try {
    const stored = JSON.parse(localStorage.getItem(HELPDESK_ANALYTICS_AGENT_DEFAULTS_STORAGE_KEY) || "{}");
    const accountDefaults = stored?.[normalizeAccountId(state.accountId)];
    if (!accountDefaults || typeof accountDefaults !== "object") return null;
    return {
      agents: cleanHelpdeskAnalyticsAgentIds(accountDefaults.agents),
      excludeAgents: cleanHelpdeskAnalyticsAgentIds(accountDefaults.excludeAgents),
    };
  } catch (_error) {
    return null;
  }
}

function saveHelpdeskAnalyticsAgentDefaults() {
  try {
    const stored = JSON.parse(localStorage.getItem(HELPDESK_ANALYTICS_AGENT_DEFAULTS_STORAGE_KEY) || "{}");
    stored[normalizeAccountId(state.accountId)] = {
      agents: cleanHelpdeskAnalyticsAgentIds(state.helpdesk_analytics.filters.agents),
      excludeAgents: cleanHelpdeskAnalyticsAgentIds(state.helpdesk_analytics.filters.excludeAgents),
    };
    localStorage.setItem(HELPDESK_ANALYTICS_AGENT_DEFAULTS_STORAGE_KEY, JSON.stringify(stored));
  } catch (_error) {
    // Analytics filters should still work when browser storage is unavailable.
  }
}

function defaultHelpdeskAnalyticsAgentFilters() {
  const storedDefaults = storedHelpdeskAnalyticsAgentDefaults();
  if (storedDefaults) return storedDefaults;
  return {
    agents: defaultHelpdeskAnalyticsAgentIds(),
    excludeAgents: [],
  };
}

function applyDefaultHelpdeskAnalyticsAgents(force = false) {
  if (!force && state.helpdesk_analytics.defaultAgentsApplied) return;
  const defaults = defaultHelpdeskAnalyticsAgentFilters();
  if (!defaults.agents.length && !defaults.excludeAgents.length && !storedHelpdeskAnalyticsAgentDefaults()) return;
  state.helpdesk_analytics.filters.agents = defaults.agents;
  state.helpdesk_analytics.filters.excludeAgents = defaults.excludeAgents;
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

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(`${reader.result || ""}`.split(",")[1] || "");
    reader.onerror = () => reject(reader.error || new Error("Failed to read report file."));
    reader.readAsDataURL(blob);
  });
}

async function sendHelpdeskAnalyticsSlack() {
  if (!state.helpdesk_analytics.data) {
    setMessage(statusMessage, "Load HelpDesk analytics before sending to Slack.", "error");
    return;
  }
  if (state.helpdesk_analytics.slackSending) return;

  const metric = helpdeskAnalyticsMetricConfig();
  const period = helpdeskAnalyticsPeriodLabel();
  const filename = helpdeskAnalyticsExportFilename("xlsx");
  const title = `HelpDesk analytics - ${metric.tabLabel} - ${period}`;

  state.helpdesk_analytics.slackSending = true;
  renderHelpdeskAnalytics();
  setMessage(statusMessage, "Sending HelpDesk analytics to Slack...");

  try {
    const fileBase64 = await blobToBase64(xlsxWorkbookBlob(helpdeskAnalyticsWorkbookSheets()));
    await api("/api/helpdesk/analytics-slack", {
      method: "POST",
      body: {
        filename,
        title,
        initialComment: `${title} attached.`,
        fileBase64,
      },
    });
    setMessage(statusMessage, "HelpDesk analytics sent to Slack.", "success");
  } catch (error) {
    setMessage(statusMessage, error.message, "error");
  } finally {
    state.helpdesk_analytics.slackSending = false;
    renderHelpdeskAnalytics();
  }
}

function pdfSafeText(value) {
  return `${value ?? ""}`
    .normalize("NFKD")
    .replace(/[^\x20-\x7e]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function truncatePdfText(value, maxChars) {
  const text = `${value ?? ""}`;
  return text.length > maxChars ? `${text.slice(0, Math.max(0, maxChars - 1))}...` : text;
}

function pdfTextCommand(value, x, y, size = 8) {
  return `BT /F1 ${size} Tf 1 0 0 1 ${Math.round(x)} ${Math.round(y)} Tm (${pdfSafeText(value)}) Tj ET\n`;
}

function helpdeskAnalyticsPdfContentPages() {
  const metric = helpdeskAnalyticsMetricConfig();
  const { days, rows, summary } = helpdeskAnalyticsExportRows();
  const totalTickets = Number(state.helpdesk_analytics.data?.summary?.total_tickets || 0);
  const periodLabel = helpdeskAnalyticsPeriodLabel();
  const dayChunkSize = 7;
  const dayChunks = days.length
    ? Array.from({ length: Math.ceil(days.length / dayChunkSize) }, (_item, index) => days.slice(index * dayChunkSize, index * dayChunkSize + dayChunkSize))
    : [[]];
  const allRows = [
    { rank: "", agent: "Account summary", email: "", total: totalTickets, days: summary },
    ...rows,
  ];
  const rowsPerPage = 30;
  const pages = [];

  dayChunks.forEach((dayChunk, chunkIndex) => {
    for (let start = 0; start < allRows.length; start += rowsPerPage) {
      const pageRows = allRows.slice(start, start + rowsPerPage);
      let content = "";
      content += pdfTextCommand("HelpDesk Analytics", 36, 555, 16);
      content += pdfTextCommand(`${metric.tabLabel} | ${periodLabel}`, 36, 537, 10);
      if (dayChunks.length > 1) {
        content += pdfTextCommand(`Date columns ${chunkIndex + 1} of ${dayChunks.length}`, 36, 522, 8);
      }

      const columns = [
        { key: "rank", label: "Rank", x: 36, width: 32, chars: 5 },
        { key: "agent", label: "Agent", x: 72, width: 116, chars: 20 },
        { key: "email", label: "Email / ID", x: 194, width: 154, chars: 28 },
        { key: "total", label: metric.periodLabel, x: 354, width: 54, chars: 8 },
        ...dayChunk.map((date, index) => ({
          key: `day-${index}`,
          label: date.slice(5),
          x: 414 + index * 58,
          width: 52,
          chars: 8,
        })),
      ];

      const headerY = 500;
      columns.forEach((column) => {
        content += pdfTextCommand(column.label, column.x, headerY, 7);
      });

      pageRows.forEach((row, rowIndex) => {
        const y = headerY - 18 - rowIndex * 14;
        const dayValues = dayChunk.map((date) => {
          const dayIndex = days.indexOf(date);
          return dayIndex >= 0 ? Number(row.days?.[dayIndex] || 0) : "";
        });
        const values = [
          row.rank,
          row.agent,
          row.email,
          row.total,
          ...dayValues,
        ];
        columns.forEach((column, columnIndex) => {
          content += pdfTextCommand(truncatePdfText(values[columnIndex], column.chars), column.x, y, 7);
        });
      });

      pages.push(content);
    }
  });

  return pages;
}

function pdfBlobFromPages(pageContents) {
  const encoder = new TextEncoder();
  const pageObjects = [];
  const objects = [
    { id: 1, body: "<< /Type /Catalog /Pages 2 0 R >>" },
    { id: 3, body: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>" },
  ];

  pageContents.forEach((content, index) => {
    const pageObjectId = 4 + index * 2;
    const contentObjectId = pageObjectId + 1;
    pageObjects.push(pageObjectId);
    const contentLength = encoder.encode(content).length;
    objects.push({
      id: pageObjectId,
      body: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
    });
    objects.push({
      id: contentObjectId,
      body: `<< /Length ${contentLength} >>\nstream\n${content}endstream`,
    });
  });
  objects.push({
    id: 2,
    body: `<< /Type /Pages /Kids [${pageObjects.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjects.length} >>`,
  });
  objects.sort((left, right) => left.id - right.id);

  let output = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets[object.id] = encoder.encode(output).length;
    output += `${object.id} 0 obj\n${object.body}\nendobj\n`;
  }
  const xrefOffset = encoder.encode(output).length;
  const maxObjectId = Math.max(...objects.map((object) => object.id));
  output += `xref\n0 ${maxObjectId + 1}\n`;
  output += "0000000000 65535 f \n";
  for (let id = 1; id <= maxObjectId; id += 1) {
    output += `${String(offsets[id] || 0).padStart(10, "0")} 00000 n \n`;
  }
  output += `trailer\n<< /Size ${maxObjectId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([encoder.encode(output)], { type: "application/pdf" });
}

function exportHelpdeskAnalyticsPdf() {
  if (!state.helpdesk_analytics.data) {
    setMessage(statusMessage, "Load HelpDesk analytics before exporting.", "error");
    return;
  }

  downloadBlobFile(helpdeskAnalyticsExportFilename("pdf"), pdfBlobFromPages(helpdeskAnalyticsPdfContentPages()));
  setMessage(statusMessage, "HelpDesk analytics PDF export downloaded.");
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
  const defaultAgentFilters = defaultHelpdeskAnalyticsAgentFilters();
  state.helpdesk_analytics.filters = {
    preset: "this_month",
    from: range.from,
    to: range.to,
    agents: defaultAgentFilters.agents,
    excludeAgents: defaultAgentFilters.excludeAgents,
    groups: [],
    agentSearch: "",
    excludeAgentSearch: "",
    groupSearch: "",
  };
  state.helpdesk_analytics.defaultAgentsApplied = Boolean(defaultAgentFilters.agents.length || defaultAgentFilters.excludeAgents.length || storedHelpdeskAnalyticsAgentDefaults());
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
  const combinedMetric = isHelpdeskCombinedMetric();
  actionBar.innerHTML = `
    <button id="helpdeskAnalyticsApplyBtn" class="btn btn-primary" type="button">Filter</button>
    <button id="helpdeskAnalyticsPdfBtn" class="btn btn-outline-secondary" type="button" ${data && !combinedMetric ? "" : "disabled"}>Export PDF</button>
    <button id="helpdeskAnalyticsExcelBtn" class="btn btn-outline-secondary" type="button" ${data && !combinedMetric ? "" : "disabled"}>Export Excel</button>
    <button id="helpdeskAnalyticsSlackBtn" class="btn btn-outline-secondary" type="button" ${data && !combinedMetric && !state.helpdesk_analytics.slackSending ? "" : "disabled"}>${state.helpdesk_analytics.slackSending ? "Sending..." : "Send to Slack"}</button>
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
  document.getElementById("helpdeskAnalyticsSlackBtn")?.addEventListener("click", () => {
    sendHelpdeskAnalyticsSlack();
  });
  document.getElementById("helpdeskAnalyticsResetBtn")?.addEventListener("click", () => {
    resetHelpdeskAnalyticsFilters();
  });

  renderFiltersConditional();

  // Render data sections if available
  if (data) {
    if (combinedMetric) {
      renderHelpdeskCombinedReport();
    } else {
      renderMetricsAndPanels();
      renderLeaderboard();
    }
  } else if (loading) {
  } else if (error) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "alert alert-danger";
    errorDiv.textContent = `Error: ${error}`;
    container.appendChild(errorDiv);
  } else if (!loading) {
    const hint = document.createElement("div");
    hint.className = "empty-state";
    hint.textContent = 'No data loaded. Click "Filter" to load the selected report.';
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
  const analyticsAgents = helpdeskAnalyticsAgents();
  const visibleAgents = analyticsAgents.filter((agent) =>
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
    subFor: (agent) => {
      const email = agent.email && agent.email !== agent.name ? agent.email : "";
      return [email, agent.historical ? "Historical D1" : ""].filter(Boolean).join(" · ");
    },
  });

  const normalizedExcludeAgentSearch = excludeAgentSearch.trim().toLowerCase();
  const visibleExcludeAgents = analyticsAgents.filter((agent) =>
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
    subFor: (agent) => {
      const email = agent.email && agent.email !== agent.name ? agent.email : "";
      return [email, agent.historical ? "Historical D1" : ""].filter(Boolean).join(" · ");
    },
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
      saveHelpdeskAnalyticsAgentDefaults();
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
      saveHelpdeskAnalyticsAgentDefaults();
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

function renderHelpdeskCombinedReport() {
  const analytics = state.helpdesk_analytics.data;
  if (!analytics) return;
  const container = document.getElementById("appContent");
  const agents = [...(analytics.agents || [])].sort((left, right) =>
    Number(right.total_tickets || 0) - Number(left.total_tickets || 0) ||
    Number(right.public_replies || 0) - Number(left.public_replies || 0) ||
    helpdeskAgentLabel(left).localeCompare(helpdeskAgentLabel(right)),
  );

  const metricsRow = document.createElement("div");
  metricsRow.className = "metrics-row d-flex gap-4 mb-4 flex-wrap";
  const cards = [
    ["Public replies", analytics.summary?.public_replies || 0],
    ["Internal notes", analytics.summary?.internal_notes || 0],
    ["Total activity", analytics.summary?.total_tickets || 0],
    ["Active agents", analytics.summary?.active_agents || 0],
  ];
  cards.forEach(([title, value]) => {
    const card = document.createElement("div");
    card.className = "analytics-card";
    card.innerHTML = `
      <div class="card-value">${Number(value || 0).toLocaleString()}</div>
      <hr class="card-divider" />
      <div class="card-title">${escapeHtml(title)}</div>
    `;
    metricsRow.appendChild(card);
  });
  container.appendChild(metricsRow);

  const shell = document.createElement("div");
  shell.className = "table-shell";
  shell.innerHTML = agents.length
    ? `<div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>Agent</th>
              <th>Email / ID</th>
              <th>Public replies</th>
              <th>Internal notes</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${agents
              .map(
                (agent) => `
                  <tr>
                    <td><strong>${escapeHtml(helpdeskAgentLabel(agent))}</strong></td>
                    <td>${escapeHtml(helpdeskAgentSubLabel(agent) || agent.agent_id || "-")}</td>
                    <td>${Number(agent.public_replies || 0).toLocaleString()}</td>
                    <td>${Number(agent.internal_notes || 0).toLocaleString()}</td>
                    <td><strong>${Number(agent.total_tickets || 0).toLocaleString()}</strong></td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>`
    : '<div class="empty-state">No public replies or internal notes for the selected period.</div>';
  container.appendChild(shell);
}

function isHelpdeskCombinedMetric() {
  return helpdeskAnalyticsMetricConfig().id === "combined";
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
    "qa-dashboard": "QA Manager Dashboard",
    "livechat-users": "LiveChat Users",
    "livechat-groups": "LiveChat Groups",
    "create-livechat-user": "Create LiveChat User",
    "livechat-analytics": "LiveChat Analytics",
    "livechat-ai-qa-tagging": "Chats pre-AI-analysis",
    "livechat-ai-qa-review": "Combined AI QA Review",
    "livechat-agent-qa-review": "Manual AI QA Review",
    "livechat-agent-qa-leaderboard": "AI QA leaderboard",
    "livechat-ai-qa-pre-review-analytics": "Chats pre-AI QA Review",
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
  if (state.adminInviteWizard) {
    const wizard = state.adminInviteWizard;
    const step = wizard.step || 1;
    const roleIsAdmin = wizard.userRole === "admin";
    modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card admin-invite-modal">
          <div class="modal-head">
            <div><div class="modal-title">Invite new user</div><div class="subtle">Step ${step} of 3</div></div>
            <button id="closeAdminInviteWizardBtn" class="btn btn-sm btn-outline-secondary" type="button">Close</button>
          </div>
          <div class="invite-stepper"><span class="${step >= 1 ? "active" : ""}">Details</span><span class="${step >= 2 ? "active" : ""}">Role</span><span class="${step >= 3 ? "active" : ""}">Permissions</span></div>
          <form id="adminInviteWizardForm">
            ${step === 1 ? `
              <div class="row g-3">
                <div class="col-md-6"><label class="form-label" for="adminFirstName">Name</label><input id="adminFirstName" class="form-control" value="${escapeHtml(wizard.firstName)}" required /></div>
                <div class="col-md-6"><label class="form-label" for="adminLastName">Surname</label><input id="adminLastName" class="form-control" value="${escapeHtml(wizard.lastName)}" required /></div>
                <div class="col-12"><label class="form-label" for="adminInviteEmail">Email</label><input id="adminInviteEmail" class="form-control" type="email" value="${escapeHtml(wizard.email)}" required /><div class="form-text">This email will also be used as the username and invitation email.</div></div>
                <div class="col-12"><label class="form-label" for="adminInviteSlackUserId">Invitation Slack user ID</label><input id="adminInviteSlackUserId" class="form-control" value="${escapeHtml(wizard.inviteSlackUserId)}" placeholder="U012ABCDEF" required /><div class="form-text">The private registration link will be sent to this Slack user.</div></div>
              </div>` : step === 2 ? `
              <label class="form-label" for="adminUserRole">Role</label>
              <select id="adminUserRole" class="form-select"><option value="qa_manager" ${roleIsAdmin ? "" : "selected"}>QA manager</option><option value="admin" ${roleIsAdmin ? "selected" : ""}>Admin</option></select>
              <div class="form-text mt-2">QA managers receive QA access. Admins can be granted additional management permissions in the next step.</div>` : `
              <div class="invite-summary"><strong>${escapeHtml(`${wizard.firstName} ${wizard.lastName}`.trim())}</strong><span>${escapeHtml(wizard.email)}</span><span>${roleIsAdmin ? "Admin" : "QA manager"} · Slack ${escapeHtml(wizard.inviteSlackUserId)}</span></div>
              ${roleIsAdmin ? `<div class="d-grid gap-2 mt-3">
                <label class="analytics-check-option"><input id="adminCanManageUsers" class="form-check-input" type="checkbox" ${wizard.canManageUsers ? "checked" : ""} /><span><strong>Can delete/deactivate users</strong><small>Allows LiveChat suspend and HelpDesk delete actions</small></span></label>
                <label class="analytics-check-option"><input id="adminCanManageAdmins" class="form-check-input" type="checkbox" ${wizard.canManageAdmins ? "checked" : ""} /><span><strong>Can manage admin accounts</strong><small>Allows permission changes and 2FA resets for others</small></span></label>
              </div>` : `<p class="subtle mt-3 mb-0">QA manager permissions are applied automatically.</p>`}`}
            <div class="action-row mt-4">
              ${step > 1 ? '<button id="adminInviteBackBtn" class="btn btn-outline-secondary" type="button">Back</button>' : ""}
              <button class="btn btn-primary" type="submit">${step === 3 ? "Create & send Slack invite" : "Continue"}</button>
            </div>
          </form>
        </div>
      </div>`;
    return;
  }
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
      <div class="modal-card ${isLiveChatUser ? "livechat-agent-modal" : ""}">
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
                <div class="editor-shell ${isLiveChatUser ? "livechat-agent-groups-panel" : ""}">
                  <div class="agent-groups-heading"><div><span class="ui-eyebrow">Access management</span><div class="section-title">${isLiveChatUser ? "Add groups" : "Change memberships"}</div></div>${isLiveChatUser ? `<span class="chip">${Number(state.modalAgent.groups?.length || 0)} current</span>` : ""}</div>
                  <div class="toolbar-row">
                    <input id="modalSearchInput" class="form-control" type="search" placeholder="Search groups" value="${escapeHtml(state.modalSearch)}" />
                    <button id="modalSelectAllBtn" class="btn btn-outline-secondary" type="button"><i class="bi bi-check2-square"></i> Select shown</button>
                    <button id="modalClearBtn" class="btn btn-outline-secondary" type="button"><i class="bi bi-x-square"></i> Clear</button>
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
                    <button id="saveModalBtn" class="btn btn-primary" type="button">${isLiveChatUser ? '<i class="bi bi-plus-lg"></i> Add selected groups' : "Save"}</button>
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
  const appView = document.getElementById("appView");
  const sidebarToggle = document.getElementById("sidebarToggleBtn");
  appView?.classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
  if (sidebarToggle) {
    sidebarToggle.setAttribute("aria-expanded", state.sidebarCollapsed ? "false" : "true");
    sidebarToggle.setAttribute("aria-label", state.sidebarCollapsed ? "Show main menu" : "Hide main menu");
    sidebarToggle.innerHTML = `<i class="bi ${state.sidebarCollapsed ? "bi-layout-sidebar-inset-reverse" : "bi-layout-sidebar-inset"}"></i>`;
  }
  ensureAllowedSection();
  syncSidebarAccess();
  pageTitle.textContent = currentSectionTitle();
  if (state.section !== "helpdesk-tickets") {
    stopHelpdeskTicketsRealtime();
  }
  if (state.section !== "helpdesk-workflows") {
    stopHelpdeskWorkflowsRealtime();
  }
  document.querySelectorAll(".sidebar-link").forEach((button) => {
    const section = button.dataset.section;
    const active =
      section === state.section ||
      (section === "livechat-ai-qa-tagging" &&
        ["livechat-ai-qa-review", "livechat-agent-qa-review", "livechat-agent-qa-leaderboard", "livechat-ai-qa-pre-review-analytics"].includes(state.section));
    button.classList.toggle("active", active);
  });

  if (state.section === "qa-dashboard") {
    appContent.innerHTML = renderQaDashboard();
    filterBar.classList.add("d-none");
  } else if (state.section === "livechat-users") {
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
  } else if (state.section === "livechat-ai-qa-tagging") {
    appContent.innerHTML = renderLivechatAiQaTagging();
    filterBar.classList.add("d-none");
  } else if (state.section === "livechat-ai-qa-review") {
    appContent.innerHTML = renderLivechatAiQaReview();
    filterBar.classList.add("d-none");
  } else if (state.section === "livechat-agent-qa-review") {
    appContent.innerHTML = renderLivechatAgentQaReview();
    filterBar.classList.add("d-none");
  } else if (state.section === "livechat-agent-qa-leaderboard") {
    appContent.innerHTML = renderAgentQaLeaderboard();
    filterBar.classList.add("d-none");
  } else if (state.section === "livechat-ai-qa-pre-review-analytics") {
    appContent.innerHTML = renderLivechatAiQaPreReviewAnalytics();
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
    state.section === "qa-dashboard" &&
    !state.qaDashboard.loading &&
    !state.qaDashboard.loaded &&
    !state.qaDashboard.error
  ) {
    fetchQaDashboard();
  }

  if (
    state.section === "livechat-ai-qa-tagging" &&
    !state.livechatAiQa.loading &&
    !state.livechatAiQa.loaded &&
    !state.livechatAiQa.error
  ) {
    fetchLivechatAiQaTagging();
  }
  if (
    ["livechat-ai-qa-review", "livechat-agent-qa-review"].includes(state.section) &&
    !state.livechatAiQaManagement.loading &&
    !state.livechatAiQaManagement.data &&
    !state.livechatAiQaManagement.error
  ) {
    fetchLivechatAiQaManagement();
  }

  if (
    state.section === "livechat-ai-qa-review" &&
    !state.livechatAiQaReview.loading &&
    !state.livechatAiQaReview.loaded &&
    !state.livechatAiQaReview.error
  ) {
    fetchLivechatAiQaReviews();
  }

  if (
    state.section === "livechat-agent-qa-review" &&
    !state.livechatAgentQaReview.loading &&
    !state.livechatAgentQaReview.loaded &&
    !state.livechatAgentQaReview.error
  ) {
    fetchLivechatAgentQaReviews();
  }

  if (
    state.section === "livechat-agent-qa-leaderboard" &&
    !state.livechatAgentQaLeaderboard.loading &&
    !state.livechatAgentQaLeaderboard.loaded &&
    !state.livechatAgentQaLeaderboard.error
  ) {
    fetchLivechatAgentQaLeaderboard();
  }
  if (
    state.section === "livechat-ai-qa-pre-review-analytics" &&
    !state.livechatAiQaPreReviewAnalytics.loading &&
    !state.livechatAiQaPreReviewAnalytics.loaded &&
    !state.livechatAiQaPreReviewAnalytics.error
  ) {
    fetchLivechatAiQaPreReviewAnalytics();
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
  refreshBtn.disabled = true;
  const canLoadAdminData = canManageAdmins();
  const canLoadManagementData = isAdminRole();
  const warnings = [];
  const load = async (label, request, applyResult) => {
    try {
      const result = await request;
      applyResult(result);
      renderApp();
    } catch (error) {
      warnings.push(`${label}: ${error.message}`);
    }
  };

  try {
    await Promise.all([
      load("LiveChat", api("/api/livechat/dashboard", { timeoutMs: 20000 }), (result) => {
        state.livechat = result;
      }),
      load("HelpDesk", api("/api/helpdesk/dashboard", { timeoutMs: 20000 }), (result) => {
        state.helpdesk = result;
        applyDefaultHelpdeskAnalyticsAgents();
      }),
      ...(canLoadAdminData
        ? [
            load("Admin users", api("/api/admin-users", { timeoutMs: 15000 }), (result) => {
              state.adminUsers = result.adminUsers || [];
            }),
            load("Logs", api("/api/logs", { timeoutMs: 15000 }), (result) => {
              state.logs = result.logs || [];
              state.logsWarning = result.warning || "";
              if (state.logsWarning) warnings.push(state.logsWarning);
            }),
          ]
        : []),
      ...(canLoadManagementData
        ? [
            load("Workflows", api("/api/helpdesk/workflows", { timeoutMs: 15000 }), (result) => {
              state.helpdeskWorkflows.workflows = result.workflows || [];
              state.helpdeskWorkflows.webhookStats = result.webhookStats || state.helpdeskWorkflows.webhookStats;
            }),
          ]
        : []),
      load("HelpDesk analytics webhooks", api("/api/helpdesk/analytics-webhooks", { timeoutMs: 15000 }), (result) => {
        state.helpdesk_analytics.webhookStats = result;
      }),
    ]);
  } finally {
    refreshBtn.disabled = false;
    renderApp();
    setMessage(
      statusMessage,
      warnings.length ? `Updated with warnings. ${warnings.join(" | ")}` : "Updated.",
      warnings.length ? "error" : "success",
    );
  }
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
  bindClick("sidebarToggleBtn", () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    window.localStorage.setItem("mainSidebarCollapsed", state.sidebarCollapsed ? "1" : "0");
    renderApp();
  });
  bindClick("sidebarBackdrop", () => {
    state.sidebarCollapsed = true;
    renderApp();
  });
  bindClick("qaDashboardOpenCombined", () => {
    state.section = "livechat-ai-qa-review";
    renderApp();
  });
  bindClick("qaDashboardReload", () => fetchQaDashboard());
  bindClick("combinedAiQaPanelToggle", () => {
    state.livechatAiQaReview.decisionPanel = state.livechatAiQaReview.decisionPanel === "agent" ? "auto" : "agent";
    renderApp();
  });
  document.querySelectorAll(".sidebar-link").forEach((button) => {
    button.onclick = () => {
      if (!canAccessSection(button.dataset.section)) return;
      state.section = button.dataset.section;
      if (window.matchMedia("(max-width: 1199.98px)").matches) state.sidebarCollapsed = true;
      renderApp();
    };
  });

  const bindSearch = (id, stateKey) => {
    document.getElementById(id)?.addEventListener("input", (event) => {
      const value = event.target.value;
      if (stateKey.includes(".")) {
        const [root, key] = stateKey.split(".");
        if (state[root] && key) {
          state[root][key] = value;
        }
      } else {
        state[stateKey] = value;
      }
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
  bindClick("livechatAiQaFilterBtn", () => {
    syncLivechatAiQaFiltersFromDom();
    fetchLivechatAiQaTagging();
  });
  bindClick("livechatAiQaResetBtn", () => {
    resetLivechatAiQaFilters();
    fetchLivechatAiQaTagging();
  });
  bindClick("livechatAiQaReloadBtn", () => {
    fetchLivechatAiQaTagging();
  });
  document.querySelectorAll("[data-livechat-ai-qa-sort]").forEach((button) => {
    button.onclick = () => {
      const sort = button.dataset.livechatAiQaSort;
      if (state.livechatAiQa.sort === sort) {
        state.livechatAiQa.order = state.livechatAiQa.order === "asc" ? "desc" : "asc";
      } else {
        state.livechatAiQa.sort = sort;
        state.livechatAiQa.order = "desc";
      }
      state.livechatAiQa.page = 1;
      fetchLivechatAiQaTagging();
    };
  });
  document.querySelectorAll("[data-livechat-ai-qa-page]").forEach((button) => {
    button.onclick = () => {
      const direction = button.dataset.livechatAiQaPage;
      const totalPages = Math.max(1, Math.ceil((state.livechatAiQa.total || 0) / state.livechatAiQa.pageSize));
      state.livechatAiQa.page = direction === "next"
        ? Math.min(totalPages, state.livechatAiQa.page + 1)
        : Math.max(1, state.livechatAiQa.page - 1);
      fetchLivechatAiQaTagging();
    };
  });
  document.querySelectorAll("[data-livechat-ai-qa-toggle]").forEach((row) => {
    row.onclick = () => {
      const key = row.dataset.livechatAiQaToggle;
      if (state.livechatAiQa.expanded.has(key)) {
        state.livechatAiQa.expanded.delete(key);
      } else {
        state.livechatAiQa.expanded.add(key);
      }
      renderApp();
    };
  });
  bindClick("aiQaReviewFilterBtn", () => {
    syncLivechatAiQaReviewFiltersFromDom();
    fetchLivechatAiQaReviews();
  });
  document.getElementById("qaManagementUsername")?.addEventListener("change", (event) => {
    state.livechatAiQaManagement.username = event.target.value;
    fetchLivechatAiQaManagement();
  });
  bindClick("qaManagementFilterBtn", () => {
    state.livechatAiQaManagement.from = document.getElementById("qaManagementFrom")?.value || "";
    state.livechatAiQaManagement.to = document.getElementById("qaManagementTo")?.value || "";
    fetchLivechatAiQaManagement();
  });
  document.querySelectorAll("[data-qa-queue-save]").forEach((button) => {
    button.onclick = async () => {
      const reviewType = button.dataset.qaQueueSave;
      const enabled = document.querySelector(`[data-qa-queue-enabled="${reviewType}"]`)?.checked || false;
      const targetQueueSize = Number(document.querySelector(`[data-qa-queue-size="${reviewType}"]`)?.value || 20);
      await withBusyState(async () => {
        await api("/api/livechat/ai-qa-management", {
          method: "PATCH",
          body: { username: state.livechatAiQaManagement.username || state.user, reviewType, enabled, targetQueueSize },
        });
        await fetchLivechatAiQaManagement();
        await Promise.all([
          fetchLivechatAiQaReviews({ keepSelection: true }),
          fetchLivechatAgentQaReviews({ keepSelection: true }),
        ]);
      }, "QA queue settings saved.");
    };
  });
  bindClick("qaManagementReleaseBtn", async () => {
    if (!window.confirm("Release all pending assigned reviews for this user?")) return;
    await withBusyState(async () => {
      await api("/api/livechat/ai-qa-management", {
        method: "POST",
        body: { action: "release", username: state.livechatAiQaManagement.username || state.user },
      });
      await fetchLivechatAiQaManagement();
    }, "Pending QA queue released.");
  });
  bindClick("aiQaReviewResetBtn", () => {
    resetLivechatAiQaReviewFilters();
    fetchLivechatAiQaReviews();
  });
  bindClick("aiQaReviewsReloadBtn", () => {
    fetchLivechatAiQaReviews({ keepSelection: true });
  });
  bindClick("aiQaReviewsProcessBtn", () => {
    processLivechatAiQaReviews({ selected: false, force: false });
  });
  bindClick("aiQaApproveBtn", () => {
    approveLivechatAiQaReview();
  });
  bindClick("aiQaCorrectBtn", () => {
    correctLivechatAiQaReview();
  });
  bindClick("aiQaRetryBtn", () => {
    processLivechatAiQaReviews({ selected: true, force: true });
  });
  document.querySelectorAll('input[name="aiQaFinalTag"]').forEach((input) => {
    input.onchange = () => {
      refreshAiQaFeedbackVisibility();
      markAiQaReviewDirty("auto");
    };
  });
  document.querySelectorAll("[data-ai-qa-feedback-tag], #aiQaDecisionNote").forEach((input) => {
    input.oninput = () => markAiQaReviewDirty("auto");
  });
  document.querySelectorAll("[data-ai-qa-review-open]").forEach((button) => {
    button.onclick = () => {
      fetchLivechatAiQaReviewDetail(button.dataset.aiQaReviewOpen);
    };
    button.onkeydown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        fetchLivechatAiQaReviewDetail(button.dataset.aiQaReviewOpen);
      }
    };
  });
  document.querySelectorAll("[data-ai-qa-review-page]").forEach((button) => {
    button.onclick = () => {
      const direction = button.dataset.aiQaReviewPage;
      const totalPages = Math.max(1, Math.ceil((state.livechatAiQaReview.total || 0) / state.livechatAiQaReview.pageSize));
      state.livechatAiQaReview.page =
        direction === "next"
          ? Math.min(totalPages, state.livechatAiQaReview.page + 1)
          : Math.max(1, state.livechatAiQaReview.page - 1);
      fetchLivechatAiQaReviews();
    };
  });
  bindClick("agentQaReviewFilterBtn", () => {
    syncLivechatAgentQaReviewFiltersFromDom();
    fetchLivechatAgentQaReviews();
  });
  bindClick("agentQaReviewResetBtn", () => {
    resetLivechatAgentQaReviewFilters();
    fetchLivechatAgentQaReviews();
  });
  bindClick("agentQaReviewsReloadBtn", () => {
    fetchLivechatAgentQaReviews({ keepSelection: true });
  });
  bindClick("agentQaReviewsProcessBtn", () => {
    processLivechatAgentQaReviews({ selected: false, force: false });
  });
  bindClick("agentQaApproveBtn", () => {
    approveLivechatAgentQaReview();
  });
  bindClick("agentQaCorrectBtn", () => {
    correctLivechatAgentQaReview();
  });
  bindClick("agentQaRetryBtn", () => {
    processLivechatAgentQaReviews({ selected: true, force: true });
  });
  bindClick("agentQaCreateAndRunBtn", () => {
    createAndProcessMissingAgentQaReview();
  });
  bindClick("agentQaProcessMissing30Btn", () => {
    processThirtyMissingAgentQaReviews();
  });
  document.querySelectorAll('select[name="agentQaFinalTag"]').forEach((select) => {
    select.onchange = () => {
      refreshAgentQaFeedbackVisibility();
      markAiQaReviewDirty("agent");
    };
  });
  document.querySelectorAll("[data-agent-qa-feedback-rule], #agentQaDecisionNote").forEach((input) => {
    input.oninput = () => markAiQaReviewDirty("agent");
  });
  document.querySelectorAll("[data-agent-qa-review-open]").forEach((button) => {
    button.onclick = () => {
      fetchLivechatAgentQaReviewDetail(button.dataset.agentQaReviewOpen);
    };
    button.onkeydown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        fetchLivechatAgentQaReviewDetail(button.dataset.agentQaReviewOpen);
      }
    };
  });
  document.querySelectorAll("[data-agent-qa-review-page]").forEach((button) => {
    button.onclick = () => {
      const direction = button.dataset.agentQaReviewPage;
      const totalPages = Math.max(1, Math.ceil((state.livechatAgentQaReview.total || 0) / state.livechatAgentQaReview.pageSize));
      state.livechatAgentQaReview.page =
        direction === "next"
          ? Math.min(totalPages, state.livechatAgentQaReview.page + 1)
          : Math.max(1, state.livechatAgentQaReview.page - 1);
      fetchLivechatAgentQaReviews();
    };
  });
  bindClick("agentQaLeaderboardFilterBtn", () => {
    syncAgentQaLeaderboardFiltersFromDom();
    fetchLivechatAgentQaLeaderboard();
  });
  bindClick("agentQaLeaderboardResetBtn", () => {
    state.livechatAgentQaLeaderboard.filters = { from: "", to: "", agent: "" };
    fetchLivechatAgentQaLeaderboard();
  });
  bindClick("agentQaLeaderboardReloadBtn", () => {
    fetchLivechatAgentQaLeaderboard();
  });
  bindClick("aiQaPreAnalyticsFilterBtn", () => {
    syncAiQaPreReviewAnalyticsFiltersFromDom();
    fetchLivechatAiQaPreReviewAnalytics();
  });
  bindClick("aiQaPreAnalyticsResetBtn", () => {
    state.livechatAiQaPreReviewAnalytics.filters = {
      from: aiQaManagementDate(30),
      to: aiQaManagementDate(0),
      reviewType: "all",
      reviewer: "",
    };
    fetchLivechatAiQaPreReviewAnalytics();
  });
  bindClick("aiQaPreAnalyticsReloadBtn", () => {
    fetchLivechatAiQaPreReviewAnalytics();
  });
  document.querySelectorAll("[data-ai-billing-range]").forEach((button) => {
    button.onclick = () => {
      state.livechatAiQaPreReviewAnalytics.billingRange = button.dataset.aiBillingRange || "24h";
      fetchLivechatAiQaPreReviewAnalytics();
    };
  });
  document.querySelectorAll("[data-livechat-chat-link]").forEach((link) => {
    link.onclick = (event) => event.stopPropagation();
    link.onkeydown = (event) => event.stopPropagation();
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

  refreshBtn.onclick = () => refreshData();

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

  bindClick("copyAdminInviteBtn", async () => {
    if (!state.lastAdminInvite?.inviteLink) return;
    await navigator.clipboard.writeText(state.lastAdminInvite.inviteLink);
    setMessage(statusMessage, "Invitation link copied.", "success");
  });

  bindClick("openAdminInviteWizardBtn", () => {
    state.adminInviteWizard = {
      step: 1,
      firstName: "",
      lastName: "",
      email: "",
      inviteSlackUserId: "",
      userRole: "qa_manager",
      canManageUsers: false,
      canManageAdmins: false,
    };
    renderModal();
    bindAppEvents();
  });
  bindClick("closeAdminInviteWizardBtn", () => {
    state.adminInviteWizard = null;
    renderModal();
  });
  bindClick("adminInviteBackBtn", () => {
    state.adminInviteWizard.step -= 1;
    renderModal();
    bindAppEvents();
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

  document.getElementById("adminInviteWizardForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const wizard = state.adminInviteWizard;
    if (!wizard) return;
    if (wizard.step === 1) {
      wizard.firstName = document.getElementById("adminFirstName").value.trim();
      wizard.lastName = document.getElementById("adminLastName").value.trim();
      wizard.email = document.getElementById("adminInviteEmail").value.trim();
      wizard.inviteSlackUserId = document.getElementById("adminInviteSlackUserId").value.trim();
      wizard.step = 2;
      renderModal();
      bindAppEvents();
      return;
    }
    if (wizard.step === 2) {
      wizard.userRole = document.getElementById("adminUserRole").value;
      wizard.canManageUsers = wizard.userRole === "admin" && wizard.canManageUsers;
      wizard.canManageAdmins = wizard.userRole === "admin" && wizard.canManageAdmins;
      wizard.step = 3;
      renderModal();
      bindAppEvents();
      return;
    }
    wizard.canManageUsers = document.getElementById("adminCanManageUsers")?.checked || false;
    wizard.canManageAdmins = document.getElementById("adminCanManageAdmins")?.checked || false;
    await withBusyState(async () => {
      await api("/api/admin-users", {
        method: "POST",
        body: {
          username: wizard.email,
          firstName: wizard.firstName,
          lastName: wizard.lastName,
          inviteEmail: wizard.email,
          inviteSlackUserId: wizard.inviteSlackUserId,
          userRole: wizard.userRole,
          accessLevel: wizard.userRole === "qa_manager" ? "qa_manager" : "full",
          canManageUsers: wizard.canManageUsers,
          canManageAdmins: wizard.canManageAdmins,
        },
      }).then((result) => {
        state.lastAdminInvite = result.invite || null;
        state.adminInviteWizard = null;
      });
    }, "Invitation created. Check the Slack delivery status below.");
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
            userRole: user.user_role || "admin",
            accessLevel: user.access_level || "",
            firstName: user.first_name || "",
            lastName: user.last_name || "",
            inviteEmail: user.invite_email || "",
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
  setMessage(loginMessage, state.inviteSetup ? "Setting up account..." : "Signing in...");

  try {
    const formData = new FormData(loginForm);
    if (state.inviteSetup) {
      const result = await api("/api/auth/invite-setup", {
        method: "POST",
        body: {
          token: state.inviteSetup.token,
          username: `${formData.get("username") || ""}`.trim(),
          password: `${formData.get("inviteNewPassword") || ""}`,
          otp: `${formData.get("inviteOtp") || ""}`,
          setupSecret: `${formData.get("setupSecret") || state.inviteSetup.setupSecret || ""}`,
        },
      });
      if (!result.ok && result.requiresInviteSetup) {
        state.inviteSetup = {
          ...state.inviteSetup,
          username: `${formData.get("username") || ""}`.trim(),
          setupSecret: result.setupSecret || "",
          otpauthUri: result.otpauthUri || "",
        };
        renderLoginChallenge();
        setMessage(loginMessage, result.message || "Continue account setup.", "info");
        return;
      }
      state.inviteSetup = null;
      window.history.replaceState({}, document.title, window.location.pathname);
      setMessage(loginMessage, "Account is ready. Sign in with your new password.", "success");
      loginForm.reset();
      renderLoginChallenge();
      return;
    }

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
