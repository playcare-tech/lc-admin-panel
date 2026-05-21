import { requireAuth } from "../../_lib/auth.js";
import { withAccountContext } from "../../_lib/accounts.js";
import { errorResponse, json, methodNotAllowed, serverErrorResponse } from "../../_lib/http.js";
import { getLiveChatDashboard, livechatAgentChatRequest, livechatReportsRequest } from "../../_lib/livechat.js";

const RAW_CHAT_EXPORT_PAGE_SIZE = 100;
const RAW_CHAT_EXPORT_MAX_PAGES = 45;
const RAW_CHAT_EXCEL_MAX_CELL_CHARS = 4000;
const RAW_CHAT_EXPORT_FORMATS = new Set(["raw_csv", "raw_excel", "raw_page"]);

function isValidDate(value) {
  return value && !Number.isNaN(new Date(value).getTime());
}

function secondsToMs(value) {
  return Number.isFinite(value) ? Math.round(value * 1000) : null;
}

function csatFromCounts(good = 0, bad = 0) {
  const total = Number(good || 0) + Number(bad || 0);
  if (!total) {
    return null;
  }
  return Math.round((Number(good || 0) / total) * 50) / 10;
}

function previousPeriod(from, to) {
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  const durationMs = toMs - fromMs;
  const offset = extractOffset(from);
  return {
    from: formatWithOffset(new Date(fromMs - durationMs), offset),
    to: formatWithOffset(new Date(fromMs), offset),
  };
}

function extractOffset(value) {
  return value.match(/(Z|[+-]\d{2}:\d{2})$/)?.[1] || "Z";
}

function offsetToMinutes(offset) {
  if (offset === "Z") {
    return 0;
  }
  const sign = offset.startsWith("-") ? -1 : 1;
  const [hours, minutes] = offset.slice(1).split(":").map(Number);
  return sign * (hours * 60 + minutes);
}

function formatWithOffset(date, offset) {
  if (offset === "Z") {
    return date.toISOString();
  }
  const shifted = new Date(date.getTime() + offsetToMinutes(offset) * 60000);
  const pad = (value) => String(value).padStart(2, "0");
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}T${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())}${offset}`;
}

function formatArchiveDate(value) {
  const match = `${value || ""}`.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/);
  if (!match) return value;
  return `${match[1]}.000000${match[2]}`;
}

function buildFilters(from, to, agentIds) {
  return {
    from,
    to,
    ...(agentIds.length ? { agents: { values: agentIds } } : {}),
  };
}

function securityHeaders(extra = {}) {
  return {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    ...extra,
  };
}

function csvCell(value) {
  const text = `${value ?? ""}`.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const safeText = /^[=+\-@]/.test(text.trimStart()) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

function escapeXml(value) {
  return `${value ?? ""}`
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function filenameDate(value) {
  return `${value || ""}`.slice(0, 10) || "period";
}

function rawChatExportFilename(from, to, extension) {
  return `livechat-raw-chats-${filenameDate(from)}-to-${filenameDate(to)}.${extension}`;
}

function downloadResponse(content, contentType, filename) {
  return new Response(content, {
    status: 200,
    headers: securityHeaders({
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    }),
  });
}

function upstreamStatus(error) {
  const status = Number(error?.status || 0);
  return Number.isFinite(status) && status >= 400 ? status : 0;
}

function exportErrorResponse(error) {
  const message = error?.message || "Failed to export LiveChat raw chats.";
  const status = upstreamStatus(error);
  const responseStatus = status >= 400 && status < 500 ? status : 502;
  return errorResponse(`Failed to export LiveChat raw chats: ${message}`, responseStatus);
}

function splitAgentIds(value) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function archiveAgentFilter(agentIds, excludedAgentIds) {
  const included = new Set(agentIds);
  for (const excluded of excludedAgentIds) {
    included.delete(excluded);
  }
  if (included.size) {
    return { values: Array.from(included) };
  }
  if (excludedAgentIds.size) {
    return { exclude_values: Array.from(excludedAgentIds) };
  }
  return null;
}

function usersByType(chat, type) {
  return (chat.users || []).filter((user) => `${user.type || ""}` === type);
}

function userLabel(user) {
  if (!user) return "";
  return user.name || user.email || user.id || "";
}

function userEmail(user) {
  return user?.email || (String(user?.id || "").includes("@") ? user.id : "");
}

function rawChatExportHeaders() {
  return [
    "ticket_link",
    "created_date",
    "user_email",
    "wait_in_queue_seconds",
    "group",
    "assignee",
    "tags",
    "thread_id",
  ];
}

function chatArchiveLink(threadId) {
  return threadId ? `https://my.livechatinc.com/archives/?q=${encodeURIComponent(threadId)}` : "";
}

