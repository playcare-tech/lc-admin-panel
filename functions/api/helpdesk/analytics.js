import { requireAuth } from "../../_lib/auth.js";
import { accountIndexName, accountTableName, withAccountContext } from "../../_lib/accounts.js";
import { helpDeskAnalyticsAgentEmail } from "../../_lib/helpdesk-analytics-agents.js";
import { errorResponse, json, methodNotAllowed, serverErrorResponse } from "../../_lib/http.js";
import { getHelpDeskDashboard, helpdeskRequestWithMeta } from "../../_lib/helpdesk.js";

const PAGE_SIZE = 100;
const MAX_PAGES_PER_RANGE = 20;
const STATUSES = ["open", "pending", "onhold", "solved", "closed"];
const METRIC_PUBLIC_REPLIES = "public_replies";
const METRIC_COMMENTS = "comments";
const COMMENT_TIME_ZONE = "Europe/Nicosia";
const DAILY_TABLE_BASE = "helpdesk_analytics_daily_v7";
const MESSAGE_EVENTS_TABLE_BASE = "helpdesk_analytics_message_events_v4";
const REPLY_DETAILS_TABLE_BASE = "helpdesk_analytics_reply_details_v4";
const COMMENT_DAILY_TABLE_BASE = "helpdesk_analytics_comment_daily_v1";
const COMMENT_EVENTS_TABLE_BASE = "helpdesk_analytics_comment_events_v1";
const COMMENT_DETAILS_TABLE_BASE = "helpdesk_analytics_comment_details_v1";
const OBSOLETE_ANALYTICS_TABLES = [
  "helpdesk_analytics_daily",
  "helpdesk_analytics_daily_fetches",
  "helpdesk_analytics_agent_fetches",
  "helpdesk_analytics_daily_v2",
  "helpdesk_analytics_daily_fetches_v2",
  "helpdesk_analytics_agent_fetches_v2",
  "helpdesk_analytics_daily_v3",
  "helpdesk_analytics_handled_tickets_v3",
  "helpdesk_analytics_daily_fetches_v3",
  "helpdesk_analytics_agent_fetches_v3",
  "helpdesk_analytics_agent_fetches_v4",
  "helpdesk_analytics_daily_fetches_v4",
  "helpdesk_analytics_handled_tickets_v4",
  "helpdesk_analytics_daily_v4",
  "helpdesk_analytics_message_events",
  "helpdesk_analytics_reply_details_v1",
  "helpdesk_analytics_daily_v5",
  "helpdesk_analytics_message_events_v2",
  "helpdesk_analytics_reply_details_v2",
  "helpdesk_analytics_daily_v6",
  "helpdesk_analytics_message_events_v3",
  "helpdesk_analytics_reply_details_v3",
];

function isValidDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function parseDateParam(value, name) {
  if (!value) throw new Error(`Missing required param: ${name}`);
  const date = new Date(value);
  if (!isValidDate(date)) throw new Error(`Invalid date format for ${name}`);
  return date;
}

function splitParam(value) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeMetric(value) {
  return value === METRIC_COMMENTS ? METRIC_COMMENTS : METRIC_PUBLIC_REPLIES;
}

function dateKey(date, timezoneOffsetMinutes = 0) {
  return new Date(date.getTime() - timezoneOffsetMinutes * 60000).toISOString().slice(0, 10);
}

function dateKeyInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function metricDateKey(metric, date, timezoneOffsetMinutes = 0) {
  return metric === METRIC_COMMENTS ? dateKeyInTimeZone(date, COMMENT_TIME_ZONE) : dateKey(date, timezoneOffsetMinutes);
}

function normalizeTicketList(payload) {
  return Array.isArray(payload) ? payload : payload?.tickets || payload?.data || payload?.items || [];
}

function normalizeTicketId(ticket) {
  return String(ticket.ID || ticket.id || "");
}

function normalizeTicketShortId(ticket) {
  return String(ticket.shortID || ticket.shortId || ticket.short_id || normalizeTicketId(ticket));
}

function normalizeTicketUpdatedDate(ticket) {
  const value = ticket.updatedAt || ticket.updated_at;
  const date = value ? new Date(value) : null;
  return isValidDate(date) ? date : null;
}

function normalizeEventDate(event) {
  const value = event?.date || event?.createdAt || event?.timestamp || event?.created_at;
  const date = value ? new Date(value) : null;
  return isValidDate(date) ? date : null;
}

