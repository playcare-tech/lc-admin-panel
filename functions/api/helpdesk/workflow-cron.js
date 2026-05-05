import { runNextAutomaticHelpdeskWorkflow } from "./tickets.js";
import { errorResponse, json, methodNotAllowed, serverErrorResponse } from "../../_lib/http.js";

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

function requireCronSecret(context) {
  const expectedSecret = `${context.env.WORKFLOW_CRON_SECRET || ""}`.trim();
  const submittedSecret = `${context.request.headers.get("X-Workflow-Cron-Secret") || ""}`.trim();
  if (!expectedSecret || !submittedSecret || !safeEqualText(submittedSecret, expectedSecret)) {
    return errorResponse("Unauthorized.", 401);
  }
  return null;
}

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const secretError = requireCronSecret(context);
  if (secretError) return secretError;

  try {
    const timezoneOffsetMinutes = Number(context.env.HELPDESK_ANALYTICS_TZ_OFFSET || 0);
    const runs = await runNextAutomaticHelpdeskWorkflow(
      context,
      { session: { user: "system:workflow-cron" } },
      timezoneOffsetMinutes,
      { forceOne: true },
    );

    return json({
      ok: true,
      runs,
      ranAt: new Date().toISOString(),
    });
  } catch (error) {
    return serverErrorResponse(error, "Failed to run HelpDesk workflow cron.");
  }
}
