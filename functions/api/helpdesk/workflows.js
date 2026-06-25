import { requireAuth } from "../../_lib/auth.js";
import { withAccountContext } from "../../_lib/accounts.js";
import { helpdeskRequest } from "../../_lib/helpdesk.js";
import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../../_lib/http.js";
import { writeLogSafely } from "../../_lib/logs.js";
import { runHelpdeskWorkflowOnce } from "./tickets.js";
import {
  createHelpdeskAutoReplyWorkflow,
  createHelpdeskAutoResolveWorkflow,
  getHelpdeskWebhookStats,
  listHelpdeskWorkflowRuns,
  listHelpdeskWorkflows,
  setHelpdeskWorkflowEnabled,
  updateHelpdeskWorkflowConfig,
} from "../../_lib/helpdesk-workflows.js";

const STATUSES = new Set(["open", "pending", "onhold", "solved", "closed"]);
const AUTO_RESOLVE_WORKFLOW_TYPE = "auto_resolve_requester";
const AUTO_REPLY_WORKFLOW_TYPE = "auto_reply_new_requester_ticket";
const AUTO_REPLY_EMPTY_REQUESTER_WORKFLOW_TYPE = "auto_reply_empty_requester_ticket";
const AUTO_MERGE_WORKFLOW_TYPE = "auto_merge_duplicates";
const AUTO_MERGE_6H_WORKFLOW_TYPE = "auto_merge_6h_rule";
const AUTO_MARKETING_SPAM_WORKFLOW_TYPE = "auto_resolve_marketing_spam";
const MANUAL_RUN_WORKFLOW_TYPES = new Set([
  AUTO_RESOLVE_WORKFLOW_TYPE,
  AUTO_REPLY_EMPTY_REQUESTER_WORKFLOW_TYPE,
  AUTO_MERGE_WORKFLOW_TYPE,
  AUTO_MERGE_6H_WORKFLOW_TYPE,
  AUTO_MARKETING_SPAM_WORKFLOW_TYPE,
]);

function splitTags(value) {
  const tags = Array.isArray(value) ? value : `${value || ""}`.split(",");
  return [...new Set(tags.map((tag) => `${tag || ""}`.trim()).filter(Boolean))];
}

function splitPhrases(value) {
  const phrases = Array.isArray(value) ? value : `${value || ""}`.split(",");
  const seen = new Set();
  const unique = [];
  for (const phrase of phrases) {
    const normalized = `${phrase || ""}`.trim().replace(/\s+/g, " ");
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    unique.push(normalized);
  }
  return unique.slice(0, 80);
}

function normalizeEmail(value) {
  return `${value || ""}`.trim().toLowerCase();
}

async function helpdeskTags(env) {
  const payload = await helpdeskRequest(env, "/tags");
  return (Array.isArray(payload) ? payload : payload?.tags || payload?.data || payload?.items || [])
    .map((tag) => ({
      id: String(tag.ID || tag.id || ""),
      name: tag.name || "",
    }))
    .filter((tag) => tag.id && tag.name);
}

async function resolveTagIds(env, tagNames) {
  const tags = await helpdeskTags(env);
  const byName = new Map(tags.map((tag) => [tag.name.trim().toLowerCase(), tag.id]));
  const byId = new Map(tags.map((tag) => [tag.id, tag.id]));
  const tagIds = [];
  const missing = [];

  for (const tag of tagNames) {
    const key = tag.toLowerCase();
    const id = byName.get(key) || byId.get(tag);
    if (id) {
      tagIds.push(id);
    } else {
      missing.push(tag);
    }
  }

  if (missing.length) {
    throw new Error(`HelpDesk tag not found: ${missing.join(", ")}.`);
  }

  return [...new Set(tagIds)];
}

async function getWorkflows(context) {
  const url = new URL(context.request.url);
  const runsFor = url.searchParams.get("runsFor") || "";
  const [workflows, runs, webhookStats] = await Promise.all([
    listHelpdeskWorkflows(context.env),
    runsFor ? listHelpdeskWorkflowRuns(context.env, runsFor) : Promise.resolve([]),
    getHelpdeskWebhookStats(context.env, { type: "create-ticket" }),
  ]);

  return json({
    workflows,
    runsFor,
    runs,
    webhookStats,
  });
}