function buildAgentDirectory(dashboard) {
  return new Map(
    (dashboard.agents || []).map((agent) => [
      String(agent.id),
      {
        id: String(agent.id),
        email: agent.email || "",
        name: agent.name || agent.email || String(agent.id),
        teamIDs: (agent.teamIDs || agent.teams?.map((team) => team.id) || []).map(String),
      },
    ]),
  );
}

function teamIdsForAgent(agentId, agentDirectory) {
  return (agentDirectory.get(String(agentId))?.teamIDs || []).map(String);
}

function matchesFilters(agentId, filters, agentDirectory) {
  const normalizedAgentId = String(agentId);
  if (filters.excludeAgentIds.includes(normalizedAgentId)) return false;
  if (filters.agentIds.length && !filters.agentIds.includes(normalizedAgentId)) return false;
  if (filters.groupIds.length) {
    const teamIds = teamIdsForAgent(normalizedAgentId, agentDirectory);
    if (!teamIds.some((teamId) => filters.groupIds.includes(String(teamId)))) return false;
  }
  return true;
}

function authorProfile(event, agentDirectory) {
  const author = event.author || event.createdBy || {};
  const id =
    (typeof author === "string" ? author : author.ID || author.id || author.agentID || author.agentId) ||
    event.agentID ||
    event.agentId ||
    event.authorID ||
    event.authorId ||
    event.createdByID ||
    event.createdById ||
    "";
  const agentId = String(id || "");
  const profile = agentDirectory.get(agentId) || {};
  return {
    id: agentId,
    name: author.name || author.fullName || event.agentName || event.authorName || profile.name || agentId,
    email: author.email || event.agentEmail || event.authorEmail || profile.email || helpDeskAnalyticsAgentEmail(agentId),
  };
}

function eventAuthorType(event) {
  const author = event.author || event.createdBy || {};
  return `${author.type || event.authorType || event.createdByType || author.role || ""}`.toLowerCase();
}

function isMessageEvent(event) {
  const type = `${event.type || event.eventType || ""}`.toLowerCase();
  return type === "message";
}