function groupLabel(groupIds, groupNameById) {
  return groupIds
    .map((groupId) => groupNameById.get(String(groupId)) || `Group ${groupId}`)
    .join("; ");
}

function queueWaitSeconds(chat, thread) {
  const candidates = [
    thread?.queue?.wait_time,
    thread?.queues_duration,
    chat?.queue?.wait_time,
    chat?.queues_duration,
  ];
  const value = candidates.find((item) => item !== null && item !== undefined && item !== "");
  return value === undefined ? "" : value;
}

function tagLabel(tag) {
  if (!tag) return "";
  if (typeof tag === "string") return tag;
  return tag.name || tag.tag || tag.id || tag.value || "";
}

function threadTagLabels(chat, thread) {
  return Array.from(
    new Set(
      [...(thread.tags || []), ...(chat.tags || [])]
        .map(tagLabel)
        .filter(Boolean),
    ),
  );
}

function threadAgentLabels(chat, thread) {
  const agents = usersByType(chat, "agent");
  const threadUserIds = new Set((thread.user_ids || []).map(String));
  const threadAgents = threadUserIds.size
    ? agents.filter((agent) => threadUserIds.has(String(agent.id)))
    : agents;
  return threadAgents.map(userLabel).filter(Boolean).join("; ");
}

function rawChatExportRecords(chats) {
  return chats.map((chat) => {
    const thread = chat.thread || {};
    const customer = usersByType(chat, "customer")[0] || {};
    const groupIds = thread.access?.group_ids || chat.access?.group_ids || [];
    return {
      ticket_link: chatArchiveLink(thread.id),
      created_date: thread.created_at || "",
      user_email: userEmail(customer),
      wait_in_queue_seconds: queueWaitSeconds(chat, thread),
      group_ids: groupIds.map(String),
      assignee: threadAgentLabels(chat, thread),
      tags: threadTagLabels(chat, thread),
      thread_id: thread.id || "",
    };
  });
}

function rawChatExportRows(chats, groupNameById = new Map()) {
  return rawChatExportRecords(chats).map((record) => [
    record.ticket_link,
    record.created_date,
    record.user_email,
    record.wait_in_queue_seconds,
    groupLabel(record.group_ids, groupNameById),
    record.assignee,
    (record.tags || []).join("; "),
    record.thread_id,
  ]);
}

async function fetchRawArchivedChatsPage(env, { from, to, agentIds, excludedAgentIds, pageId = "" }) {
  const filters = { from: formatArchiveDate(from), to: formatArchiveDate(to) };
  const agents = archiveAgentFilter(agentIds, excludedAgentIds);
  if (agents) {
    filters.agents = agents;
  }

  const body = pageId
    ? {
        page_id: pageId,
      }
    : {
        filters,
        sort_order: "asc",
        limit: RAW_CHAT_EXPORT_PAGE_SIZE,
      };
  const payload = await livechatAgentChatRequest(env, "list_archives", body);
  return {
    chats: payload.chats || [],
    nextPageId: payload.next_page_id || "",
    foundChats: Number(payload.found_chats || 0),
  };
}

async function fetchRawArchivedChats(env, { from, to, agentIds, excludedAgentIds }) {
  const chats = [];
  let pageId = "";
  let truncated = false;

  for (let page = 0; page < RAW_CHAT_EXPORT_MAX_PAGES; page += 1) {
    const payload = await fetchRawArchivedChatsPage(env, {
      from,
      to,
      agentIds,
      excludedAgentIds,
      pageId,
    });
    chats.push(...payload.chats);
    pageId = payload.nextPageId;
    if (!pageId) {
      return { chats, truncated: false };
    }
  }

  truncated = Boolean(pageId);
  return { chats, truncated };
}

