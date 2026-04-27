# LiveChat Analytics Tab — Design Spec
_Date: 2026-04-27_

## Overview

Add an Analytics tab to the LiveChat section of the admin UI. It shows per-agent performance metrics over a selected time period, with daily/weekly breakdowns, a leaderboard, top-5 panels, and metric summary cards — all backed by a new Cloudflare Worker function that aggregates the LiveChat Reports API.

---

## Architecture

### New Worker function
**`functions/api/livechat/analytics.js`**

Accepts `GET` with query params:
- `from` — RFC3339 start datetime (required)
- `to` — RFC3339 end datetime (required)
- `timezone` — IANA timezone string (required, e.g. `Europe/Warsaw`)
- `agents` — comma-separated agent emails (optional; omit = all agents)

Makes **2 parallel upstream calls** to LiveChat Reports API v3.6 for the selected period, and **2 more in parallel** for the automatically-computed prev period (same duration, immediately before `from`):

| Upstream endpoint | What it provides |
|---|---|
| `POST /v3.6/reports/agents/performance` with `distribution=day` | Per-agent per-day: ticket count, avg first response time, chatting time |
| `POST /v3.6/reports/chats/ratings` with `distribution=day` | Per-agent per-day: CSAT score |

Note: `agents/performance` already includes first response time per agent per day — no separate `first_response_time` call needed.

All upstream calls use the existing `TEXT_BASIC_AUTH_B64` env var via the shared `_lib/livechat.js` client.

### Response shape

```json
{
  "period": { "from": "2026-04-21T00:00:00Z", "to": "2026-04-27T23:59:59Z" },
  "summary": {
    "total_tickets": 142,
    "avg_ftr_ms": 7680000,
    "avg_csat": 4.6,
    "active_agents": 8,
    "prev_period": {
      "total_tickets": 124,
      "avg_ftr_ms": 8160000,
      "avg_csat": 4.4,
      "active_agents": 7
    }
  },
  "agents": [
    {
      "email": "alice@company.com",
      "total_tickets": 32,
      "avg_ftr_ms": 7680000,
      "avg_csat": 4.7,
      "days": [
        { "date": "2026-04-21", "tickets": 8, "avg_ftr_ms": 7500000, "avg_csat": 4.8 },
        { "date": "2026-04-22", "tickets": 6, "avg_ftr_ms": 7920000, "avg_csat": 4.7 }
      ]
    }
  ]
}
```

FTR is stored and returned in **milliseconds**; the frontend formats it as `Xh Ym`.

A ticket counts as "handled" by an agent if the agent sent at least one message in the chat during the period (this matches the `agents/performance` endpoint's definition).

---

## UI — Filter Bar

Rendered at the top of `#analytics-pane`. Controls:

| Control | Behaviour |
|---|---|
| **Preset dropdown** | Today, Yesterday, Last 7 days, Last 30 days, This week, Last week, This month, Last month, Custom range |
| **Prev / Next arrows** | Steps by week (weekly presets) or month (monthly presets). Disabled for Today/Yesterday/Custom. |
| **Timezone dropdown** | IANA timezone list. Defaults to `Intl.DateTimeFormat().resolvedOptions().timeZone` (browser timezone). Persisted in `localStorage`. |
| **Agent filter** | Multi-select dropdown populated from `state.livechat.agents`. Empty = all agents. |
| **Compare toggle** | Shown/hidden the prev-period row on metric cards. On by default. |

Any filter change triggers a fresh `GET /api/livechat/analytics` call and re-renders the entire pane.

---

## UI — Metric Cards Row

4 cards displayed in a horizontal row:

| Card | Value | Delta direction (green = good) |
|---|---|---|
| **Total Tickets** | Integer | More = green |
| **Avg FTR** | Duration string e.g. `2h 14m` | Faster (lower) = green |
| **Avg CSAT** | Star rating e.g. `4.6 ★` | Higher = green |
| **Active Agents** | Integer | More = green |

Each card uses the style-B treatment:
- Main value large at top
- Thin divider line
- `prev: X` label on left
- Delta pill badge on right (green background = improvement, red = regression)
- Delta pill hidden when compare toggle is off

---

## UI — Top-5 Panels

Two panels side by side, below the metric cards:

- **Top 5 by Tickets** — agents ranked by `total_tickets` descending, showing email + ticket count
- **Top 5 by Avg FTR** — agents ranked by `avg_ftr_ms` ascending (fastest first), showing email + FTR duration

Both read from the same analytics response — no extra API calls.

---

## UI — Leaderboard Table

Full-width table below the top-5 panels. Horizontally scrollable.

### Fixed left columns (sticky)
| Column | Notes |
|---|---|
| Rank | 🥇🥈🥉 for top 3, then number |
| Agent | Email address |
| Total Tickets | Period total, bold |
| Avg FTR | Period average, formatted as `Xh Ym` |
| Avg CSAT | Period average, formatted as `4.7 ★` |

### Scrollable daily columns
Each day (or week in monthly view) gets 3 sub-columns: **Tickets · FTR · CSAT**. Days with no activity show `—` in grey.

### Column grouping by view mode

| View mode | Triggered by | Column groups |
|---|---|---|
| Daily | Any preset ≤ 31 days, or custom range ≤ 31 days | One group per calendar day |
| Weekly | Monthly preset, or custom range > 31 days | One group per ISO week (Week 17, Week 18…) |

### Sorting
Default: Total Tickets descending. Clicking any fixed column header re-sorts. Daily/weekly sub-columns are not sortable.

---

## State & Data Flow

The existing `state` object in `script.js` gains:

```js
state.analytics = {
  loading: false,
  error: null,
  filters: {
    preset: 'last_7_days',
    from: null,   // ISO string, computed from preset
    to: null,     // ISO string
    timezone: '', // IANA, from localStorage or browser default
    agents: [],   // emails, empty = all
    compare: true,
  },
  data: null, // last successful API response
}
```

Flow:
1. Tab activated → `initAnalytics()` → sets `from/to` from preset → calls `fetchAnalytics()`
2. `fetchAnalytics()` → sets `loading=true`, renders skeleton → `GET /api/livechat/analytics?...` → on success sets `data`, calls `renderAnalytics()` → clears loading
3. Any filter change → updates `state.analytics.filters` → calls `fetchAnalytics()`

---

## Files Changed

| File | Change |
|---|---|
| `functions/api/livechat/analytics.js` | **New** — Worker function |
| `index.html` | Add `#analytics-pane` tab and content skeleton inside LiveChat section |
| `script.js` | Add `initAnalytics()`, `fetchAnalytics()`, `renderAnalytics()`, helper `formatFtr(ms)`, `formatDelta()` |
| `styles.css` | Add `.analytics-card`, `.leaderboard-table`, `.top5-panel` styles |

No changes to existing Worker functions, `_lib/`, schema, or other tabs.

---

## Out of Scope

- CSV/export of analytics data
- Charts or sparklines (table only)
- HelpDesk analytics (separate future feature)
- Real-time / auto-refresh