function stripHtml(value) {
  return `${value || ""}`.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function eventMessageText(event) {
  const message = event.message || event.content || {};
  if (typeof message === "string") return stripHtml(message);
  return stripHtml(
    message.text ||
      message.plainText ||
      message.plain_text ||
      event.text ||
      event.plainText ||
      event.plain_text ||
      message.html ||
      message.richTextHtml ||
      message.rich_text_html ||
      event.richTextHtml ||
      event.rich_text_html ||
      event.html ||
      "",
  );
}

function isConversationTranscriptEvent(event) {
  return eventMessageText(event).toLowerCase().startsWith("conversation transcript");
}

function isZeroIdEvent(event) {
  const id = event?.ID ?? event?.id ?? event?.eventID ?? event?.eventId;
  return `${id ?? ""}`.trim() === "0";
}

function isPublicAgentMessageEvent(event) {
  return (
    isMessageEvent(event) &&
    !isPrivateMessageEvent(event) &&
    eventAuthorType(event) === "agent" &&
    !isZeroIdEvent(event) &&
    !isConversationTranscriptEvent(event)
  );
}

function isPrivateMessageEvent(event) {
  const message = event.message || {};
  return Boolean(
    event.isPrivate ||
      event.private ||
      event.is_private ||
      message.isPrivate ||
      message.private ||
      message.is_private,
  );
}

function isPrivateAgentCommentEvent(event) {
  return (
    isMessageEvent(event) &&
    isPrivateMessageEvent(event) &&
    eventAuthorType(event) === "agent" &&
    !isConversationTranscriptEvent(event)
  );
}

function analyticsAgentMessageEvents(ticket) {
  return (Array.isArray(ticket.events) ? ticket.events : []).filter((event) => isPublicAgentMessageEvent(event));
}

function metricTables(metric) {
  return metric === METRIC_COMMENTS
    ? {
        daily: COMMENT_DAILY_TABLE_BASE,
        events: COMMENT_EVENTS_TABLE_BASE,
        details: COMMENT_DETAILS_TABLE_BASE,
      }
    : {
        daily: DAILY_TABLE_BASE,
        events: MESSAGE_EVENTS_TABLE_BASE,
        details: REPLY_DETAILS_TABLE_BASE,
      };
}

function dailyTable(env, metric = METRIC_PUBLIC_REPLIES) {
  return accountTableName(env, metricTables(metric).daily);
}

function messageEventsTable(env, metric = METRIC_PUBLIC_REPLIES) {
  return accountTableName(env, metricTables(metric).events);
}

function replyDetailsTable(env, metric = METRIC_PUBLIC_REPLIES) {
  return accountTableName(env, metricTables(metric).details);
}

async function ensureHelpDeskAnalyticsCache(env, metric = METRIC_PUBLIC_REPLIES) {
  if (!env?.DB) throw new Error("Missing DB binding.");
  const table = dailyTable(env, metric);
  const tables = metricTables(metric);

  if (metric === METRIC_PUBLIC_REPLIES) {
    await env.DB.batch(
      OBSOLETE_ANALYTICS_TABLES.map((obsoleteTable) => env.DB.prepare(`DROP TABLE IF EXISTS ${accountTableName(env, obsoleteTable)}`)),
    );
  }

  await env.DB
    .prepare(
      `CREATE TABLE IF NOT EXISTS ${table} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        agent_name TEXT,
        agent_email TEXT,
        handled_tickets INTEGER NOT NULL DEFAULT 0,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, agent_id)
      )`,
    )
    .run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${accountIndexName(env, `idx_${tables.daily}_date`)} ON ${table}(date)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${accountIndexName(env, `idx_${tables.daily}_agent`)} ON ${table}(agent_id)`).run();
  await ensureHelpDeskAnalyticsReplyDetails(env, metric);
}

async function ensureHelpDeskAnalyticsMessageEvents(env, metric = METRIC_PUBLIC_REPLIES) {
  if (!env?.DB) throw new Error("Missing DB binding.");
  await env.DB
    .prepare(
      `CREATE TABLE IF NOT EXISTS ${messageEventsTable(env, metric)} (
        event_key TEXT PRIMARY KEY,
        recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    )
    .run();
}

async function ensureHelpDeskAnalyticsReplyDetails(env, metric = METRIC_PUBLIC_REPLIES) {
  if (!env?.DB) throw new Error("Missing DB binding.");
  const table = replyDetailsTable(env, metric);
  const tables = metricTables(metric);
  await env.DB
    .prepare(
      `CREATE TABLE IF NOT EXISTS ${table} (
        event_key TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        agent_name TEXT,
        agent_email TEXT,
        ticket_id TEXT,
        short_id TEXT,
        event_date TEXT,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    )
    .run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${accountIndexName(env, `idx_${tables.details}_date`)} ON ${table}(date)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${accountIndexName(env, `idx_${tables.details}_agent`)} ON ${table}(agent_id)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${accountIndexName(env, `idx_${tables.details}_date_agent`)} ON ${table}(date, agent_id)`).run();
}

async function sha256Text(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function analyticsEventUniqueKey({ event, ticket, agent, messageDate }) {
  const ticketId = normalizeTicketId(ticket);
  const directId = [
    event?.ID,
    event?.id,
    event?.eventID,
    event?.eventId,
    event?.messageID,
    event?.messageId,
    event?.message?.ID,
    event?.message?.id,
  ]
    .map((value) => `${value || ""}`.trim())
    .find(Boolean);
  if (directId) return ticketId ? `direct:${ticketId}:${directId}` : `direct:${directId}`;

  return `hash:${await sha256Text(
    JSON.stringify({
      ticketId,
      agentId: agent.id,
      date: messageDate.toISOString(),
      text: eventMessageText(event),
    }),
  )}`;
}

async function analyticsCommentEventUniqueKey({ event, ticket, agent, messageDate }) {
  const ticketId = normalizeTicketId(ticket);
  const shortId = normalizeTicketShortId(ticket);
  return `comment:${await sha256Text(
    JSON.stringify({
      ticketId,
      shortId,
      agentId: agent.id,
      date: messageDate.toISOString(),
      eventId: event?.ID ?? event?.id ?? event?.eventID ?? event?.eventId ?? "",
    }),
  )}`;
}

async function reserveAnalyticsMessageEvent(env, eventKey, metric = METRIC_PUBLIC_REPLIES) {
  await ensureHelpDeskAnalyticsMessageEvents(env, metric);
  const result = await env.DB.prepare(
    `INSERT INTO ${messageEventsTable(env, metric)} (event_key, recorded_at)
     VALUES (?, CURRENT_TIMESTAMP)
     ON CONFLICT(event_key) DO NOTHING`,
  )
    .bind(eventKey)
    .run();
  return Number(result?.meta?.changes || 0) > 0;
}

async function readCachedRange(env, fromDate, toDate, metric = METRIC_PUBLIC_REPLIES) {
  const table = dailyTable(env, metric);
  const { results } = await env.DB.prepare(
    `SELECT date, agent_id, agent_name, agent_email, handled_tickets
     FROM ${table}
     WHERE date >= ? AND date <= ?
     ORDER BY date ASC, handled_tickets DESC`,
  )
    .bind(fromDate, toDate)
    .all();
  return results || [];
}

async function readCachedDetailsRange(env, fromDate, toDate, metric = METRIC_PUBLIC_REPLIES) {
  const table = replyDetailsTable(env, metric);
  const { results } = await env.DB.prepare(
    `SELECT date, agent_id, agent_name, agent_email, ticket_id, short_id, event_date, event_key
     FROM ${table}
     WHERE date >= ? AND date <= ?
     ORDER BY date ASC, event_date ASC, short_id ASC`,
  )
    .bind(fromDate, toDate)
    .all();
  return results || [];
}

async function runBatches(db, statements, size = 80) {
  if (!statements.length) return;
  for (let index = 0; index < statements.length; index += size) {
    await db.batch(statements.slice(index, index + size));
  }
}

async function finalizeCachedDay(env, date, metric = METRIC_PUBLIC_REPLIES) {
  await env.DB.prepare(`UPDATE ${dailyTable(env, metric)} SET cached_at = CURRENT_TIMESTAMP WHERE date = ?`).bind(date).run();
}

function datesFromDetails(detailRows, fallbackDate) {
  const dates = new Set();
  for (const row of detailRows || []) {
    const date = row.date || fallbackDate;
    if (date) dates.add(date);
  }
  return dates;
}

function hasAnySearchParam(searchParams, names) {
  return names.some((name) => searchParams.has(name));
}

async function insertReplyDetails(env, detailRows, metric = METRIC_PUBLIC_REPLIES) {
  const table = replyDetailsTable(env, metric);
  await runBatches(
    env.DB,
    (detailRows || [])
      .filter((row) => row.event_key && row.date && row.agent_id)
      .map((row) =>
        env.DB.prepare(
          `INSERT INTO ${table}
            (event_key, date, agent_id, agent_name, agent_email, ticket_id, short_id, event_date, cached_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(event_key) DO UPDATE SET
            date = excluded.date,
            agent_id = excluded.agent_id,
            agent_name = COALESCE(NULLIF(excluded.agent_name, ''), ${table}.agent_name),
            agent_email = COALESCE(NULLIF(excluded.agent_email, ''), ${table}.agent_email),
            ticket_id = COALESCE(NULLIF(excluded.ticket_id, ''), ${table}.ticket_id),
            short_id = COALESCE(NULLIF(excluded.short_id, ''), ${table}.short_id),
            event_date = COALESCE(NULLIF(excluded.event_date, ''), ${table}.event_date),
            cached_at = CURRENT_TIMESTAMP`,
        ).bind(
          row.event_key,
          row.date,
          row.agent_id,
          row.agent_name || "",
          row.agent_email || "",
          row.ticket_id || "",
          row.short_id || "",
          row.event_date || "",
        ),
      ),
  );
}

async function recomputeCachedDatesFromDetails(env, dates, metric = METRIC_PUBLIC_REPLIES) {
  const uniqueDates = [...new Set(dates)].filter(Boolean);
  const daily = dailyTable(env, metric);
  const details = replyDetailsTable(env, metric);

  for (const date of uniqueDates) {
    await env.DB.prepare(`DELETE FROM ${daily} WHERE date = ?`).bind(date).run();
    await env.DB
      .prepare(
        `INSERT INTO ${daily}
          (date, agent_id, agent_name, agent_email, handled_tickets, cached_at)
         SELECT
          date,
          agent_id,
          COALESCE(MAX(NULLIF(agent_name, '')), agent_id),
          COALESCE(MAX(NULLIF(agent_email, '')), ''),
          COUNT(*),
          CURRENT_TIMESTAMP
         FROM ${details}
         WHERE date = ?
         GROUP BY date, agent_id`,
      )
      .bind(date)
      .run();
  }
}

async function writeCachedDetailsByDate(env, fallbackDate, detailRows, metric = METRIC_PUBLIC_REPLIES) {
  const dates = new Set(datesFromDetails(detailRows, fallbackDate));
  await insertReplyDetails(env, detailRows, metric);
  await recomputeCachedDatesFromDetails(env, dates, metric);

  if (!dates.size) return [];
  const sortedDates = [...dates].sort();
  return readCachedRange(env, sortedDates[0], sortedDates[sortedDates.length - 1], metric);
}

function filterRows(rows, filters, agentDirectory = new Map()) {
  return rows.filter((row) => matchesFilters(row.agent_id, filters, agentDirectory));
}

function filterDetailRows(rows, filters, agentDirectory = new Map()) {
  return rows.filter((row) => matchesFilters(row.agent_id, filters, agentDirectory));
}

function addDateKeyDays(value, days) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateKeysBetween(fromDate, toDate) {
  const dates = [];
  for (let current = fromDate; current <= toDate; current = addDateKeyDays(current, 1)) {
    dates.push(current);
  }
  return dates;
}

function dateKeysForRange(from, to, timezoneOffsetMinutes) {
  return dateKeysBetween(dateKey(from, timezoneOffsetMinutes), dateKey(new Date(to.getTime() - 1), timezoneOffsetMinutes));
}

async function listTicketsForRange(env, from, to) {
  const ticketsById = new Map();
  let pageBudget = MAX_PAGES_PER_RANGE;

  for (const status of STATUSES) {
    let nextCursor = null;
    let page = 1;

    do {
      if (pageBudget <= 0) throw new Error("Too many tickets for this time slice. Retry with a smaller range.");

      const params = new URLSearchParams({
        status,
        updatedDateFrom: from.toISOString(),
        updatedDateTo: to.toISOString(),
        sortBy: "updatedAt",
        order: "asc",
        pageSize: String(PAGE_SIZE),
        eventsScope: "full",
      });
      if (nextCursor) {
        params.set("next.value", nextCursor.value);
        params.set("next.ID", nextCursor.id);
      }
      const { payload, headers } = await helpdeskRequestWithMeta(env, `/tickets?${params.toString()}`, { method: "GET" });
      const tickets = normalizeTicketList(payload);
      pageBudget -= 1;

      for (const ticket of tickets) {
        const updatedDate = normalizeTicketUpdatedDate(ticket);
        if (!updatedDate || updatedDate < from || updatedDate >= to) continue;
        const id = normalizeTicketId(ticket);
        if (id) ticketsById.set(id, ticket);
      }

      const totalPages = Number(headers.get("X-Total-Pages") || 0);
      const hasNextPage = totalPages > 0 ? page < totalPages : tickets.length === PAGE_SIZE;
      if (!hasNextPage) break;

      const lastTicket = tickets.at(-1);
      const lastId = lastTicket ? normalizeTicketId(lastTicket) : "";
      const lastValue = lastTicket?.updatedAt || lastTicket?.updated_at;
      if (!lastId || !lastValue) throw new Error("HelpDesk did not return a cursor for the next ticket page.");
      nextCursor = { id: lastId, value: lastValue };
      page += 1;
    } while (nextCursor);
  }

  return Array.from(ticketsById.values());
}

async function computeDay(env, from, to, timezoneOffsetMinutes, agentDirectory, { eventFrom = from, eventTo = to } = {}) {
  const tickets = await listTicketsForRange(env, from, to);
  const handled = [];

  for (const ticket of tickets) {
    const ticketId = normalizeTicketId(ticket);
    const shortId = normalizeTicketShortId(ticket);
    const events = analyticsAgentMessageEvents(ticket);

    for (const event of events) {
      const eventDate = normalizeEventDate(event);
      if (!eventDate || eventDate < eventFrom || eventDate >= eventTo) continue;

      const agent = authorProfile(event, agentDirectory);
      if (!agent.id) continue;

      const localDay = dateKey(eventDate, timezoneOffsetMinutes);
      handled.push({
        date: localDay,
        agent_id: agent.id,
        agent_name: agent.name || agent.id,
        agent_email: agent.email || "",
        ticket_id: ticketId,
        short_id: shortId,
        event_date: eventDate.toISOString(),
        event_key: await analyticsEventUniqueKey({ event, ticket, agent, messageDate: eventDate }),
      });
    }
  }

  return handled.sort((left, right) => {
    const agentOrder = left.agent_name.localeCompare(right.agent_name);
    return agentOrder || left.short_id.localeCompare(right.short_id) || left.event_date.localeCompare(right.event_date);
  });
}

export async function recordHelpDeskAnalyticsMessageWebhook(env, payload, receivedAt = new Date()) {
  const eventType = `${payload?.eventType || ""}`;

  if (eventType === "tickets.update") {
    const ticket = payload?.payload || {};
    const events = Array.isArray(ticket.events) ? ticket.events : [];
    const commentDetails = [];
    const replyDetails = [];
    let commentReservedCount = 0;
    let replyReservedCount = 0;
    const timezoneOffsetMinutes = Number(env.HELPDESK_ANALYTICS_TZ_OFFSET || 0);
    const replyOffset = Number.isFinite(timezoneOffsetMinutes) ? timezoneOffsetMinutes : 0;

    for (const event of events) {
      const metric = isPrivateAgentCommentEvent(event)
        ? METRIC_COMMENTS
        : isPublicAgentMessageEvent(event)
          ? METRIC_PUBLIC_REPLIES
          : "";
      if (!metric) continue;

      const eventDate = normalizeEventDate(event);
      if (!eventDate) continue;
      if (eventDate > receivedAt) continue;

      const agent = authorProfile(event, new Map());
      if (!agent.id) continue;

      const localDay = metricDateKey(metric, eventDate, replyOffset);
      const eventKey = metric === METRIC_COMMENTS
        ? await analyticsCommentEventUniqueKey({ event, ticket, agent, messageDate: eventDate })
        : await analyticsEventUniqueKey({ event, ticket, agent, messageDate: eventDate });
      if (await reserveAnalyticsMessageEvent(env, eventKey, metric)) {
        if (metric === METRIC_COMMENTS) {
          commentReservedCount += 1;
        } else {
          replyReservedCount += 1;
        }
      }

      const detail = {
        date: localDay,
        agent_id: agent.id,
        agent_name: agent.name || agent.id,
        agent_email: agent.email || "",
        ticket_id: normalizeTicketId(ticket),
        short_id: normalizeTicketShortId(ticket),
        event_date: eventDate.toISOString(),
        event_key: eventKey,
      };
      if (metric === METRIC_COMMENTS) {
        commentDetails.push(detail);
      } else {
        replyDetails.push(detail);
      }
    }

    if (!commentDetails.length && !replyDetails.length) {
      return { recorded: false, ignored: true, reason: "no_agent_analytics_events", assignedPoints: 0 };
    }

    const commentDates = datesFromDetails(commentDetails, "");
    const replyDates = datesFromDetails(replyDetails, "");
    if (commentDetails.length) {
      await ensureHelpDeskAnalyticsCache(env, METRIC_COMMENTS);
      await writeCachedDetailsByDate(env, "", commentDetails, METRIC_COMMENTS);
      for (const date of commentDates) {
        await finalizeCachedDay(env, date, METRIC_COMMENTS);
      }
    }
    if (replyDetails.length) {
      await ensureHelpDeskAnalyticsCache(env, METRIC_PUBLIC_REPLIES);
      await writeCachedDetailsByDate(env, "", replyDetails, METRIC_PUBLIC_REPLIES);
      for (const date of replyDates) {
        await finalizeCachedDay(env, date, METRIC_PUBLIC_REPLIES);
      }
    }

    return {
      recorded: true,
      duplicate: commentReservedCount + replyReservedCount === 0,
      assignedPoints: commentReservedCount + replyReservedCount,
      metric: "tickets_update",
      comments: commentDetails.length,
      newComments: commentReservedCount,
      publicReplies: replyDetails.length,
      newPublicReplies: replyReservedCount,
      commentDates: [...commentDates],
      replyDates: [...replyDates],
      ticketId: normalizeTicketId(ticket),
      ticketShortId: normalizeTicketShortId(ticket),
    };
  }

  if (eventType !== "tickets.events.message") {
    return { recorded: false, ignored: true, reason: "unsupported_event_type" };
  }

  const ticket = payload?.payload?.ticket || {};
  const event = payload?.payload?.event || {};
  if (!isPublicAgentMessageEvent(event)) {
    return { recorded: false, ignored: true, reason: "not_public_agent_message" };
  }

  const eventDate = normalizeEventDate(event);
  if (!eventDate) return { recorded: false, ignored: true, reason: "invalid_event_date" };
  if (eventDate > receivedAt) return { recorded: false, ignored: true, reason: "future_event_date" };

  const agent = authorProfile(event, new Map());
  if (!agent.id) return { recorded: false, ignored: true, reason: "missing_agent_id" };

  const timezoneOffsetMinutes = Number(env.HELPDESK_ANALYTICS_TZ_OFFSET || 0);
  const localDay = dateKey(eventDate, Number.isFinite(timezoneOffsetMinutes) ? timezoneOffsetMinutes : 0);
  const eventKey = await analyticsEventUniqueKey({ event, ticket, agent, messageDate: eventDate });
  const detail = {
    date: localDay,
    agent_id: agent.id,
    agent_name: agent.name || agent.id,
    agent_email: agent.email || "",
    ticket_id: normalizeTicketId(ticket),
    short_id: normalizeTicketShortId(ticket),
    event_date: eventDate.toISOString(),
    event_key: eventKey,
  };

  await ensureHelpDeskAnalyticsCache(env, METRIC_PUBLIC_REPLIES);
  const reserved = await reserveAnalyticsMessageEvent(env, eventKey, METRIC_PUBLIC_REPLIES);
  await writeCachedDetailsByDate(env, localDay, [detail], METRIC_PUBLIC_REPLIES);
  await finalizeCachedDay(env, localDay, METRIC_PUBLIC_REPLIES);

  return {
    recorded: true,
    duplicate: !reserved,
    assignedPoints: reserved ? 1 : 0,
    metric: METRIC_PUBLIC_REPLIES,
    date: localDay,
    eventKey,
    ticketId: detail.ticket_id,
    ticketShortId: detail.short_id,
    agentId: agent.id,
    agentName: agent.name,
    agentEmail: agent.email,
  };
}

function rowsToResponse(rows, from, to, agentDirectory, cache = {}, detailRows = [], metric = METRIC_PUBLIC_REPLIES) {
  const agentsById = new Map();
  for (const row of rows) {
    const profile = agentDirectory.get(String(row.agent_id)) || {};
    const agentId = String(row.agent_id);
    const replies = Number(row.handled_tickets || 0);
    if (!agentsById.has(agentId)) {
      agentsById.set(agentId, {
        agent_id: agentId,
        id: agentId,
        name: row.agent_name || profile.name || agentId,
        email: row.agent_email || profile.email || agentId,
        total_tickets: 0,
        total_replies: 0,
        days: [],
      });
    }
    const agent = agentsById.get(agentId);
    agent.name = agent.name || row.agent_name || profile.name || agentId;
    agent.email = agent.email || row.agent_email || profile.email || agentId;
    agent.total_tickets += replies;
    agent.total_replies += replies;
    agent.days.push({ date: row.date, tickets: replies, replies });
  }

  for (const detail of detailRows || []) {
    const agentId = String(detail.agent_id || "");
    if (!agentId) continue;
    const profile = agentDirectory.get(agentId) || {};
    if (!agentsById.has(agentId)) {
      agentsById.set(agentId, {
        agent_id: agentId,
        id: agentId,
        name: detail.agent_name || profile.name || agentId,
        email: detail.agent_email || profile.email || agentId,
        total_tickets: 0,
        total_replies: 0,
        days: [],
      });
    }
    const agent = agentsById.get(agentId);
    if (!agent.reply_details) agent.reply_details = [];
    agent.reply_details.push({
      date: detail.date || "",
      ticket_id: detail.ticket_id || "",
      short_id: detail.short_id || detail.ticket_id || "",
      event_date: detail.event_date || "",
      event_key: detail.event_key || "",
      points: 1,
    });
  }

  for (const agent of agentsById.values()) {
    agent.reply_details = (agent.reply_details || []).sort((left, right) => {
      const dateOrder = `${left.date || ""}`.localeCompare(`${right.date || ""}`);
      return dateOrder || `${left.event_date || ""}`.localeCompare(`${right.event_date || ""}`) || `${left.short_id || ""}`.localeCompare(`${right.short_id || ""}`);
    });
  }

  const agents = Array.from(agentsById.values()).sort((left, right) => right.total_tickets - left.total_tickets);

  const totalTickets = agents.reduce((sum, agent) => sum + agent.total_tickets, 0);
  const timelineByDate = new Map();
  for (const row of rows) {
    if (!timelineByDate.has(row.date)) timelineByDate.set(row.date, { date: row.date, tickets: 0, replies: 0 });
    const replies = Number(row.handled_tickets || 0);
    const timelineDay = timelineByDate.get(row.date);
    timelineDay.tickets += replies;
    timelineDay.replies += replies;
  }

  return {
    metric,
    period: { from: from.toISOString(), to: to.toISOString() },
    summary: {
      total_tickets: totalTickets,
      total_replies: totalTickets,
      active_agents: agents.filter((agent) => agent.total_tickets > 0).length,
      prev_period: { total_tickets: 0, total_replies: 0, active_agents: 0 },
    },
    agents,
    timeline: Array.from(timelineByDate.values()).sort((left, right) => left.date.localeCompare(right.date)),
    cache,
    capabilities: {
      per_agent_period_metrics: true,
      per_agent_daily_metrics: true,
      account_daily_timeline: true,
      cached_past_days: true,
      public_agent_reply_counts: metric === METRIC_PUBLIC_REPLIES,
      private_agent_comment_counts: metric === METRIC_COMMENTS,
      agent_reply_details: true,
      source: metric === METRIC_COMMENTS ? "tickets_update_private_agent_comment_events" : "all_status_ticket_updated_scan_filtered_agent_public_reply_events",
    },
  };
}

export async function onRequest(context) {
  if (context.request.method !== "GET") return methodNotAllowed(["GET"]);

  const auth = await requireAuth(context);
  if (auth.error) return auth.error;
  context = withAccountContext(context);

  try {
    const url = new URL(context.request.url);
    const metric = normalizeMetric(url.searchParams.get("metric"));
    await ensureHelpDeskAnalyticsCache(context.env, metric);

    if (
      hasAnySearchParam(url.searchParams, [
        "import",
        "reset_date",
        "finalize_date",
        "cache_full_day",
        "event_from",
        "event_to",
        "report_from",
        "report_to",
      ])
    ) {
      return errorResponse("HelpDesk import is no longer available.", 410);
    }

    const from = parseDateParam(url.searchParams.get("from"), "from");
    const to = parseDateParam(url.searchParams.get("to"), "to");
    if (to <= from) return errorResponse("to must be after from", 400);

    const timezoneOffsetMinutes = Number(url.searchParams.get("tz_offset") || 0);
    if (!Number.isFinite(timezoneOffsetMinutes)) return errorResponse("Invalid timezone offset", 400);

    const filters = {
      agentIds: splitParam(url.searchParams.get("agents")),
      excludeAgentIds: splitParam(url.searchParams.get("exclude_agents")),
      groupIds: splitParam(url.searchParams.get("groups")),
    };

    const agentDirectory = filters.groupIds.length > 0 ? buildAgentDirectory(await getHelpDeskDashboard(context.env)) : new Map();
    const rangeFromDate = metricDateKey(metric, from, timezoneOffsetMinutes);
    const rangeToDate = metricDateKey(metric, new Date(to.getTime() - 1), timezoneOffsetMinutes);
    const cachedRangeRows = await readCachedRange(context.env, rangeFromDate, rangeToDate, metric);
    const cachedDetailRows = await readCachedDetailsRange(context.env, rangeFromDate, rangeToDate, metric);
    const rows = filterRows(cachedRangeRows, filters, agentDirectory);
    const detailRows = filterDetailRows(cachedDetailRows, filters, agentDirectory);
    const expectedDates = dateKeysBetween(rangeFromDate, rangeToDate);
    const datesWithRows = new Set(cachedRangeRows.map((row) => row.date));
    const missingDays = expectedDates.filter((date) => !datesWithRows.has(date)).length;

    return json(
      rowsToResponse(
        rows,
        from,
        to,
        agentDirectory,
        {
          date: rangeFromDate,
          from_date: rangeFromDate,
          to_date: rangeToDate,
          checked: true,
          hit: cachedRangeRows.length > 0,
          source: "d1_range",
          missing: missingDays > 0,
          missing_days: missingDays,
          saved: false,
          metric,
        },
        detailRows,
        metric,
      ),
    );
  } catch (error) {
    const message = error.message || "";
    if (/too many requests|rate limit/i.test(message)) {
      console.error("HelpDesk analytics rate limited.", error);
      return errorResponse("HelpDesk analytics is rate limited. Try again later.", 429);
    }

    return serverErrorResponse(error, "Failed to load HelpDesk analytics.");
  }
}
