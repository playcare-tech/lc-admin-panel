import { requireAuth } from "../../_lib/auth.js";
import { buildLiveChatGroups, getLiveChatAgent, livechatRequest } from "../../_lib/livechat.js";
import { errorResponse, json, methodNotAllowed, readJson } from "../../_lib/http.js";
import { writeLogSafely } from "../../_lib/logs.js";

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const auth = await requireAuth(context);
  if (auth.error) {
    return auth.error;
  }

  try {
    const body = await readJson(context.request);
    const agentId = `${body.agentId || ""}`.trim();
    const name = `${body.name || ""}`.trim();
    const jobTitle = `${body.jobTitle || ""}`.trim();
    const avatarPath = `${body.avatarPath || ""}`.trim();
    const chatLimit = Number(body.chatLimit);
    const role = ["normal", "administrator", "viceowner"].includes(body.role) ? body.role : "normal";

    if (!agentId) {
      return errorResponse("agentId is required.", 400);
    }
    if (!name) {
      return errorResponse("Full name is required.", 400);
    }
    if (!Number.isInteger(chatLimit) || chatLimit < 0 || chatLimit > 20) {
      return errorResponse("Chat limit must be a number from 0 to 20.", 400);
    }

    const currentAgent = await getLiveChatAgent(context.env, agentId);
    const payload = {
      id: agentId,
      name,
      role,
      job_title: jobTitle,
      max_chats_count: chatLimit,
      groups: buildLiveChatGroups(
        currentAgent.groups.map((group) => group.id),
        "normal",
      ).map((group) => {
        const currentGroup = currentAgent.groups.find((item) => String(item.id) === String(group.id));
        return {
          ...group,
          priority: currentGroup?.priority || "normal",
        };
      }),
    };

    if (avatarPath) {
      payload.avatar_path = avatarPath;
    }

    await livechatRequest(context.env, "update_agent", payload);

    await writeLogSafely(context.env, {
      actor: auth.session.user,
      area: "livechat",
      action: "update_profile",
      target: agentId,
      status: "success",
      details: `Updated LiveChat profile for ${agentId}.`,
      metadata: {
        agentId,
        before: {
          name: currentAgent.name,
          role: currentAgent.role,
          jobTitle: currentAgent.jobTitle,
          chatLimit: currentAgent.chatLimit,
          avatar: currentAgent.avatar,
        },
        after: {
          name,
          role,
          jobTitle,
          chatLimit,
          avatar: avatarPath || currentAgent.avatar,
        },
      },
    });

    return json({ ok: true });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