async function createWorkflow(context, auth, body) {
  const title = `${body.title || ""}`.trim();
  const type = `${body.type || AUTO_RESOLVE_WORKFLOW_TYPE}`.trim();

  if (!title) return errorResponse("Workflow title is required.", 400);

  if (type === AUTO_REPLY_WORKFLOW_TYPE) {
    const senderName = `${body.senderName || body.sender || ""}`.trim();
    const senderAgentId = `${body.senderAgentId || ""}`.trim();
    const messageText = `${body.messageText || body.message || ""}`.trim();

    if (!senderName && !senderAgentId) return errorResponse("Sender is required.", 400);
    if (!messageText) return errorResponse("Message text is required.", 400);

    const workflowId = await createHelpdeskAutoReplyWorkflow(context.env, {
      title,
      senderName,
      senderAgentId,
      messageText,
    });

    await writeLogSafely(context.env, {
      actor: auth.session.user,
      area: "helpdesk",
      action: "create_workflow",
      target: workflowId,
      status: "success",
      details: `Created HelpDesk workflow ${title}.`,
      metadata: {
        workflowId,
        type,
        senderName,
        senderAgentId,
      },
    });

    return json({
      ok: true,
      workflowId,
      workflows: await listHelpdeskWorkflows(context.env),
    });
  }

  if (type !== AUTO_RESOLVE_WORKFLOW_TYPE) {
    return errorResponse("Choose a valid workflow type.", 400);
  }

  const requesterEmail = normalizeEmail(body.requesterEmail);
  const status = `${body.status || "solved"}`.trim().toLowerCase();
  const tagNames = splitTags(body.tags || body.tagNames);

  if (!requesterEmail || !requesterEmail.includes("@")) return errorResponse("Requester email is required.", 400);
  if (!STATUSES.has(status)) return errorResponse("Choose a valid HelpDesk ticket status.", 400);

  const tagIds = tagNames.length ? await resolveTagIds(context.env, tagNames) : [];
  const workflowId = await createHelpdeskAutoResolveWorkflow(context.env, {
    title,
    requesterEmail,
    status,
    tagNames,
    tagIds,
  });

  await writeLogSafely(context.env, {
    actor: auth.session.user,
    area: "helpdesk",
    action: "create_workflow",
    target: workflowId,
    status: "success",
    details: `Created HelpDesk workflow ${title}.`,
    metadata: {
      workflowId,
      type,
      requesterEmail,
      status,
      tagNames,
    },
  });

  return json({
    ok: true,
    workflowId,
    workflows: await listHelpdeskWorkflows(context.env),
  });
}

async function runWorkflow(context, auth, body) {
  const workflowId = `${body.id || body.workflowId || ""}`.trim();
  if (!workflowId) return errorResponse("Workflow ID is required.", 400);

  const workflows = await listHelpdeskWorkflows(context.env);
  const workflow = workflows.find((item) => item.id === workflowId);
  if (!workflow) return errorResponse("Workflow not found.", 404);
  if (!MANUAL_RUN_WORKFLOW_TYPES.has(workflow.type)) {
    return errorResponse("Manual run is not available for this workflow.", 400);
  }

  const timezoneOffsetMinutes = Number(body.tzOffset || body.timezoneOffsetMinutes || 0);
  const run = await runHelpdeskWorkflowOnce(context, auth, workflow, timezoneOffsetMinutes);

  return json({
    ok: run.status === "success",
    run,
    runsFor: workflowId,
    runs: await listHelpdeskWorkflowRuns(context.env, workflowId),
    workflows: await listHelpdeskWorkflows(context.env),
  });
}

async function updateWorkflow(context, auth) {
  const body = await readJson(context.request);
  const workflowId = `${body.id || body.workflowId || ""}`.trim();
  if (!workflowId) return errorResponse("Workflow ID is required.", 400);

  const action = `${body.action || ""}`.trim().toLowerCase();
  if (action === "update_marketing_spam_keywords") {
    const workflows = await listHelpdeskWorkflows(context.env);
    const workflow = workflows.find((item) => item.id === workflowId);
    if (!workflow) return errorResponse("Workflow not found.", 404);
    if (workflow.type !== AUTO_MARKETING_SPAM_WORKFLOW_TYPE) {
      return errorResponse("Keyword editing is only available for the marketing spam workflow.", 400);
    }

    const keywords = splitPhrases(body.keywords || body.phrases || body.config?.keywords);
    await updateHelpdeskWorkflowConfig(context.env, workflowId, {
      ...(workflow.config || {}),
      keywords,
    });
    await writeLogSafely(context.env, {
      actor: auth.session.user,
      area: "helpdesk",
      action: "update_workflow",
      target: workflowId,
      status: "success",
      details: "Updated HelpDesk marketing spam workflow keywords.",
      metadata: {
        workflowId,
        type: workflow.type,
        keywords,
      },
    });

    return json({
      ok: true,
      workflows: await listHelpdeskWorkflows(context.env),
    });
  }

  if (!Object.prototype.hasOwnProperty.call(body, "enabled")) {
    return errorResponse("Workflow enabled state is required.", 400);
  }

  await setHelpdeskWorkflowEnabled(context.env, workflowId, Boolean(body.enabled));
  await writeLogSafely(context.env, {
    actor: auth.session.user,
    area: "helpdesk",
    action: "toggle_workflow",
    target: workflowId,
    status: "success",
    details: `${body.enabled ? "Enabled" : "Disabled"} HelpDesk workflow.`,
    metadata: {
      workflowId,
      enabled: Boolean(body.enabled),
    },
  });

  return json({
    ok: true,
    workflows: await listHelpdeskWorkflows(context.env),
  });
}

export async function onRequest(context) {
  if (!["GET", "POST", "PATCH"].includes(context.request.method)) {
    return methodNotAllowed(["GET", "POST", "PATCH"]);
  }

  const auth = await requireAuth(context);
  if (auth.error) return auth.error;
  context = withAccountContext(context);

  try {
    if (context.request.method === "GET") return await getWorkflows(context);
    if (context.request.method === "PATCH") return await updateWorkflow(context, auth);
    const body = await readJson(context.request);
    if (`${body.action || ""}`.trim().toLowerCase() === "run") {
      return await runWorkflow(context, auth, body);
    }
    return await createWorkflow(context, auth, body);
  } catch (error) {
    if (error.message?.startsWith("HelpDesk tag not found:")) {
      return errorResponse(error.message, 400);
    }
    return serverErrorResponse(error, "Failed to manage HelpDesk workflows.");
  }
}
