import { requireAuth } from "../../_lib/auth.js";
import { json, methodNotAllowed, readJson, serverErrorResponse } from "../../_lib/http.js";

const DEFAULT_CHANNEL = "C0B8SQY3LNR";
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function safeFilename(value) {
  const filename = `${value || "helpdesk-analytics.xlsx"}`
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return filename.endsWith(".xlsx") ? filename : `${filename || "helpdesk-analytics"}.xlsx`;
}

function normalizeSlackToken(value) {
  return `${value || ""}`.trim().replace(/^Bearer\s+/i, "").replace(/^"+|"+$/g, "");
}

function decodeBase64Bytes(value) {
  const binary = atob(`${value || ""}`);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function slackApi(env, method, body) {
  const token = normalizeSlackToken(env.SLACK_BOT_TOKEN);
  if (!token) throw new Error("Missing SLACK_BOT_TOKEN secret.");

  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(body || {})) {
    form.set(key, typeof value === "string" ? value : JSON.stringify(value));
  }

  const response = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
    },
    body: form.toString(),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) {
    const messages = payload.response_metadata?.messages?.join("; ");
    throw new Error(`Slack ${method} failed: ${payload.error || response.status}${messages ? ` (${messages})` : ""}`);
  }
  return payload;
}

async function uploadSlackFile(env, { bytes, filename, title, initialComment }) {
  const channel = `${env.SLACK_HELPDESK_REPORT_CHANNEL || DEFAULT_CHANNEL}`.trim();
  const upload = await slackApi(env, "files.getUploadURLExternal", {
    filename,
    length: bytes.length,
  });

  const uploadResponse = await fetch(upload.upload_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
    body: bytes,
  });
  if (!uploadResponse.ok) {
    throw new Error(`Slack file upload failed: ${uploadResponse.status}`);
  }

  const complete = await slackApi(env, "files.completeUploadExternal", {
    channel_id: channel,
    initial_comment: initialComment,
    files: [{ id: upload.file_id, title }],
  });

  return { channel, fileId: upload.file_id, files: complete.files || [] };
}

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const auth = await requireAuth(context);
  if (auth.error) return auth.error;

  try {
    const body = await readJson(context.request);
    const filename = safeFilename(body.filename);
    const title = `${body.title || "HelpDesk analytics report"}`.trim().slice(0, 200);
    const initialComment = `${body.initialComment || `${title} attached.`}`.trim().slice(0, 1000);
    const bytes = decodeBase64Bytes(body.fileBase64);

    if (!bytes.length) {
      return json({ ok: false, error: "Missing report file." }, 400);
    }
    if (bytes.length > MAX_UPLOAD_BYTES) {
      return json({ ok: false, error: "Report file is too large to send to Slack." }, 400);
    }

    const upload = await uploadSlackFile(context.env, {
      bytes,
      filename,
      title,
      initialComment,
    });

    return json({ ok: true, upload, filename, byteLength: bytes.length });
  } catch (error) {
    console.error("Failed to send HelpDesk analytics to Slack.", error);
    return json({ ok: false, error: error.message || "Failed to send HelpDesk analytics to Slack." }, 500);
  }
}
