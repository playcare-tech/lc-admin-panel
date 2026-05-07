import { requireAuth } from "../../_lib/auth.js";
import { helpdeskRequestWithMeta, normalizeHelpDeskTicketList } from "../../_lib/helpdesk.js";
import {
  getHelpdeskWorkflowAnalytics,
  listHelpdeskOpenTicketSnapshots,
  recordHelpdeskOpenTicketSnapshot,
} from "../../_lib/helpdesk-workflows.js";
import { errorResponse, json, methodNotAllowed, serverErrorResponse } from "../../_lib/http.js";

function dateKeyForOffset(date, timezoneOffsetMinutes = 0) {
  return new Date(date.getTime() - Number(timezoneOffsetMinutes || 0) * 60000).toISOString().slice(0, 10);
}

function addDays(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function currentOpenTicketCount(env) {
  const params = new URLSearchParams({
    status: "open",
    pageSize: "1",
    order: "desc",
    sortBy: "createdAt",
    eventsScope: "none",
  });
  const { payload, headers } = await helpdeskRequestWithMeta(env, `/tickets?${params.toString()}`);
  const totalHeader = headers.get("X-Total-Results");
  const total = Number(totalHeader);
  return totalHeader !== null && Number.isFinite(total) ? total : normalizeHelpDeskTicketList(payload).length;
}

async function openTicketTrend(env, period, timezoneOffsetMinutes) {
  const today = dateKeyForOffset(new Date(), timezoneOffsetMinutes);
  const yesterday = addDays(today, -1);
  const trendFrom = [period.from, yesterday].filter(Boolean).sort()[0] || yesterday;
  const trendTo = [period.to, today].filter(Boolean).sort().at(-1) || today;
  let currentCount = null;
  let errorMessage = "";

  try {
    currentCount = await currentOpenTicketCount(env);
    await recordHelpdeskOpenTicketSnapshot(env, {
      date: today,
      count: currentCount,
    });
  } catch (error) {
    console.warn("Failed to record HelpDesk open ticket snapshot.", error);
    errorMessage = error.message || "Failed to record open ticket snapshot.";
  }

  try {
    const snapshots = await listHelpdeskOpenTicketSnapshots(env, {
      from: trendFrom,
      to: trendTo,
    });
    const snapshotByDate = new Map(snapshots.map((snapshot) => [snapshot.date, snapshot]));
    if (currentCount !== null) {
      snapshotByDate.set(today, {
        date: today,
        count: currentCount,
        capturedAt: new Date().toISOString(),
      });
    }
    return {
      today: snapshotByDate.get(today) || { date: today, count: null },
      yesterday: snapshotByDate.get(yesterday) || { date: yesterday, count: null },
      snapshots: Array.from(snapshotByDate.values()).sort((left, right) => left.date.localeCompare(right.date)),
      ...(errorMessage ? { error: errorMessage } : {}),
    };
  } catch (error) {
    console.warn("Failed to load HelpDesk open ticket snapshots.", error);
    return {
      today: { date: today, count: currentCount },
      yesterday: { date: yesterday, count: null },
      snapshots: currentCount === null ? [] : [{ date: today, count: currentCount, capturedAt: new Date().toISOString() }],
      error: error.message || errorMessage || "Failed to load open ticket snapshots.",
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
    const analytics = await getHelpdeskWorkflowAnalytics(context.env, {
      from,
      to,
      timezoneOffsetMinutes,
    });
    const openTickets = await openTicketTrend(context.env, analytics.period, timezoneOffsetMinutes);
    const openTicketByDate = new Map((openTickets.snapshots || []).map((snapshot) => [snapshot.date, snapshot]));
    const daily = (analytics.daily || []).map((day) => ({
      ...day,
      openTickets: openTicketByDate.get(day.date)?.count ?? null,
    }));

    return json({
      ...analytics,
      daily,
      openTickets,
    });
  } catch (error) {
    if (error.message?.includes("from date must be before")) {
      return errorResponse(error.message, 400);
    }
    return serverErrorResponse(error, "Failed to load HelpDesk workflow analytics.");
  }
}
