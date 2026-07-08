import {
  buildTotpUri,
  findValidAdminInvite,
  generateTotpSecret,
  setupInvitedAdminUser,
} from "../../_lib/admin-users.js";
import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../../_lib/http.js";
import { writeLogSafely } from "../../_lib/logs.js";

const SAFE_INVITE_ERRORS = new Set([
  "Invitation link is invalid.",
  "Invitation link was already used.",
  "Invitation link expired.",
  "Invalid 2FA setup code.",
  "Password must be at least 12 characters long.",
  "Password must include a lowercase letter.",
  "Password must include an uppercase letter.",
  "Password must include a number.",
  "Password must include a special character.",
]);

export async function onRequest(context) {
  if (context.request.method !== "POST") return methodNotAllowed(["POST"]);

  try {
    const body = await readJson(context.request);
    const username = `${body.username || ""}`.trim();
    const token = `${body.token || ""}`.trim();
    const password = `${body.password || ""}`;
    const setupSecret = `${body.setupSecret || generateTotpSecret()}`.replace(/\s+/g, "").toUpperCase();
    const otp = `${body.otp || ""}`;

    if (!username || !token) return errorResponse("Invitation link is invalid.", 400);
    await findValidAdminInvite(context.env, { token, username });
    if (!password || !otp) {
      return json({
        ok: false,
        requiresInviteSetup: true,
        setupSecret,
        otpauthUri: buildTotpUri(username, setupSecret),
        message: "Set a password, scan Google Authenticator, and enter the 6-digit code.",
      });
    }

    const result = await setupInvitedAdminUser(context.env, { token, username, password, setupSecret, otp });
    await writeLogSafely(context.env, {
      actor: username,
      area: "auth",
      action: "accept_admin_invite",
      status: "success",
      details: "Admin invitation accepted.",
    });
    return json(result);
  } catch (error) {
    if (SAFE_INVITE_ERRORS.has(error?.message)) return errorResponse(error.message, 400);
    return serverErrorResponse(error, "Failed to accept invitation.");
  }
}
