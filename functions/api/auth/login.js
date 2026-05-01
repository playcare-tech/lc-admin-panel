import { createSessionCookie } from "../../_lib/auth.js";
import {
  buildTotpUri,
  enableAdminTotp,
  generateTotpSecret,
  updateAdminPassword,
  verifyAdminCredentials,
  verifyTotpCode,
} from "../../_lib/admin-users.js";
import { errorResponse, json, methodNotAllowed, readJson } from "../../_lib/http.js";
import { writeLogSafely } from "../../_lib/logs.js";

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
    let authenticated = false;
    try {
      user = await verifyAdminCredentials(context.env, username, password);
      authenticated = Boolean(user);
    } catch {
      authenticated = false;
    }

    if (
      !authenticated &&
      context.env.ADMIN_USERNAME &&
      context.env.ADMIN_PASSWORD &&
      username === context.env.ADMIN_USERNAME &&
      password === context.env.ADMIN_PASSWORD
    ) {
      authenticated = true;
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

    if (!user) {
      const sessionCookie = await createSessionCookie(context.env, username);
      await writeLogSafely(context.env, {
        actor: username,
        area: "auth",
        action: "login",
        status: "success",
        details: "Fallback admin signed in.",
      });

      return json(
        {
          ok: true,
          user: username,
        },
        {
          headers: {
            "Set-Cookie": sessionCookie,
          },
        },
      );
    }

    const needsPasswordChange = Boolean(user.password_reset_required);
    const needsTotpSetup = !Number(user.totp_enabled) || Boolean(user.totp_setup_required);

    if (needsPasswordChange || needsTotpSetup) {
      const secret = setupSecret || generateTotpSecret();
      const hasPassword = !needsPasswordChange || newPassword.length >= 12;
      const hasTotp = !needsTotpSetup || (setupSecret && (await verifyTotpCode(setupSecret, otp)));

      if (!hasPassword || !hasTotp) {
        return json({
          ok: false,
          requiresPasswordChange: needsPasswordChange,
          requiresTotpSetup: needsTotpSetup,
          setupSecret: needsTotpSetup ? secret : "",
          otpauthUri: needsTotpSetup ? buildTotpUri(username, secret) : "",
          message: needsPasswordChange
            ? "Set a new password with at least 12 characters, then verify 2FA."
            : "Set up Google Authenticator and enter the 6-digit code.",
        });
      }

      if (needsPasswordChange) {
        await updateAdminPassword(context.env, username, newPassword);
      }
      if (needsTotpSetup) {
        await enableAdminTotp(context.env, username, setupSecret);
      }
    } else if (!(await verifyTotpCode(user.totp_secret, otp))) {
      return json({
        ok: false,
        requiresOtp: true,
        message: "Enter your 6-digit Google Authenticator code.",
      });
    }

    const sessionCookie = await createSessionCookie(context.env, username);
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
      },
      {
        headers: {
          "Set-Cookie": sessionCookie,
        },
      },
    );
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
