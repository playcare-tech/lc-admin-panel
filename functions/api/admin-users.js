import {
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  resetAdminTotp,
  setAdminDisabled,
  updateAdminPermissions,
} from "../_lib/admin-users.js";
import { sendAdminInviteSlack } from "../_lib/admin-invites.js";
import { requireAuth } from "../_lib/auth.js";
import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../_lib/http.js";
import { writeLogSafely } from "../_lib/logs.js";

const SAFE_ADMIN_ERROR_MESSAGES = new Set([
  "Admin user was not found.",
  "Username already exists.",
  "Password must be at least 12 characters long.",
  "Password must include a lowercase letter.",
  "Password must include an uppercase letter.",
  "Password must include a number.",
  "Password must include a special character.",
]);

function adminErrorResponse(error, fallback) {
  if (SAFE_ADMIN_ERROR_MESSAGES.has(error?.message)) {
    return errorResponse(error.message, 400);
  }

  return serverErrorResponse(error, fallback);
}

export async function onRequest(context) {
  if (context.request.method === "GET") {
    const auth = await requireAuth(context);
    if (auth.error) {
      return auth.error;
    }
    if (!auth.session.permissions?.canManageAdmins) return errorResponse("Forbidden.", 403);

    try {
      return json({
        adminUsers: await listAdminUsers(context.env),
      });
    } catch (error) {
      return serverErrorResponse(error, "Failed to load admin users.");
    }
  }

  if (context.request.method === "PATCH") {
    const auth = await requireAuth(context);
    if (auth.error) {
      return auth.error;
    }

    try {
      const body = await readJson(context.request);
      const username = `${body.username || ""}`.trim();
      const action = `${body.action || ""}`;

      if (!username) return errorResponse("Username is required.", 400);

      if (!auth.session.permissions?.canManageAdmins && username !== auth.session.user) {
        return errorResponse("Forbidden.", 403);
      }

      if (action === "reset_2fa") {
        await resetAdminTotp(context.env, username, auth.session.user);

        await writeLogSafely(context.env, {
          actor: auth.session.user,
          area: "admin",
          action: "reset_admin_2fa",
          target: username,
          status: "success",
          details: `Reset 2FA for admin user ${username}.`,
        });

        return json({ ok: true, username, action });
      }

      if (action === "update_permissions") {
        if (!auth.session.permissions?.canManageAdmins) return errorResponse("Forbidden.", 403);
        await updateAdminPermissions(context.env, username, {
          canManageUsers: Boolean(body.canManageUsers),
          canManageAdmins: Boolean(body.canManageAdmins),
          userRole: body.userRole || body.user_role || "admin",
          accessLevel: body.accessLevel || body.access_level || "",
          firstName: `${body.firstName || body.first_name || ""}`.trim(),
          lastName: `${body.lastName || body.last_name || ""}`.trim(),
          inviteEmail: `${body.inviteEmail || body.invite_email || ""}`.trim(),
        });

        await writeLogSafely(context.env, {
          actor: auth.session.user,
          area: "admin",
          action: "update_admin_permissions",
          target: username,
          status: "success",
          details: `Updated admin permissions for ${username}.`,
        });

        return json({ ok: true });
      }

      if (action === "set_disabled") {
        if (!auth.session.permissions?.canManageAdmins) return errorResponse("Forbidden.", 403);
        if (username === auth.session.user) return errorResponse("You cannot deactivate your own admin account.", 400);
        const disabled = Boolean(body.disabled);
        await setAdminDisabled(context.env, username, disabled, auth.session.user);

        await writeLogSafely(context.env, {
          actor: auth.session.user,
          area: "admin",
          action: disabled ? "deactivate_admin_user" : "reactivate_admin_user",
          target: username,
          status: "success",
          details: `${disabled ? "Deactivated" : "Reactivated"} admin user ${username}.`,
        });

        return json({ ok: true });
      }

      if (action === "delete_admin") {
        if (!auth.session.permissions?.canManageAdmins) return errorResponse("Forbidden.", 403);
        if (username === auth.session.user) return errorResponse("You cannot delete your own admin account.", 400);
        await deleteAdminUser(context.env, username);

        await writeLogSafely(context.env, {
          actor: auth.session.user,
          area: "admin",
          action: "delete_admin_user",
          target: username,
          status: "success",
          details: `Deleted admin user ${username}.`,
        });

        return json({ ok: true });
      }

      return errorResponse("Unsupported admin user action.", 400);
    } catch (error) {
      return adminErrorResponse(error, "Failed to update admin user.");
    }
  }

  if (context.request.method === "POST") {
    const auth = await requireAuth(context);
    if (auth.error) {
      return auth.error;
    }
    if (!auth.session.permissions?.canManageAdmins) return errorResponse("Forbidden.", 403);

    try {
      const body = await readJson(context.request);
      const inviteEmail = `${body.inviteEmail || body.username || ""}`.trim().toLowerCase();
      const username = inviteEmail;
      const inviteSlackUserId = `${body.inviteSlackUserId || ""}`.trim();
      const password = `${body.password || ""}`;
      const userRole = `${body.userRole || ""}` === "qa_manager" ? "qa_manager" : "admin";

      if (!username) {
        return errorResponse("Email is required.", 400);
      }
      if (!inviteSlackUserId) return errorResponse("Invitation Slack user ID is required.", 400);

      const invite = await createAdminUser(context.env, {
        username,
        password: password || "",
        createdBy: auth.session.user,
        canManageUsers: userRole === "admin" && Boolean(body.canManageUsers),
        canManageAdmins: userRole === "admin" && Boolean(body.canManageAdmins),
        userRole,
        accessLevel: `${body.accessLevel || ""}`.trim(),
        firstName: `${body.firstName || ""}`.trim(),
        lastName: `${body.lastName || ""}`.trim(),
        inviteEmail,
        inviteSlackUserId,
        inviteOrigin: new URL(context.request.url).origin,
      });
      let inviteSlack = { sent: false, reason: "not_attempted" };
      try {
        inviteSlack = await sendAdminInviteSlack(context.env, {
          ...invite,
          inviteEmail,
          inviteSlackUserId,
          firstName: `${body.firstName || ""}`.trim(),
          lastName: `${body.lastName || ""}`.trim(),
        });
      } catch (error) {
        await writeLogSafely(context.env, {
          actor: auth.session.user,
          area: "admin",
          action: "send_admin_invite_slack",
          target: username,
          status: "error",
          details: error.message || "Failed to send admin invitation in Slack.",
        });
        inviteSlack = { sent: false, reason: "send_failed", error: error.message || "Slack delivery failed." };
      }

      await writeLogSafely(context.env, {
        actor: auth.session.user,
        area: "admin",
        action: "create_admin_user",
        target: username,
        status: "success",
        details: `Created admin user ${username}.`,
      });

      return json({ ok: true, invite: { ...invite, slack: inviteSlack } });
    } catch (error) {
      return adminErrorResponse(error, "Failed to create admin user.");
    }
  }

  return methodNotAllowed(["GET", "POST", "PATCH"]);
}
