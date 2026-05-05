import { createCsrfToken, createSessionCookie } from "../../_lib/auth.js";
import {
  adminPermissions,
  buildTotpUri,
  clearTotpRateLimit,
  createOrUpdateFallbackAdminUser,
  enableAdminTotp,
  findAdminUserByUsername,
  generateTotpSecret,
  getTotpRateLimitState,
  recordTotpFailure,
  updateAdminPassword,
  validateAdminPassword,
  verifyAdminCredentials,
  verifyFallbackAdminCredentials,
  verifyTotpCode,
} from "../../_lib/admin-users.js";
import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../../_lib/http.js";
import { writeLogSafely } from "../../_lib/logs.js";

function totpRateLimitResponse() {
  return json(
    {
      error: "Too many 2FA attempts. Try later.",
    },
    {
      status: 429,
    },
  );
}

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  try {
    const body = await readJson(context.request);
    const username = `${body.username || ""}`.trim();
    const password = `${body.password || ""}`;
    const otp = `${body.otp || ""}`;
    const newPassword = `${body.newPassword || ""}`;
    const setupSecret = `${body.setupSecret || ""}`.replace(/\s+/g, "").toUpperCase();

    let user = null;
    const existingUser = username ? await findAdminUserByUsername(context.env, username) : null;
    let authenticated = false;
    try {
      user = await verifyAdminCredentials(context.env, username, password, existingUser);
      authenticated = Boolean(user);
    } catch {
      authenticated = false;
    }
    const fallbackAuthenticated = authenticated ? false : await verifyFallbackAdminCredentials(context.env, username, password);

    if (
      !existingUser &&
      !authenticated &&
      fallbackAuthenticated
    ) {
      user = await createOrUpdateFallbackAdminUser(context.env, { username, password });
      authenticated = Boolean(user);
    }

    if (!authenticated) {
      await writeLogSafely(context.env, {
        actor: username || "unknown",
        area: "auth",
        action: "login",
        status: "error",
        details: "Invalid admin credentials.",
      });
      return errorResponse("Invalid username or password.", 401);
    }

    if (user.disabled_at) {
      await writeLogSafely(context.env, {
        actor: username,
        area: "auth",
        action: "login",
        status: "error",
        details: "Disabled admin account attempted to sign in.",
      });
      return errorResponse("This admin account is disabled.", 403);
    }

    const needsPasswordChange = Boolean(user.password_reset_required);
    const needsTotpSetup = !Number(user.totp_enabled) || Boolean(user.totp_setup_required);
    const totpRateLimit = getTotpRateLimitState(user);
    if (totpRateLimit.locked) {
      await writeLogSafely(context.env, {
        actor: username,
        area: "auth",
        action: "login",
        status: "error",
        details: "2FA rate limit exceeded.",
        metadata: { lockedUntil: totpRateLimit.lockedUntil },
      });
      return totpRateLimitResponse();
    }

    if (needsPasswordChange || needsTotpSetup) {
      const secret = setupSecret || generateTotpSecret();
      let passwordError = "";
      if (needsPasswordChange) {
        try {
          validateAdminPassword(newPassword);
        } catch (error) {
          passwordError = error.message;
        }
      }
      const hasPassword = !needsPasswordChange || !passwordError;
      const hasTotp = !needsTotpSetup || (setupSecret && (await verifyTotpCode(setupSecret, otp)));

      if (!hasPassword || !hasTotp) {
        if (needsTotpSetup && otp && !hasTotp) {
          const rateLimit = await recordTotpFailure(context.env, username);
          await writeLogSafely(context.env, {
            actor: username,
            area: "auth",
            action: "login",
            status: "error",
            details: rateLimit.locked ? "Invalid 2FA setup code; rate limit exceeded." : "Invalid 2FA setup code.",
          });
          if (rateLimit.locked) {
            return totpRateLimitResponse();
          }
        }

        return json({
          ok: false,
          requiresPasswordChange: needsPasswordChange,
          requiresTotpSetup: needsTotpSetup,
          setupSecret: needsTotpSetup ? secret : "",
          otpauthUri: needsTotpSetup ? buildTotpUri(username, secret) : "",
          message:
            passwordError ||
            (needsPasswordChange
              ? "Set a new password with uppercase, lowercase, number, and special character, then verify 2FA."
              : "Set up Google Authenticator and enter the 6-digit code."),
        });
      }

      if (needsPasswordChange) {
        await updateAdminPassword(context.env, username, newPassword);
      }
      if (needsTotpSetup) {
        await enableAdminTotp(context.env, username, setupSecret);
      }
    } else if (!otp) {
      return json({
        ok: false,
        requiresOtp: true,
        message: "Enter your 6-digit Google Authenticator code.",
      });
    } else if (!(await verifyTotpCode(user.totp_secret, otp))) {
      const rateLimit = await recordTotpFailure(context.env, username);
      await writeLogSafely(context.env, {
        actor: username,
        area: "auth",
        action: "login",
        status: "error",
        details: rateLimit.locked ? "Invalid 2FA code; rate limit exceeded." : "Invalid 2FA code.",
      });
      if (rateLimit.locked) {
        return totpRateLimitResponse();
      }
      return json({
        ok: false,
        requiresOtp: true,
        message: "Enter your 6-digit Google Authenticator code.",
      });
    }

    await clearTotpRateLimit(context.env, username);
    const csrfToken = createCsrfToken();
    const sessionCookie = await createSessionCookie(context.env, username, {
      permissions: adminPermissions(user),
      csrfToken,
    });
    await writeLogSafely(context.env, {
      actor: username,
      area: "auth",
      action: "login",
      status: "success",
      details: "Admin signed in.",
    });

    return json(
      {
        ok: true,
        user: username,
        permissions: adminPermissions(user),
        csrfToken,
      },
      {
        headers: {
          "Set-Cookie": sessionCookie,
        },
      },
    );
  } catch (error) {
    return serverErrorResponse(error, "Sign in failed.");
  }
}
