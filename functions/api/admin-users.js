import { createAdminUser, listAdminUsers, resetAdminTotp, updateAdminPermissions } from "../_lib/admin-users.js";
import { requireAuth } from "../_lib/auth.js";
import { errorResponse, json, methodNotAllowed, readJson } from "../_lib/http.js";
import { writeLogSafely } from "../_lib/logs.js";

export async function onRequest(context) {
  if (context.request.method === "GET") {
    const auth = await requireAuth(context);
    if (auth.error) {
      return auth.error;
    }

    try {
      return json({
        adminUsers: await listAdminUsers(context.env),
      });
    } catch (error) {
      return errorResponse(error.message, 500);
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

        return json({ ok: true });
      }

      if (action === "update_permissions") {
        if (!auth.session.permissions?.canManageAdmins) return errorResponse("Forbidden.", 403);
        await updateAdminPermissions(context.env, username, {
          canManageUsers: Boolean(body.canManageUsers),
          canManageAdmins: Boolean(body.canManageAdmins),
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

      return errorResponse("Unsupported admin user action.", 400);
    } catch (error) {
      return errorResponse(error.message, 500);
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
      const username = `${body.username || ""}`.trim();
      const password = `${body.password || ""}`;

      if (!username || !password) {
        return errorResponse("Username and password are required.", 400);
      }

      await createAdminUser(context.env, {
        username,
        password,
        createdBy: auth.session.user,
        canManageUsers: Boolean(body.canManageUsers),
        canManageAdmins: Boolean(body.canManageAdmins),
      });

      await writeLogSafely(context.env, {
        actor: auth.session.user,
        area: "admin",
        action: "create_admin_user",
        target: username,
        status: "success",
        details: `Created admin user ${username}.`,
      });

      return json({ ok: true });
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  }

  return methodNotAllowed(["GET", "POST", "PATCH"]);
}
