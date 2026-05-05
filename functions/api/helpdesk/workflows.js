import { requireAuth } from "../../_lib/auth.js";
import { helpdeskRequest } from "../../_lib/helpdesk.js";
import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../../_lib/http.js";
import { writeLogSafely } from "../../_lib/logs.js";
import {
  createHelpdeskAutoResolveWorkflow,
  listHelpdeskWorkflowRuns,
  listHelpdeskWorkflows,
  setHelpdeskWorkflowEnabled,
} from "../../_lib/helpdesk-workflows.js";

const STATUSES = new Set(["open", "pending", "onhold", "solved", "closed"]);

function splitTags(value) {
  const tags = Array.isArray(value) ? value : `${value || ""}`.split(",");
  return [...new Set(tags.map((tag) => `${tag || ""}`.trim()).filter(Boolean))];
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
  const [workflows, runs] = await Promise.all([
    listHelpdeskWorkflows(context.env),
    runsFor ? listHelpdeskWorkflowRuns(context.env, runsFor) : Promise.resolve([]),
  ]);

  return json({
    workflows,
    runsFor,
    runs,
  });
}

async function createWorkflow(context, auth) {
  const body = await readJson(context.request);
  const title = `${body.title || ""}`.trim();
  const requesterEmail = normalizeEmail(body.requesterEmail);
  const status = `${body.status || "solved"}`.trim().toLowerCase();
  const tagNames = splitTags(body.tags || body.tagNames);

  if (!title) return errorResponse("Workflow title is required.", 400);
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
      type: "auto_resolve_requester",
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

async function updateWorkflow(context, auth) {
  const body = await readJson(context.request);
  const workflowId = `${body.id || body.workflowId || ""}`.trim();
  if (!workflowId) return errorResponse("Workflow ID is required.", 400);
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

  try {
    if (context.request.method === "GET") return await getWorkflows(context);
    if (context.request.method === "PATCH") return await updateWorkflow(context, auth);
    return await createWorkflow(context, auth);
  } catch (error) {
    if (error.message?.startsWith("HelpDesk tag not found:")) {
      return errorResponse(error.message, 400);
    }
    return serverErrorResponse(error, "Failed to manage HelpDesk workflows.");
  }
}
