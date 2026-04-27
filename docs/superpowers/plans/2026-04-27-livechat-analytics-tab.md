# LiveChat Analytics Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Analytics tab to the LiveChat section showing per-agent ticket counts, avg FTR, and CSAT with daily breakdowns, a leaderboard, and top-5 panels.

**Architecture:** A new Cloudflare Worker function `functions/api/livechat/analytics.js` calls the LiveChat Reports API (`agents/performance` + `chats/ratings`) in parallel for both the selected period and prev period, aggregates the data, and returns a single JSON response. The frontend adds an `#analytics-pane` section to `index.html`, new state/render functions to `script.js`, and scoped CSS to `styles.css`.

**Tech Stack:** Cloudflare Pages Functions (ES modules), Bootstrap 5.3 dark theme, vanilla JS, LiveChat Reports API v3.6.

**Spec:** `docs/superpowers/specs/2026-04-27-livechat-analytics-tab-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `functions/api/livechat/analytics.js` | **Create** | Worker endpoint — fetches & aggregates Reports API data |
| `functions/_lib/livechat.js` | **Modify** | Add `livechatReportsRequest()` helper for the Reports API base URL |
| `index.html` | **Modify** | Add sidebar link + `#analytics-pane` HTML skeleton |
| `script.js` | **Modify** | Add analytics state, `initAnalytics()`, `fetchAnalytics()`, `renderAnalytics()`, `formatFtr()`, `formatDelta()` |
| `styles.css` | **Modify** | Add `.analytics-card`, `.leaderboard-table`, `.top5-panel` scoped styles |

---

## Task 1: Add `livechatReportsRequest()` to `_lib/livechat.js`

The existing `livechatRequest()` posts to the Configuration API (`api.livechatinc.com/v3.6/configuration/action`). The Reports API uses a different base (`api.livechatinc.com/v3.6/reports`). We need a separate helper.

**Files:**
- Modify: `functions/_lib/livechat.js`

- [ ] **Step 1: Append the helper to `_lib/livechat.js`**

Open `functions/_lib/livechat.js`. Append after all existing exports:

```js
function getReportsBaseUrl(env) {
  const version = env.LIVECHAT_API_VERSION || DEFAULT_LIVECHAT_API_VERSION;
  return `https://api.livechatinc.com/${version}/reports`;
}

