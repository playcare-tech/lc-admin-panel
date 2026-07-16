import { accountIndexName, accountTableName } from "./accounts.js";
import { livechatAgentChatRequest } from "./livechat.js";

const CHAT_TABLE_BASE = "livechat_ai_qa_chats";
const EVENT_TABLE_BASE = "livechat_ai_qa_events";
const REVIEW_TABLE_BASE = "livechat_ai_qa_reviews";
const SUGGESTION_TABLE_BASE = "livechat_ai_qa_suggestions";
const FEEDBACK_TABLE_BASE = "livechat_ai_qa_feedback";
const KNOWLEDGE_TABLE_BASE = "livechat_ai_qa_knowledge_base";
const USAGE_DAILY_TABLE_BASE = "livechat_ai_qa_usage_daily";
const AGENT_QA_REVIEW_TABLE_BASE = "livechat_ai_agent_qa_reviews";
const AGENT_QA_CHECK_TABLE_BASE = "livechat_ai_agent_qa_checks";
const AGENT_QA_FEEDBACK_TABLE_BASE = "livechat_ai_agent_qa_feedback";
const AGENT_QA_KNOWLEDGE_TABLE_BASE = "livechat_ai_agent_qa_knowledge_base";
const VALID_ACTIONS = new Set(["incoming_chat", "chat_transferred", "incoming_event", "thread_tagged", "chat_deactivated"]);
const NO_TRANSFER_REASON_EVENT_TYPES = new Set(["manual_archived_customer"]);
const FTR_QA_THRESHOLD_MS = 30 * 1000;
const FAST_FTR_TAG = "q12a";
const SLOW_FTR_TAG = "q12b";
const AI_QA_PRIMARY_MODEL = "@cf/ibm-granite/granite-4.0-h-micro";
const AI_QA_FALLBACK_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const AI_QA_PROMPT_VERSION = "manual-qa-tags-v2";
const AI_QA_TAXONOMY_VERSION = "2026-07-05-v1";
const AI_QA_DEFAULT_DAILY_NEURON_LIMIT = 17000;
const AI_QA_MAX_TRANSCRIPT_EVENTS = 160;
const AI_QA_MAX_TRANSCRIPT_CHARS = 24000;
const AI_QA_OUTPUT_TOKEN_BUDGET = 900;
const AI_QA_KNOWLEDGE_CANDIDATE_LIMIT = 80;
const AI_QA_PROMPT_KNOWLEDGE_LIMIT = 10;
const AGENT_QA_PROMPT_VERSION = "manual-agent-qa-v2";
const AGENT_QA_RULES_VERSION = "2026-07-05-v1";
const AGENT_QA_LOW_CONFIDENCE_THRESHOLD = 0.85;
const AGENT_QA_OUTPUT_TOKEN_BUDGET = 1100;
const AGENT_QA_KNOWLEDGE_CANDIDATE_LIMIT = 100;
const AGENT_QA_PROMPT_KNOWLEDGE_LIMIT = 14;
const livechatAiQaSchemaReady = new Map();
const AGENT_QA_RULES = [
  {
    rule: "q1",
    passTag: "q1a",
    failTag: "q1b",
    title: "Closure Reason",
    instruction: "If the player wants to close the account, the agent must clarify the closure reason unless the player already stated it.",
  },
  {
    rule: "q2",
    passTag: "q2a",
    failTag: "q2b",
    title: "Closure Retention",
    instruction: "If the closure reason is not gambling addiction, the agent should offer help or retention before directing closure.",
  },
  {
    rule: "q3",
    passTag: "q3a",
    failTag: "q3b",
    title: "Closure Final Clarification",
    instruction: "Before confirming account closure, the agent should ask if the player is sure they want to close the account.",
  },
  {
    rule: "q4",
    passTag: "q4a",
    failTag: "q4b",
    title: "GA Closure Non-VIP",
    instruction:
      "If a non-VIP player mentions gambling addiction or harmful gambling, the agent should close/inform about account closure and should not offer retention.",
  },
  {
    rule: "q5",
    passTag: "q5a",
    failTag: "q5b",
    title: "GA Closure VIP licensed project",
    instruction:
      "For VIP players on Blitz.bet, Lama.bet, BetiBet, Zotabet, or BoomeranBet.io who mention gambling addiction, the agent should close/inform about account closure in chat.",
  },
  {
    rule: "q6",
    passTag: "q6a",
    failTag: "q6b",
    title: "GA Closure VIP non-license project",
    instruction:
      "For VIP players on SpinStar, RichRoyal, Koning, WinRolla, BillyBets.com, MrPacho.com, Boomerang-casino.com, Boomerang-bet.com, Boomerang.bet, or 0x.bet who mention gambling addiction, the agent should direct them to their VIP Manager.",
  },
  {
    rule: "q7",
    passTag: "q7a",
    failTag: "q7b",
    title: "Technical Issue Website",
    instruction:
      "Apply only when the customer reports a website/platform technical malfunction such as an error, unavailable button, broken page, loading problem, or feature not working. Do not apply to withdrawal wagering, payment processing, verification, bonus, or account-policy questions unless the customer clearly reports a technical malfunction. When applicable, the agent should ask for issue description and screenshot and provide troubleshooting: log out, close tabs, clear cookies/cache/history, restart device, and retry in Google Chrome.",
  },
  {
    rule: "q8",
    passTag: "q8a",
    failTag: "q8b",
    title: "Technical Issue Game",
    instruction:
      "Apply only when the customer reports a slot/game technical malfunction such as a game not loading, stuck round, game error, missing spin result, or broken game behavior. Do not apply to generic withdrawal, payment, wagering, bonus, or account-policy questions. When applicable, the agent should ask for game name, issue description, exact time, screenshot, and provide troubleshooting: log out, close tabs, clear cookies/cache/history, restart device, and retry in Google Chrome.",
  },
  {
    rule: "q9",
    passTag: "q9a",
    failTag: "q9b",
    title: "Rude Communication",
    instruction: "The agent must remain polite and professional. Openly rude, disrespectful, sarcastic, offensive, or hostile communication is a critical mistake.",
  },
  {
    rule: "q10",
    passTag: "q10a",
    failTag: "q10b",
    title: "Explanation quality",
    instruction: "The agent should provide a clear, complete answer with important details and next steps when applicable.",
  },
  {
    rule: "q11",
    passTag: "q11a",
    failTag: "q11b",
    title: "Tone of Voice",
    instruction: "The agent should communicate in a friendly, professional, helpful, and empathetic manner, not cold, dismissive, robotic, or passive-aggressive.",
  },
];
const AGENT_QA_TAGS = new Set([
  "q0x",
  "q0l",
  "q0m",
  ...AGENT_QA_RULES.flatMap((rule) => [rule.passTag, rule.failTag]),
]);
const AI_QA_TAXONOMY = [
  {
    tag: "Bonus_request",
    description:
      "Customer requests to credit, activate, or reissue any bonus available on the platform, including casino, sportsbook, promotions, and sendouts.",
    guidance:
      "Use when the player wants to obtain, activate, reissue, restore, or receive a bonus they believe they are eligible for.",
  },
  {
    tag: "VIP",
    description: "Requests or issues received from VIP players.",
    guidance: "Use when there is any mention of a personal VIP manager by the player or agent.",
  },
  {
    tag: "Withdrawal_hold",
    description: "Withdrawal is pending due to wagering requirements, limits, verification, or manual review.",
    guidance:
      "Use when a withdrawal is pending/on hold due to incomplete wagering, account limits, KYC, or manual review.",
  },
  {
    tag: "No_communication",
    description: "Player did not reply after initiating the chat or left the conversation.",
    guidance: "Use when the player starts a chat but does not answer the agent afterward.",
  },
  {
    tag: "Sportsbook",
    description: "Issues or questions related to sports betting, including bets, promotions, and limitations.",
    guidance: "Use for bet placement, bet settlement, odds, sportsbook limits, sportsbook promotions, or sportsbook bonuses.",
  },
  {
    tag: "Closure_other",
    description: "Account closure requests for reasons other than responsible gambling.",
    guidance: "Use when the player requests closure without addiction, harmful behavior, self-harm, or suicide signals.",
  },
  {
    tag: "Bonus_info",
    description: "Questions about bonus details, wagering requirements, eligibility, or how to use a bonus.",
    guidance: "Use for bonus clarification without a request to credit/reissue a bonus.",
  },
  {
    tag: "account",
    description: "Account access or account information changes.",
    guidance: "Use for login, password reset, 2FA, email, phone, or profile information changes.",
  },
  {
    tag: "kyc",
    description: "Account verification and required documentation.",
    guidance: "Use for identity verification, document submission, upload issues, required documents, or KYC timeframes.",
  },
  {
    tag: "bonus_problem",
    description: "Problem with a bonus such as incorrect issuance, activation issues, or setup errors.",
    guidance: "Use when the player reports that a bonus was not credited, cannot be activated, does not work, or bonus winnings are missing.",
  },
  {
    tag: "withdrawal_problem",
    description: "Problem withdrawing funds from the account.",
    guidance: "Use when withdrawal methods are unavailable, the withdrawal button/function fails, or the player cannot submit a withdrawal.",
  },
  {
    tag: "other",
    description: "Any case that does not fit an existing category.",
    guidance: "Use when no predefined tag fits the chat.",
  },
  {
    tag: "rg_closure",
    description: "Responsible gambling account closure.",
    guidance: "Use when the player shows signs of gambling addiction, harmful gambling behavior, self-harm, or suicide related to gambling.",
  },
  {
    tag: "reopen",
    description: "Request to reopen a previously closed account.",
    guidance: "Use when the player explicitly asks to restore or reopen a closed/deactivated account.",
  },
  {
    tag: "product_info",
    description: "General questions about the website, games, features, or terms and conditions.",
    guidance: "Use when the player asks how the product works, where to click, how games/features work, or asks general T&C questions.",
  },
  {
    tag: "esc",
    description: "Escalation to Jira, Slack, or another department because the issue cannot be resolved in chat.",
    guidance: "Use when the agent promises to forward/escalate the issue to another department.",
  },
  {
    tag: "product_problem",
    description: "Issues with website functionality, cashier operations, T&C discrepancies, or platform bugs.",
    guidance: "Use for platform bugs, cashier problems, features not working as intended, or errors in T&C.",
  },
  {
    tag: "tech_issue",
    description: "Technical difficulties affecting website functionality or player actions.",
    guidance: "Use for registration errors, cancel bet issues, game loading problems, deposit/withdrawal windows, server issues, or troubleshooting steps.",
  },
  {
    tag: "truspilot",
    description: "Agent sends a Trustpilot link or asks the player to leave a Trustpilot review.",
    guidance: "Use when the agent shares a Trustpilot link or asks for a Trustpilot review.",
  },
  {
    tag: "refund",
    description: "Request for a refund, reimbursement, money back, or chargeback.",
    guidance: "Use when the player asks for a refund or mentions initiating/wanting a chargeback.",
  },
  {
    tag: "Loyalty bonus",
    description: "Rewards given as loyalty or retention bonuses, including cash, free spins, no-deposit bonuses, or gifts.",
    guidance: "Use for loyalty/retention offers, including offers to keep a player from closing the account.",
  },
  {
    tag: "Сashback",
    description: "Promotional cashback where the player receives a percentage of losses back as a bonus.",
    guidance: "Use when the player specifically refers to live, weekly, sports, or other promotional cashback.",
  },
  {
    tag: "Promo bonus",
    description: "Request to add, reissue, or activate any named bonus from the promo page.",
    guidance: "Use when the player names a promotion they want to receive, activate, or have reissued.",
  },
];

function nowIso() {
  return new Date().toISOString();
}

function text(value) {
  return `${value ?? ""}`.trim();
}

function jsonText(value) {
  return JSON.stringify(value ?? null);
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

function unique(values) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => text(value)).filter(Boolean))];
}

function chatIdFromPayload(payload) {
  return text(payload?.chat_id || payload?.chat?.id || payload?.id);
}

function threadFromIncomingChat(payload) {
  return payload?.chat?.thread || {};
}

function threadIdFromPayload(payload) {
  return text(payload?.thread_id || payload?.chat?.thread?.id || payload?.thread?.id);
}

function eventDate(action, payload, receivedAt) {
  return payload?.event?.created_at || payload?.chat?.thread?.created_at || payload?.created_at || receivedAt;
}

function diffMs(from, to) {
  const fromMs = new Date(from || "").getTime();
  const toMs = new Date(to || "").getTime();
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) return null;
  return Math.max(0, toMs - fromMs);
}

function isAgentId(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(value).toLowerCase());
}

function isChatbotWelcomeEvent(event) {
  return Boolean(event?.properties?.lc2?.welcome_message) && !isAgentId(event?.author_id);
}

function isChatbotEvent(event) {
  return text(event?.custom_id).startsWith("chatbot_") || isChatbotWelcomeEvent(event);
}

function actorTypeForIncomingEvent(event) {
  if (event?.type === "system_message") return "system";
  if (isChatbotEvent(event)) return "chatbot";
  if (isAgentId(event?.author_id)) return "agent";
  return "customer";
}

function isPostbackButtonClick(event) {
  if (!event?.postback) return false;
  return Boolean(event.postback.id || event.postback.event_id || text(event.postback.value).startsWith("goto:"));
}

function rawEventFromRow(row) {
  const raw = parseJson(row?.raw_json, null);
  return raw?.payload?.event || null;
}

