function getAuthHeader(env) {
  const value = `${env.TEXT_BASIC_AUTH_B64 || ""}`.trim();
  if (!value) {
    throw new Error(`Missing ${env.LC_AUTH_SECRET_NAME || "TEXT_BASIC_AUTH_B64"} environment variable.`);
  }

  return /^Basic\s+/i.test(value) ? value : `Basic ${value}`;
}

function extractErrorMessage(payload, fallback) {
  if (!payload) {
    return fallback;
  }

  if (typeof payload === "string") {
    return payload;
  }

  const detailCandidates = [
    payload.details,
    payload.detail,
    payload.errors,
    payload.validation,
    payload.error?.details,
    payload.error?.errors,
  ].filter(Boolean);
  const details = detailCandidates
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => {
      if (typeof value === "string") {
        return value;
      }
      const path = value.path || value.field || value.param || value.property;
      const message = value.message || value.error || value.reason || JSON.stringify(value);
      return path ? `${path}: ${message}` : message;
    })
    .filter(Boolean)
    .join(" | ");
  const message = payload.error?.message || payload.message || payload.error || fallback;

  return details ? `${message}: ${details}` : message;
}

export async function helpdeskRequestWithMeta(env, path, options = {}) {
  const response = await fetch(`https://api.helpdesk.com/v1${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: getAuthHeader(env),
      "Content-Type": "application/json",
      "User-Agent": "livechat-admin/1.0",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (_error) {
      payload = text;
    }
  }

  if (!response.ok) {
    const error = new Error(extractErrorMessage(payload, `HelpDesk ${path} failed.`));
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return {
    payload,
    headers: response.headers,
    status: response.status,
  };
}

export async function helpdeskRequest(env, path, options = {}) {
  const { payload } = await helpdeskRequestWithMeta(env, path, options);
  return payload;
}

export function normalizeHelpDeskTicketList(payload) {
  return Array.isArray(payload) ? payload : payload?.tickets || payload?.data || payload?.items || [];
}

export function normalizeHelpDeskTicketId(ticket) {
  return String(ticket?.ID || ticket?.id || "");
}

export function normalizeHelpDeskTicketShortId(ticket) {
  return String(ticket?.shortID || ticket?.shortId || ticket?.short_id || normalizeHelpDeskTicketId(ticket));
}

function normalizeDateString(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : "";
}

function normalizeRequester(ticket) {
  const requester = ticket?.requester || ticket?.requesterData || ticket?.customer || ticket?.client || {};
  return {
    email: requester.email || ticket?.requesterEmail || ticket?.customerEmail || "",
    name: requester.name || requester.fullName || ticket?.requesterName || ticket?.customerName || "",
  };
}

function normalizeAssignment(ticket, agentDirectory = new Map()) {
  const assignment = ticket?.assignment || {};
  const agent = assignment.agent || ticket?.assignedAgent || ticket?.assignee || {};
  const agentId = String(agent.ID || agent.id || ticket?.agentID || ticket?.agentId || "");
  const dashboardAgent = agentDirectory.get(agentId) || {};

  return {
    agent: {
      id: agentId,
      name: agent.name || agent.fullName || dashboardAgent.name || "",
      email: agent.email || dashboardAgent.email || "",
    },
    team: {
      id: String(assignment.team?.ID || assignment.team?.id || ""),
      name: assignment.team?.name || "",
    },
  };
}

function normalizeEventDate(event) {
  return normalizeDateString(event?.date || event?.createdAt || event?.timestamp || event?.created_at);
}

function eventAuthor(event, agentDirectory = new Map()) {
  const author = event?.author || event?.createdBy || {};
  const authorId =
    (typeof author === "string" ? author : author.ID || author.id || author.agentID || author.agentId) ||
    event?.agentID ||
    event?.agentId ||
    event?.authorID ||
    event?.authorId ||
    "";
  const id = String(authorId || "");
  const dashboardAgent = agentDirectory.get(id) || {};
  const type = `${author.type || event?.authorType || event?.createdByType || author.role || ""}`.toLowerCase();

  return {
    id,
    type: type || "system",
    name: author.name || author.fullName || event?.authorName || dashboardAgent.name || "",
    email: author.email || event?.authorEmail || dashboardAgent.email || "",
  };
}

function eventMessageParts(event) {
  const message = event?.message || event?.content || {};
  if (typeof message === "string") {
    return { text: message, html: "" };
  }

  return {
    text: message.text || message.plainText || event?.text || "",
    html: message.html || event?.richTextHtml || event?.html || "",
  };
}

function eventStatusValue(event) {
  const status =
    event?.status ||
    event?.newStatus ||
    event?.value ||
    event?.to ||
    event?.data?.status ||
    event?.payload?.status ||
    event?.changes?.status?.to ||
    "";
  if (typeof status === "string") return status.toLowerCase();
  return `${status.value || status.name || status.status || ""}`.toLowerCase();
}

function eventActivityText(event, assignment) {
  const type = `${event?.type || event?.eventType || ""}`.toLowerCase();
  const status = eventStatusValue(event);

  if (status && (type.includes("status") || ["open", "pending", "onhold", "solved", "closed"].includes(status))) {
    return `Status changed to ${status}.`;
  }
  if (type.includes("priority")) {
    return "Priority changed.";
  }
  if (type.includes("assignment")) {
    const agent = assignment?.agent?.name || assignment?.agent?.email || "an agent";
    return `Assignment changed to ${agent}.`;
  }
  if (type.includes("tags")) {
    return "Tags changed.";
  }
  if (type.includes("followers")) {
    return "Followers changed.";
  }
  if (type) {
    return type.replaceAll(".", " ").replaceAll("_", " ");
  }
  return "Ticket activity.";
}

export function buildHelpDeskAgentDirectory(dashboard) {
  return new Map(
    (dashboard?.agents || []).map((agent) => [
      String(agent.id),
      {
        id: String(agent.id),
        email: agent.email || "",
        name: agent.name || agent.email || String(agent.id),
        teamIDs: (agent.teamIDs || agent.teams?.map((team) => team.id) || []).map(String),
      },
    ]),
  );
}

export function normalizeHelpDeskConversationEvents(ticket, agentDirectory = new Map()) {
  const assignment = normalizeAssignment(ticket, agentDirectory);
  return (ticket?.events || [])
    .map((event) => {
      const author = eventAuthor(event, agentDirectory);
      const message = eventMessageParts(event);
      return {
        id: String(event.ID || event.id || ""),
        date: normalizeEventDate(event),
        type: event.type || event.eventType || "",
        author_type: author.type,
        author_id: author.id,
        author_name: author.name || author.email || author.type,
        author_email: author.email,
        is_private: Boolean(event.isPrivate || event.private),
        status: eventStatusValue(event),
        text: message.text,
        html: message.html,
        activity: eventActivityText(event, assignment),
      };
    })
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function normalizeHelpDeskTicketSummary(ticket, agentDirectory = new Map()) {
  const id = normalizeHelpDeskTicketId(ticket);
  const shortId = normalizeHelpDeskTicketShortId(ticket);
  const requester = normalizeRequester(ticket);
  const assignment = normalizeAssignment(ticket, agentDirectory);

  return {
    id,
    ticket_id: id,
    short_id: shortId,
    link:
      ticket?.url ||
      ticket?.webUrl ||
      ticket?.ticketUrl ||
      ticket?.ticketURL ||
      ticket?.link ||
      `https://app.helpdesk.com/tickets/${encodeURIComponent(shortId)}`,
    shortID: shortId,
    createdAt: normalizeDateString(ticket?.createdAt || ticket?.created_at),
    updatedAt: normalizeDateString(ticket?.updatedAt || ticket?.updated_at),
    lastMessageAt: normalizeDateString(ticket?.lastMessageAt || ticket?.last_message_at),
    status: ticket?.status || "",
    priority: ticket?.priority ?? 0,
    subject: ticket?.subject || "",
    teamIDs: Array.isArray(ticket?.teamIDs) ? ticket.teamIDs.map(String) : [],
    tagIDs: Array.isArray(ticket?.tagIDs) ? ticket.tagIDs.map(String) : [],
    silo: ticket?.silo || "tickets",
    requester,
    requesterEmail: requester.email,
    requesterName: requester.name,
    assignment,
    assignedAgent: assignment.agent,
    parentTicket: ticket?.parentTicket || null,
    childTickets: Array.isArray(ticket?.childTickets) ? ticket.childTickets : [],
  };
}

export function normalizeHelpDeskTicketDetail(ticket, agentDirectory = new Map()) {
  return {
    ...normalizeHelpDeskTicketSummary(ticket, agentDirectory),
    requesterTickets: [],
    conversation: normalizeHelpDeskConversationEvents(ticket, agentDirectory),
    detectedLanguage: ticket?.detectedLanguage || "",
  };
}

export async function getHelpDeskDashboard(env) {
  const [agents, teams] = await Promise.all([
    helpdeskRequest(env, "/agents"),
    helpdeskRequest(env, "/teams"),
  ]);

  const teamNameById = new Map((teams || []).map((team) => [String(team.ID), team.name]));

  return {
    agents: (agents || [])
      .map((agent) => ({
        id: String(agent.ID),
        email: agent.email,
        name: agent.name || agent.email,
        status: agent.status || "unknown",
        roles: agent.roles || [],
        teamIDs: (agent.teamIDs || []).map(String),
        teams: (agent.teamIDs || []).map((teamId) => ({
          id: String(teamId),
          name: teamNameById.get(String(teamId)) || `Team ${teamId}`,
        })),
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    teams: (teams || [])
      .map((team) => ({
        id: String(team.ID),
        name: team.name,
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
  };
}