export async function livechatReportsRequest(env, path, body = {}) {
  if (!env.TEXT_BASIC_AUTH_B64) {
    throw new Error("Missing TEXT_BASIC_AUTH_B64 environment variable.");
  }

  const response = await fetch(`${getReportsBaseUrl(env)}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${env.TEXT_BASIC_AUTH_B64}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(payload, `LiveChat reports${path} failed.`)
    );
  }

  return payload;
}
```

- [ ] **Step 2: Commit**

```bash
git add functions/_lib/livechat.js
git commit -m "feat: add livechatReportsRequest helper for Reports API"
```

---

## Task 2: Create `functions/api/livechat/analytics.js`

Accepts `GET ?from=&to=&timezone=&agents=`, fires 2+2 parallel upstream calls (current + prev period), returns aggregated JSON.

**Upstream response shapes:**

`POST /agents/performance` with `{ filters: { from, to, agents: { values: [...] } }, distribution: "day", timezone }` returns:
```json
{
  "agents": {
    "alice@co.com": { "chats_count": 32, "first_response_time": { "avg": 7680 } }
  },
  "distribution": {
    "2026-04-21": {
      "agents": { "alice@co.com": { "chats_count": 8, "first_response_time": { "avg": 7500 } } }
    }
  }
}
```
`first_response_time.avg` is in **seconds** — multiply by 1000 for ms.

`POST /chats/ratings` with same filters returns:
```json
{
  "agents": { "alice@co.com": { "ratings": { "good": 28, "bad": 2 } } },
  "distribution": { "2026-04-21": { "agents": { "alice@co.com": { "ratings": { "good": 7, "bad": 1 } } } } }
}
```
CSAT = `good / (good + bad) * 5`, one decimal. If both 0 → `null`.

**Files:**
- Create: `functions/api/livechat/analytics.js`

- [ ] **Step 1: Create the file**

```js
import { requireAuth } from "../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed } from "../../_lib/http.js";
import { livechatReportsRequest } from "../../_lib/livechat.js";

function ratingsToCSAT(ratings) {
  if (!ratings) return null;
  const total = (ratings.good || 0) + (ratings.bad || 0);
  if (total === 0) return null;
  return Math.round(((ratings.good || 0) / total) * 50) / 10;
}

async function fetchPeriodData(env, from, to, timezone, agentEmails) {
  const agentsFilter = agentEmails.length ? { agents: { values: agentEmails } } : {};
  const baseFilters = { from, to, ...agentsFilter };

  const [perfData, ratingsData] = await Promise.all([
    livechatReportsRequest(env, "/agents/performance", {
      filters: baseFilters,
      distribution: "day",
      timezone,
    }),
    livechatReportsRequest(env, "/chats/ratings", {
      filters: baseFilters,
      distribution: "day",
      timezone,
    }),
  ]);

  const agentMap = {};

  const perfAgents = perfData.agents || {};
  for (const [email, data] of Object.entries(perfAgents)) {
    agentMap[email] = {
      email,
      total_tickets: data.chats_count || 0,
      avg_ftr_ms: (data.first_response_time?.avg || 0) * 1000,
      avg_csat: null,
      days: {},
    };
  }

  const ratingsAgents = ratingsData.agents || {};
  for (const [email, data] of Object.entries(ratingsAgents)) {
    if (!agentMap[email]) {
      agentMap[email] = { email, total_tickets: 0, avg_ftr_ms: 0, avg_csat: null, days: {} };
    }
    agentMap[email].avg_csat = ratingsToCSAT(data.ratings);
  }

  const perfDist = perfData.distribution || {};
  for (const [date, dayData] of Object.entries(perfDist)) {
    const dayAgents = dayData.agents || {};
    for (const [email, data] of Object.entries(dayAgents)) {
      if (!agentMap[email]) {
        agentMap[email] = { email, total_tickets: 0, avg_ftr_ms: 0, avg_csat: null, days: {} };
      }
      agentMap[email].days[date] = {
        date,
        tickets: data.chats_count || 0,
        avg_ftr_ms: (data.first_response_time?.avg || 0) * 1000,
        avg_csat: null,
      };
    }
  }

  const ratingsDist = ratingsData.distribution || {};
  for (const [date, dayData] of Object.entries(ratingsDist)) {
    const dayAgents = dayData.agents || {};
    for (const [email, data] of Object.entries(dayAgents)) {
      if (agentMap[email]?.days[date]) {
        agentMap[email].days[date].avg_csat = ratingsToCSAT(data.ratings);
      }
    }
  }

  const agents = Object.values(agentMap).map((a) => ({
    ...a,
    days: Object.values(a.days).sort((x, y) => x.date.localeCompare(y.date)),
  }));

  const totalTickets = agents.reduce((s, a) => s + a.total_tickets, 0);
  const activeAgents = agents.filter((a) => a.total_tickets > 0).length;
  const csatAgents = agents.filter((a) => a.avg_csat !== null);
  const avgCsat = csatAgents.length
    ? Math.round((csatAgents.reduce((s, a) => s + a.avg_csat, 0) / csatAgents.length) * 10) / 10
    : null;
  const ftrAgents = agents.filter((a) => a.avg_ftr_ms > 0);
  const avgFtrMs = ftrAgents.length
    ? Math.round(ftrAgents.reduce((s, a) => s + a.avg_ftr_ms, 0) / ftrAgents.length)
    : 0;

  return {
    summary: { total_tickets: totalTickets, avg_ftr_ms: avgFtrMs, avg_csat: avgCsat, active_agents: activeAgents },
    agents,
  };
}

export async function onRequest(context) {
  if (context.request.method !== "GET") return methodNotAllowed(["GET"]);

  const auth = await requireAuth(context);
  if (auth.error) return auth.error;

  const url = new URL(context.request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const timezone = url.searchParams.get("timezone") || "UTC";
  const agentsParam = url.searchParams.get("agents") || "";
  const agentEmails = agentsParam ? agentsParam.split(",").map((s) => s.trim()).filter(Boolean) : [];

  if (!from || !to) return errorResponse("Missing required params: from, to", 400);

  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  const durationMs = toMs - fromMs;
  const prevTo = new Date(fromMs - 1).toISOString();
  const prevFrom = new Date(fromMs - durationMs - 1).toISOString();

  try {
    const [current, prev] = await Promise.all([
      fetchPeriodData(context.env, from, to, timezone, agentEmails),
      fetchPeriodData(context.env, prevFrom, prevTo, timezone, agentEmails),
    ]);

    return json({
      period: { from, to },
      summary: { ...current.summary, prev_period: prev.summary },
      agents: current.agents,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add functions/api/livechat/analytics.js
git commit -m "feat: add livechat analytics worker function"
```

---

## Task 3: Add sidebar link and `#analytics-pane` to `index.html`

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add sidebar link**

Find in `index.html`:
```html
<button class="sidebar-link" data-section="create-livechat-user">Create user</button>
```

Add immediately after:
```html
<button class="sidebar-link" data-section="livechat-analytics">Analytics</button>
```

- [ ] **Step 2: Add pane div**

Find the content area where other livechat panes live (search for `id="livechat-users-pane"` or the equivalent section container). Add a new pane immediately after the last livechat pane:

```html
<div id="livechat-analytics-pane" class="section-pane d-none">
  <div id="analyticsFilterBar" class="analytics-filter-bar mb-3"></div>
  <div id="analyticsCards" class="row g-3 mb-3"></div>
  <div id="analyticsTop5" class="row g-3 mb-3"></div>
  <div id="analyticsLeaderboard" class="analytics-leaderboard-wrap"></div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add analytics sidebar link and pane skeleton"
```

---

## Task 4: Add analytics state and helper functions to `script.js`

**Files:**
- Modify: `script.js`

- [ ] **Step 1: Add `analytics` key to `state` object**

Find `const state = {` and add at the end of the object body (before closing `}`):

```js
  analytics: {
    loading: false,
    error: null,
    filters: {
      preset: "last_7_days",
      from: null,
      to: null,
      timezone: localStorage.getItem("analyticsTimezone") ||
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      agents: [],
      compare: true,
    },
    data: null,
  },
```

- [ ] **Step 2: Add `formatFtr()`, `analyticsPresetRange()`, `shiftAnalyticsPeriod()` after the `state` object**

```js
function formatFtr(ms) {
  if (!ms) return "—";
  const totalSec = Math.round(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function analyticsPresetRange(preset) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const startOfDay = (d) => new Date(`${dateStr(d)}T00:00:00`);
  const endOfDay = (d) => new Date(`${dateStr(d)}T23:59:59`);
  const startOfWeek = (d) => {
    const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
    const m = new Date(d); m.setDate(d.getDate() + diff); return startOfDay(m);
  };
  const startOfMonth = (d) => new Date(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-01T00:00:00`);

  switch (preset) {
    case "today": return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": { const y = new Date(now); y.setDate(now.getDate() - 1); return { from: startOfDay(y), to: endOfDay(y) }; }
    case "last_7_days": { const f = new Date(now); f.setDate(now.getDate() - 6); return { from: startOfDay(f), to: endOfDay(now) }; }
    case "last_30_days": { const f = new Date(now); f.setDate(now.getDate() - 29); return { from: startOfDay(f), to: endOfDay(now) }; }
    case "this_week": return { from: startOfWeek(now), to: endOfDay(now) };
    case "last_week": { const lws = new Date(startOfWeek(now)); lws.setDate(lws.getDate() - 7); const lwe = new Date(lws); lwe.setDate(lws.getDate() + 6); return { from: lws, to: endOfDay(lwe) }; }
    case "this_month": return { from: startOfMonth(now), to: endOfDay(now) };
    case "last_month": { const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1); const lme = new Date(now.getFullYear(), now.getMonth(), 0); return { from: startOfDay(lm), to: endOfDay(lme) }; }
    default: { const f = new Date(now); f.setDate(now.getDate() - 6); return { from: startOfDay(f), to: endOfDay(now) }; }
  }
}

