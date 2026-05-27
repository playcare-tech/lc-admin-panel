import { withAccountContext } from "../_lib/accounts.js";
import { helpdeskRequest, normalizeHelpDeskTicketSummary } from "../_lib/helpdesk.js";
import { recordHelpDeskAnalyticsWebhookReceived } from "../_lib/helpdesk-analytics-webhooks.js";
import { errorResponse, json, methodNotAllowed, serverErrorResponse } from "../_lib/http.js";
import {
  finishHelpdeskWebhookEvent,
  helpdeskWorkflowActionCount,
  recordHelpdeskWebhookEvent,
} from "../_lib/helpdesk-workflows.js";
import { writeLogSafely } from "../_lib/logs.js";
import { runEnabledHelpdeskWorkflowsForWebhook } from "../api/helpdesk/tickets.js";
import { processHelpDeskAnalyticsMessagePayload } from "./helpdesk-analytics-message.js";

function safeEqualText(left, right) {
  const leftText = `${left || ""}`;
  const rightText = `${right || ""}`;
  if (leftText.length !== rightText.length) return false;

  let diff = 0;
  for (let index = 0; index < leftText.length; index += 1) {
    diff |= leftText.charCodeAt(index) ^ rightText.charCodeAt(index);
  }
  return diff === 0;
}

function webhookSecretError(context) {
  const expectedSecret = `${context.env.HELPDESK_WEBHOOK_SECRET || ""}`.trim();
  if (!expectedSecret) return null;

  const url = new URL(context.request.url);
  const submittedSecret =
    `${context.request.headers.get("X-HelpDesk-Webhook-Secret") || ""}`.trim() ||
    `${context.request.headers.get("X-Webhook-Secret") || ""}`.trim() ||
    `${url.searchParams.get("secret") || ""}`.trim();

  if (!submittedSecret || !safeEqualText(submittedSecret, expectedSecret)) {
    return errorResponse("Unauthorized.", 401);
  }
  return null;
}

async function readWebhookPayload(request) {
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_error) {
    return { raw: text };
  }
}

function firstString(values) {
  return values.map((value) => `${value || ""}`.trim()).find(Boolean) || "";
}

function looksLikeTicketPayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Boolean(
    value.shortID ||
      value.shortId ||
      value.short_id ||
      value.status ||
      value.subject ||
      value.requester ||
      value.lastMessageAt ||
      value.tagIDs,
  );
}

function collectTicketIdCandidates(value, candidates = []) {
  if (!value || typeof value !== "object") return candidates;
  if (Array.isArray(value)) {
    value.forEach((item) => collectTicketIdCandidates(item, candidates));
    return candidates;
  }

  const ticket = value.ticket || value.ticketData || value.conversation || value.resource;
  if (ticket && typeof ticket === "object") {
    candidates.push(ticket.ID, ticket.id, ticket.ticketId, ticket.ticketID, ticket.ticket_id);
  }
  if (looksLikeTicketPayload(value)) {
    candidates.push(value.ID, value.id);
  }
  candidates.push(value.ticketId, value.ticketID, value.ticket_id);

  for (const nestedValue of Object.values(value)) {
    if (nestedValue && typeof nestedValue === "object") {
      collectTicketIdCandidates(nestedValue, candidates);
    }
  }

  return candidates;
}

function extractTicketId(payload) {
  return firstString([
    payload?.payload?.ID,
    payload?.payload?.id,
    payload?.payload?.ticket?.ID,
    payload?.payload?.ticket?.id,
    payload?.data?.ID,
    payload?.data?.id,
    payload?.data?.ticket?.ID,
    payload?.data?.ticket?.id,
    ...collectTicketIdCandidates(payload),
  ]);
}

