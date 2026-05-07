import { requireAuth } from "../../_lib/auth.js";
import { helpdeskRequestWithMeta, normalizeHelpDeskTicketList } from "../../_lib/helpdesk.js";
import { getHelpdeskWorkflowAnalytics } from "../../_lib/helpdesk-workflows.js";
import { errorResponse, json, methodNotAllowed, serverErrorResponse } from "../../_lib/http.js";

function dateKeyForOffset(date, timezoneOffsetMinutes = 0) {
  return new Date(date.getTime() - Number(timezoneOffsetMinutes || 0) * 60000).toISOString().slice(0, 10);
}

function addDays(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function offsetText(timezoneOffsetMinutes = 0) {
  const offsetMinutes = -Number(timezoneOffsetMinutes || 0);
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
  const minutes = String(absolute % 60).padStart(2, "0");
  return `${sign}${hours}:${minutes}`;
}

function localDayBoundary(dateKey, timezoneOffsetMinutes, endOfDay = false) {
  return `${dateKey}T${endOfDay ? "23:59:59" : "00:00:00"}${offsetText(timezoneOffsetMinutes)}`;
}

async function openTicketCountForDate(env, dateKey, timezoneOffsetMinutes) {
  const params = new URLSearchParams({
    status: "open",
    pageSize: "1",
    order: "desc",
    sortBy: "createdAt",
    eventsScope: "none",
    createdDateFrom: localDayBoundary(dateKey, timezoneOffsetMinutes),
    createdDateTo: localDayBoundary(dateKey, timezoneOffsetMinutes, true),
  });
  const { payload, headers } = await helpdeskRequestWithMeta(env, `/tickets?${params.toString()}`);
  const totalHeader = headers.get("X-Total-Results");
  const total = Number(totalHeader);
  return totalHeader !== null && Number.isFinite(total) ? total : normalizeHelpDeskTicketList(payload).length;
}

async function openTicketCounts(env, timezoneOffsetMinutes) {
  const today = dateKeyForOffset(new Date(), timezoneOffsetMinutes);
  const yesterday = addDays(today, -1);
  try {
    const [todayCount, yesterdayCount] = await Promise.all([
      openTicketCountForDate(env, today, timezoneOffsetMinutes),
      openTicketCountForDate(env, yesterday, timezoneOffsetMinutes),
    ]);
    return {
      today: { date: today, count: todayCount },
      yesterday: { date: yesterday, count: yesterdayCount },
    };
  } catch (error) {
    console.warn("Failed to load HelpDesk open ticket counts.", error);
    return {
      today: { date: today, count: null },
      yesterday: { date: yesterday, count: null },
      error: error.message || "Failed to load open ticket counts.",
    };
  }
}

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const auth = await requireAuth(context);
  if (auth.error) return auth.error;

  const url = new URL(context.request.url);
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";
  const timezoneOffsetMinutes = Number(url.searchParams.get("tzOffset") || url.searchParams.get("timezoneOffsetMinutes") || 0);

  try {
    const [analytics, openTickets] = await Promise.all([
      getHelpdeskWorkflowAnalytics(context.env, {
        from,
        to,
        timezoneOffsetMinutes,
      }),
      openTicketCounts(context.env, timezoneOffsetMinutes),
    ]);

    return json({
      ...analytics,
      openTickets,
    });
  } catch (error) {
    if (error.message?.includes("from date must be before")) {
      return errorResponse(error.message, 400);
    }
    return serverErrorResponse(error, "Failed to load HelpDesk workflow analytics.");
  }
}