async function exportRawChatsPage(context, { from, to, agentIds, excludedAgentIds, pageId }) {
  const result = await fetchRawArchivedChatsPage(context.env, {
    from,
    to,
    agentIds,
    excludedAgentIds,
    pageId,
  });
  return json({
    records: rawChatExportRecords(result.chats),
    nextPageId: result.nextPageId,
    foundChats: result.foundChats,
    pageSize: RAW_CHAT_EXPORT_PAGE_SIZE,
  });
}

function rawChatsCsv(chats, truncated, groupNameById) {
  const rows = [rawChatExportHeaders(), ...rawChatExportRows(chats, groupNameById)];
  if (truncated) {
    rows.push(["EXPORT_TRUNCATED", "", "", "", "", "More chats matched this period than this export can fetch in one run.", "", ""]);
  }
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

function rawChatsExcelHtml(chats, truncated, from, to, groupNameById) {
  const headers = rawChatExportHeaders();
  const rows = rawChatExportRows(chats, groupNameById);
  const excelCell = (value) => {
    const text = `${value ?? ""}`;
    return text.length > RAW_CHAT_EXCEL_MAX_CELL_CHARS
      ? `${text.slice(0, RAW_CHAT_EXCEL_MAX_CELL_CHARS)}... [truncated for Excel export]`
      : text;
  };
  const tableRows = [
    `<tr>${headers.map((header) => `<th>${escapeXml(header)}</th>`).join("")}</tr>`,
    ...rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeXml(excelCell(cell))}</td>`).join("")}</tr>`),
    ...(truncated
      ? [
          `<tr><td>EXPORT_TRUNCATED</td><td colspan="${headers.length - 1}">More chats matched this period than this export can fetch in one run.</td></tr>`,
        ]
      : []),
  ].join("");

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
    <caption>LiveChat raw chats ${escapeXml(from)} to ${escapeXml(to)}</caption>
    ${tableRows}
  </table>