function eventSequence(value) {
  const match = text(value).match(/_(\d+)$/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function compareEventRows(left, right) {
  const leftTime = new Date(left?.event_at || "").getTime();
  const rightTime = new Date(right?.event_at || "").getTime();
  if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) return leftTime - rightTime;
  if (Number.isFinite(leftTime) && !Number.isFinite(rightTime)) return -1;
  if (!Number.isFinite(leftTime) && Number.isFinite(rightTime)) return 1;
  const sequenceDiff = eventSequence(left?.event_id) - eventSequence(right?.event_id);
  if (sequenceDiff) return sequenceDiff;
  return text(left?.event_key).localeCompare(text(right?.event_key));
}

function messageTextForEvent(event, options = {}) {
  if (text(event?.text)) return text(event.text);
  if (event?.type === "rich_message") {
    return (event.elements || [])
      .map((element) => {
        const buttons = options.includeButtons === false ? "" : (element.buttons || []).map((button) => button.text).filter(Boolean).join(", ");
        return [element.title, element.subtitle, buttons].map(text).filter(Boolean).join(" | ");
      })
      .filter(Boolean)
      .join("\n");
  }
  if (event?.type === "filled_form") {
    return `Filled form${event.form_type ? `: ${event.form_type}` : ""}`;
  }
  return text(event?.type || "event");
}

function parseTranslationSignal(event) {
  if (event?.type !== "system_message" || event?.system_message_type !== "translation") return null;
  const value = text(event.text);
  const match = value.match(/Visitors Language:\s*([^,]+),\s*translation enabled for\s*([^-]+?)\s*-\s*([^.]+?)\s*pair/i);
  if (!match) return { source: "system_message", raw: value };
  return {
    source: "system_message",
    customerLanguage: text(match[1]),
    translationFrom: text(match[2]),
    translationTo: text(match[3]),
    chatbotLanguage: text(match[3]),
    raw: value,
  };
}

function isQueueStartSystemEvent(event) {
  return event?.type === "system_message" && event?.system_message_type === "chat_transferred";
}

function noTransferReasonForEvent(event) {
  const systemType = text(event?.system_message_type);
  return NO_TRANSFER_REASON_EVENT_TYPES.has(systemType) ? systemType : "";
}

function eventKeyForWebhook(body) {
  const action = text(body.action);
  const payload = body.payload || {};
  const chatId = chatIdFromPayload(payload);
  const threadId = threadIdFromPayload(payload);
  if (action === "incoming_chat") {
    return `incoming_chat:${chatId}:${threadId}:${text(body.webhook_id || payload.chat?.thread?.id || crypto.randomUUID())}`;
  }
  if (action === "incoming_event") {
    return `incoming_event:${chatId}:${threadId}:${text(payload.event?.id || body.webhook_id)}`;
  }
  if (action === "thread_tagged") {
    return `thread_tagged:${chatId}:${threadId}:${text(body.webhook_id || payload.tag).toLowerCase()}`;
  }
  return `${action}:${chatId}:${threadId}:${text(body.webhook_id || crypto.randomUUID())}`;
}

export function livechatAiQaTables(env) {
  return {
    chats: accountTableName(env, CHAT_TABLE_BASE),
    events: accountTableName(env, EVENT_TABLE_BASE),
    reviews: accountTableName(env, REVIEW_TABLE_BASE),
    suggestions: accountTableName(env, SUGGESTION_TABLE_BASE),
    feedback: accountTableName(env, FEEDBACK_TABLE_BASE),
    knowledgeBase: accountTableName(env, KNOWLEDGE_TABLE_BASE),
    usageDaily: accountTableName(env, USAGE_DAILY_TABLE_BASE),
    agentQaReviews: accountTableName(env, AGENT_QA_REVIEW_TABLE_BASE),
    agentQaChecks: accountTableName(env, AGENT_QA_CHECK_TABLE_BASE),
    agentQaFeedback: accountTableName(env, AGENT_QA_FEEDBACK_TABLE_BASE),
    agentQaKnowledgeBase: accountTableName(env, AGENT_QA_KNOWLEDGE_TABLE_BASE),
    chatsAgentIndex: accountIndexName(env, `idx_${CHAT_TABLE_BASE}_agent`),
    chatsLastEventIndex: accountIndexName(env, `idx_${CHAT_TABLE_BASE}_last_event`),
    chatsTransferIndex: accountIndexName(env, `idx_${CHAT_TABLE_BASE}_transfer`),
    eventsChatIndex: accountIndexName(env, `idx_${EVENT_TABLE_BASE}_chat`),
    eventsDateIndex: accountIndexName(env, `idx_${EVENT_TABLE_BASE}_date`),
    reviewsStatusIndex: accountIndexName(env, `idx_${REVIEW_TABLE_BASE}_status`),
    reviewsChatIndex: accountIndexName(env, `idx_${REVIEW_TABLE_BASE}_chat`),
    suggestionsReviewIndex: accountIndexName(env, `idx_${SUGGESTION_TABLE_BASE}_review`),
    feedbackReviewIndex: accountIndexName(env, `idx_${FEEDBACK_TABLE_BASE}_review`),
    knowledgeTagIndex: accountIndexName(env, `idx_${KNOWLEDGE_TABLE_BASE}_tag`),
    knowledgeStatusIndex: accountIndexName(env, `idx_${KNOWLEDGE_TABLE_BASE}_status`),
    agentQaReviewsStatusIndex: accountIndexName(env, `idx_${AGENT_QA_REVIEW_TABLE_BASE}_status`),
    agentQaReviewsChatIndex: accountIndexName(env, `idx_${AGENT_QA_REVIEW_TABLE_BASE}_chat`),
    agentQaReviewsAgentIndex: accountIndexName(env, `idx_${AGENT_QA_REVIEW_TABLE_BASE}_agent`),
    agentQaChecksReviewIndex: accountIndexName(env, `idx_${AGENT_QA_CHECK_TABLE_BASE}_review`),
    agentQaChecksTagIndex: accountIndexName(env, `idx_${AGENT_QA_CHECK_TABLE_BASE}_tag`),
    agentQaFeedbackReviewIndex: accountIndexName(env, `idx_${AGENT_QA_FEEDBACK_TABLE_BASE}_review`),
    agentQaKnowledgeTagIndex: accountIndexName(env, `idx_${AGENT_QA_KNOWLEDGE_TABLE_BASE}_tag`),
  };
}

export async function ensureLivechatAiQaTables(env) {
  const tables = livechatAiQaTables(env);
  const schemaKey = [
    tables.chats,
    tables.events,
    tables.reviews,
    tables.agentQaReviews,
  ].join("|");
  if (!livechatAiQaSchemaReady.has(schemaKey)) {
    livechatAiQaSchemaReady.set(
      schemaKey,
      ensureLivechatAiQaTablesUncached(env, tables).catch((error) => {
        livechatAiQaSchemaReady.delete(schemaKey);
        throw error;
      }),
    );
  }
  await livechatAiQaSchemaReady.get(schemaKey);
  return tables;
}

async function ensureLivechatAiQaTablesUncached(env, tables) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ${tables.chats} (
      chat_id TEXT NOT NULL,
      thread_id TEXT NOT NULL,
      organization_id TEXT,
      first_seen_at TEXT,
      last_event_at TEXT,
      agent_ids_json TEXT NOT NULL DEFAULT '[]',
      agent_label TEXT,
      transferred_to_agent INTEGER NOT NULL DEFAULT 0,
      transfer_reason TEXT,
      transferred_to_agent_ids_json TEXT NOT NULL DEFAULT '[]',
      transferred_to_group_ids_json TEXT NOT NULL DEFAULT '[]',
      transfer_queue_json TEXT,
      queued_at TEXT,
      agent_transferred_at TEXT,
      queue_wait_ms INTEGER,
      transferred_at TEXT,
      deactivated_at TEXT,
      ftr_ms INTEGER,
      cht_ms INTEGER,
      customer_language TEXT,
      chatbot_language TEXT,
      translation_from TEXT,
      translation_to TEXT,
      language_source TEXT,
      tags_json TEXT NOT NULL DEFAULT '[]',
      system_tags_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (chat_id, thread_id)
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ${tables.events} (
      event_key TEXT PRIMARY KEY,
      webhook_id TEXT,
      action TEXT NOT NULL,
      organization_id TEXT,
      chat_id TEXT NOT NULL,
      thread_id TEXT NOT NULL,
      event_id TEXT,
      event_at TEXT NOT NULL,
      actor_type TEXT,
      actor_id TEXT,
      event_type TEXT,
      message_text TEXT,
      tag TEXT,
      transfer_reason TEXT,
      transfer_to_json TEXT,
      queue_json TEXT,
      language_signal_json TEXT,
      raw_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.chatsAgentIndex} ON ${tables.chats}(agent_label)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.chatsLastEventIndex} ON ${tables.chats}(last_event_at)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.chatsTransferIndex} ON ${tables.chats}(transferred_to_agent, transfer_reason)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.eventsChatIndex} ON ${tables.events}(chat_id, thread_id, event_at)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.eventsDateIndex} ON ${tables.events}(event_at)`).run();
  await ensureLivechatAiQaColumn(env, tables.chats, "system_tags_json", "TEXT NOT NULL DEFAULT '[]'");
  await ensureLivechatAiQaReviewTables(env, tables);
  await ensureLivechatAgentQaTables(env, tables);
}

async function ensureLivechatAiQaReviewTables(env, tables = livechatAiQaTables(env)) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ${tables.reviews} (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      thread_id TEXT NOT NULL,
      organization_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending_review',
      ai_status TEXT NOT NULL DEFAULT 'pending',
      ai_model TEXT,
      ai_fallback_model TEXT,
      prompt_version TEXT,
      taxonomy_version TEXT,
      transcript_snapshot_json TEXT NOT NULL DEFAULT '[]',
      existing_tags_json TEXT NOT NULL DEFAULT '[]',
      suggested_tags_json TEXT NOT NULL DEFAULT '[]',
      ai_summary TEXT,
      ai_overall_confidence REAL,
      ai_response_json TEXT,
      ai_error TEXT,
      queued_at TEXT,
      ai_started_at TEXT,
      ai_completed_at TEXT,
      review_started_at TEXT,
      reviewed_at TEXT,
      reviewer TEXT,
      final_tags_json TEXT NOT NULL DEFAULT '[]',
      decision_note TEXT,
      livechat_tags_applied_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(chat_id, thread_id)
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ${tables.suggestions} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      confidence REAL,
      why TEXT,
      evidence_json TEXT NOT NULL DEFAULT '[]',
      existing_tags_considered_json TEXT NOT NULL DEFAULT '[]',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(review_id, tag)
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ${tables.feedback} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      feedback_type TEXT NOT NULL,
      comment TEXT,
      ai_suggested INTEGER NOT NULL DEFAULT 0,
      final_selected INTEGER NOT NULL DEFAULT 0,
      reviewer TEXT,
      created_at TEXT NOT NULL
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ${tables.knowledgeBase} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag TEXT NOT NULL,
      entry_type TEXT NOT NULL DEFAULT 'rule',
      polarity TEXT NOT NULL DEFAULT 'positive',
      content TEXT NOT NULL,
      example_chat_id TEXT,
      example_thread_id TEXT,
      source_review_id TEXT,
      source_feedback_id INTEGER,
      status TEXT NOT NULL DEFAULT 'active',
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ${tables.usageDaily} (
      usage_date TEXT PRIMARY KEY,
      neuron_limit INTEGER NOT NULL DEFAULT 17000,
      requests_count INTEGER NOT NULL DEFAULT 0,
      skipped_count INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0,
      estimated_neurons REAL NOT NULL DEFAULT 0,
      actual_neurons REAL NOT NULL DEFAULT 0,
      prompt_tokens INTEGER NOT NULL DEFAULT 0,
      completion_tokens INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    )
  `).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.reviewsStatusIndex} ON ${tables.reviews}(status, ai_status, updated_at)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.reviewsChatIndex} ON ${tables.reviews}(chat_id, thread_id)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.suggestionsReviewIndex} ON ${tables.suggestions}(review_id, sort_order)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.feedbackReviewIndex} ON ${tables.feedback}(review_id, created_at)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.knowledgeTagIndex} ON ${tables.knowledgeBase}(tag, status)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.knowledgeStatusIndex} ON ${tables.knowledgeBase}(status, updated_at)`).run();
  await ensureLivechatAiQaColumn(env, tables.reviews, "assigned_to", "TEXT");
  await ensureLivechatAiQaColumn(env, tables.reviews, "assigned_at", "TEXT");
  await ensureLivechatAiQaColumn(env, tables.reviews, "completed_by", "TEXT");
}

async function ensureLivechatAgentQaTables(env, tables = livechatAiQaTables(env)) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ${tables.agentQaReviews} (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      thread_id TEXT NOT NULL,
      organization_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending_review',
      ai_status TEXT NOT NULL DEFAULT 'pending',
      ai_model TEXT,
      ai_fallback_model TEXT,
      prompt_version TEXT,
      rules_version TEXT,
      transcript_snapshot_json TEXT NOT NULL DEFAULT '[]',
      agent_ids_json TEXT NOT NULL DEFAULT '[]',
      agent_label TEXT,
      existing_tags_json TEXT NOT NULL DEFAULT '[]',
      system_tags_json TEXT NOT NULL DEFAULT '[]',
      check_tags_json TEXT NOT NULL DEFAULT '[]',
      ai_summary TEXT,
      ai_overall_confidence REAL,
      ai_response_json TEXT,
      ai_error TEXT,
      queued_at TEXT,
      ai_started_at TEXT,
      ai_completed_at TEXT,
      reviewed_at TEXT,
      reviewer TEXT,
      final_tags_json TEXT NOT NULL DEFAULT '[]',
      decision_note TEXT,
      livechat_tags_applied_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(chat_id, thread_id)
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ${tables.agentQaChecks} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id TEXT NOT NULL,
      rule_key TEXT NOT NULL,
      title TEXT NOT NULL,
      pass_tag TEXT NOT NULL,
      fail_tag TEXT NOT NULL,
      selected_tag TEXT NOT NULL,
      result TEXT NOT NULL,
      confidence REAL,
      why TEXT,
      evidence_json TEXT NOT NULL DEFAULT '[]',
      source TEXT NOT NULL DEFAULT 'ai',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(review_id, rule_key)
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ${tables.agentQaFeedback} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id TEXT NOT NULL,
      rule_key TEXT NOT NULL,
      tag TEXT NOT NULL,
      feedback_type TEXT NOT NULL,
      comment TEXT,
      ai_tag TEXT,
      final_tag TEXT,
      reviewer TEXT,
      created_at TEXT NOT NULL
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ${tables.agentQaKnowledgeBase} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_key TEXT NOT NULL,
      tag TEXT NOT NULL,
      entry_type TEXT NOT NULL DEFAULT 'correction',
      polarity TEXT NOT NULL DEFAULT 'positive',
      content TEXT NOT NULL,
      example_chat_id TEXT,
      example_thread_id TEXT,
      source_review_id TEXT,
      source_feedback_id INTEGER,
      status TEXT NOT NULL DEFAULT 'active',
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.agentQaReviewsStatusIndex} ON ${tables.agentQaReviews}(status, ai_status, updated_at)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.agentQaReviewsChatIndex} ON ${tables.agentQaReviews}(chat_id, thread_id)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.agentQaReviewsAgentIndex} ON ${tables.agentQaReviews}(agent_label, updated_at)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.agentQaChecksReviewIndex} ON ${tables.agentQaChecks}(review_id, sort_order)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.agentQaChecksTagIndex} ON ${tables.agentQaChecks}(selected_tag, result)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.agentQaFeedbackReviewIndex} ON ${tables.agentQaFeedback}(review_id, created_at)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS ${tables.agentQaKnowledgeTagIndex} ON ${tables.agentQaKnowledgeBase}(rule_key, tag, status)`).run();
  await ensureLivechatAiQaColumn(env, tables.agentQaReviews, "assigned_to", "TEXT");
  await ensureLivechatAiQaColumn(env, tables.agentQaReviews, "assigned_at", "TEXT");
  await ensureLivechatAiQaColumn(env, tables.agentQaReviews, "completed_by", "TEXT");
}

async function ensureLivechatAiQaColumn(env, table, column, definition) {
  const columns = await env.DB.prepare(`PRAGMA table_info(${table})`).all();
  if ((columns.results || []).some((row) => row.name === column)) return;
  await env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
}

function normalizeTagKey(value) {
  return text(value)
    .toLowerCase()
    .replace(/\u0421/g, "c")
    .replace(/\u0441/g, "c")
    .replace(/\s+/g, " ")
    .trim();
}

const AI_QA_TAG_BY_KEY = new Map([
  ...AI_QA_TAXONOMY.map((item) => [normalizeTagKey(item.tag), item.tag]),
  ["cashback", "Сashback"],
  ["trustpilot", "truspilot"],
  ["trust pilot", "truspilot"],
]);

function canonicalAiQaTag(value) {
  return AI_QA_TAG_BY_KEY.get(normalizeTagKey(value)) || "";
}

const AI_QA_LIVECHAT_TAG_BY_CANONICAL = new Map([
  ["Bonus_request", "bonus_request"],
  ["Withdrawal_hold", "withdrawal_hold"],
  ["No_communication", "no_communication"],
  ["Sportsbook", "sportsbook"],
  ["Closure_other", "closure_other"],
  ["Bonus_info", "bonus_info"],
]);

function livechatTagForAiQaTag(tag) {
  return AI_QA_LIVECHAT_TAG_BY_CANONICAL.get(tag) || tag;
}

function envAiQaEnabled(env) {
  const value = text(env.AI_QA_ENABLED).toLowerCase();
  return !["0", "false", "no", "off", "disabled"].includes(value);
}

function configuredAiQaDailyLimit(env) {
  const value = Number(env.AI_QA_DAILY_NEURON_LIMIT);
  return Number.isFinite(value) && value > 0 ? value : AI_QA_DEFAULT_DAILY_NEURON_LIMIT;
}