function shiftAnalyticsPeriod(dir) {
  const f = state.analytics.filters;
  const isWeekly = ["this_week", "last_week", "last_7_days"].includes(f.preset);
  const days = isWeekly ? 7 : 30;
  const fromMs = new Date(f.from).getTime();
  const toMs = new Date(f.to).getTime();
  f.from = new Date(fromMs + dir * days * 86400000).toISOString();
  f.to = new Date(toMs + dir * days * 86400000).toISOString();
  f.preset = "custom";
  fetchAnalytics();
}
```

- [ ] **Step 3: Commit**

```bash
git add script.js
git commit -m "feat: add analytics state and date helpers"
```

---

## Task 5: Add `renderAnalyticsFilterBar()` and `fetchAnalytics()` to `script.js`

**Files:**
- Modify: `script.js`

- [ ] **Step 1: Add `renderAnalyticsFilterBar()`**

All dynamic values passed to innerHTML are run through `escapeHtml()`. This matches the existing pattern throughout `script.js`.

```js
function renderAnalyticsFilterBar() {
  const f = state.analytics.filters;
  const presets = [
    ["today","Today"],["yesterday","Yesterday"],
    ["last_7_days","Last 7 days"],["last_30_days","Last 30 days"],
    ["this_week","This week"],["last_week","Last week"],
    ["this_month","This month"],["last_month","Last month"],
  ];
  const canNavigate = !["today","yesterday"].includes(f.preset);
  const isWeekly = ["this_week","last_week","last_7_days"].includes(f.preset);
  const navUnit = isWeekly ? "week" : "month";

  const agentOptions = (state.livechat.agents || [])
    .map((a) => `<option value="${escapeHtml(a.email)}" ${f.agents.includes(a.email) ? "selected" : ""}>${escapeHtml(a.email)}</option>`)
    .join("");

  const tzList = [
    "UTC","America/New_York","America/Chicago","America/Denver","America/Los_Angeles",
    "Europe/London","Europe/Paris","Europe/Warsaw","Europe/Moscow",
    "Asia/Dubai","Asia/Kolkata","Asia/Singapore","Asia/Tokyo",
    "Australia/Sydney","Pacific/Auckland",
  ];
  if (!tzList.includes(f.timezone)) tzList.unshift(f.timezone);

  document.getElementById("analyticsFilterBar").innerHTML = `
    <div class="d-flex flex-wrap gap-2 align-items-center">
      <select class="form-select form-select-sm w-auto" id="analyticsPreset">
        ${presets.map(([v,l]) => `<option value="${v}" ${f.preset===v?"selected":""}>${l}</option>`).join("")}
      </select>
      <button class="btn btn-sm btn-outline-secondary" id="analyticsPrev" ${canNavigate?"":"disabled"}>&larr; Prev ${navUnit}</button>
      <button class="btn btn-sm btn-outline-secondary" id="analyticsNext" ${canNavigate?"":"disabled"}>Next ${navUnit} &rarr;</button>
      <select class="form-select form-select-sm w-auto" id="analyticsTimezone">
        ${tzList.map((tz) => `<option value="${escapeHtml(tz)}" ${f.timezone===tz?"selected":""}>${escapeHtml(tz)}</option>`).join("")}
      </select>
      <select class="form-select form-select-sm w-auto" id="analyticsAgents" multiple style="min-width:180px;height:36px">
        ${agentOptions}
      </select>
      <div class="form-check form-switch mb-0">
        <input class="form-check-input" type="checkbox" id="analyticsCompare" ${f.compare?"checked":""}>
        <label class="form-check-label small" for="analyticsCompare">Compare</label>
      </div>
    </div>`;

  document.getElementById("analyticsPreset").addEventListener("change", (e) => {
    state.analytics.filters.preset = e.target.value;
    fetchAnalytics();
  });
  document.getElementById("analyticsPrev").addEventListener("click", () => shiftAnalyticsPeriod(-1));
  document.getElementById("analyticsNext").addEventListener("click", () => shiftAnalyticsPeriod(1));
  document.getElementById("analyticsTimezone").addEventListener("change", (e) => {
    state.analytics.filters.timezone = e.target.value;
    localStorage.setItem("analyticsTimezone", e.target.value);
    fetchAnalytics();
  });
  document.getElementById("analyticsAgents").addEventListener("change", (e) => {
    state.analytics.filters.agents = Array.from(e.target.selectedOptions).map((o) => o.value);
    fetchAnalytics();
  });
  document.getElementById("analyticsCompare").addEventListener("change", (e) => {
    state.analytics.filters.compare = e.target.checked;
    renderAnalyticsCards();
  });
}
```

- [ ] **Step 2: Add `fetchAnalytics()`**

```js
async function fetchAnalytics() {
  const f = state.analytics.filters;
  if (f.preset !== "custom") {
    const range = analyticsPresetRange(f.preset);
    f.from = range.from.toISOString();
    f.to = range.to.toISOString();
  }
  state.analytics.loading = true;
  state.analytics.error = null;
  document.getElementById("analyticsCards").innerHTML =
    `<div class="col-12 text-secondary small">Loading&hellip;</div>`;
  document.getElementById("analyticsLeaderboard").innerHTML = "";
  document.getElementById("analyticsTop5").innerHTML = "";

  const params = new URLSearchParams({ from: f.from, to: f.to, timezone: f.timezone });
  if (f.agents.length) params.set("agents", f.agents.join(","));

  try {
    const data = await api(`/api/livechat/analytics?${params}`);
    state.analytics.data = data;
    renderAnalyticsFilterBar();
    renderAnalyticsCards();
    renderAnalyticsTop5();
    renderAnalyticsLeaderboard();
  } catch (err) {
    state.analytics.error = err.message;
    document.getElementById("analyticsCards").innerHTML =
      `<div class="col-12 text-danger small">Error: ${escapeHtml(err.message)}</div>`;
  } finally {
    state.analytics.loading = false;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add script.js
git commit -m "feat: add renderAnalyticsFilterBar and fetchAnalytics"
```

---

## Task 6: Add `renderAnalyticsCards()` to `script.js`

**Files:**
- Modify: `script.js`

- [ ] **Step 1: Add the function**

```js
function renderAnalyticsCards() {
  const el = document.getElementById("analyticsCards");
  if (!state.analytics.data) return;
  const s = state.analytics.data.summary;
  const p = s.prev_period;
  const compare = state.analytics.filters.compare;

  function numDeltaPill(current, prev, lowerIsBetter) {
    if (!compare || prev == null) return "";
    const diff = current - prev;
    if (diff === 0) return `<span class="badge bg-secondary ms-auto">&plusmn;0</span>`;
    const better = lowerIsBetter ? diff < 0 : diff > 0;
    const cls = better ? "bg-success" : "bg-danger";
    return `<span class="badge ${cls} ms-auto">${diff > 0 ? "+" : ""}${diff}</span>`;
  }

  function ftrDeltaPill(currentMs, prevMs) {
    if (!compare || !prevMs) return "";
    const diffMs = currentMs - prevMs;
    if (diffMs === 0) return `<span class="badge bg-secondary ms-auto">&plusmn;0</span>`;
    const cls = diffMs < 0 ? "bg-success" : "bg-danger";
    const sign = diffMs < 0 ? "&minus;" : "+";
    return `<span class="badge ${cls} ms-auto">${sign}${formatFtr(Math.abs(diffMs))}</span>`;
  }

  function csatDeltaPill(current, prev) {
    if (!compare || prev == null || current == null) return "";
    const diff = Math.round((current - prev) * 10) / 10;
    if (diff === 0) return `<span class="badge bg-secondary ms-auto">&plusmn;0</span>`;
    const cls = diff > 0 ? "bg-success" : "bg-danger";
    return `<span class="badge ${cls} ms-auto">${diff > 0 ? "+" : ""}${diff}</span>`;
  }

  function card(label, value, prevLabel, deltaPill) {
    const prevRow = compare
      ? `<div class="d-flex align-items-center gap-2 mt-2 pt-2 border-top border-secondary analytics-card-prev">
           <span class="text-secondary small">prev: ${prevLabel}</span>${deltaPill}
         </div>`
      : "";
    return `<div class="col-6 col-md-3">
      <div class="card glass-card analytics-card h-100">
        <div class="card-body">
          <div class="text-secondary small text-uppercase mb-1" style="letter-spacing:.05em">${label}</div>
          <div class="fs-3 fw-bold">${value}</div>
          ${prevRow}
        </div>
      </div>
    </div>`;
  }

  el.innerHTML =
    card("Total Tickets", s.total_tickets, String(p.total_tickets),
      numDeltaPill(s.total_tickets, p.total_tickets, false)) +
    card("Avg FTR", formatFtr(s.avg_ftr_ms), formatFtr(p.avg_ftr_ms),
      ftrDeltaPill(s.avg_ftr_ms, p.avg_ftr_ms)) +
    card("Avg CSAT", s.avg_csat !== null ? `${s.avg_csat} &#9733;` : "&#8212;",
      p.avg_csat !== null ? `${p.avg_csat} &#9733;` : "&#8212;",
      csatDeltaPill(s.avg_csat, p.avg_csat)) +
    card("Active Agents", s.active_agents, String(p.active_agents),
      numDeltaPill(s.active_agents, p.active_agents, false));
}
```

- [ ] **Step 2: Commit**

```bash
git add script.js
git commit -m "feat: add renderAnalyticsCards"
```

---

## Task 7: Add `renderAnalyticsTop5()` to `script.js`

**Files:**
- Modify: `script.js`

- [ ] **Step 1: Add the function**

```js
function renderAnalyticsTop5() {
  const el = document.getElementById("analyticsTop5");
  if (!state.analytics.data) return;
  const agents = state.analytics.data.agents;
  const medals = ["&#127947;","&#127948;","&#127949;","4.","5."];

  const byTickets = [...agents].sort((a, b) => b.total_tickets - a.total_tickets).slice(0, 5);
  const byFtr = [...agents].filter((a) => a.avg_ftr_ms > 0).sort((a, b) => a.avg_ftr_ms - b.avg_ftr_ms).slice(0, 5);

  function panel(title, rows, valueFn) {
    const items = rows.map((a, i) =>
      `<div class="d-flex align-items-center gap-2 py-1 border-bottom border-secondary">
         <span style="width:1.6rem">${medals[i]}</span>
         <span class="small text-truncate flex-grow-1">${escapeHtml(a.email)}</span>
         <span class="small fw-semibold text-nowrap">${valueFn(a)}</span>
       </div>`
    ).join("");
    return `<div class="col-12 col-md-6">
      <div class="card glass-card top5-panel h-100">
        <div class="card-body">
          <div class="text-secondary small text-uppercase mb-2" style="letter-spacing:.05em">${title}</div>
          ${items || '<div class="text-secondary small">No data</div>'}
        </div>
      </div>
    </div>`;
  }

  el.innerHTML =
    panel("Top 5 by Tickets", byTickets, (a) => `${a.total_tickets} tickets`) +
    panel("Top 5 by Avg FTR", byFtr, (a) => formatFtr(a.avg_ftr_ms));
}
```

- [ ] **Step 2: Commit**

```bash
git add script.js
git commit -m "feat: add renderAnalyticsTop5"
```

---

## Task 8: Add `renderAnalyticsLeaderboard()` to `script.js`

**Files:**
- Modify: `script.js`

- [ ] **Step 1: Add the function**

```js
function renderAnalyticsLeaderboard() {
  const el = document.getElementById("analyticsLeaderboard");
  if (!state.analytics.data) return;
  const { agents, period } = state.analytics.data;
  if (!agents.length) {
    el.innerHTML = `<div class="text-secondary small p-3">No agent data for this period.</div>`;
    return;
  }

  const from = new Date(period.from);
  const to = new Date(period.to);
  const diffDays = Math.round((to - from) / 86400000) + 1;
  const useWeekly = diffDays > 31;

  function getISOWeek(d) {
    const jan4 = new Date(d.getFullYear(), 0, 4);
    const startW1 = new Date(jan4); startW1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
    const wn = Math.floor((d - startW1) / (7 * 86400000)) + 1;
    return `${d.getFullYear()}-W${String(wn).padStart(2, "0")}`;
  }

  const columnKeys = [];
  const columnLabels = {};
  if (!useWeekly) {
    const cur = new Date(from);
    while (cur <= to) {
      const key = cur.toISOString().slice(0, 10);
      columnKeys.push(key);
      columnLabels[key] = cur.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
      cur.setDate(cur.getDate() + 1);
    }
  } else {
    const seen = new Set();
    const cur = new Date(from);
    while (cur <= to) {
      const key = getISOWeek(cur);
      if (!seen.has(key)) { seen.add(key); columnKeys.push(key); columnLabels[key] = key.replace("-W", " W"); }
      cur.setDate(cur.getDate() + 7);
    }
  }

  function agentDayMap(agent) {
    const map = {};
    if (!useWeekly) {
      agent.days.forEach((d) => { map[d.date] = d; });
    } else {
      agent.days.forEach((d) => {
        const wk = getISOWeek(new Date(d.date));
        if (!map[wk]) map[wk] = { tickets: 0, ftr_sum: 0, ftr_count: 0, csat_sum: 0, csat_count: 0 };
        map[wk].tickets += d.tickets;
        if (d.avg_ftr_ms) { map[wk].ftr_sum += d.avg_ftr_ms; map[wk].ftr_count++; }
        if (d.avg_csat !== null) { map[wk].csat_sum += d.avg_csat; map[wk].csat_count++; }
      });
      for (const wk of Object.keys(map)) {
        const w = map[wk];
        map[wk] = {
          tickets: w.tickets,
          avg_ftr_ms: w.ftr_count ? Math.round(w.ftr_sum / w.ftr_count) : 0,
          avg_csat: w.csat_count ? Math.round((w.csat_sum / w.csat_count) * 10) / 10 : null,
        };
      }
    }
    return map;
  }

  const medals = ["&#127947;","&#127948;","&#127949;"];
  const sorted = [...agents].sort((a, b) => b.total_tickets - a.total_tickets);

  const headerDayCols = columnKeys.map((k) =>
    `<th colspan="3" class="text-center border-start border-secondary" style="font-size:.75rem;color:#a0aec0">${columnLabels[k]}</th>`
  ).join("");

  const subHeader = columnKeys.map(() =>
    `<th class="text-center" style="font-size:.7rem;color:#718096">Tkts</th>` +
    `<th class="text-center" style="font-size:.7rem;color:#a78bfa">FTR</th>` +
    `<th class="text-center border-end border-secondary" style="font-size:.7rem;color:#d69e2e">CSAT</th>`
  ).join("");

  const rows = sorted.map((agent, i) => {
    const rank = i < 3 ? medals[i] : `${i + 1}.`;
    const dayMap = agentDayMap(agent);
    const dayCells = columnKeys.map((k) => {
      const d = dayMap[k];
      if (!d || d.tickets === 0) {
        return `<td class="text-center text-secondary" style="font-size:.75rem">&mdash;</td>` +
          `<td class="text-center text-secondary" style="font-size:.75rem">&mdash;</td>` +
          `<td class="text-center text-secondary border-end border-secondary" style="font-size:.75rem">&mdash;</td>`;
      }
      return `<td class="text-center" style="font-size:.75rem">${d.tickets}</td>` +
        `<td class="text-center" style="font-size:.75rem;color:#a78bfa">${formatFtr(d.avg_ftr_ms)}</td>` +
        `<td class="text-center border-end border-secondary" style="font-size:.75rem;color:#d69e2e">${d.avg_csat !== null ? d.avg_csat : "&mdash;"}</td>`;
    }).join("");

    return `<tr>
      <td class="ps-3" style="font-size:.8rem">${rank}</td>
      <td style="font-size:.8rem;max-width:200px" class="text-truncate">${escapeHtml(agent.email)}</td>
      <td class="text-center fw-bold border-end border-secondary">${agent.total_tickets}</td>
      <td class="text-center border-end border-secondary" style="color:#a78bfa">${formatFtr(agent.avg_ftr_ms)}</td>
      <td class="text-center border-end border-secondary" style="color:#d69e2e">${agent.avg_csat !== null ? `${agent.avg_csat} &#9733;` : "&mdash;"}</td>
      ${dayCells}
    </tr>`;
  }).join("");

  el.innerHTML = `<div class="table-responsive">
    <table class="table table-dark table-sm table-hover leaderboard-table mb-0">
      <thead>
        <tr>
          <th rowspan="2" class="ps-3" style="vertical-align:bottom">#</th>
          <th rowspan="2" style="vertical-align:bottom">Agent</th>
          <th rowspan="2" class="text-center border-end border-secondary" style="vertical-align:bottom">Total<br>Tickets</th>
          <th rowspan="2" class="text-center border-end border-secondary" style="vertical-align:bottom;color:#a78bfa">Avg FTR</th>
          <th rowspan="2" class="text-center border-end border-secondary" style="vertical-align:bottom;color:#d69e2e">Avg CSAT</th>
          ${headerDayCols}
        </tr>
        <tr>${subHeader}</tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}
```

- [ ] **Step 2: Commit**

```bash
git add script.js
git commit -m "feat: add renderAnalyticsLeaderboard"
```

---

## Task 9: Wire `initAnalytics()` into section navigation in `script.js`

**Files:**
- Modify: `script.js`

- [ ] **Step 1: Add `initAnalytics()`**

```js
function initAnalytics() {
  renderAnalyticsFilterBar();
  fetchAnalytics();
}
```

- [ ] **Step 2: Add the section branch**

Find the block around line 1321 that starts:
```js
if (state.section === "livechat-users") {
```

Add a new `else if` branch:
```js
} else if (state.section === "livechat-analytics") {
  initAnalytics();
```

- [ ] **Step 3: Ensure pane visibility is handled**

Search `script.js` for `section-pane`. The existing code uses a pattern like:
```js
document.querySelectorAll('.section-pane').forEach(p => p.classList.add('d-none'));
document.getElementById(`${state.section}-pane`).classList.remove('d-none');
```
If it uses `${state.section}-pane` as the ID pattern, the pane `livechat-analytics-pane` is automatically shown when `state.section === "livechat-analytics"` — no extra change needed. If the code uses a hardcoded list, add `"livechat-analytics"` to it.

- [ ] **Step 4: Commit**

```bash
git add script.js
git commit -m "feat: wire initAnalytics into section navigation"
```

---

## Task 10: Add CSS to `styles.css`

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Append at end of file**

```css
/* ── Analytics Tab ─────────────────────────────────────────── */

.analytics-filter-bar select[multiple] {
  height: 36px;
  overflow: hidden;
}

.analytics-card .analytics-card-prev {
  font-size: .8rem;
}

.analytics-leaderboard-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.leaderboard-table th,
.leaderboard-table td {
  white-space: nowrap;
  vertical-align: middle;
}

.leaderboard-table thead tr:first-child th {
  border-bottom: 2px solid rgba(255,255,255,.12);
}

.top5-panel .card-body {
  padding: 1rem;
}
```

- [ ] **Step 2: Commit**

```bash
git add styles.css
git commit -m "feat: add analytics tab CSS"
```

---

## Task 11: Smoke test end-to-end

- [ ] **Step 1: Start local dev server**

```bash
npx wrangler pages dev . --compatibility-date=2024-01-01
```

- [ ] **Step 2: Verify filter bar**

Open admin UI → log in → LiveChat → Analytics. Expected: preset dropdown ("Last 7 days"), prev/next arrows, timezone dropdown (browser default), agent multi-select, Compare toggle checked.

- [ ] **Step 3: Verify metric cards**

Expected: 4 cards — Total Tickets, Avg FTR (e.g. "2h 14m"), Avg CSAT (e.g. "4.6 ★"), Active Agents. Each has a prev-period row with delta badge. Toggling Compare hides/shows prev rows.

- [ ] **Step 4: Verify top-5 panels**

Expected: Two side-by-side panels with medals, agent emails, and values.

- [ ] **Step 5: Verify leaderboard table**

Expected: Sticky rank/agent/total columns left, scrollable per-day sub-columns (Tkts · FTR · CSAT) right. Days with no data show "—".

- [ ] **Step 6: Verify prev/next navigation**

Switch to "This week" → click Prev week → data reloads for prior week.

- [ ] **Step 7: Verify timezone persistence**

Change timezone → hard-reload page → timezone still selected.

- [ ] **Step 8: Commit any fixes**

```bash
git add -p
git commit -m "fix: analytics smoke test corrections"
```