</body>
</html>`;
}

async function exportRawChats(context, { from, to, agentIds, excludedAgentIds, format }) {
  const [{ chats, truncated }, dashboard] = await Promise.all([
    fetchRawArchivedChats(context.env, {
      from,
      to,
      agentIds,
      excludedAgentIds,
    }),
    getLiveChatDashboard(context.env),
  ]);
  const groupNameById = new Map((dashboard.groups || []).map((group) => [String(group.id), group.name]));

  if (format === "raw_excel") {
    return downloadResponse(
      rawChatsExcelHtml(chats, truncated, from, to, groupNameById),
      "application/vnd.ms-excel; charset=utf-8",
      rawChatExportFilename(from, to, "xls"),
    );
  }

  return downloadResponse(
    rawChatsCsv(chats, truncated, groupNameById),
    "text/csv; charset=utf-8",
    rawChatExportFilename(from, to, "csv"),
  );
}

function reportDatePart(value) {
  return `${value}`.slice(0, 10);
}

function datesBetween(from, to) {
  const dates = [];
  const current = new Date(`${reportDatePart(from)}T12:00:00Z`);
  const end = new Date(`${reportDatePart(to)}T12:00:00Z`);

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function dayBounds(date, offset) {
  return {
    from: `${date}T00:00:00${offset}`,
    to: `${date}T23:59:59${offset}`,
  };
}

function todayForOffset(offset) {
  return formatWithOffset(new Date(), offset).slice(0, 10);
}

async function tableColumns(db, tableName) {
  const { results } = await db.prepare(`PRAGMA table_info(${tableName})`).all();
  return new Set((results || []).map((column) => column.name));
}

async function ensureAnalyticsCache(db) {
  if (!db) {
    throw new Error("Missing DB binding.");
  }

  const createDailyTable = () =>
    db.prepare(
      `CREATE TABLE IF NOT EXISTS analytics_agent_daily (
      date TEXT NOT NULL,
      agent_key TEXT NOT NULL,
      agent_id TEXT,
      agent_email TEXT,
      agent_name TEXT,
      chats_count INTEGER NOT NULL DEFAULT 0,
      avg_ftr_ms INTEGER,
      avg_csat REAL,
      rated_good INTEGER NOT NULL DEFAULT 0,
      rated_bad INTEGER NOT NULL DEFAULT 0,
      fetched_at TEXT NOT NULL,
      PRIMARY KEY (date, agent_key)
    )`,
    ).run();

  const columns = await tableColumns(db, "analytics_agent_daily");
  if (!columns.size) {
    await createDailyTable();
  } else if (columns.has("agent_scope")) {
    await db.prepare("DROP TABLE IF EXISTS analytics_agent_daily_next").run();
    await db.prepare(
      `CREATE TABLE analytics_agent_daily_next (
        date TEXT NOT NULL,
        agent_key TEXT NOT NULL,
        agent_id TEXT,
        agent_email TEXT,
        agent_name TEXT,
        chats_count INTEGER NOT NULL DEFAULT 0,
        avg_ftr_ms INTEGER,
        avg_csat REAL,
        rated_good INTEGER NOT NULL DEFAULT 0,
        rated_bad INTEGER NOT NULL DEFAULT 0,
        fetched_at TEXT NOT NULL,
        PRIMARY KEY (date, agent_key)
      )`,
    ).run();
    await db
      .prepare(
        `INSERT OR REPLACE INTO analytics_agent_daily_next
          (date, agent_key, agent_id, agent_email, agent_name, chats_count, avg_ftr_ms, avg_csat, rated_good, rated_bad, fetched_at)
         SELECT
          date,
          CASE WHEN agent_email LIKE '%@%' THEN agent_email ELSE agent_key END AS normalized_agent_key,
          MAX(agent_id),
          MAX(agent_email),
          MAX(agent_name),
          MAX(chats_count),
          MAX(avg_ftr_ms),
          MAX(avg_csat),
          MAX(rated_good),
          MAX(rated_bad),
          MAX(fetched_at)
         FROM analytics_agent_daily
         WHERE agent_email LIKE '%@%' OR agent_key LIKE '%@%'
         GROUP BY date, normalized_agent_key`,
      )
      .run();
    await db.prepare("DROP TABLE analytics_agent_daily").run();
    await db.prepare("ALTER TABLE analytics_agent_daily_next RENAME TO analytics_agent_daily").run();
  }

  await db.prepare("DELETE FROM analytics_agent_daily WHERE agent_key NOT LIKE '%@%'").run();
  await db.prepare("DROP TABLE IF EXISTS analytics_agent_daily_fetches").run();
  await db.prepare("DROP TABLE IF EXISTS analytics_agent_daily_next").run();
}

function buildAgentDirectory(livechatDashboard) {
  const byId = new Map();
  const byEmail = new Map();
  const ids = [];
  (livechatDashboard.agents || []).filter(isHumanAnalyticsAgent).forEach((agent) => {
    const normalized = {
      id: String(agent.id),
      email: agent.email || agent.id,
      name: agent.name || agent.email || agent.id,
    };
    byId.set(String(agent.id), normalized);
    ids.push(String(agent.id));
    if (agent.email) {
      byEmail.set(String(agent.email), normalized);
    }
  });
  return { byId, byEmail, ids };
}

function agentFromRecordKey(key, directory) {
  return directory.byId.get(String(key)) || directory.byEmail.get(String(key)) || { id: String(key), email: String(key), name: String(key) };
}

function displayNameFromRecord(record, fallback) {
  return record.full_name || record.name || record.display_name || record.agent_name || fallback;
}

function resolveAgentId(value, directory) {
  return directory.byId.get(String(value))?.id || directory.byEmail.get(String(value))?.id || String(value);
}

function hasEmailLikeIdentifier(value) {
  return `${value || ""}`.includes("@");
}

function isHumanAnalyticsAgent(agent) {
  return hasEmailLikeIdentifier(agent.id) || hasEmailLikeIdentifier(agent.email) || hasEmailLikeIdentifier(agent.record_key);
}

function effectiveAgentIds(includedAgentIds, excludedAgentIds, directory) {
  const excluded = new Set(Array.from(excludedAgentIds).map((value) => resolveAgentId(value, directory)));
  const base = includedAgentIds.length ? includedAgentIds.map((value) => resolveAgentId(value, directory)) : directory.ids;
  const filtered = base.filter((id) => !excluded.has(id));
  return Array.from(new Set(filtered));
}

function normalizeAgentRecords(performanceData, directory, excludedAgentIds) {
  const records = performanceData.records || {};
  return Object.entries(records)
    .map(([recordKey, record]) => {
      const agent = agentFromRecordKey(recordKey, directory);
      const good = Number(record.chats_rated_good || 0);
      const bad = Number(record.chats_rated_bad || 0);
      return {
        id: agent.id,
        record_key: String(recordKey),
        email: agent.email,
        name: displayNameFromRecord(record, agent.name),
        total_tickets: Number(record.chats_count || 0),
        avg_ftr_ms: secondsToMs(record.first_response_time),
        avg_csat: csatFromCounts(good, bad),
        rated_good: good,
        rated_bad: bad,
      };
    })
    .filter(
      (agent) =>
        isHumanAnalyticsAgent(agent) &&
        !excludedAgentIds.has(agent.id) &&
        !excludedAgentIds.has(agent.email) &&
        !excludedAgentIds.has(agent.record_key),
    )
    .sort((left, right) => right.total_tickets - left.total_tickets || left.email.localeCompare(right.email));
}

function normalizeCachedAgentRows(rows) {
  return rows
    .map((row) => ({
      id: row.agent_id || row.agent_key,
      record_key: row.agent_key,
      email: row.agent_email || row.agent_key,
      name: row.agent_name || row.agent_email || row.agent_key,
      total_tickets: Number(row.chats_count || 0),
      avg_ftr_ms: row.avg_ftr_ms === null || row.avg_ftr_ms === undefined ? null : Number(row.avg_ftr_ms),
      avg_csat: row.avg_csat === null || row.avg_csat === undefined ? null : Number(row.avg_csat),
      rated_good: Number(row.rated_good || 0),
      rated_bad: Number(row.rated_bad || 0),
    }))
    .filter(isHumanAnalyticsAgent);
}

function filterAgentRows(agents, includedAgentIds, excludedAgentIds, directory) {
  const included = new Set(effectiveAgentIds(includedAgentIds, excludedAgentIds, directory));
  const excluded = new Set(Array.from(excludedAgentIds).map((value) => resolveAgentId(value, directory)));
  return agents.filter((agent) => {
    const id = resolveAgentId(agent.id || agent.email || agent.record_key, directory);
    return included.has(id) && !excluded.has(id);
  });
}

function normalizeSummary(agents) {
  const ftrAgents = agents.filter((agent) => agent.avg_ftr_ms !== null && agent.total_tickets > 0);
  const ftrChats = ftrAgents.reduce((sum, agent) => sum + agent.total_tickets, 0);
  const ratedGood = agents.reduce((sum, agent) => sum + agent.rated_good, 0);
  const ratedBad = agents.reduce((sum, agent) => sum + agent.rated_bad, 0);
  const totalTickets = agents.reduce((sum, agent) => sum + agent.total_tickets, 0);
  return {
    total_tickets: totalTickets,
    avg_ftr_ms: ftrChats
      ? Math.round(ftrAgents.reduce((sum, agent) => sum + agent.avg_ftr_ms * agent.total_tickets, 0) / ftrChats)
      : null,
    avg_csat: csatFromCounts(ratedGood, ratedBad),
    active_agents: agents.filter((agent) => agent.total_tickets > 0).length,
  };
}

function normalizeTimeline(totalChatsData, ftrData, ratingsData) {
  const totalRecords = totalChatsData.records || {};
  const ftrRecords = ftrData.records || {};
  const ratingsRecords = ratingsData.records || {};
  const dates = Array.from(
    new Set([...Object.keys(totalRecords), ...Object.keys(ftrRecords), ...Object.keys(ratingsRecords)]),
  ).sort();

  return dates.map((date) => {
    const totalRecord = totalRecords[date] || {};
    const ftrRecord = ftrRecords[date] || {};
    const ratingsRecord = ratingsRecords[date] || {};
    return {
      date,
      tickets: Number(totalRecord.total || 0),
      continuous: Number(totalRecord.continuous || 0),
      first_response_chats: Number(ftrRecord.count || 0),
      avg_ftr_ms: secondsToMs(ftrRecord.first_response_time),
      rated_chats: Number(ratingsRecord.chats || 0),
      avg_csat: csatFromCounts(ratingsRecord.good, ratingsRecord.bad),
      rated_good: Number(ratingsRecord.good || 0),
      rated_bad: Number(ratingsRecord.bad || 0),
    };
  });
}

async function readCachedAgentDay(env, date) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM analytics_agent_daily WHERE date = ? AND agent_key LIKE '%@%' ORDER BY chats_count DESC, agent_email ASC",
  )
    .bind(date)
    .all();

  if (!results?.length) return null;
  return normalizeCachedAgentRows(results || []);
}

async function writeCachedAgentDay(env, date, agents) {
  const fetchedAt = new Date().toISOString();
  const uniqueAgents = new Map();
  agents.forEach((agent) => {
    const agentKey = hasEmailLikeIdentifier(agent.email)
      ? agent.email
      : hasEmailLikeIdentifier(agent.record_key)
        ? agent.record_key
        : "";
    if (!agentKey) return;
    uniqueAgents.set(String(agentKey), agent);
  });

  const statements = [
    env.DB.prepare("DELETE FROM analytics_agent_daily WHERE date = ?").bind(date),
    ...Array.from(uniqueAgents.entries()).map(([agentKey, agent]) =>
      env.DB.prepare(
      `INSERT OR REPLACE INTO analytics_agent_daily
        (date, agent_key, agent_id, agent_email, agent_name, chats_count, avg_ftr_ms, avg_csat, rated_good, rated_bad, fetched_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        date,
        agentKey,
        agent.id || null,
        agent.email || null,
        agent.name || null,
        agent.total_tickets || 0,
        agent.avg_ftr_ms,
        agent.avg_csat,
        agent.rated_good || 0,
        agent.rated_bad || 0,
        fetchedAt,
      ),
    ),
  ];

  if (statements.length) {
    await env.DB.batch(statements);
  }
}