function utcDateKey(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

function truncate(value, maxLength) {
  const input = text(value);
  if (input.length <= maxLength) return input;
  return `${input.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

function reviewIdForChat(chatId, threadId) {
  return `review_${crypto.randomUUID()}_${text(chatId).slice(0, 12)}_${text(threadId).slice(0, 12)}`;
}

function humanLivechatTags(row) {
  const tags = unique(parseJson(row?.tags_json, []));
  const systemTags = new Set(unique(parseJson(row?.system_tags_json, [])));
  return tags.filter((tag) => !systemTags.has(tag) && tag !== FAST_FTR_TAG && tag !== SLOW_FTR_TAG);
}

function isSystemOnlyAgentQaTag(tag) {
  const value = text(tag).toLowerCase();
  return value === FAST_FTR_TAG || value === SLOW_FTR_TAG;
}

function aiQaTranscriptEvent(row) {
  const rawEvent = rawEventFromRow(row);
  const messageSource = rawEvent?.type === "rich_message" ? messageTextForEvent(rawEvent, { includeButtons: true }) : row.message_text;
  const analysisSource = rawEvent?.type === "rich_message" ? messageTextForEvent(rawEvent, { includeButtons: false }) : messageSource;
  const message = truncate(messageSource, 900);
  if (!message) return null;
  if (["incoming_chat", "chat_deactivated", "tag_added"].includes(row.event_type)) return null;
  return {
    at: row.event_at,
    actorType: rawEvent ? actorTypeForIncomingEvent(rawEvent) : row.actor_type || "system",
    actorId: text(rawEvent?.author_id) || row.actor_id || "",
    eventType: row.event_type || row.action || "",
    text: message,
    analysisText: truncate(analysisSource, 900),
    isPostbackButtonClick: rawEvent ? isPostbackButtonClick(rawEvent) : false,
  };
}

function buildTranscriptSnapshot(eventRows) {
  const snapshot = [];
  let totalChars = 0;
  for (const row of [...(eventRows || [])].sort(compareEventRows)) {
    const item = aiQaTranscriptEvent(row);
    if (!item) continue;
    const itemChars = item.text.length;
    if (snapshot.length >= AI_QA_MAX_TRANSCRIPT_EVENTS || totalChars + itemChars > AI_QA_MAX_TRANSCRIPT_CHARS) break;
    totalChars += itemChars;
    snapshot.push(item);
  }
  return snapshot;
}

function analysisTranscriptForAi(transcript) {
  return (Array.isArray(transcript) ? transcript : [])
    .filter((event) => !event.isPostbackButtonClick)
    .map((event) => ({
      at: event.at,
      actorType: event.actorType,
      actorId: event.actorId,
      eventType: event.eventType,
      text: event.analysisText || event.text || "",
    }))
    .filter((event) => text(event.text));
}

function promptKnowledgeTranscriptText(transcript) {
  return analysisTranscriptForAi(transcript)
    .map((event) => `${event.actorType}: ${event.text}`)
    .join("\n")
    .toLowerCase();
}

function knowledgeTokens(value) {
  const stopWords = new Set([
    "about",
    "after",
    "agent",
    "chat",
    "customer",
    "false",
    "final",
    "from",
    "have",
    "into",
    "must",
    "only",
    "player",
    "review",
    "should",
    "system",
    "that",
    "this",
    "true",
    "user",
    "with",
  ]);
  return unique(
    text(value)
      .toLowerCase()
      .split(/[^a-z0-9\u00c0-\u024f\u0400-\u04ff]+/i)
      .filter((token) => token.length >= 4 && !stopWords.has(token)),
  ).slice(0, 40);
}

function knowledgeContentScore(row, transcriptText) {
  return knowledgeTokens(`${row.tag || row.rule_key || ""} ${row.content || ""}`).reduce(
    (score, token) => score + (transcriptText.includes(token) ? 1 : 0),
    0,
  );
}

function promptKnowledgeEntry(row, scope) {
  const content = truncate(row.content, 500);
  if (!content) return null;
  return {
    scope,
    tag: row.tag || "",
    rule: row.rule_key || "",
    polarity: row.polarity || "",
    guidance: content,
    exampleChatId: row.example_chat_id || "",
    exampleThreadId: row.example_thread_id || "",
  };
}

function candidateAiQaTagsForPromptKnowledge(review) {
  const transcriptText = promptKnowledgeTranscriptText(review.transcript);
  const candidates = new Set(
    [...(review.existingTags || []), ...(review.systemTags || [])].map(canonicalAiQaTag).filter(Boolean),
  );
  for (const item of AI_QA_TAXONOMY) {
    const tokens = knowledgeTokens(`${item.tag} ${item.description} ${item.guidance}`);
    const score = tokens.reduce((sum, token) => sum + (transcriptText.includes(token) ? 1 : 0), 0);
    if (score >= 2) candidates.add(item.tag);
  }
  return candidates;
}

async function loadAiQaPromptKnowledge(env, review) {
  const tables = livechatAiQaTables(env);
  const rows = await env.DB.prepare(`
    SELECT tag, entry_type, polarity, content, example_chat_id, example_thread_id, updated_at
    FROM ${tables.knowledgeBase}
    WHERE status = 'active'
      AND content <> ''
    ORDER BY updated_at DESC, id DESC
    LIMIT ?
  `)
    .bind(AI_QA_KNOWLEDGE_CANDIDATE_LIMIT)
    .all();
  const transcriptText = promptKnowledgeTranscriptText(review.transcript);
  const candidateTags = candidateAiQaTagsForPromptKnowledge(review);
  const seen = new Set();
  return (rows.results || [])
    .map((row, index) => ({
      row,
      index,
      score: (candidateTags.has(canonicalAiQaTag(row.tag)) ? 30 : 0) + knowledgeContentScore(row, transcriptText),
    }))
    .filter((item) => item.score > 0 || item.index < 5)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ row }) => promptKnowledgeEntry(row, "content_tagging"))
    .filter((entry) => {
      if (!entry) return false;
      const key = `${entry.tag}|${entry.polarity}|${entry.guidance.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, AI_QA_PROMPT_KNOWLEDGE_LIMIT);
}

async function transcriptSnapshotForChat(env, chatId, threadId) {
  const tables = livechatAiQaTables(env);
  const events = await env.DB.prepare(`
    SELECT * FROM ${tables.events}
    WHERE chat_id = ? AND thread_id = ?
    ORDER BY event_at ASC, event_id ASC, event_key ASC
  `)
    .bind(chatId, threadId)
    .all();
  return buildTranscriptSnapshot(events.results || []);
}

async function refreshContentReviewTranscriptSnapshot(env, reviewRow) {
  const tables = livechatAiQaTables(env);
  const transcript = await transcriptSnapshotForChat(env, reviewRow.chat_id, reviewRow.thread_id);
  await env.DB.prepare(`UPDATE ${tables.reviews} SET transcript_snapshot_json = ?, updated_at = ? WHERE id = ?`)
    .bind(jsonText(transcript), nowIso(), reviewRow.id)
    .run();
  return transcript;
}

async function refreshAgentQaReviewTranscriptSnapshot(env, reviewRow) {
  const tables = livechatAiQaTables(env);
  const transcript = await transcriptSnapshotForChat(env, reviewRow.chat_id, reviewRow.thread_id);
  await env.DB.prepare(`UPDATE ${tables.agentQaReviews} SET transcript_snapshot_json = ?, updated_at = ? WHERE id = ?`)
    .bind(jsonText(transcript), nowIso(), reviewRow.id)
    .run();
  return transcript;
}

function estimateTokens(value) {
  return Math.max(1, Math.ceil(text(value).length / 4));
}

function estimateAiQaNeurons(inputTokens, outputTokens, model) {
  const isGraniteMicro = text(model).includes("granite-4.0-h-micro");
  const inputRate = isGraniteMicro ? 1542 : 40000;
  const outputRate = isGraniteMicro ? 10158 : 40000;
  return (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000;
}

function usageFromAiPayload(payload, fallbackInputTokens, fallbackOutputTokens) {
  const usage = payload?.usage || payload?.result?.usage || {};
  const promptTokens = Number(usage.prompt_tokens ?? usage.input_tokens ?? usage.promptTokens ?? fallbackInputTokens);
  const completionTokens = Number(
    usage.completion_tokens ?? usage.output_tokens ?? usage.completionTokens ?? fallbackOutputTokens,
  );
  return {
    promptTokens: Number.isFinite(promptTokens) ? promptTokens : fallbackInputTokens,
    completionTokens: Number.isFinite(completionTokens) ? completionTokens : fallbackOutputTokens,
  };
}

async function ensureAiQaUsageDay(env, tables, usageDate, limit) {
  const now = nowIso();
  await env.DB.prepare(`
    INSERT OR IGNORE INTO ${tables.usageDaily}
      (usage_date, neuron_limit, updated_at)
    VALUES (?, ?, ?)
  `)
    .bind(usageDate, limit, now)
    .run();
  await env.DB.prepare(`
    UPDATE ${tables.usageDaily}
    SET neuron_limit = ?, updated_at = ?
    WHERE usage_date = ?
  `)
    .bind(limit, now, usageDate)
    .run();
}

async function reserveAiQaUsage(env, estimatedNeurons) {
  const tables = await ensureLivechatAiQaTables(env);
  const usageDate = utcDateKey();
  const limit = configuredAiQaDailyLimit(env);
  await ensureAiQaUsageDay(env, tables, usageDate, limit);
  const row = await env.DB.prepare(`SELECT * FROM ${tables.usageDaily} WHERE usage_date = ?`).bind(usageDate).first();
  const used = Math.max(Number(row?.actual_neurons || 0), Number(row?.estimated_neurons || 0));
  if (used + estimatedNeurons > limit) {
    await env.DB.prepare(`
      UPDATE ${tables.usageDaily}
      SET skipped_count = skipped_count + 1, updated_at = ?
      WHERE usage_date = ?
    `)
      .bind(nowIso(), usageDate)
      .run();
    return { allowed: false, usageDate, limit, used, estimatedNeurons };
  }

  await env.DB.prepare(`
    UPDATE ${tables.usageDaily}
    SET requests_count = requests_count + 1,
        estimated_neurons = estimated_neurons + ?,
        updated_at = ?
    WHERE usage_date = ?
  `)
    .bind(estimatedNeurons, nowIso(), usageDate)
    .run();
  return { allowed: true, usageDate, limit, used, estimatedNeurons };
}

async function recordAiQaUsageResult(env, usageDate, result = {}) {
  const tables = livechatAiQaTables(env);
  await env.DB.prepare(`
    UPDATE ${tables.usageDaily}
    SET actual_neurons = actual_neurons + ?,
        prompt_tokens = prompt_tokens + ?,
        completion_tokens = completion_tokens + ?,
        failed_count = failed_count + ?,
        updated_at = ?
    WHERE usage_date = ?
  `)
    .bind(
      Number(result.actualNeurons || 0),
      Number(result.promptTokens || 0),
      Number(result.completionTokens || 0),
      result.failed ? 1 : 0,
      nowIso(),
      usageDate,
    )
    .run();
}

function buildAiQaMessages(review) {
  const systemPrompt = [
    "You are a QA tagging assistant for LiveChat casino support chats.",
    "You do not apply tags. You only propose tags for a human QA reviewer.",
    "Choose zero or more tags from the allowed taxonomy. If nothing fits, use other.",
    "Use learnedQaGuidance as reviewer-provided correction memory. Apply it only when it is relevant to this transcript.",
    "The allowed taxonomy remains the source of valid tag names. Do not invent tags from learnedQaGuidance.",
    "Return JSON only. Do not include markdown.",
    "For every suggested tag include confidence from 0 to 1, a short why, and evidence from the transcript.",
    "Do not use q12a or q12b; those are FTR system tags and are unrelated to content QA.",
  ].join(" ");
  const userPayload = {
    taxonomyVersion: AI_QA_TAXONOMY_VERSION,
    allowedTags: AI_QA_TAXONOMY,
    expectedJsonShape: {
      summary: "short chat summary",
      suggested_tags: [
        {
          tag: "one allowed tag",
          confidence: 0.95,
          why: "why this tag was selected",
          evidence: ["short transcript quote or paraphrase"],
          existing_tags_considered: ["optional existing LiveChat tags used in the decision"],
        },
      ],
      needs_other: false,
    },
    chat: {
      chatId: review.chatId,
      threadId: review.threadId,
      organizationId: review.organizationId,
      agentLabel: review.agentLabel,
      customerLanguage: review.customerLanguage,
      existingLiveChatTags: review.existingTags,
      ignoredSystemTags: review.systemTags,
    },
    learnedQaGuidance: review.promptKnowledge || [],
    transcript: analysisTranscriptForAi(review.transcript),
  };
  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: JSON.stringify(userPayload) },
  ];
}

function extractAiText(payload) {
  if (typeof payload === "string") return payload;
  if (payload?.suggested_tags || payload?.summary || payload?.tags) return JSON.stringify(payload);
  if (payload?.result?.suggested_tags || payload?.result?.summary || payload?.result?.tags) {
    return JSON.stringify(payload.result);
  }
  const candidate =
    payload?.response ||
      payload?.result?.response ||
      payload?.result?.text ||
      payload?.text ||
      payload?.choices?.[0]?.message?.content ||
      payload?.choices?.[0]?.text ||
      "";
  return typeof candidate === "object" && candidate ? JSON.stringify(candidate) : text(candidate);
}

function extractJsonText(value) {
  let content = text(value);
  content = content.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return content;
  return content.slice(start, end + 1);
}

function normalizeEvidence(value) {
  return (Array.isArray(value) ? value : value ? [value] : [])
    .map((item) => truncate(item, 400))
    .filter(Boolean)
    .slice(0, 6);
}

function normalizeAiQaResponse(payload) {
  const rawText = extractAiText(payload);
  let parsed;
  try {
    parsed = JSON.parse(extractJsonText(rawText));
  } catch (error) {
    const parseError = new Error("AI returned invalid JSON.");
    parseError.cause = error;
    parseError.rawText = rawText;
    throw parseError;
  }

  const sourceSuggestions = Array.isArray(parsed?.suggested_tags)
    ? parsed.suggested_tags
    : Array.isArray(parsed?.tags)
      ? parsed.tags
      : [];
  const seenTags = new Set();
  const suggestions = [];
  for (const item of sourceSuggestions) {
    const rawTag = typeof item === "string" ? item : item?.tag;
    const tag = canonicalAiQaTag(rawTag);
    if (!tag || seenTags.has(tag)) continue;
    seenTags.add(tag);
    const rawConfidence = Number(typeof item === "string" ? 0.5 : item?.confidence);
    const confidence = Number.isFinite(rawConfidence)
      ? Math.max(0, Math.min(1, rawConfidence > 1 ? rawConfidence / 100 : rawConfidence))
      : 0.5;
    suggestions.push({
      tag,
      confidence,
      why: truncate(typeof item === "string" ? "" : item?.why || item?.reason || item?.explanation, 700),
      evidence: normalizeEvidence(typeof item === "string" ? [] : item?.evidence),
      existingTagsConsidered: unique(typeof item === "string" ? [] : item?.existing_tags_considered || item?.existingTagsConsidered),
    });
  }

  if (!suggestions.length) {
    suggestions.push({
      tag: "other",
      confidence: parsed?.needs_other === false ? 0.35 : 0.65,
      why: "No predefined tag was confidently matched.",
      evidence: [],
      existingTagsConsidered: [],
    });
  }

  const averageConfidence =
    suggestions.reduce((sum, item) => sum + Number(item.confidence || 0), 0) / Math.max(1, suggestions.length);
  return {
    summary: truncate(parsed?.summary || parsed?.chat_summary, 1000),
    suggestions,
    overallConfidence: Number.isFinite(Number(parsed?.overall_confidence))
      ? Number(parsed.overall_confidence)
      : averageConfidence,
    raw: parsed,
  };
}

async function runAiQaModel(env, model, messages, jsonMode = false) {
  const input = {
    messages,
    temperature: 0.1,
    max_tokens: AI_QA_OUTPUT_TOKEN_BUDGET,
  };
  if (jsonMode) {
    input.response_format = { type: "json_object" };
  }
  try {
    return await env.AI.run(model, input);
  } catch (error) {
    if (!jsonMode) throw error;
    const retryInput = { ...input };
    delete retryInput.response_format;
    return env.AI.run(model, retryInput);
  }
}

function reviewFromRows(reviewRow, suggestionRows = []) {
  const suggestions = suggestionRows.map((row) => ({
    id: row.id,
    tag: row.tag,
    confidence: row.confidence,
    why: row.why || "",
    evidence: parseJson(row.evidence_json, []),
    existingTagsConsidered: parseJson(row.existing_tags_considered_json, []),
    sortOrder: row.sort_order,
  }));
  return {
    id: reviewRow.id,
    chatId: reviewRow.chat_id,
    threadId: reviewRow.thread_id,
    organizationId: reviewRow.organization_id || "",
    status: reviewRow.status,
    aiStatus: reviewRow.ai_status,
    aiModel: reviewRow.ai_model || "",
    aiFallbackModel: reviewRow.ai_fallback_model || "",
    promptVersion: reviewRow.prompt_version || "",
    taxonomyVersion: reviewRow.taxonomy_version || "",
    transcript: parseJson(reviewRow.transcript_snapshot_json, []),
    existingTags: parseJson(reviewRow.existing_tags_json, []),
    suggestedTags: parseJson(reviewRow.suggested_tags_json, []),
    suggestions,
    aiSummary: reviewRow.ai_summary || "",
    aiOverallConfidence: reviewRow.ai_overall_confidence,
    aiError: reviewRow.ai_error || "",
    queuedAt: reviewRow.queued_at || "",
    aiStartedAt: reviewRow.ai_started_at || "",
    aiCompletedAt: reviewRow.ai_completed_at || "",
    reviewStartedAt: reviewRow.review_started_at || "",
    reviewedAt: reviewRow.reviewed_at || "",
    reviewer: reviewRow.reviewer || "",
    assignedTo: reviewRow.assigned_to || "",
    assignedAt: reviewRow.assigned_at || "",
    finalTags: parseJson(reviewRow.final_tags_json, []),
    decisionNote: reviewRow.decision_note || "",
    livechatTagsAppliedAt: reviewRow.livechat_tags_applied_at || "",
    createdAt: reviewRow.created_at,
    updatedAt: reviewRow.updated_at,
  };
}

async function loadReviewSuggestions(env, reviewId) {
  const tables = livechatAiQaTables(env);
  const rows = await env.DB.prepare(`
    SELECT * FROM ${tables.suggestions}
    WHERE review_id = ?
    ORDER BY sort_order ASC, id ASC
  `)
    .bind(reviewId)
    .all();
  return rows.results || [];
}

