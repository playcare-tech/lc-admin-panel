import { requireAuth } from "../../_lib/auth.js";
import { errorResponse, json, methodNotAllowed, serverErrorResponse } from "../../_lib/http.js";

const DETAIL_TABLE = "helpdesk_analytics_handled_tickets_v4";

export async function onRequest(context) {
  if (context.request.method !== "GET") return methodNotAllowed(["GET"]);

  const auth = await requireAuth(context);
  if (auth.error) return auth.error;

  try {
    if (!context.env.DB) throw new Error("Missing DB binding.");

    const url = new URL(context.request.url);
    const date = url.searchParams.get("date");
    const agentId = url.searchParams.get("agent_id");
    const shortId = url.searchParams.get("short_id");

    if (!date || !agentId || !shortId) {
      return errorResponse("Missing required params: date, agent_id, short_id", 400);
    }

    const row = await context.env.DB.prepare(
      `SELECT
        date,
        agent_id,
        agent_name,
        agent_email,
        ticket_id,
        short_id,
        ticket_link,
        subject,
        agent_reply_count,
        incoming_message_count,
        ticket_created_at,
        ticket_solved_at,
        ticket_closed_at,
        last_public_reply_at,
        conversation_json
       FROM ${DETAIL_TABLE}
       WHERE date = ? AND agent_id = ? AND short_id = ?`,
    )
      .bind(date, agentId, shortId)
      .first();

    if (!row) return errorResponse("Ticket analytics detail not found in D1.", 404);

    return json({
      ticket: {
        ...row,
        agent_reply_count: Number(row.agent_reply_count || 0),
        incoming_message_count: Number(row.incoming_message_count || 0),
        conversation: row.conversation_json ? JSON.parse(row.conversation_json) : [],
      },
    });
  } catch (error) {
    return serverErrorResponse(error, "Failed to load HelpDesk analytics ticket.");
  }
}