async function fetchAgentDay(env, date, offset, agentIds, excludedAgentIds, directory) {
  const bounds = dayBounds(date, offset);
  const performanceData = await livechatReportsRequest(env, "/agents/performance", {
    filters: buildFilters(bounds.from, bounds.to, agentIds),
  });
  return normalizeAgentRecords(performanceData, directory, excludedAgentIds);
}

async function getAgentDay(env, date, offset, agentIds, excludedAgentIds, directory) {
  const shouldRefresh = date === todayForOffset(offset);
  if (!shouldRefresh) {
    const cached = await readCachedAgentDay(env, date);
    if (cached) {
      return filterAgentRows(cached, agentIds, excludedAgentIds, directory);
    }
  }

  const agents = await fetchAgentDay(env, date, offset, directory.ids, new Set(), directory);
  await writeCachedAgentDay(env, date, agents);
  return filterAgentRows(agents, agentIds, excludedAgentIds, directory);
}

async function fetchAgentDailyMetrics(env, from, to, agentIds, excludedAgentIds, directory) {
  const offset = extractOffset(from);
  const dates = datesBetween(from, to);
  if (dates.length > 31) {
    return [];
  }

  const entries = await Promise.all(
    dates.map(async (date) => ({
      date,
      agents: await getAgentDay(env, date, offset, agentIds, excludedAgentIds, directory),
    })),
  );

  return entries;
}