async function saveAiQaSuggestions(env, reviewId, result) {
  const tables = livechatAiQaTables(env);
  const now = nowIso();
  await env.DB.prepare(`DELETE FROM ${tables.suggestions} WHERE review_id = ?`).bind(reviewId).run();
  let index = 0;
  for (const suggestion of result.suggestions) {
    await env.DB.prepare(`
      INSERT INTO ${tables.suggestions}
        (review_id, tag, confidence, why, evidence_json, existing_tags_considered_json, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        reviewId,
        suggestion.tag,
        suggestion.confidence,
        suggestion.why,
        jsonText(suggestion.evidence),
        jsonText(suggestion.existingTagsConsidered),
        index,
        now,
        now,
      )
      .run();
    index += 1;
  }
}

export async function queueLivechatAiQaReviewForChat(env, chatId, threadId) {
  const tables = await ensureLivechatAiQaTables(env);
  const chat = await env.DB.prepare(`SELECT * FROM ${tables.chats} WHERE chat_id = ? AND thread_id = ?`)
    .bind(chatId, threadId)
    .first();
  if (!chat?.deactivated_at) {
    return { queued: false, reason: "chat_not_ended" };
  }

  const existing = await env.DB.prepare(`SELECT * FROM ${tables.reviews} WHERE chat_id = ? AND thread_id = ?`)
    .bind(chatId, threadId)
    .first();
  if (existing) {
    return { queued: false, reason: "already_exists", reviewId: existing.id, status: existing.status, aiStatus: existing.ai_status };
  }

  const transcript = await transcriptSnapshotForChat(env, chatId, threadId);
  const now = nowIso();
  const reviewId = reviewIdForChat(chatId, threadId);
  await env.DB.prepare(`
    INSERT INTO ${tables.reviews}
      (id, chat_id, thread_id, organization_id, status, ai_status, prompt_version, taxonomy_version,
       transcript_snapshot_json, existing_tags_json, suggested_tags_json, queued_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'pending_review', 'pending', ?, ?, ?, ?, '[]', ?, ?, ?)
  `)
    .bind(
      reviewId,
      chatId,
      threadId,
      chat.organization_id || "",
      AI_QA_PROMPT_VERSION,
      AI_QA_TAXONOMY_VERSION,
      jsonText(transcript),
      jsonText(humanLivechatTags(chat)),
      now,
      now,
      now,
    )
    .run();

  const management = await import("./livechat-ai-qa-management.js");
  await management.refillAllEnabledLivechatAiQaQueues(env, "auto_tag");
  return { queued: true, reviewId, status: "pending_review", aiStatus: "pending" };
}

async function reviewInput(env, reviewId) {
  const tables = await ensureLivechatAiQaTables(env);
  const review = await env.DB.prepare(`SELECT * FROM ${tables.reviews} WHERE id = ?`).bind(reviewId).first();
  if (!review) return null;
  const chat = await env.DB.prepare(`SELECT * FROM ${tables.chats} WHERE chat_id = ? AND thread_id = ?`)
    .bind(review.chat_id, review.thread_id)
    .first();
  return {
    reviewRow: review,
    chat,
    chatId: review.chat_id,
    threadId: review.thread_id,
    organizationId: review.organization_id || "",
    agentLabel: chat?.agent_label || "",
    customerLanguage: chat?.customer_language || "",
    transcript: parseJson(review.transcript_snapshot_json, []),
    existingTags: parseJson(review.existing_tags_json, []),
    systemTags: parseJson(chat?.system_tags_json, []),
  };
}

export async function processLivechatAiQaReview(env, reviewId, options = {}) {
  const tables = await ensureLivechatAiQaTables(env);
  const input = await reviewInput(env, reviewId);
  if (!input) return { processed: false, reason: "not_found" };
  if (input.reviewRow.ai_status === "completed" && !options.force) {
    const suggestions = await loadReviewSuggestions(env, reviewId);
    return { processed: false, reason: "already_completed", review: reviewFromRows(input.reviewRow, suggestions) };
  }
  input.transcript = await refreshContentReviewTranscriptSnapshot(env, input.reviewRow);
  if (!envAiQaEnabled(env)) {
    await env.DB.prepare(`
      UPDATE ${tables.reviews}
      SET ai_status = 'skipped', ai_error = ?, updated_at = ?
      WHERE id = ?
    `)
      .bind("AI QA is disabled by AI_QA_ENABLED.", nowIso(), reviewId)
      .run();
    return { processed: false, reason: "disabled" };
  }
  if (!env.AI?.run) {
    await env.DB.prepare(`
      UPDATE ${tables.reviews}
      SET ai_status = 'skipped', ai_error = ?, updated_at = ?
      WHERE id = ?
    `)
      .bind("Workers AI binding AI is not available.", nowIso(), reviewId)
      .run();
    return { processed: false, reason: "missing_ai_binding" };
  }

  input.promptKnowledge = await loadAiQaPromptKnowledge(env, input);
  const messages = buildAiQaMessages(input);
  const promptText = messages.map((message) => `${message.role}: ${message.content}`).join("\n");
  const inputTokens = estimateTokens(promptText);
  const estimatedNeurons = estimateAiQaNeurons(inputTokens, AI_QA_OUTPUT_TOKEN_BUDGET, AI_QA_PRIMARY_MODEL);
  const reservation = await reserveAiQaUsage(env, estimatedNeurons);
  if (!reservation.allowed) {
    await env.DB.prepare(`
      UPDATE ${tables.reviews}
      SET ai_status = 'skipped', ai_error = ?, updated_at = ?
      WHERE id = ?
    `)
      .bind(
        `Daily AI QA neuron limit reached (${Math.round(reservation.used)} / ${reservation.limit}).`,
        nowIso(),
        reviewId,
      )
      .run();
    return { processed: false, reason: "daily_limit", reservation };
  }

  const startedAt = nowIso();
  await env.DB.prepare(`
    UPDATE ${tables.reviews}
    SET ai_status = 'running',
        ai_model = ?,
        ai_fallback_model = '',
        ai_error = '',
        ai_started_at = ?,
        updated_at = ?
    WHERE id = ?
  `)
    .bind(AI_QA_PRIMARY_MODEL, startedAt, startedAt, reviewId)
    .run();

  let payload;
  let parsed;
  let fallbackModel = "";
  let failed = false;
  try {
    payload = await runAiQaModel(env, AI_QA_PRIMARY_MODEL, messages, false);
    try {
      parsed = normalizeAiQaResponse(payload);
    } catch (_parseError) {
      fallbackModel = AI_QA_FALLBACK_MODEL;
      payload = await runAiQaModel(env, AI_QA_FALLBACK_MODEL, messages, true);
      parsed = normalizeAiQaResponse(payload);
    }
    await saveAiQaSuggestions(env, reviewId, parsed);
    const usage = usageFromAiPayload(payload, inputTokens, AI_QA_OUTPUT_TOKEN_BUDGET);
    const actualNeurons = estimateAiQaNeurons(usage.promptTokens, usage.completionTokens, fallbackModel || AI_QA_PRIMARY_MODEL);
    await recordAiQaUsageResult(env, reservation.usageDate, {
      actualNeurons,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
    });
    const completedAt = nowIso();
    await env.DB.prepare(`
      UPDATE ${tables.reviews}
      SET ai_status = 'completed',
          ai_model = ?,
          ai_fallback_model = ?,
          suggested_tags_json = ?,
          ai_summary = ?,
          ai_overall_confidence = ?,
          ai_response_json = ?,
          ai_error = '',
          ai_completed_at = ?,
          updated_at = ?
      WHERE id = ?
    `)
      .bind(
        AI_QA_PRIMARY_MODEL,
        fallbackModel,
        jsonText(parsed.suggestions.map((item) => item.tag)),
        parsed.summary,
        parsed.overallConfidence,
        jsonText(parsed.raw),
        completedAt,
        completedAt,
        reviewId,
      )
      .run();
  } catch (error) {
    failed = true;
    await recordAiQaUsageResult(env, reservation.usageDate, {
      actualNeurons: estimatedNeurons,
      promptTokens: inputTokens,
      completionTokens: 0,
      failed: true,
    });
    await env.DB.prepare(`
      UPDATE ${tables.reviews}
      SET ai_status = 'failed',
          ai_error = ?,
          updated_at = ?
      WHERE id = ?
    `)
      .bind(truncate(error.message || "AI analysis failed.", 1000), nowIso(), reviewId)
      .run();
  }

  const review = await getLivechatAiQaReview(env, reviewId);
  return { processed: !failed, review };
}

export async function processPendingLivechatAiQaReviews(env, options = {}) {
  const tables = await ensureLivechatAiQaTables(env);
  const limit = Math.min(Math.max(Number(options.limit) || 5, 1), 25);
  const staleRunningCutoff = new Date(Date.now() - Math.min(Math.max(Number(options.staleRunningMinutes) || 10, 1), 120) * 60 * 1000).toISOString();
  const queuedMissing =
    options.queueMissing === false
      ? { queued: 0, results: [] }
      : await queueMissingLivechatAiQaReviews(env, { limit, sinceHours: options.sinceHours, type: "content" });
  const where = options.force
    ? "ai_status IN ('pending', 'running', 'failed', 'skipped')"
    : "(ai_status = 'pending' OR (ai_status = 'running' AND updated_at < ?))";
  const rows = await env.DB.prepare(`
    SELECT id FROM ${tables.reviews}
    WHERE ${where}
    ORDER BY queued_at ASC, created_at ASC
    LIMIT ?
  `)
    .bind(...(options.force ? [] : [staleRunningCutoff]), limit)
    .all();
  const results = [];
  for (const row of rows.results || []) {
    results.push(await processLivechatAiQaReview(env, row.id, { force: options.force }));
  }
  return { queuedMissing, processed: results.filter((item) => item.processed).length, results };
}

export async function queueMissingLivechatAiQaReviews(env, options = {}) {
  const tables = await ensureLivechatAiQaTables(env);
  const limit = Math.min(Math.max(Number(options.limit) || 10, 1), 50);
  const sinceHours = Math.min(Math.max(Number(options.sinceHours) || 6, 1), 48);
  const cutoff = new Date(Date.now() - sinceHours * 60 * 60 * 1000).toISOString();
  const type = options.type === "agent" ? "agent" : "content";
  const reviewTable = type === "agent" ? tables.agentQaReviews : tables.reviews;
  const rows = await env.DB.prepare(`
    SELECT c.chat_id, c.thread_id
    FROM ${tables.chats} c
    LEFT JOIN ${reviewTable} r ON r.chat_id = c.chat_id AND r.thread_id = c.thread_id
    WHERE c.deactivated_at IS NOT NULL
      AND c.deactivated_at >= ?
      AND r.id IS NULL
    ORDER BY c.deactivated_at DESC
    LIMIT ?
  `)
    .bind(cutoff, limit)
    .all();
  const results = [];
  for (const row of rows.results || []) {
    try {
      const result =
        type === "agent"
          ? await queueLivechatAgentQaReviewForChat(env, row.chat_id, row.thread_id)
          : await queueLivechatAiQaReviewForChat(env, row.chat_id, row.thread_id);
      results.push({ chatId: row.chat_id, threadId: row.thread_id, ...result });
    } catch (error) {
      results.push({ chatId: row.chat_id, threadId: row.thread_id, queued: false, reason: "queue_failed", error: error.message });
    }
  }
  return { type, cutoff, queued: results.filter((item) => item.queued).length, results };
}

export async function listLivechatAiQaReviews(env, filters = {}) {
  const tables = await ensureLivechatAiQaTables(env);
  const where = [];
  const binds = [];
  if (filters.status) {
    if (filters.status === "pending_review") {
      where.push("(r.status = 'pending_review' OR aq.status = 'pending_review')");
    } else if (filters.status === "approved") {
      where.push("r.status = 'approved' AND (aq.id IS NULL OR aq.status = 'approved')");
    } else if (filters.status === "corrected") {
      where.push("r.status <> 'pending_review' AND (aq.id IS NULL OR aq.status <> 'pending_review') AND (r.status = 'corrected' OR aq.status = 'corrected')");
    }
  }
  if (filters.aiStatus) {
    if (filters.aiStatus === "ready") {
      where.push("r.ai_status = 'completed' AND aq.ai_status = 'completed'");
    } else if (filters.aiStatus === "missing_agent_qa") {
      where.push("r.ai_status = 'completed' AND aq.id IS NULL");
    } else {
      where.push("(r.ai_status = ? OR aq.ai_status = ?)");
      binds.push(filters.aiStatus, filters.aiStatus);
    }
  }
  if (filters.chatId) {
    where.push("(r.chat_id LIKE ? OR r.thread_id LIKE ?)");
    const value = `%${filters.chatId}%`;
    binds.push(value, value);
  }
  if (filters.assignedTo) {
    where.push("r.assigned_to = ?");
    binds.push(filters.assignedTo);
  }
  const pageSize = Math.min(Math.max(Number(filters.pageSize) || 25, 1), 100);
  const page = Math.max(Number(filters.page) || 1, 1);
  const offset = (page - 1) * pageSize;
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const joinSql = `LEFT JOIN ${tables.agentQaReviews} aq ON aq.chat_id = r.chat_id AND aq.thread_id = r.thread_id`;
  const countRow = await env.DB.prepare(`SELECT COUNT(*) AS count FROM ${tables.reviews} r ${joinSql} ${whereSql}`)
    .bind(...binds)
    .first();
  const rows = await env.DB.prepare(`
    SELECT r.*, c.agent_label, c.deactivated_at, c.last_event_at, c.customer_language, c.system_tags_json,
           aq.id AS agent_qa_review_id, aq.status AS agent_qa_status, aq.ai_status AS agent_qa_ai_status,
           aq.check_tags_json AS agent_qa_tags_json, aq.ai_error AS agent_qa_error
    FROM ${tables.reviews} r
    ${joinSql}
    LEFT JOIN ${tables.chats} c ON c.chat_id = r.chat_id AND c.thread_id = r.thread_id
    ${whereSql}
    ORDER BY r.updated_at DESC, r.created_at DESC
    LIMIT ? OFFSET ?
  `)
    .bind(...binds, pageSize, offset)
    .all();

  return {
    rows: (rows.results || []).map((row) => ({
      id: row.id,
      chatId: row.chat_id,
      threadId: row.thread_id,
      status: row.status,
      aiStatus: row.ai_status,
      aiSummary: row.ai_summary || "",
      aiOverallConfidence: row.ai_overall_confidence,
      suggestedTags: parseJson(row.suggested_tags_json, []),
      finalTags: parseJson(row.final_tags_json, []),
      existingTags: parseJson(row.existing_tags_json, []),
      systemTags: parseJson(row.system_tags_json, []),
      agentLabel: row.agent_label || "",
      customerLanguage: row.customer_language || "",
      deactivatedAt: row.deactivated_at || "",
      lastEventAt: row.last_event_at || "",
      reviewedAt: row.reviewed_at || "",
      reviewer: row.reviewer || "",
      assignedTo: row.assigned_to || "",
      assignedAt: row.assigned_at || "",
      aiError: row.ai_error || "",
      agentQaReviewId: row.agent_qa_review_id || "",
      agentQaStatus: row.agent_qa_status || "missing",
      agentQaAiStatus: row.agent_qa_ai_status || "missing",
      agentQaTags: parseJson(row.agent_qa_tags_json, []),
      agentQaError: row.agent_qa_error || "",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    page,
    pageSize,
    total: Number(countRow?.count || 0),
  };
}

export async function getLivechatAiQaReview(env, reviewId) {
  const tables = await ensureLivechatAiQaTables(env);
  const review = await env.DB.prepare(`SELECT * FROM ${tables.reviews} WHERE id = ?`).bind(reviewId).first();
  if (!review) return null;
  const [suggestions, feedbackRows, chat] = await Promise.all([
    loadReviewSuggestions(env, reviewId),
    env.DB.prepare(`SELECT * FROM ${tables.feedback} WHERE review_id = ? ORDER BY created_at ASC, id ASC`)
      .bind(reviewId)
      .all(),
    env.DB.prepare(`SELECT * FROM ${tables.chats} WHERE chat_id = ? AND thread_id = ?`)
      .bind(review.chat_id, review.thread_id)
      .first(),
  ]);
  const reviewData = reviewFromRows(review, suggestions);
  reviewData.transcript = await transcriptSnapshotForChat(env, review.chat_id, review.thread_id);
  return {
    ...reviewData,
    chat: chat
      ? {
          agentLabel: chat.agent_label || "",
          deactivatedAt: chat.deactivated_at || "",
          lastEventAt: chat.last_event_at || "",
          customerLanguage: chat.customer_language || "",
          systemTags: parseJson(chat.system_tags_json, []),
          ftrMs: chat.ftr_ms,
          chtMs: chat.cht_ms,
        }
      : null,
    feedback: (feedbackRows.results || []).map((row) => ({
      id: row.id,
      tag: row.tag,
      type: row.feedback_type,
      comment: row.comment || "",
      aiSuggested: Boolean(row.ai_suggested),
      finalSelected: Boolean(row.final_selected),
      reviewer: row.reviewer || "",
      createdAt: row.created_at,
    })),
  };
}

function normalizeReviewDecisionTags(tags, fallbackTags = []) {
  const normalized = unique((Array.isArray(tags) && tags.length ? tags : fallbackTags).map(canonicalAiQaTag).filter(Boolean));
  return normalized.length ? normalized : ["other"];
}

async function applyLivechatAiQaFinalTags(env, review, tags) {
  const tables = livechatAiQaTables(env);
  const chat = await env.DB.prepare(`SELECT tags_json, system_tags_json FROM ${tables.chats} WHERE chat_id = ? AND thread_id = ?`)
    .bind(review.chat_id, review.thread_id)
    .first();
  const localTags = new Set(unique(parseJson(chat?.tags_json, [])));
  const systemTags = new Set(unique(parseJson(chat?.system_tags_json, [])));
  const localTagByKey = new Map([...localTags].map((tag) => [normalizeTagKey(tag), tag]));
  const systemTagByKey = new Map([...systemTags].map((tag) => [normalizeTagKey(tag), tag]));
  const applied = [];
  const skipped = [];
  const markedSystem = [];
  const failed = [];
  for (const tag of tags) {
    const livechatTag = livechatTagForAiQaTag(tag);
    const tagKey = normalizeTagKey(livechatTag);
    const existingLocalTag = localTagByKey.get(tagKey);
    if (existingLocalTag) {
      if (!systemTagByKey.has(tagKey)) {
        await applyLocalSystemThreadTag(env, review.chat_id, review.thread_id, existingLocalTag);
        systemTags.add(existingLocalTag);
        systemTagByKey.set(tagKey, existingLocalTag);
        markedSystem.push(existingLocalTag);
      }
      skipped.push({ tag, existingTag: existingLocalTag, reason: "already_present", systemTagged: true });
      continue;
    }
    try {
      await livechatAgentChatRequest(env, "tag_thread", {
        chat_id: review.chat_id,
        thread_id: review.thread_id,
        tag: livechatTag,
      });
      await applyLocalSystemThreadTag(env, review.chat_id, review.thread_id, livechatTag);
      localTags.add(livechatTag);
      systemTags.add(livechatTag);
      localTagByKey.set(tagKey, livechatTag);
      systemTagByKey.set(tagKey, livechatTag);
      applied.push(livechatTag);
    } catch (error) {
      failed.push({
        tag,
        livechatTag,
        reason: "livechat_tag_failed",
        error: truncate(error.message || "Failed to apply tag to LiveChat.", 500),
        status: error.status || null,
        payload: error.payload || null,
      });
    }
  }
  return { applied, skipped, markedSystem, failed };
}

async function insertAiQaFeedback(env, review, feedback, finalTags, reviewer) {
  const tables = livechatAiQaTables(env);
  const finalTagSet = new Set(finalTags);
  const now = nowIso();
  for (const item of Array.isArray(feedback) ? feedback : []) {
    const tag = canonicalAiQaTag(item?.tag);
    if (!tag) continue;
    const feedbackType = text(item?.type || item?.feedbackType || (finalTagSet.has(tag) ? "missed_tag" : "wrong_tag"));
    const comment = truncate(item?.comment, 1200);
    const result = await env.DB.prepare(`
      INSERT INTO ${tables.feedback}
        (review_id, tag, feedback_type, comment, ai_suggested, final_selected, reviewer, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        review.id,
        tag,
        feedbackType || "comment",
        comment,
        item?.aiSuggested ? 1 : 0,
        finalTagSet.has(tag) ? 1 : 0,
        reviewer,
        now,
      )
      .run();
    if (comment) {
      await env.DB.prepare(`
        INSERT INTO ${tables.knowledgeBase}
          (tag, entry_type, polarity, content, example_chat_id, example_thread_id,
           source_review_id, source_feedback_id, status, created_by, created_at, updated_at)
        VALUES (?, 'correction', ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
      `)
        .bind(
          tag,
          finalTagSet.has(tag) ? "positive" : "negative",
          comment,
          review.chat_id,
          review.thread_id,
          review.id,
          result.meta?.last_row_id || null,
          reviewer,
          now,
          now,
        )
        .run();
    }
  }
}

export async function decideLivechatAiQaReview(env, reviewId, decision = {}) {
  const tables = await ensureLivechatAiQaTables(env);
  const management = await import("./livechat-ai-qa-management.js");
  await management.ensureLivechatAiQaManagementTables(env);
  const review = await env.DB.prepare(`SELECT * FROM ${tables.reviews} WHERE id = ?`).bind(reviewId).first();
  if (!review) return { decided: false, reason: "not_found" };

  const suggestions = await loadReviewSuggestions(env, reviewId);
  const suggestedTags = suggestions.map((item) => item.tag);
  const action = text(decision.action).toLowerCase();
  const isApprove = action === "approve";
  const isCorrect = ["correct", "decline", "decline_apply", "decline_and_apply"].includes(action);
  if (!isApprove && !isCorrect) {
    return { decided: false, reason: "unsupported_action" };
  }

  const finalTags = normalizeReviewDecisionTags(decision.finalTags || decision.final_tags, isApprove ? suggestedTags : []);
  if (isApprove && JSON.stringify([...finalTags].sort()) !== JSON.stringify([...suggestedTags].sort())) {
    return { decided: false, reason: "changed_review_requires_correction" };
  }
  const reviewer = text(decision.reviewer || "qa");
  const applyToLiveChat = decision.applyToLiveChat !== false && decision.apply_to_livechat !== false;
  let applyResult = { applied: [], skipped: [] };
  if (applyToLiveChat) {
    applyResult = await applyLivechatAiQaFinalTags(env, review, finalTags);
  }
  if (isCorrect) {
    await insertAiQaFeedback(env, review, decision.feedback, finalTags, reviewer);
  }

  const now = nowIso();
  const previousTags = parseJson(review.final_tags_json, []);
  const previousStatus = review.status || "";
  const historyAction = ["approved", "corrected"].includes(previousStatus)
    ? "edited"
    : isApprove
      ? "approved"
      : "corrected";
  await env.DB.prepare(`
    UPDATE ${tables.reviews}
    SET status = ?,
        reviewed_at = ?,
        reviewer = ?,
        final_tags_json = ?,
        decision_note = ?,
        livechat_tags_applied_at = ?,
        completed_by = ?,
        updated_at = ?
    WHERE id = ?
  `)
    .bind(
      isApprove ? "approved" : "corrected",
      now,
      reviewer,
      jsonText(finalTags),
      truncate(decision.note || decision.decisionNote, 1200),
      applyToLiveChat ? now : "",
      reviewer,
      now,
      reviewId,
    )
    .run();
  await management.recordLivechatAiQaDecisionHistory(env, {
    reviewType: "auto_tag",
    reviewId,
    chatId: review.chat_id,
    threadId: review.thread_id,
    action: historyAction,
    previousStatus,
    newStatus: isApprove ? "approved" : "corrected",
    previousResult: previousTags,
    newResult: finalTags,
    reviewer,
    note: decision.note || decision.decisionNote,
  });
  await management.refillConfiguredLivechatAiQaQueue(env, review.assigned_to || reviewer, "auto_tag");

  return {
    decided: true,
    status: isApprove ? "approved" : "corrected",
    finalTags,
    applyResult,
    review: await getLivechatAiQaReview(env, reviewId),
  };
}

function agentQaReviewIdForChat(chatId, threadId) {
  return `agent_qa_${crypto.randomUUID()}_${text(chatId).slice(0, 12)}_${text(threadId).slice(0, 12)}`;
}

function agentQaRuleByKey(ruleKey) {
  return AGENT_QA_RULES.find((rule) => rule.rule === ruleKey) || null;
}

function agentQaRuleKeyForTag(tag) {
  const value = text(tag).toLowerCase();
  if (["q0x", "q0l", "q0m"].includes(value)) return value;
  return AGENT_QA_RULES.find((rule) => rule.passTag === value || rule.failTag === value)?.rule || "";
}

function canonicalAgentQaTag(value) {
  const tag = text(value).toLowerCase();
  return AGENT_QA_TAGS.has(tag) ? tag : "";
}

function visibleAgentQaTags(tags = []) {
  return unique((Array.isArray(tags) ? tags : []).map(canonicalAgentQaTag).filter(Boolean));
}

function agentQaCheckTags(checks = []) {
  return visibleAgentQaTags(checks.map((check) => check.selectedTag || check.selected_tag));
}

function agentQaCheckRow(check, index = 0) {
  const selectedTag = text(check.selectedTag || check.selected_tag);
  return {
    ruleKey: text(check.ruleKey || check.rule_key || check.rule),
    title: text(check.title),
    passTag: text(check.passTag || check.pass_tag || selectedTag),
    failTag: text(check.failTag || check.fail_tag || selectedTag),
    selectedTag,
    result: text(check.result || "not_applicable"),
    confidence: Number.isFinite(Number(check.confidence)) ? Number(check.confidence) : null,
    why: truncate(check.why || check.reason || "", 1000),
    evidence: normalizeEvidence(check.evidence),
    source: text(check.source || "ai"),
    sortOrder: Number.isFinite(Number(check.sortOrder ?? check.sort_order)) ? Number(check.sortOrder ?? check.sort_order) : index,
  };
}

function isHumanTransferTranscriptEvent(event) {
  const value = text(event?.text);
  return (
    event?.eventType === "transfer_to_agent" ||
    /^transferred to\s+[^\s@]+@[^\s@]+\.[^\s@]+/i.test(value) ||
    value.toLowerCase().includes(" transferred the chat to ")
  );
}

function isCustomerLeftTranscriptEvent(event) {
  if (event?.actorType !== "system") return false;
  const eventType = text(event?.eventType).toLowerCase();
  const value = text(event?.text).toLowerCase();
  return (
    eventType === "manual_archived_customer" ||
    eventType === "archived_customer_disconnected" ||
    value.includes(" left the chat") ||
    value.includes(" archived the chat")
  );
}

function isHumanCustomerTranscriptMessage(event) {
  return event?.actorType === "customer" && text(event?.text) && !event.isPostbackButtonClick && event.eventType !== "filled_form";
}

function agentQaDeterministicChecks(chat, transcript) {
  const checks = [];
  const transferIndex = transcript.findIndex(isHumanTransferTranscriptEvent);
  const leftIndex =
    transferIndex >= 0
      ? transcript.findIndex((event, index) => index > transferIndex && isCustomerLeftTranscriptEvent(event))
      : -1;
  const reviewWindowEnd = leftIndex >= 0 ? leftIndex : transcript.length;
  const reviewWindow = transferIndex >= 0 ? transcript.slice(transferIndex + 1, reviewWindowEnd) : transcript;
  const agentEvents = reviewWindow.filter((event) => event.actorType === "agent" && text(event.text));
  const firstAgentIndex = reviewWindow.findIndex((event) => event.actorType === "agent" && text(event.text));
  const customerAfterFirstAgent =
    firstAgentIndex >= 0 && reviewWindow.slice(firstAgentIndex + 1).some(isHumanCustomerTranscriptMessage);

  if (!agentEvents.length) {
    checks.push({
      ruleKey: "q0x",
      title: "Not enough human agent interaction to rate",
      passTag: "q0x",
      failTag: "q0x",
      selectedTag: "q0x",
      result: "not_enough_agent_interaction",
      confidence: 1,
      why:
        transferIndex >= 0
          ? "The chat was transferred to a human agent, then ended before any human agent message was recorded."
          : "No human agent messages were recorded in this ended chat.",
      evidence: [transcript[transferIndex]?.text || "", transcript[leftIndex]?.text || ""].filter(Boolean),
      source: "deterministic",
      sortOrder: 0,
    });
  } else if (transferIndex >= 0 && leftIndex >= 0 && !customerAfterFirstAgent) {
    checks.push({
      ruleKey: "q0l",
      title: "Customer left after agent greeting",
      passTag: "q0l",
      failTag: "q0l",
      selectedTag: "q0l",
      result: "customer_left_after_agent_joined",
      confidence: 1,
      why: "The chat was transferred to a human agent, the agent sent a message, and then the customer left without a real customer reply afterward.",
      evidence: [transcript[transferIndex]?.text || "", agentEvents[0]?.text || "", transcript[leftIndex]?.text || ""].filter(Boolean),
      source: "deterministic",
      sortOrder: 1,
    });
  }

  return checks.map(agentQaCheckRow);
}

async function saveAgentQaChecks(env, reviewId, checks, { replaceAi = false } = {}) {
  const tables = livechatAiQaTables(env);
  const now = nowIso();
  const statements = [];
  if (replaceAi) {
    statements.push(
      env.DB.prepare(`
        DELETE FROM ${tables.agentQaChecks}
        WHERE review_id = ?
          AND (source <> 'deterministic' OR rule_key = 'q12' OR selected_tag IN (?, ?))
      `).bind(reviewId, FAST_FTR_TAG, SLOW_FTR_TAG),
    );
  }
  for (const [index, sourceCheck] of checks.entries()) {
    const check = agentQaCheckRow(sourceCheck, index);
    if (check.ruleKey === "q12" || isSystemOnlyAgentQaTag(check.selectedTag)) continue;
    if (!check.ruleKey || !check.selectedTag) continue;
    statements.push(
      env.DB.prepare(`
      INSERT INTO ${tables.agentQaChecks}
        (review_id, rule_key, title, pass_tag, fail_tag, selected_tag, result, confidence,
         why, evidence_json, source, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(review_id, rule_key) DO UPDATE SET
        title = excluded.title,
        pass_tag = excluded.pass_tag,
        fail_tag = excluded.fail_tag,
        selected_tag = excluded.selected_tag,
        result = excluded.result,
        confidence = excluded.confidence,
        why = excluded.why,
        evidence_json = excluded.evidence_json,
        source = excluded.source,
        sort_order = excluded.sort_order,
        updated_at = excluded.updated_at
    `)
        .bind(
        reviewId,
        check.ruleKey,
        check.title,
        check.passTag,
        check.failTag,
        check.selectedTag,
        check.result,
        check.confidence,
        check.why,
        jsonText(check.evidence),
        check.source,
        check.sortOrder,
        now,
        now,
        ),
    );
  }
  if (statements.length) {
    await env.DB.batch(statements);
  }
}

async function loadAgentQaChecks(env, reviewId) {
  const tables = livechatAiQaTables(env);
  const rows = await env.DB.prepare(`
    SELECT * FROM ${tables.agentQaChecks}
    WHERE review_id = ?
      AND rule_key <> 'q12'
      AND selected_tag NOT IN (?, ?)
    ORDER BY sort_order ASC, id ASC
  `)
    .bind(reviewId, FAST_FTR_TAG, SLOW_FTR_TAG)
    .all();
  return (rows.results || []).map((row) => ({
    id: row.id,
    ruleKey: row.rule_key,
    title: row.title,
    passTag: row.pass_tag,
    failTag: row.fail_tag,
    selectedTag: row.selected_tag,
    result: row.result,
    confidence: row.confidence,
    why: row.why || "",
    evidence: parseJson(row.evidence_json, []),
    source: row.source,
    sortOrder: row.sort_order,
  }));
}

async function refreshAgentQaReviewTags(env, reviewId) {
  const tables = livechatAiQaTables(env);
  const checks = await loadAgentQaChecks(env, reviewId);
  const tags = agentQaCheckTags(checks);
  await env.DB.prepare(`
    UPDATE ${tables.agentQaReviews}
    SET check_tags_json = ?, updated_at = ?
    WHERE id = ?
  `)
    .bind(jsonText(tags), nowIso(), reviewId)
    .run();
  return tags;
}

function buildAgentQaMessages(review) {
  const systemPrompt = [
    "You are a QA auditor for LiveChat casino support conversations.",
    "Assess only the human agent's procedure, explanation quality, politeness, and tone.",
    "Ignore examples and external links. Use only the rule descriptions provided here and the transcript.",
    "Return JSON only. Do not include markdown.",
    "For q1 through q8, include a check only when that exact procedure is relevant to the customer's request and the agent's workflow in this chat.",
    "If a q1-q8 procedure is not relevant, omit that rule completely; never mark a non-applicable rule as passed or failed.",
    "Do not treat withdrawal wagering, payment processing, KYC, bonus, or account-policy questions as q7/q8 unless there is a clear website or game technical malfunction.",
    "q9, q10, and q11 are general communication checks. When there is any real communication between the customer and a human agent, checks must include q9, q10, and q11.",
    "Use learnedQaGuidance as reviewer-provided correction memory. Apply it only when it is relevant to this transcript and rule.",
    "The listed rules remain the source of valid checks. Do not invent rules or tags from learnedQaGuidance.",
    "The checks field must be an array of check objects, not an object keyed by rule.",
    "Do not output q0x, q0l, or q0m; those QA review outcomes are calculated by code.",
    "Do not output q12a or q12b; those are system FTR tags and are excluded from Manual AI QA Review.",
  ].join(" ");
  const userPayload = {
    rulesVersion: AGENT_QA_RULES_VERSION,
    rules: AGENT_QA_RULES,
    expectedJsonShape: {
      summary: "short summary of agent QA result",
      checks: [
        {
          rule: "q9",
          selected_tag: "q9a",
          result: "passed",
          applicable: true,
          confidence: 0.95,
          why: "why the check passed or failed",
          evidence: ["short quote or paraphrase from transcript"],
        },
      ],
      omittedRules: "Do not include non-applicable q1-q8 rules in checks. Omit them instead of returning pass/fail.",
      overall_confidence: 0.93,
    },
    chat: {
      chatId: review.chatId,
      threadId: review.threadId,
      organizationId: review.organizationId,
      agentLabel: review.agentLabel,
      existingLiveChatTags: review.existingTags,
      systemTags: review.systemTags,
    },
    learnedQaGuidance: review.promptKnowledge || [],
    transcript: analysisTranscriptForAi(review.transcript),
  };
  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: JSON.stringify(userPayload) },
  ];
}

