import { withAccountContext } from "../../_lib/accounts.js";
import { requireAuth } from "../../_lib/auth.js";
import { json, methodNotAllowed, serverErrorResponse } from "../../_lib/http.js";
import { listLivechatAiQaChats } from "../../_lib/livechat-ai-qa-tagging.js";

function dateParam(value, endOfDay = false) {
  const text = `${value || ""}`.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "";
  return `${text}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`;
}

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

  const auth = await requireAuth(context);
  if (auth.error) {
    return auth.error;
  }
  context = withAccountContext(context);

  try {
    const url = new URL(context.request.url);
    const filters = {
      from: dateParam(url.searchParams.get("from")),
      to: dateParam(url.searchParams.get("to"), true),
      agent: url.searchParams.get("agent") || "",
      tag: url.searchParams.get("tag") || "",
      chatId: url.searchParams.get("chatId") || "",
      transferred: url.searchParams.get("transferred") || "",
      reason: url.searchParams.get("reason") || "",
      hasQueue: url.searchParams.get("hasQueue") || "",
      customerLanguage: url.searchParams.get("customerLanguage") || "",
      chatbotLanguage: url.searchParams.get("chatbotLanguage") || "",
      sort: url.searchParams.get("sort") || "date",
      order: url.searchParams.get("order") || "desc",
      page: url.searchParams.get("page") || "1",
      pageSize: url.searchParams.get("pageSize") || "50",
    };
    return json(await listLivechatAiQaChats(context.env, filters));
  } catch (error) {
    return serverErrorResponse(error, "Failed to load LiveChat AI QA tagging data.");
  }
}
