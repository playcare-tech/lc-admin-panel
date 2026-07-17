import { withAccountContext } from "../../_lib/accounts.js";
import { requirePermission } from "../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed, readJson, serverErrorResponse } from "../../_lib/http.js";
import {
  getLivechatTranslationOverview,
  saveLivechatTranslationSettings,
  testLivechatTranslation,
} from "../../_lib/livechat-translation.js";

export async function onRequest(context) {
  if (!["GET", "PATCH", "POST"].includes(context.request.method)) {
    return methodNotAllowed(["GET", "PATCH", "POST"]);
  }

  const auth = await requirePermission(context, "canManageAdmins");
  if (auth.error) return auth.error;
  context = withAccountContext(context);

  try {
    if (context.request.method === "GET") {
      return json(
        await getLivechatTranslationOverview(context.env),
      );
    }

    const body = await readJson(context.request);
    if (context.request.method === "PATCH") {
      return json({
        settings: await saveLivechatTranslationSettings(context.env, {
          groupId: body.groupId,
          enabled: Boolean(body.enabled),
          updatedBy: auth.session.user,
        }),
      });
    }

    if (body.action === "test") {
      const textValue = `${body.text || ""}`.trim();
      if (!textValue) return errorResponse("Text is required.", 400);
      return json(
        await testLivechatTranslation(context.env, {
          text: textValue,
          targetLang: body.targetLang || "EN",
          sourceLang: body.sourceLang || "",
        }),
      );
    }

    return errorResponse("Unsupported translation action.", 400);
  } catch (error) {
    if (/Missing DEEPL_AUTH_KEY|invalid/i.test(error.message || "")) {
      return errorResponse(error.message, 400);
    }
    return serverErrorResponse(error, "Failed to load LiveChat translation settings.");
  }
}