function agentQaResponseCheckItems(parsed) {
  if (Array.isArray(parsed?.checks)) return parsed.checks;
  if (parsed?.checks && typeof parsed.checks === "object") {
    return Object.entries(parsed.checks).map(([ruleKey, item]) => ({
      ...(item && typeof item === "object" ? item : {}),
      rule: item?.rule || item?.rule_key || ruleKey,
    }));
  }
  return [];
}

function normalizeAgentQaResponse(payload) {
  const rawText = extractAiText(payload);
  let parsed;
  try {
    parsed = JSON.parse(extractJsonText(rawText));
  } catch (error) {
    const parseError = new Error("Agent QA AI returned invalid JSON.");
    parseError.cause = error;
    parseError.rawText = rawText;
    throw parseError;
  }

  const checks = [];
  for (const item of agentQaResponseCheckItems(parsed)) {
    const ruleKey = text(item?.rule || item?.rule_key).toLowerCase();
    const rule = agentQaRuleByKey(ruleKey);
    if (!rule) continue;
    if (item?.applicable === false || text(item?.result).toLowerCase() === "not_applicable") continue;
    const rawTag = text(item?.selected_tag || item?.tag);
    const result = text(item?.result).toLowerCase();
    let selectedTag = rawTag;
    if (![rule.passTag, rule.failTag].includes(selectedTag)) {
      selectedTag = result === "failed" || result === "fail" ? rule.failTag : rule.passTag;
    }
    const rawConfidence = Number(item?.confidence);
    const confidence = Number.isFinite(rawConfidence)
      ? Math.max(0, Math.min(1, rawConfidence > 1 ? rawConfidence / 100 : rawConfidence))
      : 0.5;
    checks.push(
      agentQaCheckRow({
        ruleKey: rule.rule,
        title: rule.title,
        passTag: rule.passTag,
        failTag: rule.failTag,
        selectedTag,
        result: selectedTag === rule.failTag ? "failed" : "passed",
        confidence,
        why: item?.why || item?.reason || "",
        evidence: item?.evidence,
        source: "ai",
        sortOrder: Number(rule.rule.replace("q", "")) || 99,
      }),
    );
  }

  const averageConfidence =
    checks.reduce((sum, item) => sum + Number(item.confidence || 0), 0) / Math.max(1, checks.length);
  const overallConfidence = Number.isFinite(Number(parsed?.overall_confidence))
    ? Math.max(0, Math.min(1, Number(parsed.overall_confidence) > 1 ? Number(parsed.overall_confidence) / 100 : Number(parsed.overall_confidence)))
    : averageConfidence;
  if (overallConfidence < AGENT_QA_LOW_CONFIDENCE_THRESHOLD || checks.some((check) => Number(check.confidence || 0) < AGENT_QA_LOW_CONFIDENCE_THRESHOLD)) {
    checks.push(
      agentQaCheckRow({
        ruleKey: "q0m",
        title: "Manual QA review needed",
        passTag: "q0m",
        failTag: "q0m",
        selectedTag: "q0m",
        result: "manual_review_needed",
        confidence: 1,
        why: "AI confidence is below 85% for at least one QA decision.",
        evidence: [],
        source: "ai",
        sortOrder: 0.5,
      }),
    );
  }

  return {
    summary: truncate(parsed?.summary || parsed?.qa_summary, 1000),
    checks,
    overallConfidence,
    raw: parsed,
  };
}

function transcriptTextByActors(transcript, actorTypes) {
  const allowed = new Set(actorTypes);
  return analysisTranscriptForAi(transcript)
    .filter((event) => allowed.has(event.actorType))
    .map((event) => event.text)
    .join("\n")
    .toLowerCase();
}

function hasPattern(value, pattern) {
  return pattern.test(value || "");
}

function hasClosureIntent(value) {
  return hasPattern(
    value,
    /\b(close|closure|closing|delete|deactivate|terminate|shut)\s+(my\s+)?account\b|account\s+(closure|closing|deletion|deactivation)|konto\s+(schlie|kündig|lösch)|cuenta\s+(cerr|elimin)|chiud.*conto|zamkn.*konto|fechar.*conta/i,
  );
}

function hasResponsibleGamblingIntent(value) {
  return hasPattern(
    value,
    /gambling\s+(addict|problem|harm)|responsible\s+gambling|self[-\s]?exclu|spielsucht|glücksspiel(?:problem|sucht)|ludopat|dipenden[zt]a.*gioco|uzależn.*hazard|auto[-\s]?exclu/i,
  );
}

function hasWebsiteTechnicalIssue(value) {
  const technicalSignal =
    /\b(error|bug|broken|loading|load|page|site|website|button|click|browser|cache|cookie|technical|malfunction)\b|fehler|lädt|ladet|seite|webseite|knopf|button|klick|browser|technisch|funktioniert\s+nicht|no\s+funciona|erro|errore|błąd/i;
  const policyOnlySignal =
    /withdraw|withdrawal|auszahl|wager|wagering|umsatz|deposit|payment|kyc|verification|bonus|policy|terms|einzahl|verifizierung/i;
  return hasPattern(value, technicalSignal) && !hasPattern(value, policyOnlySignal);
}

function hasGameTechnicalIssue(value) {
  return hasPattern(
    value,
    /\b(game|slot|spin|round|provider)\b.*\b(error|stuck|frozen|loading|broken|missing|crash|bug)\b|\b(error|stuck|frozen|loading|broken|missing|crash|bug)\b.*\b(game|slot|spin|round|provider)\b|spiel.*(fehler|lädt|hängt)|slot.*(fehler|lädt|hängt)/i,
  );
}

function agentQaRuleApplicableToTranscript(ruleKey, transcript) {
  const customerText = transcriptTextByActors(transcript, ["customer"]);
  if (["q1", "q2", "q3"].includes(ruleKey)) return hasClosureIntent(customerText);
  if (["q4", "q5", "q6"].includes(ruleKey)) return hasResponsibleGamblingIntent(customerText);
  if (ruleKey === "q7") return hasWebsiteTechnicalIssue(customerText);
  if (ruleKey === "q8") return hasGameTechnicalIssue(customerText);
  return true;
}

function filterAgentQaChecksByApplicability(checks, transcript) {
  return (Array.isArray(checks) ? checks : []).filter((check) => {
    if (!/^q[1-8]$/.test(check.ruleKey)) return true;
    return agentQaRuleApplicableToTranscript(check.ruleKey, transcript);
  });
}

function hasCustomerAgentCommunication(transcript) {
  const events = analysisTranscriptForAi(transcript);
  const firstAgentIndex = events.findIndex((event) => event.actorType === "agent" && text(event.text).length >= 8);
  if (firstAgentIndex < 0) return false;
  return (
    events.slice(0, firstAgentIndex).some((event) => event.actorType === "customer" && text(event.text).length >= 2) ||
    events.slice(firstAgentIndex + 1).some((event) => event.actorType === "customer" && text(event.text).length >= 2)
  );
}

function ensureMandatoryAgentQaCommunicationChecks(checks, transcript) {
  if (!hasCustomerAgentCommunication(transcript)) return checks;
  const existingRules = new Set((Array.isArray(checks) ? checks : []).map((check) => check.ruleKey));
  const missingRules = ["q9", "q10", "q11"].filter((ruleKey) => !existingRules.has(ruleKey));
  if (!missingRules.length || existingRules.has("q0m")) return checks;
  return [
    ...checks,
    agentQaCheckRow({
      ruleKey: "q0m",
      title: "Manual QA review needed",
      passTag: "q0m",
      failTag: "q0m",
      selectedTag: "q0m",
      result: "manual_review_needed",
      confidence: 1,
      why: `AI did not return mandatory communication check(s): ${missingRules.join(", ")}.`,
      evidence: [],
      source: "deterministic",
      sortOrder: 0.5,
    }),
  ];
}