function extractTicketShortId(payload) {
  return firstString([
    payload?.payload?.shortID,
    payload?.payload?.shortId,
    payload?.payload?.short_id,
    payload?.payload?.ticket?.shortID,
    payload?.payload?.ticket?.shortId,
    payload?.payload?.ticket?.short_id,
    payload?.ticket?.shortID,
    payload?.ticket?.shortId,
    payload?.ticket?.short_id,
    payload?.data?.ticket?.shortID,
    payload?.data?.ticket?.shortId,
    payload?.data?.ticket?.short_id,
    payload?.shortID,
    payload?.shortId,
    payload?.short_id,
  ]);
}

function runsActionCount(runs = []) {
  return runs.reduce((sum, run) => sum + helpdeskWorkflowActionCount(run.metadata || {}), 0);
}

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }
  context = withAccountContext(context);

  const secretError = webhookSecretError(context);
  if (secretError) return secretError;

  let webhookEvent = null;
  let payload = {};
  try {
    payload = await readWebhookPayload(context.request);
    const ticketId = extractTicketId(payload);
    const ticketShortId = extractTicketShortId(payload);
    webhookEvent = await recordHelpdeskWebhookEvent(context.env, {
      type: "create-ticket",
      ticketId,
      ticketShortId,
      payload,
    });

    const eventType = `${payload.eventType || ""}`.trim();
    if (eventType && eventType !== "tickets.create") {
      let analytics = null;
      if (["tickets.events.message", "tickets.update"].includes(eventType)) {
        await recordHelpDeskAnalyticsWebhookReceived(context.env);
        analytics = await processHelpDeskAnalyticsMessagePayload(context.env, payload);
      }
      await finishHelpdeskWebhookEvent(context.env, webhookEvent.id, {
        status: "ignored",
      });
      return json({
        ok: true,
        ignored: true,
        webhookEventId: webhookEvent.id,
        eventType,
        analytics,
      });
    }

    if (!ticketId) {
      await finishHelpdeskWebhookEvent(context.env, webhookEvent.id, {
        status: "error",
        error: "Webhook payload did not include a ticket id.",
      });
      return errorResponse("Webhook payload did not include a ticket id.", 400);
    }

    const ticketDetail = await helpdeskRequest(context.env, `/tickets/${encodeURIComponent(ticketId)}`);
    const ticket = normalizeHelpDeskTicketSummary(ticketDetail);
    const timezoneOffsetMinutes = Number(context.env.HELPDESK_ANALYTICS_TZ_OFFSET || 0);
    const runs = await runEnabledHelpdeskWorkflowsForWebhook(
      context,
      { session: { user: "system:helpdesk-webhook" } },
      ticketDetail,
      timezoneOffsetMinutes,
      { webhookEventId: webhookEvent.id },
    );
    const actions = runsActionCount(runs);

    await finishHelpdeskWebhookEvent(context.env, webhookEvent.id, {
      status: "processed",
      workflowRuns: runs.length,
      actions,
    });
    await writeLogSafely(context.env, {
      actor: "system:helpdesk-webhook",
      area: "helpdesk",
      action: "create_ticket_webhook",
      target: ticket.id || ticketId,
      status: "success",
      details: `Processed HelpDesk create-ticket webhook with ${runs.length} workflow run(s) and ${actions} action(s).`,
      metadata: {
        webhookEventId: webhookEvent.id,
        ticketId: ticket.id || ticketId,
        shortId: ticket.short_id || ticketShortId,
        workflowRuns: runs.length,
        actions,
      },
    });

    return json({
      ok: true,
      webhookEventId: webhookEvent.id,
      ticketId: ticket.id || ticketId,
      ticketShortId: ticket.short_id || ticketShortId,
      workflowRuns: runs.length,
      actions,
      runs,
    });
  } catch (error) {
    if (webhookEvent?.id) {
      await finishHelpdeskWebhookEvent(context.env, webhookEvent.id, {
        status: "error",
        error: error.message || "Webhook processing failed.",
      });
    }
    return serverErrorResponse(error, "Failed to process HelpDesk create-ticket webhook.");
  }
}