function mergeAgentDailyMetrics(agents, dailyEntries) {
  const byAgentKey = new Map(
    agents.map((agent) => [agent.id || agent.email || agent.record_key, { ...agent, days: [] }]),
  );

  dailyEntries.forEach(({ date, agents: dayAgents }) => {
    dayAgents.forEach((dayAgent) => {
      const key = dayAgent.id || dayAgent.email || dayAgent.record_key;
      const current =
        byAgentKey.get(key) ||
        {
          ...dayAgent,
          total_tickets: 0,
          avg_ftr_ms: null,
          avg_csat: null,
          days: [],
        };

      current.days.push({
        date,
        chats: dayAgent.total_tickets,
        avg_ftr_ms: dayAgent.avg_ftr_ms,
        avg_csat: dayAgent.avg_csat,
      });
      byAgentKey.set(key, current);
    });
  });

  return Array.from(byAgentKey.values()).sort(
    (left, right) => right.total_tickets - left.total_tickets || left.email.localeCompare(right.email),
  );
}

async function fetchPeriodData(env, from, to, agentIds, excludedAgentIds, directory, includeDaily = false) {
  const filters = buildFilters(from, to, agentIds);

  const [performanceData, totalChatsData, ftrData, ratingsData] = await Promise.all([
    livechatReportsRequest(env, "/agents/performance", {
      filters,
    }),
    livechatReportsRequest(env, "/chats/total_chats", {
      filters,
      distribution: "day",
    }),
    livechatReportsRequest(env, "/chats/first_response_time", {
      filters,
      distribution: "day",
    }),
    livechatReportsRequest(env, "/chats/ratings", {
      filters,
      distribution: "day",
    }),
  ]);
  const agents = normalizeAgentRecords(performanceData, directory, excludedAgentIds);
  const dailyEntries = includeDaily
    ? await fetchAgentDailyMetrics(env, from, to, agentIds, excludedAgentIds, directory)
    : [];

  return {
    summary: normalizeSummary(agents),
    agents: includeDaily ? mergeAgentDailyMetrics(agents, dailyEntries) : agents,
    timeline: normalizeTimeline(totalChatsData, ftrData, ratingsData),
  };
}

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const auth = await requireAuth(context);
  if (auth.error) {
    return auth.error;
  }
  context = withAccountContext(context);

  const url = new URL(context.request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const agentIds = splitAgentIds(url.searchParams.get("agents"));
  const excludedAgentIds = new Set(splitAgentIds(url.searchParams.get("exclude_agents")));
  const exportFormat = url.searchParams.get("export") || "";

  if (!from || !to) {
    return errorResponse("Missing required params: from, to", 400);
  }
  if (!isValidDate(from) || !isValidDate(to)) {
    return errorResponse("Invalid date format for from or to", 400);
  }
  if (new Date(to).getTime() <= new Date(from).getTime()) {
    return errorResponse("The to param must be after from.", 400);
  }
  if (exportFormat && !RAW_CHAT_EXPORT_FORMATS.has(exportFormat)) {
    return errorResponse("Invalid LiveChat analytics export format.", 400);
  }

  try {
    if (exportFormat) {
      try {
        if (exportFormat === "raw_page") {
          return await exportRawChatsPage(context, {
            from,
            to,
            agentIds,
            excludedAgentIds,
            pageId: url.searchParams.get("page_id") || "",
          });
        }
        return await exportRawChats(context, { from, to, agentIds, excludedAgentIds, format: exportFormat });
      } catch (error) {
        console.error("Failed to export LiveChat raw chats.", error);
        return exportErrorResponse(error);
      }
    }

    const prev = previousPeriod(from, to);
    await ensureAnalyticsCache(context.env.DB);
    const directory = buildAgentDirectory(await getLiveChatDashboard(context.env));
    const reportAgentIds = effectiveAgentIds(agentIds, excludedAgentIds, directory);
    const [current, previous] = await Promise.all([
      fetchPeriodData(context.env, from, to, reportAgentIds, excludedAgentIds, directory, true),
      fetchPeriodData(context.env, prev.from, prev.to, reportAgentIds, excludedAgentIds, directory),
    ]);

    return json({
      period: { from, to },
      previous_period: prev,
      summary: { ...current.summary, prev_period: previous.summary },
      agents: current.agents,
      timeline: current.timeline,
      capabilities: {
        per_agent_period_metrics: true,
        per_agent_daily_metrics: true,
        account_daily_timeline: true,
        per_agent_daily_source: "agents/performance day-range cache",
        timeline_tickets_source: "chats/total_chats",
        timeline_ftr_source: "chats/first_response_time",
        timeline_csat_source: "chats/ratings",
      },
    });
  } catch (error) {
    return serverErrorResponse(error, "Failed to load LiveChat analytics.");
  }
}