function isAiEvaluatedAgentQaRule(ruleKey) {
  return AGENT_QA_RULES.some((rule) => rule.rule === ruleKey);
}

function candidateAgentQaRulesForPromptKnowledge(transcript) {
  const candidates = new Set();
  for (const rule of AGENT_QA_RULES) {
    if (["q9", "q10", "q11"].includes(rule.rule)) {
      if (hasCustomerAgentCommunication(transcript)) candidates.add(rule.rule);
      continue;
    }
    if (agentQaRuleApplicableToTranscript(rule.rule, transcript)) candidates.add(rule.rule);
  }
  return candidates;
}

async function loadAgentQaPromptKnowledge(env, review) {
  const tables = livechatAiQaTables(env);
  const rows = await env.DB.prepare(`
    SELECT rule_key, tag, entry_type, polarity, content, example_chat_id, example_thread_id, updated_at
    FROM ${tables.agentQaKnowledgeBase}
    WHERE status = 'active'
      AND content <> ''
      AND rule_key <> 'q12'
      AND tag NOT IN (?, ?)
    ORDER BY updated_at DESC, id DESC
    LIMIT ?
  `)
    .bind(FAST_FTR_TAG, SLOW_FTR_TAG, AGENT_QA_KNOWLEDGE_CANDIDATE_LIMIT)
    .all();
  const transcriptText = promptKnowledgeTranscriptText(review.transcript);
  const candidateRules = candidateAgentQaRulesForPromptKnowledge(review.transcript);
  const seen = new Set();
  return (rows.results || [])
    .filter((row) => isAiEvaluatedAgentQaRule(row.rule_key) && canonicalAgentQaTag(row.tag))
    .map((row, index) => ({
      row,
      index,
      score: (candidateRules.has(row.rule_key) ? 30 : 0) + knowledgeContentScore(row, transcriptText),
    }))
    .filter((item) => item.score > 0 || item.index < 5)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ row }) => promptKnowledgeEntry(row, "agent_qa"))
    .filter((entry) => {
      if (!entry) return false;
      const key = `${entry.rule}|${entry.tag}|${entry.polarity}|${entry.guidance.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, AGENT_QA_PROMPT_KNOWLEDGE_LIMIT);
}

function agentQaReviewFromRow(row, checks = []) {
  return {
    id: row.id,
    chatId: row.chat_id,
    threadId: row.thread_id,
    organizationId: row.organization_id || "",
    status: row.status,
    aiStatus: row.ai_status,
    aiModel: row.ai_model || "",
    aiFallbackModel: row.ai_fallback_model || "",
    promptVersion: row.prompt_version || "",
    rulesVersion: row.rules_version || "",
    transcript: parseJson(row.transcript_snapshot_json, []),
    agentIds: parseJson(row.agent_ids_json, []),
    agentLabel: row.agent_label || "",
    existingTags: parseJson(row.existing_tags_json, []),
    systemTags: parseJson(row.system_tags_json, []),
    checkTags: visibleAgentQaTags(parseJson(row.check_tags_json, [])),
    aiSummary: row.ai_summary || "",
    aiOverallConfidence: row.ai_overall_confidence,
    aiError: row.ai_error || "",
    checks,
    reviewedAt: row.reviewed_at || "",
    reviewer: row.reviewer || "",
    assignedTo: row.assigned_to || "",
    assignedAt: row.assigned_at || "",
    finalTags: visibleAgentQaTags(parseJson(row.final_tags_json, [])),
    decisionNote: row.decision_note || "",
    livechatTagsAppliedAt: row.livechat_tags_applied_at || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function queueLivechatAgentQaReviewForChat(env, chatId, threadId) {
  const tables = await ensureLivechatAiQaTables(env);
  const chat = await env.DB.prepare(`SELECT * FROM ${tables.chats} WHERE chat_id = ? AND thread_id = ?`)
    .bind(chatId, threadId)
    .first();
  if (!chat?.deactivated_at) return { queued: false, reason: "chat_not_ended" };

  const existing = await env.DB.prepare(`SELECT * FROM ${tables.agentQaReviews} WHERE chat_id = ? AND thread_id = ?`)
    .bind(chatId, threadId)
    .first();
  if (existing) {
    return { queued: false, reason: "already_exists", reviewId: existing.id, status: existing.status, aiStatus: existing.ai_status };
  }

  const transcript = await transcriptSnapshotForChat(env, chatId, threadId);
  const deterministicChecks = agentQaDeterministicChecks(chat, transcript);
  const enoughInteraction = !deterministicChecks.some((check) => ["q0x", "q0l"].includes(check.ruleKey));
  const now = nowIso();
  const reviewId = agentQaReviewIdForChat(chatId, threadId);
  await env.DB.prepare(`
    INSERT INTO ${tables.agentQaReviews}
      (id, chat_id, thread_id, organization_id, status, ai_status, ai_model, prompt_version, rules_version,
       transcript_snapshot_json, agent_ids_json, agent_label, existing_tags_json, system_tags_json,
       check_tags_json, ai_summary, queued_at, ai_completed_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'pending_review', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      reviewId,
      chatId,
      threadId,
      chat.organization_id || "",
      enoughInteraction ? "pending" : "completed",
      enoughInteraction ? "" : "deterministic",
      AGENT_QA_PROMPT_VERSION,
      AGENT_QA_RULES_VERSION,
      jsonText(transcript),
      chat.agent_ids_json || "[]",
      chat.agent_label || "",
      jsonText(humanLivechatTags(chat)),
      chat.system_tags_json || "[]",
      jsonText(agentQaCheckTags(deterministicChecks)),
      enoughInteraction ? "" : "Not enough interaction for full AI QA analysis.",
      now,
      enoughInteraction ? "" : now,
      now,
      now,
    )
    .run();
  await saveAgentQaChecks(env, reviewId, deterministicChecks);
  const management = await import("./livechat-ai-qa-management.js");
  await management.refillAllEnabledLivechatAiQaQueues(env, "agent_qa");
  return { queued: true, reviewId, status: "pending_review", aiStatus: enoughInteraction ? "pending" : "completed" };
}

async function agentQaReviewInput(env, reviewId) {
  const tables = await ensureLivechatAiQaTables(env);
  const review = await env.DB.prepare(`SELECT * FROM ${tables.agentQaReviews} WHERE id = ?`).bind(reviewId).first();
  if (!review) return null;
  return {
    reviewRow: review,
    chatId: review.chat_id,
    threadId: review.thread_id,
    organizationId: review.organization_id || "",
    agentLabel: review.agent_label || "",
    transcript: parseJson(review.transcript_snapshot_json, []),
    existingTags: parseJson(review.existing_tags_json, []),
    systemTags: parseJson(review.system_tags_json, []),
  };
}

export async function processLivechatAgentQaReview(env, reviewId, options = {}) {
  const tables = await ensureLivechatAiQaTables(env);
  const input = await agentQaReviewInput(env, reviewId);
  if (!input) return { processed: false, reason: "not_found" };
  if (input.reviewRow.ai_status === "completed" && !options.force) {
    return { processed: false, reason: "already_completed", review: await getLivechatAgentQaReview(env, reviewId) };
  }
  const deterministicChecks = await loadAgentQaChecks(env, reviewId);
  if (deterministicChecks.some((check) => ["q0x", "q0l"].includes(check.ruleKey)) && !options.force) {
    return { processed: false, reason: "deterministic_only", review: await getLivechatAgentQaReview(env, reviewId) };
  }
  input.transcript = await refreshAgentQaReviewTranscriptSnapshot(env, input.reviewRow);
  const chat = await env.DB.prepare(`SELECT * FROM ${tables.chats} WHERE chat_id = ? AND thread_id = ?`)
    .bind(input.chatId, input.threadId)
    .first();
  const refreshedDeterministicChecks = agentQaDeterministicChecks(chat, input.transcript);
  if (refreshedDeterministicChecks.some((check) => ["q0x", "q0l"].includes(check.ruleKey))) {
    await saveAgentQaChecks(env, reviewId, refreshedDeterministicChecks, { replaceAi: true });
    const tags = await refreshAgentQaReviewTags(env, reviewId);
    const completedAt = nowIso();
    await env.DB.prepare(`
      UPDATE ${tables.agentQaReviews}
      SET ai_status = 'completed',
          ai_model = 'deterministic',
          ai_fallback_model = '',
          check_tags_json = ?,
          ai_summary = ?,
          ai_error = '',
          ai_completed_at = ?,
          updated_at = ?
      WHERE id = ?
    `)
      .bind(jsonText(tags), "Not enough human agent interaction for full AI QA analysis.", completedAt, completedAt, reviewId)
      .run();
    return { processed: false, reason: "deterministic_only", review: await getLivechatAgentQaReview(env, reviewId) };
  }

  if (!envAiQaEnabled(env)) {
    await env.DB.prepare(`UPDATE ${tables.agentQaReviews} SET ai_status = 'skipped', ai_error = ?, updated_at = ? WHERE id = ?`)
      .bind("AI QA is disabled by AI_QA_ENABLED.", nowIso(), reviewId)
      .run();
    return { processed: false, reason: "disabled" };
  }
  if (!env.AI?.run) {
    await env.DB.prepare(`UPDATE ${tables.agentQaReviews} SET ai_status = 'skipped', ai_error = ?, updated_at = ? WHERE id = ?`)
      .bind("Workers AI binding AI is not available.", nowIso(), reviewId)
      .run();
    return { processed: false, reason: "missing_ai_binding" };
  }

  input.promptKnowledge = await loadAgentQaPromptKnowledge(env, input);
  const messages = buildAgentQaMessages(input);
  const promptText = messages.map((message) => `${message.role}: ${message.content}`).join("\n");
  const inputTokens = estimateTokens(promptText);
  const estimatedNeurons = estimateAiQaNeurons(inputTokens, AGENT_QA_OUTPUT_TOKEN_BUDGET, AI_QA_PRIMARY_MODEL);
  const reservation = await reserveAiQaUsage(env, estimatedNeurons);
  if (!reservation.allowed) {
    await env.DB.prepare(`UPDATE ${tables.agentQaReviews} SET ai_status = 'skipped', ai_error = ?, updated_at = ? WHERE id = ?`)
      .bind(`Daily AI QA neuron limit reached (${Math.round(reservation.used)} / ${reservation.limit}).`, nowIso(), reviewId)
      .run();
    return { processed: false, reason: "daily_limit", reservation };
  }

  const startedAt = nowIso();
  await env.DB.prepare(`
    UPDATE ${tables.agentQaReviews}
    SET ai_status = 'running', ai_model = ?, ai_fallback_model = '', ai_error = '', ai_started_at = ?, updated_at = ?
    WHERE id = ?
  `)
    .bind(AI_QA_PRIMARY_MODEL, startedAt, startedAt, reviewId)
    .run();

  let payload;
  let parsed;
  let fallbackModel = "";
  let failed = false;
  try {
    payload = await runAiQaModel(env, AI_QA_PRIMARY_MODEL, messages, false);
    try {
      parsed = normalizeAgentQaResponse(payload);
    } catch (_parseError) {
      fallbackModel = AI_QA_FALLBACK_MODEL;
      payload = await runAiQaModel(env, AI_QA_FALLBACK_MODEL, messages, true);
      parsed = normalizeAgentQaResponse(payload);
    }
    parsed.checks = filterAgentQaChecksByApplicability(parsed.checks, input.transcript);
    parsed.checks = ensureMandatoryAgentQaCommunicationChecks(parsed.checks, input.transcript);
    await saveAgentQaChecks(env, reviewId, parsed.checks, { replaceAi: true });
    const tags = await refreshAgentQaReviewTags(env, reviewId);
    const usage = usageFromAiPayload(payload, inputTokens, AGENT_QA_OUTPUT_TOKEN_BUDGET);
    const actualNeurons = estimateAiQaNeurons(usage.promptTokens, usage.completionTokens, fallbackModel || AI_QA_PRIMARY_MODEL);
    await recordAiQaUsageResult(env, reservation.usageDate, {
      actualNeurons,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
    });
    const completedAt = nowIso();
    await env.DB.prepare(`
      UPDATE ${tables.agentQaReviews}
      SET ai_status = 'completed',
          ai_model = ?,
          ai_fallback_model = ?,
          check_tags_json = ?,
          ai_summary = ?,
          ai_overall_confidence = ?,
          ai_response_json = ?,
          ai_error = '',
          ai_completed_at = ?,
          updated_at = ?
      WHERE id = ?
    `)
      .bind(
        AI_QA_PRIMARY_MODEL,
        fallbackModel,
        jsonText(tags),
        parsed.summary,
        parsed.overallConfidence,
        jsonText(parsed.raw),
        completedAt,
        completedAt,
        reviewId,
      )
      .run();
  } catch (error) {
    failed = true;
    await recordAiQaUsageResult(env, reservation.usageDate, {
      actualNeurons: estimatedNeurons,
      promptTokens: inputTokens,
      completionTokens: 0,
      failed: true,
    });
    await env.DB.prepare(`UPDATE ${tables.agentQaReviews} SET ai_status = 'failed', ai_error = ?, updated_at = ? WHERE id = ?`)
      .bind(truncate(error.message || "Agent QA analysis failed.", 1000), nowIso(), reviewId)
      .run();
  }

  return { processed: !failed, review: await getLivechatAgentQaReview(env, reviewId) };
}

export async function processPendingLivechatAgentQaReviews(env, options = {}) {
  const tables = await ensureLivechatAiQaTables(env);
  const limit = Math.min(Math.max(Number(options.limit) || 5, 1), 25);
  const staleRunningCutoff = new Date(Date.now() - Math.min(Math.max(Number(options.staleRunningMinutes) || 10, 1), 120) * 60 * 1000).toISOString();
  const queuedMissing =
    options.queueMissing === false
      ? { queued: 0, results: [] }
      : await queueMissingLivechatAiQaReviews(env, { limit, sinceHours: options.sinceHours, type: "agent" });
  const where = options.force
    ? "ai_status IN ('pending', 'running', 'failed', 'skipped')"
    : "(ai_status = 'pending' OR (ai_status = 'running' AND updated_at < ?))";
  const rows = await env.DB.prepare(`
    SELECT id FROM ${tables.agentQaReviews}
    WHERE ${where}
    ORDER BY queued_at ASC, created_at ASC
    LIMIT ?
  `)
    .bind(...(options.force ? [] : [staleRunningCutoff]), limit)
    .all();
  const results = [];
  for (const row of rows.results || []) {
    results.push(await processLivechatAgentQaReview(env, row.id, { force: options.force }));
  }
  return { queuedMissing, processed: results.filter((item) => item.processed).length, results };
}

export async function processMissingAgentQaForCompletedAutoTags(env, options = {}) {
  const tables = await ensureLivechatAiQaTables(env);
  const limit = Math.min(Math.max(Number(options.limit) || 30, 1), 50);
  const rows = await env.DB.prepare(`
    SELECT a.chat_id, a.thread_id
    FROM ${tables.reviews} a
    LEFT JOIN ${tables.agentQaReviews} q
      ON q.chat_id = a.chat_id AND q.thread_id = a.thread_id
    WHERE a.ai_status = 'completed' AND q.id IS NULL
    ORDER BY a.ai_completed_at ASC, a.created_at ASC
    LIMIT ?
  `).bind(limit).all();
  const results = [];
  for (const row of rows.results || []) {
    const queued = await queueLivechatAgentQaReviewForChat(env, row.chat_id, row.thread_id);
    const processed =
      queued.reviewId && queued.aiStatus === "pending"
        ? await processLivechatAgentQaReview(env, queued.reviewId)
        : null;
    results.push({ chatId: row.chat_id, threadId: row.thread_id, queued, processed });
  }
  return {
    requested: limit,
    selected: (rows.results || []).length,
    queued: results.filter((item) => item.queued?.queued).length,
    processed: results.filter((item) => item.processed?.processed).length,
    results,
  };
}

export async function listLivechatAgentQaReviews(env, filters = {}) {
  const tables = await ensureLivechatAiQaTables(env);
  const where = [];
  const binds = [];
  if (filters.status) {
    where.push("status = ?");
    binds.push(filters.status);
  }
  if (filters.aiStatus) {
    where.push("ai_status = ?");
    binds.push(filters.aiStatus);
  }
  if (filters.agent) {
    where.push("(agent_label LIKE ? OR agent_ids_json LIKE ?)");
    const value = `%${filters.agent}%`;
    binds.push(value, value);
  }
  if (filters.tag) {
    where.push("check_tags_json LIKE ?");
    binds.push(`%${filters.tag}%`);
  }
  if (filters.chatId) {
    where.push("(chat_id LIKE ? OR thread_id LIKE ?)");
    const value = `%${filters.chatId}%`;
    binds.push(value, value);
  }
  if (filters.assignedTo) {
    where.push("assigned_to = ?");
    binds.push(filters.assignedTo);
  }
  const pageSize = Math.min(Math.max(Number(filters.pageSize) || 25, 1), 100);
  const page = Math.max(Number(filters.page) || 1, 1);
  const offset = (page - 1) * pageSize;
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const countRow = await env.DB.prepare(`SELECT COUNT(*) AS count FROM ${tables.agentQaReviews} ${whereSql}`)
    .bind(...binds)
    .first();
  const rows = await env.DB.prepare(`
    SELECT * FROM ${tables.agentQaReviews}
    ${whereSql}
    ORDER BY updated_at DESC, created_at DESC
    LIMIT ? OFFSET ?
  `)
    .bind(...binds, pageSize, offset)
    .all();
  return {
    rows: (rows.results || []).map((row) => agentQaReviewFromRow(row)),
    page,
    pageSize,
    total: Number(countRow?.count || 0),
  };
}

export async function getLivechatAgentQaReview(env, reviewId) {
  const tables = await ensureLivechatAiQaTables(env);
  const review = await env.DB.prepare(`SELECT * FROM ${tables.agentQaReviews} WHERE id = ?`).bind(reviewId).first();
  if (!review) return null;
  const [checks, feedbackRows] = await Promise.all([
    loadAgentQaChecks(env, reviewId),
    env.DB.prepare(`SELECT * FROM ${tables.agentQaFeedback} WHERE review_id = ? ORDER BY created_at ASC, id ASC`)
      .bind(reviewId)
      .all(),
  ]);
  const reviewData = agentQaReviewFromRow(review, checks);
  const chat = await env.DB.prepare(`SELECT ftr_ms FROM ${tables.chats} WHERE chat_id = ? AND thread_id = ?`)
    .bind(review.chat_id, review.thread_id)
    .first();
  reviewData.ftrMs = chat?.ftr_ms ?? null;
  reviewData.ftrLabel = durationLabel(chat?.ftr_ms);
  reviewData.transcript = await transcriptSnapshotForChat(env, review.chat_id, review.thread_id);
  return {
    ...reviewData,
    feedback: (feedbackRows.results || []).map((row) => ({
      id: row.id,
      ruleKey: row.rule_key,
      tag: row.tag,
      type: row.feedback_type,
      comment: row.comment || "",
      aiTag: row.ai_tag || "",
      finalTag: row.final_tag || "",
      reviewer: row.reviewer || "",
      createdAt: row.created_at,
    })),
  };
}

function normalizeAgentQaDecisionTags(tags, fallbackTags = []) {
  const normalized = visibleAgentQaTags(Array.isArray(tags) && tags.length ? tags : fallbackTags);
  return normalized.length ? normalized : visibleAgentQaTags(fallbackTags);
}

async function applyLivechatAgentQaFinalTags(env, review, tags) {
  const tables = livechatAiQaTables(env);
  const chat = await env.DB.prepare(`SELECT tags_json, system_tags_json FROM ${tables.chats} WHERE chat_id = ? AND thread_id = ?`)
    .bind(review.chat_id, review.thread_id)
    .first();
  const localTags = new Set(unique(parseJson(chat?.tags_json, [])));
  const systemTags = new Set(unique(parseJson(chat?.system_tags_json, [])));
  const applied = [];
  const skipped = [];
  const markedSystem = [];
  for (const tag of visibleAgentQaTags(tags)) {
    if (localTags.has(tag)) {
      if (!systemTags.has(tag)) {
        await applyLocalSystemThreadTag(env, review.chat_id, review.thread_id, tag);
        systemTags.add(tag);
        markedSystem.push(tag);
      }
      skipped.push({ tag, reason: "already_present", systemTagged: true });
      continue;
    }
    await livechatAgentChatRequest(env, "tag_thread", {
      chat_id: review.chat_id,
      thread_id: review.thread_id,
      tag,
    });
    await applyLocalSystemThreadTag(env, review.chat_id, review.thread_id, tag);
    localTags.add(tag);
    systemTags.add(tag);
    applied.push(tag);
  }
  return { applied, skipped, markedSystem, systemTags: [...systemTags] };
}

async function insertAgentQaFeedback(env, review, checks, feedback, finalTags, reviewer) {
  const tables = livechatAiQaTables(env);
  const finalTagSet = new Set(finalTags);
  const checkByRule = new Map(checks.map((check) => [check.ruleKey, check]));
  const now = nowIso();
  for (const item of Array.isArray(feedback) ? feedback : []) {
    const finalTag = canonicalAgentQaTag(item?.finalTag || item?.final_tag || item?.tag);
    const aiTag = canonicalAgentQaTag(item?.aiTag || item?.ai_tag || "");
    const tag = finalTag || aiTag || canonicalAgentQaTag(item?.tag);
    if (!tag) continue;
    const ruleKey = text(item?.ruleKey || item?.rule_key || agentQaRuleKeyForTag(tag));
    const sourceCheck = checkByRule.get(ruleKey);
    const feedbackType = text(
      item?.type ||
        item?.feedbackType ||
        (finalTag && sourceCheck?.selectedTag && finalTag !== sourceCheck.selectedTag ? "corrected_tag" : "comment"),
    );
    const comment = truncate(item?.comment, 1200);
    const result = await env.DB.prepare(`
      INSERT INTO ${tables.agentQaFeedback}
        (review_id, rule_key, tag, feedback_type, comment, ai_tag, final_tag, reviewer, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        review.id,
        ruleKey,
        tag,
        feedbackType || "comment",
        comment,
        aiTag || sourceCheck?.selectedTag || "",
        finalTag || (finalTagSet.has(tag) ? tag : ""),
        reviewer,
        now,
      )
      .run();
    if (comment) {
      await env.DB.prepare(`
        INSERT INTO ${tables.agentQaKnowledgeBase}
          (rule_key, tag, entry_type, polarity, content, example_chat_id, example_thread_id,
           source_review_id, source_feedback_id, status, created_by, created_at, updated_at)
        VALUES (?, ?, 'correction', ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
      `)
        .bind(
          ruleKey,
          tag,
          finalTagSet.has(tag) ? "positive" : "negative",
          comment,
          review.chat_id,
          review.thread_id,
          review.id,
          result.meta?.last_row_id || null,
          reviewer,
          now,
          now,
        )
        .run();
    }
  }
}

export async function decideLivechatAgentQaReview(env, reviewId, decision = {}) {
  const tables = await ensureLivechatAiQaTables(env);
  const management = await import("./livechat-ai-qa-management.js");
  await management.ensureLivechatAiQaManagementTables(env);
  const review = await env.DB.prepare(`SELECT * FROM ${tables.agentQaReviews} WHERE id = ?`).bind(reviewId).first();
  if (!review) return { decided: false, reason: "not_found" };

  const checks = await loadAgentQaChecks(env, reviewId);
  const suggestedTags = agentQaCheckTags(checks);
  const action = text(decision.action).toLowerCase();
  const isApprove = action === "approve";
  const isCorrect = ["correct", "decline", "decline_apply", "decline_and_apply"].includes(action);
  if (!isApprove && !isCorrect) {
    return { decided: false, reason: "unsupported_action" };
  }

  const finalTags = normalizeAgentQaDecisionTags(
    decision.finalTags || decision.final_tags || decision.correctTags || decision.correct_tags,
    isApprove ? suggestedTags : [],
  );
  if (!finalTags.length) {
    return { decided: false, reason: "missing_final_tags" };
  }
  if (isApprove && JSON.stringify([...finalTags].sort()) !== JSON.stringify([...suggestedTags].sort())) {
    return { decided: false, reason: "changed_review_requires_correction" };
  }

  const reviewer = text(decision.reviewer || "qa");
  const applyToLiveChat = decision.applyToLiveChat !== false && decision.apply_to_livechat !== false;
  let applyResult = { applied: [], skipped: [], markedSystem: [], systemTags: parseJson(review.system_tags_json, []) };
  if (applyToLiveChat) {
    applyResult = await applyLivechatAgentQaFinalTags(env, review, finalTags);
  }
  if (isCorrect) {
    await insertAgentQaFeedback(env, review, checks, decision.feedback, finalTags, reviewer);
  }

  const now = nowIso();
  const previousTags = parseJson(review.final_tags_json, []);
  const previousStatus = review.status || "";
  const historyAction = ["approved", "corrected"].includes(previousStatus)
    ? "edited"
    : isApprove
      ? "approved"
      : "corrected";
  await env.DB.prepare(`
    UPDATE ${tables.agentQaReviews}
    SET status = ?,
        reviewed_at = ?,
        reviewer = ?,
        final_tags_json = ?,
        decision_note = ?,
        livechat_tags_applied_at = ?,
        system_tags_json = ?,
        completed_by = ?,
        updated_at = ?
    WHERE id = ?
  `)
    .bind(
      isApprove ? "approved" : "corrected",
      now,
      reviewer,
      jsonText(finalTags),
      truncate(decision.note || decision.decisionNote, 1200),
      applyToLiveChat ? now : "",
      jsonText(applyResult.systemTags || parseJson(review.system_tags_json, [])),
      reviewer,
      now,
      reviewId,
    )
    .run();
  await management.recordLivechatAiQaDecisionHistory(env, {
    reviewType: "agent_qa",
    reviewId,
    chatId: review.chat_id,
    threadId: review.thread_id,
    action: historyAction,
    previousStatus,
    newStatus: isApprove ? "approved" : "corrected",
    previousResult: previousTags,
    newResult: finalTags,
    reviewer,
    note: decision.note || decision.decisionNote,
  });
  await management.refillConfiguredLivechatAiQaQueue(env, review.assigned_to || reviewer, "agent_qa");

  return {
    decided: true,
    status: isApprove ? "approved" : "corrected",
    finalTags,
    applyResult,
    review: await getLivechatAgentQaReview(env, reviewId),
  };
}

function agentQaTagOutcome(tag) {
  const value = canonicalAgentQaTag(tag);
  if (!value) return "ignored";
  if (["q0x", "q0l"].includes(value)) return "not_rateable";
  if (value === "q0m") return "manual";
  if (value.endsWith("a")) return "passed";
  if (value.endsWith("b")) return "failed";
  return "ignored";
}

export async function getLivechatAgentQaLeaderboard(env, filters = {}) {
  const tables = await ensureLivechatAiQaTables(env);
  const where = ["status IN ('approved', 'corrected')"];
  const binds = [];
  if (filters.from) {
    where.push("reviewed_at >= ?");
    binds.push(filters.from);
  }
  if (filters.to) {
    where.push("reviewed_at <= ?");
    binds.push(filters.to);
  }
  if (filters.agent) {
    where.push("(agent_label LIKE ? OR agent_ids_json LIKE ?)");
    const value = `%${filters.agent}%`;
    binds.push(value, value);
  }
  const rows = await env.DB.prepare(`
    SELECT agent_label, agent_ids_json, final_tags_json, check_tags_json, status, reviewed_at
    FROM ${tables.agentQaReviews}
    WHERE ${where.join(" AND ")}
    ORDER BY reviewed_at DESC, updated_at DESC
    LIMIT 5000
  `)
    .bind(...binds)
    .all();

  const agents = new Map();
  for (const row of rows.results || []) {
    const agentLabel = text(row.agent_label) || unique(parseJson(row.agent_ids_json, [])).join(", ") || "Unknown agent";
    const current =
      agents.get(agentLabel) || {
        agent: agentLabel,
        reviews: 0,
        passed: 0,
        failed: 0,
        manual: 0,
        notRateable: 0,
        tags: {},
        lastReviewedAt: "",
      };
    current.reviews += 1;
    current.lastReviewedAt = current.lastReviewedAt || row.reviewed_at || "";
    const tags = visibleAgentQaTags(
      unique(parseJson(row.final_tags_json, [])).length
        ? unique(parseJson(row.final_tags_json, []))
        : unique(parseJson(row.check_tags_json, [])),
    );
    for (const tag of tags) {
      const outcome = agentQaTagOutcome(tag);
      current.tags[tag] = (current.tags[tag] || 0) + 1;
      if (outcome === "passed") current.passed += 1;
      if (outcome === "failed") current.failed += 1;
      if (outcome === "manual") current.manual += 1;
      if (outcome === "not_rateable") current.notRateable += 1;
    }
    agents.set(agentLabel, current);
  }

  const leaderboard = [...agents.values()]
    .map((row) => {
      const rated = row.passed + row.failed;
      return {
        ...row,
        rated,
        score: rated ? Math.round((row.passed / rated) * 1000) / 10 : null,
      };
    })
    .sort((a, b) => {
      const scoreDiff = (b.score ?? -1) - (a.score ?? -1);
      if (scoreDiff) return scoreDiff;
      return b.rated - a.rated || b.reviews - a.reviews || a.agent.localeCompare(b.agent);
    });

  return {
    rows: leaderboard,
    total: leaderboard.length,
    reviewedCount: (rows.results || []).length,
  };
}

async function ensureChat(env, body, receivedAt) {
  const tables = livechatAiQaTables(env);
  const payload = body.payload || {};
  const chatId = chatIdFromPayload(payload);
  const threadId = threadIdFromPayload(payload);
  await env.DB.prepare(`
    INSERT INTO ${tables.chats}
      (chat_id, thread_id, organization_id, first_seen_at, last_event_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(chat_id, thread_id) DO UPDATE SET
      organization_id = COALESCE(NULLIF(excluded.organization_id, ''), organization_id),
      first_seen_at = COALESCE(first_seen_at, excluded.first_seen_at),
      last_event_at = CASE
        WHEN last_event_at IS NULL OR excluded.last_event_at > last_event_at
        THEN excluded.last_event_at
        ELSE last_event_at
      END,
      updated_at = excluded.updated_at
  `)
    .bind(chatId, threadId, text(body.organization_id), receivedAt, eventDate(body.action, payload, receivedAt), receivedAt, receivedAt)
    .run();
}

async function insertEvent(env, body, receivedAt, normalized) {
  const tables = livechatAiQaTables(env);
  const payload = body.payload || {};
  const result = await env.DB.prepare(`
    INSERT OR IGNORE INTO ${tables.events}
      (event_key, webhook_id, action, organization_id, chat_id, thread_id, event_id, event_at, actor_type, actor_id,
       event_type, message_text, tag, transfer_reason, transfer_to_json, queue_json, language_signal_json, raw_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      eventKeyForWebhook(body),
      text(body.webhook_id),
      text(body.action),
      text(body.organization_id),
      chatIdFromPayload(payload),
      threadIdFromPayload(payload),
      normalized.eventId || "",
      normalized.eventAt || receivedAt,
      normalized.actorType || "",
      normalized.actorId || "",
      normalized.eventType || "",
      normalized.messageText || "",
      normalized.tag || "",
      normalized.transferReason || "",
      normalized.transferToJson || "",
      normalized.queueJson || "",
      normalized.languageSignalJson || "",
      JSON.stringify(body),
      receivedAt,
    )
    .run();
  return Number(result.meta?.changes || 0) > 0;
}

async function refreshChatMetrics(env, chatId, threadId) {
  const tables = livechatAiQaTables(env);
  const chat = await env.DB.prepare(`SELECT * FROM ${tables.chats} WHERE chat_id = ? AND thread_id = ?`)
    .bind(chatId, threadId)
    .first();
  if (!chat) return;

  const firstAgent = await env.DB.prepare(`
    SELECT event_at FROM ${tables.events}
    WHERE chat_id = ? AND thread_id = ? AND actor_type = 'agent' AND message_text <> ''
    ORDER BY event_at ASC
    LIMIT 1
  `)
    .bind(chatId, threadId)
    .first();

  const transferredAt = chat.agent_transferred_at || chat.transferred_at || null;
  const ftrMs = transferredAt && firstAgent?.event_at ? diffMs(transferredAt, firstAgent.event_at) : null;
  const chtMs = transferredAt && chat.deactivated_at ? diffMs(transferredAt, chat.deactivated_at) : null;
  const queueWaitMs =
    chat.queued_at && chat.agent_transferred_at
      ? diffMs(chat.queued_at, chat.agent_transferred_at)
      : chat.queue_wait_ms ?? null;

  await env.DB.prepare(`
    UPDATE ${tables.chats}
    SET ftr_ms = ?, cht_ms = ?, queue_wait_ms = ?, updated_at = ?
    WHERE chat_id = ? AND thread_id = ?
  `)
    .bind(ftrMs, chtMs, queueWaitMs, nowIso(), chatId, threadId)
    .run();

  return {
    ...chat,
    ftr_ms: ftrMs,
    cht_ms: chtMs,
    queue_wait_ms: queueWaitMs,
  };
}

function ftrQualityTag(ftrMs) {
  if (ftrMs === null || ftrMs === undefined || ftrMs === "") return "";
  const value = Number(ftrMs);
  if (!Number.isFinite(value) || value < 0) return "";
  return value <= FTR_QA_THRESHOLD_MS ? FAST_FTR_TAG : SLOW_FTR_TAG;
}

async function applyLocalSystemThreadTag(env, chatId, threadId, tag) {
  const tables = livechatAiQaTables(env);
  const row = await env.DB.prepare(`SELECT tags_json, system_tags_json FROM ${tables.chats} WHERE chat_id = ? AND thread_id = ?`)
    .bind(chatId, threadId)
    .first();
  const tags = unique([...parseJson(row?.tags_json, []), tag]);
  const systemTags = unique([...parseJson(row?.system_tags_json, []), tag]);
  await env.DB.prepare(`
    UPDATE ${tables.chats}
    SET tags_json = ?, system_tags_json = ?, updated_at = ?
    WHERE chat_id = ? AND thread_id = ?
  `)
    .bind(jsonText(tags), jsonText(systemTags), nowIso(), chatId, threadId)
    .run();
}

async function tagThreadByFtr(env, chat) {
  const chatId = text(chat?.chat_id);
  const threadId = text(chat?.thread_id);
  const tag = ftrQualityTag(chat?.ftr_ms);
  if (!chatId || !threadId || !tag) return { tagged: false, reason: "missing_ftr" };
  if (!chat?.deactivated_at) return { tagged: false, tag, reason: "chat_not_ended" };

  const existingSystemTags = unique(parseJson(chat.system_tags_json, []));
  if (existingSystemTags.includes(tag)) {
    return { tagged: false, tag, reason: "already_tagged" };
  }

  await livechatAgentChatRequest(env, "tag_thread", {
    chat_id: chatId,
    thread_id: threadId,
    tag,
  });
  await applyLocalSystemThreadTag(env, chatId, threadId, tag);
  return { tagged: true, tag };
}

export async function tagLivechatThreadByFtrForChat(env, chatId, threadId) {
  const tables = await ensureLivechatAiQaTables(env);
  const chat = await env.DB.prepare(`SELECT * FROM ${tables.chats} WHERE chat_id = ? AND thread_id = ?`)
    .bind(chatId, threadId)
    .first();
  if (!chat) return { tagged: false, reason: "chat_not_found" };
  return tagThreadByFtr(env, chat);
}

async function applyChatTransferred(env, body, receivedAt) {
  const tables = livechatAiQaTables(env);
  const payload = body.payload || {};
  const chatId = chatIdFromPayload(payload);
  const threadId = threadIdFromPayload(payload);
  const eventAt = receivedAt;
  const agentIds = unique(payload.transferred_to?.agent_ids || []);
  const groupIds = unique(payload.transferred_to?.group_ids || []);
  const hasAgent = agentIds.length > 0;
  const reason = text(payload.reason);
  const queueJson = payload.queue ? jsonText(payload.queue) : null;
  const fallbackQueuedAt = text(payload.queue?.queued_at);

  await insertEvent(env, body, receivedAt, {
    eventAt,
    eventType: payload.queue ? "queued" : hasAgent ? "transfer_to_agent" : "transfer",
    messageText: hasAgent ? `Transferred to ${agentIds.join(", ")}` : "Chat transferred",
    transferReason: reason,
    transferToJson: jsonText(payload.transferred_to || {}),
    queueJson,
  });

  await env.DB.prepare(`
    UPDATE ${tables.chats}
    SET
      transferred_to_agent = CASE WHEN ? THEN 1 ELSE transferred_to_agent END,
      transfer_reason = COALESCE(NULLIF(?, ''), transfer_reason),
      transferred_to_agent_ids_json = CASE WHEN ? THEN ? ELSE transferred_to_agent_ids_json END,
      transferred_to_group_ids_json = CASE WHEN ? THEN ? ELSE transferred_to_group_ids_json END,
      agent_ids_json = CASE WHEN ? THEN ? ELSE agent_ids_json END,
      agent_label = CASE WHEN ? THEN ? ELSE agent_label END,
      transfer_queue_json = COALESCE(?, transfer_queue_json),
      queued_at = CASE WHEN ? THEN COALESCE(queued_at, ?) ELSE queued_at END,
      transferred_at = COALESCE(transferred_at, ?),
      agent_transferred_at = CASE WHEN ? THEN COALESCE(agent_transferred_at, ?) ELSE agent_transferred_at END,
      updated_at = ?
    WHERE chat_id = ? AND thread_id = ?
  `)
    .bind(
      hasAgent ? 1 : 0,
      reason,
      hasAgent ? 1 : 0,
      jsonText(agentIds),
      groupIds.length ? 1 : 0,
      jsonText(groupIds),
      hasAgent ? 1 : 0,
      jsonText(agentIds),
      hasAgent ? 1 : 0,
      agentIds.join(", "),
      queueJson,
      fallbackQueuedAt ? 1 : 0,
      fallbackQueuedAt,
      eventAt,
      hasAgent ? 1 : 0,
      eventAt,
      receivedAt,
      chatId,
      threadId,
    )
    .run();
}

async function applyIncomingChat(env, body, receivedAt) {
  const tables = livechatAiQaTables(env);
  const payload = body.payload || {};
  const chat = payload.chat || {};
  const thread = threadFromIncomingChat(payload);
  const chatId = chatIdFromPayload(payload);
  const threadId = threadIdFromPayload(payload);
  const eventAt = thread.created_at || chat.created_at || receivedAt;

  await insertEvent(env, body, receivedAt, {
    eventAt,
    actorType: "system",
    eventType: "incoming_chat",
    messageText: "Incoming chat started",
  });

  const threadTags = unique(thread.tags || []);
  if (threadTags.length) {
    const row = await env.DB.prepare(`SELECT tags_json FROM ${tables.chats} WHERE chat_id = ? AND thread_id = ?`)
      .bind(chatId, threadId)
      .first();
    const tags = unique([...parseJson(row?.tags_json, []), ...threadTags]);
    await env.DB.prepare(`UPDATE ${tables.chats} SET tags_json = ?, updated_at = ? WHERE chat_id = ? AND thread_id = ?`)
      .bind(jsonText(tags), receivedAt, chatId, threadId)
      .run();
  }

  for (const event of thread.events || []) {
    await applyIncomingEvent(
      env,
      {
        ...body,
        action: "incoming_event",
        payload: {
          chat_id: chatId,
          thread_id: threadId,
          event,
        },
      },
      receivedAt,
    );
  }
}

async function applyThreadTagged(env, body, receivedAt) {
  const tables = livechatAiQaTables(env);
  const payload = body.payload || {};
  const chatId = chatIdFromPayload(payload);
  const threadId = threadIdFromPayload(payload);
  const tag = text(payload.tag);
  await insertEvent(env, body, receivedAt, {
    eventAt: eventDate(body.action, payload, receivedAt),
    eventType: "tag_added",
    messageText: tag ? `Tag added: ${tag}` : "Tag added",
    tag,
  });
  const row = await env.DB.prepare(`SELECT tags_json FROM ${tables.chats} WHERE chat_id = ? AND thread_id = ?`)
    .bind(chatId, threadId)
    .first();
  const tags = unique([...parseJson(row?.tags_json, []), tag]);
  await env.DB.prepare(`UPDATE ${tables.chats} SET tags_json = ?, updated_at = ? WHERE chat_id = ? AND thread_id = ?`)
    .bind(jsonText(tags), receivedAt, chatId, threadId)
    .run();
}

async function applyIncomingEvent(env, body, receivedAt) {
  const tables = livechatAiQaTables(env);
  const payload = body.payload || {};
  const event = payload.event || {};
  const chatId = chatIdFromPayload(payload);
  const threadId = threadIdFromPayload(payload);
  const actorType = actorTypeForIncomingEvent(event);
  const languageSignal = parseTranslationSignal(event);
  const queueStarted = isQueueStartSystemEvent(event);
  const noTransferReason = noTransferReasonForEvent(event);
  const inserted = await insertEvent(env, body, receivedAt, {
    eventId: text(event.id),
    eventAt: eventDate(body.action, payload, receivedAt),
    actorType,
    actorId: text(event.author_id),
    eventType: queueStarted ? "queue_started" : text(event.system_message_type || event.type),
    messageText: messageTextForEvent(event),
    languageSignalJson: languageSignal ? jsonText(languageSignal) : "",
  });
  if (!inserted) return;

  if (noTransferReason) {
    await env.DB.prepare(`
      UPDATE ${tables.chats}
      SET transfer_reason = COALESCE(NULLIF(transfer_reason, ''), ?),
          updated_at = ?
      WHERE chat_id = ? AND thread_id = ? AND transferred_to_agent = 0
    `)
      .bind(noTransferReason, receivedAt, chatId, threadId)
      .run();
  }

  if (queueStarted) {
    await env.DB.prepare(`
      UPDATE ${tables.chats}
      SET queued_at = COALESCE(queued_at, ?),
          updated_at = ?
      WHERE chat_id = ? AND thread_id = ?
    `)
      .bind(eventDate(body.action, payload, receivedAt), receivedAt, chatId, threadId)
      .run();
  }

  if (actorType === "agent" && isAgentId(event.author_id)) {
    const current = await env.DB.prepare(`SELECT agent_ids_json, agent_label FROM ${tables.chats} WHERE chat_id = ? AND thread_id = ?`)
      .bind(chatId, threadId)
      .first();
    const agentIds = unique([...parseJson(current?.agent_ids_json, []), text(event.author_id)]);
    await env.DB.prepare(`
      UPDATE ${tables.chats}
      SET agent_ids_json = ?, agent_label = COALESCE(NULLIF(agent_label, ''), ?), updated_at = ?
      WHERE chat_id = ? AND thread_id = ?
    `)
      .bind(jsonText(agentIds), agentIds.join(", "), receivedAt, chatId, threadId)
      .run();
  }

  if (languageSignal) {
    await env.DB.prepare(`
      UPDATE ${tables.chats}
      SET customer_language = COALESCE(NULLIF(?, ''), customer_language),
          chatbot_language = COALESCE(NULLIF(?, ''), chatbot_language),
          translation_from = COALESCE(NULLIF(?, ''), translation_from),
          translation_to = COALESCE(NULLIF(?, ''), translation_to),
          language_source = ?,
          updated_at = ?
      WHERE chat_id = ? AND thread_id = ?
    `)
      .bind(
        languageSignal.customerLanguage || "",
        languageSignal.chatbotLanguage || "",
        languageSignal.translationFrom || "",
        languageSignal.translationTo || "",
        "system_message",
        receivedAt,
        chatId,
        threadId,
      )
      .run();
  }
}

async function applyChatDeactivated(env, body, receivedAt) {
  const tables = livechatAiQaTables(env);
  const payload = body.payload || {};
  const chatId = chatIdFromPayload(payload);
  const threadId = threadIdFromPayload(payload);
  const eventAt = eventDate(body.action, payload, receivedAt);
  await insertEvent(env, body, receivedAt, {
    eventAt,
    eventType: "chat_deactivated",
    messageText: "Chat deactivated",
  });
  await env.DB.prepare(`
    UPDATE ${tables.chats}
    SET deactivated_at = COALESCE(deactivated_at, ?),
        transfer_reason = CASE
          WHEN transferred_to_agent = 0 THEN COALESCE(NULLIF(transfer_reason, ''), 'chat_deactivated')
          ELSE transfer_reason
        END,
        updated_at = ?
    WHERE chat_id = ? AND thread_id = ?
  `)
    .bind(eventAt, receivedAt, chatId, threadId)
    .run();
}

export async function recordLivechatAiQaWebhook(env, body, options = {}) {
  if (!VALID_ACTIONS.has(text(body.action))) {
    return { recorded: false, ignored: true, reason: "unsupported_action" };
  }
  const payload = body.payload || {};
  const chatId = chatIdFromPayload(payload);
  const threadId = threadIdFromPayload(payload);
  if (!chatId || !threadId) {
    return { recorded: false, ignored: true, reason: "missing_chat_or_thread" };
  }

  const receivedAt = nowIso();
  await ensureLivechatAiQaTables(env);
  await ensureChat(env, body, receivedAt);

  if (body.action === "incoming_chat") {
    await applyIncomingChat(env, body, receivedAt);
  } else if (body.action === "chat_transferred") {
    await applyChatTransferred(env, body, receivedAt);
  } else if (body.action === "thread_tagged") {
    await applyThreadTagged(env, body, receivedAt);
  } else if (body.action === "incoming_event") {
    await applyIncomingEvent(env, body, receivedAt);
  } else if (body.action === "chat_deactivated") {
    await applyChatDeactivated(env, body, receivedAt);
  }

  const chat = await refreshChatMetrics(env, chatId, threadId);
  let ftrTag = { tagged: false, reason: "not_attempted" };
  let aiReview = { queued: false, reason: "not_attempted" };
  let agentQaReview = { queued: false, reason: "not_attempted" };
  const processQueuedReviews = options.processQueuedReviews === true;
  const tagFtr = options.tagFtr !== false;
  if (chat?.deactivated_at) {
    try {
      aiReview = await queueLivechatAiQaReviewForChat(env, chatId, threadId);
      if (processQueuedReviews && aiReview.reviewId && aiReview.aiStatus === "pending") {
        const processTask = processLivechatAiQaReview(env, aiReview.reviewId).catch((error) => {
          console.error("Failed to process LiveChat AI QA review.", {
            chatId,
            threadId,
            reviewId: aiReview.reviewId,
            message: error.message,
          });
        });
        if (typeof options.waitUntil === "function") {
          options.waitUntil(processTask);
        } else {
          await processTask;
        }
      }
    } catch (error) {
      console.error("Failed to queue LiveChat AI QA review.", {
        chatId,
        threadId,
        message: error.message,
      });
      aiReview = { queued: false, reason: "queue_failed", error: error.message };
    }
    try {
      agentQaReview = await queueLivechatAgentQaReviewForChat(env, chatId, threadId);
      if (processQueuedReviews && agentQaReview.reviewId && agentQaReview.aiStatus === "pending") {
        const processTask = processLivechatAgentQaReview(env, agentQaReview.reviewId).catch((error) => {
          console.error("Failed to process LiveChat agent QA review.", {
            chatId,
            threadId,
            reviewId: agentQaReview.reviewId,
            message: error.message,
          });
        });
        if (typeof options.waitUntil === "function") {
          options.waitUntil(processTask);
        } else {
          await processTask;
        }
      }
    } catch (error) {
      console.error("Failed to queue LiveChat agent QA review.", {
        chatId,
        threadId,
        message: error.message,
      });
      agentQaReview = { queued: false, reason: "queue_failed", error: error.message };
    }
    if (tagFtr) {
      try {
        ftrTag = await tagThreadByFtr(env, chat);
      } catch (error) {
        console.error("Failed to tag LiveChat thread by FTR.", {
          chatId,
          threadId,
          message: error.message,
          status: error.status,
          payload: error.payload,
        });
        ftrTag = { tagged: false, reason: "tag_failed", error: error.message };
      }
    }
  }
  return { recorded: true, chatId, threadId, ftrTag, aiReview, agentQaReview };
}

function durationLabel(ms) {
  const value = Number(ms);
  if (!Number.isFinite(value) || value < 0) return "";
  const seconds = Math.round(value / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours) return `${hours}h ${minutes}m ${rest}s`;
  if (minutes) return `${minutes}m ${rest}s`;
  return `${rest}s`;
}

function chatRow(row, events = []) {
  const tags = parseJson(row.tags_json, []);
  const systemTags = parseJson(row.system_tags_json, []);
  const agentIds = parseJson(row.agent_ids_json, []);
  const transferAgentIds = parseJson(row.transferred_to_agent_ids_json, []);
  const transferredToAgent = Boolean(row.transferred_to_agent);
  const noTransferReason = !transferredToAgent
    ? (events || []).find((event) => NO_TRANSFER_REASON_EVENT_TYPES.has(event.event_type))?.event_type || ""
    : "";
  return {
    chatId: row.chat_id,
    threadId: row.thread_id,
    organizationId: row.organization_id || "",
    firstSeenAt: row.first_seen_at || "",
    lastEventAt: row.last_event_at || "",
    agentIds,
    agentLabel: row.agent_label || agentIds.join(", "),
    transferredToAgent,
    transferReason: row.transfer_reason || noTransferReason,
    transferAgentIds,
    transferGroupIds: parseJson(row.transferred_to_group_ids_json, []),
    queue: parseJson(row.transfer_queue_json, null),
    queuedAt: row.queued_at || "",
    agentTransferredAt: row.agent_transferred_at || "",
    queueWaitMs: row.queue_wait_ms,
    queueWaitLabel: durationLabel(row.queue_wait_ms),
    transferredAt: row.transferred_at || "",
    deactivatedAt: row.deactivated_at || "",
    ftrMs: row.ftr_ms,
    ftrLabel: durationLabel(row.ftr_ms),
    chtMs: row.cht_ms,
    chtLabel: durationLabel(row.cht_ms),
    customerLanguage: row.customer_language || "",
    chatbotLanguage: row.chatbot_language || "",
    translationFrom: row.translation_from || "",
    translationTo: row.translation_to || "",
    languageSource: row.language_source || "",
    tags,
    tagsLabel: tags.join(", "),
    systemTags,
    systemTagsLabel: systemTags.join(", "),
    events: events.map(eventRow),
  };
}

function eventRow(row) {
  const rawEvent = rawEventFromRow(row);
  return {
    key: row.event_key,
    webhookId: row.webhook_id || "",
    action: row.action,
    chatId: row.chat_id,
    threadId: row.thread_id,
    eventId: row.event_id || "",
    eventAt: row.event_at,
    actorType: rawEvent ? actorTypeForIncomingEvent(rawEvent) : row.actor_type || "",
    actorId: text(rawEvent?.author_id) || row.actor_id || "",
    eventType: row.event_type || "",
    messageText: row.message_text || "",
    tag: row.tag || "",
    transferReason: row.transfer_reason || "",
    transferTo: parseJson(row.transfer_to_json, null),
    queue: parseJson(row.queue_json, null),
    languageSignal: parseJson(row.language_signal_json, null),
  };
}

export async function listLivechatAiQaChats(env, filters = {}) {
  const tables = await ensureLivechatAiQaTables(env);
  const where = [];
  const binds = [];
  if (filters.from) {
    where.push("last_event_at >= ?");
    binds.push(filters.from);
  }
  if (filters.to) {
    where.push("last_event_at <= ?");
    binds.push(filters.to);
  }
  if (filters.agent) {
    where.push("(agent_label LIKE ? OR agent_ids_json LIKE ? OR transferred_to_agent_ids_json LIKE ?)");
    const value = `%${filters.agent}%`;
    binds.push(value, value, value);
  }
  if (filters.tag) {
    where.push("tags_json LIKE ?");
    binds.push(`%${filters.tag}%`);
  }
  if (filters.chatId) {
    where.push("(chat_id LIKE ? OR thread_id LIKE ?)");
    const value = `%${filters.chatId}%`;
    binds.push(value, value);
  }
  if (filters.transferred === "yes") where.push("transferred_to_agent = 1");
  if (filters.transferred === "no") where.push("transferred_to_agent = 0");
  if (filters.reason) {
    where.push(`(
      transfer_reason = ?
      OR (
        transferred_to_agent = 0
        AND EXISTS (
          SELECT 1 FROM ${tables.events}
          WHERE ${tables.events}.chat_id = ${tables.chats}.chat_id
            AND ${tables.events}.thread_id = ${tables.chats}.thread_id
            AND ${tables.events}.event_type = ?
        )
      )
    )`);
    binds.push(filters.reason, filters.reason);
  }
  if (filters.hasQueue === "yes") where.push("queued_at IS NOT NULL");
  if (filters.hasQueue === "no") where.push("queued_at IS NULL");
  if (filters.customerLanguage) {
    where.push("customer_language LIKE ?");
    binds.push(`%${filters.customerLanguage}%`);
  }
  if (filters.chatbotLanguage) {
    where.push("chatbot_language LIKE ?");
    binds.push(`%${filters.chatbotLanguage}%`);
  }

  const sortMap = {
    date: "last_event_at",
    agent: "agent_label",
    transferred: "transferred_to_agent",
    reason: "transfer_reason",
    queue: "queue_wait_ms",
    ftr: "ftr_ms",
    cht: "cht_ms",
    customerLanguage: "customer_language",
    chatbotLanguage: "chatbot_language",
    tags: "tags_json",
    systemTags: "system_tags_json",
    ended: "deactivated_at",
  };
  const sortColumn = sortMap[filters.sort] || "last_event_at";
  const order = filters.order === "asc" ? "ASC" : "DESC";
  const pageSize = Math.min(Math.max(Number(filters.pageSize) || 50, 1), 200);
  const page = Math.max(Number(filters.page) || 1, 1);
  const offset = (page - 1) * pageSize;
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countRow = await env.DB.prepare(`SELECT COUNT(*) AS count FROM ${tables.chats} ${whereSql}`).bind(...binds).first();
  const rows = await env.DB.prepare(`
    SELECT * FROM ${tables.chats}
    ${whereSql}
    ORDER BY ${sortColumn} ${order}, chat_id ASC
    LIMIT ? OFFSET ?
  `)
    .bind(...binds, pageSize, offset)
    .all();

  const events = [];
  const chatKeys = (rows.results || []).map((row) => [row.chat_id, row.thread_id]);
  for (const [chatId, threadId] of chatKeys) {
    const eventRows = await env.DB.prepare(`
      SELECT * FROM ${tables.events}
      WHERE chat_id = ? AND thread_id = ?
      ORDER BY event_at ASC, event_id ASC, event_key ASC
    `)
      .bind(chatId, threadId)
      .all();
    events.push([`${chatId}:${threadId}`, eventRows.results || []]);
  }
  const eventsByChat = new Map(events);

  return {
    rows: (rows.results || []).map((row) => chatRow(row, eventsByChat.get(`${row.chat_id}:${row.thread_id}`) || [])),
    page,
    pageSize,
    total: Number(countRow?.count || 0),
  };
}
