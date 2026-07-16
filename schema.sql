CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  actor TEXT NOT NULL,
  area TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  status TEXT NOT NULL,
  details TEXT,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs (created_at DESC);

CREATE TABLE IF NOT EXISTS helpdesk_workflows (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  config_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS helpdesk_webhook_daily_stats (
  stat_date TEXT PRIMARY KEY,
  webhooks_received INTEGER NOT NULL DEFAULT 0,
  workflow_runs INTEGER NOT NULL DEFAULT 0,
  tickets_solved INTEGER NOT NULL DEFAULT 0,
  tickets_auto_replied INTEGER NOT NULL DEFAULT 0,
  tickets_merged INTEGER NOT NULL DEFAULT 0,
  actions_count INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS helpdesk_open_ticket_snapshots (
  snapshot_date TEXT PRIMARY KEY,
  open_ticket_count INTEGER NOT NULL DEFAULT 0,
  captured_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_helpdesk_open_ticket_snapshots_captured ON helpdesk_open_ticket_snapshots (captured_at DESC);

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT,
  totp_secret TEXT,
  totp_enabled INTEGER NOT NULL DEFAULT 0,
  totp_setup_required INTEGER NOT NULL DEFAULT 1,
  password_reset_required INTEGER NOT NULL DEFAULT 0,
  totp_reset_at TEXT,
  totp_reset_by TEXT,
  totp_failed_attempts INTEGER NOT NULL DEFAULT 0,
  totp_first_failed_at TEXT,
  totp_locked_until TEXT,
  can_manage_users INTEGER NOT NULL DEFAULT 0,
  can_manage_admins INTEGER NOT NULL DEFAULT 0,
  user_role TEXT NOT NULL DEFAULT 'admin',
  access_level TEXT NOT NULL DEFAULT 'full',
  first_name TEXT,
  last_name TEXT,
  invite_email TEXT,
  invite_slack_user_id TEXT,
  invite_token_hash TEXT,
  invite_expires_at TEXT,
  invite_accepted_at TEXT,
  disabled_at TEXT,
  disabled_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users (username);

CREATE TABLE IF NOT EXISTS admin_login_rate_limits (
  key TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  identifier_hash TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  first_failed_at TEXT,
  locked_until TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_login_rate_limits_updated_at ON admin_login_rate_limits (updated_at);

CREATE TABLE IF NOT EXISTS analytics_agent_daily (
  date TEXT NOT NULL,
  agent_key TEXT NOT NULL,
  agent_id TEXT,
  agent_email TEXT,
  agent_name TEXT,
  chats_count INTEGER NOT NULL DEFAULT 0,
  avg_ftr_ms INTEGER,
  avg_csat REAL,
  rated_good INTEGER NOT NULL DEFAULT 0,
  rated_bad INTEGER NOT NULL DEFAULT 0,
  fetched_at TEXT NOT NULL,
  PRIMARY KEY (date, agent_key)
);

CREATE TABLE IF NOT EXISTS helpdesk_analytics_daily_v7 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  agent_name TEXT,
  agent_email TEXT,
  handled_tickets INTEGER NOT NULL DEFAULT 0,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_daily_v7_date ON helpdesk_analytics_daily_v7(date);
CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_daily_v7_agent ON helpdesk_analytics_daily_v7(agent_id);

CREATE TABLE IF NOT EXISTS helpdesk_analytics_message_events_v4 (
  event_key TEXT PRIMARY KEY,
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS helpdesk_analytics_reply_details_v4 (
  event_key TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  agent_name TEXT,
  agent_email TEXT,
  ticket_id TEXT,
  short_id TEXT,
  event_date TEXT,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_reply_details_v4_date ON helpdesk_analytics_reply_details_v4(date);
CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_reply_details_v4_agent ON helpdesk_analytics_reply_details_v4(agent_id);
CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_reply_details_v4_date_agent ON helpdesk_analytics_reply_details_v4(date, agent_id);

CREATE TABLE IF NOT EXISTS helpdesk_analytics_comment_daily_v1 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  agent_name TEXT,
  agent_email TEXT,
  handled_tickets INTEGER NOT NULL DEFAULT 0,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_comment_daily_v1_date ON helpdesk_analytics_comment_daily_v1(date);
CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_comment_daily_v1_agent ON helpdesk_analytics_comment_daily_v1(agent_id);

CREATE TABLE IF NOT EXISTS helpdesk_analytics_comment_events_v1 (
  event_key TEXT PRIMARY KEY,
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS helpdesk_analytics_comment_details_v1 (
  event_key TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  agent_name TEXT,
  agent_email TEXT,
  ticket_id TEXT,
  short_id TEXT,
  event_date TEXT,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_comment_details_v1_date ON helpdesk_analytics_comment_details_v1(date);
CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_comment_details_v1_agent ON helpdesk_analytics_comment_details_v1(agent_id);
CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_comment_details_v1_date_agent ON helpdesk_analytics_comment_details_v1(date, agent_id);

CREATE TABLE IF NOT EXISTS helpdesk_analytics_webhook_stats (
  stat_hour TEXT PRIMARY KEY,
  received_count INTEGER NOT NULL DEFAULT 0,
  assigned_points_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS helpdesk_analytics_sync_meta (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS livechat_ai_qa_reviews (
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
  assigned_to TEXT,
  assigned_at TEXT,
  completed_by TEXT,
  final_tags_json TEXT NOT NULL DEFAULT '[]',
  decision_note TEXT,
  livechat_tags_applied_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(chat_id, thread_id)
);

CREATE INDEX IF NOT EXISTS idx_livechat_ai_qa_reviews_status ON livechat_ai_qa_reviews(status, ai_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_livechat_ai_qa_reviews_chat ON livechat_ai_qa_reviews(chat_id, thread_id);

CREATE TABLE IF NOT EXISTS livechat_ai_qa_suggestions (
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
);

CREATE INDEX IF NOT EXISTS idx_livechat_ai_qa_suggestions_review ON livechat_ai_qa_suggestions(review_id, sort_order);

CREATE TABLE IF NOT EXISTS livechat_ai_qa_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  feedback_type TEXT NOT NULL,
  comment TEXT,
  ai_suggested INTEGER NOT NULL DEFAULT 0,
  final_selected INTEGER NOT NULL DEFAULT 0,
  reviewer TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_livechat_ai_qa_feedback_review ON livechat_ai_qa_feedback(review_id, created_at);

CREATE TABLE IF NOT EXISTS livechat_ai_qa_knowledge_base (
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
);

CREATE INDEX IF NOT EXISTS idx_livechat_ai_qa_knowledge_base_tag ON livechat_ai_qa_knowledge_base(tag, status);
CREATE INDEX IF NOT EXISTS idx_livechat_ai_qa_knowledge_base_status ON livechat_ai_qa_knowledge_base(status, updated_at);

CREATE TABLE IF NOT EXISTS livechat_ai_qa_usage_daily (
  usage_date TEXT PRIMARY KEY,
  neuron_limit INTEGER NOT NULL DEFAULT 8500,
  requests_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  estimated_neurons REAL NOT NULL DEFAULT 0,
  actual_neurons REAL NOT NULL DEFAULT 0,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS livechat_ai_agent_qa_reviews (
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
  assigned_to TEXT,
  assigned_at TEXT,
  completed_by TEXT,
  final_tags_json TEXT NOT NULL DEFAULT '[]',
  decision_note TEXT,
  livechat_tags_applied_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(chat_id, thread_id)
);

CREATE INDEX IF NOT EXISTS idx_livechat_ai_agent_qa_reviews_status ON livechat_ai_agent_qa_reviews(status, ai_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_livechat_ai_agent_qa_reviews_chat ON livechat_ai_agent_qa_reviews(chat_id, thread_id);
CREATE INDEX IF NOT EXISTS idx_livechat_ai_agent_qa_reviews_agent ON livechat_ai_agent_qa_reviews(agent_label, updated_at);

CREATE TABLE IF NOT EXISTS livechat_ai_qa_queue_settings (
  username TEXT NOT NULL,
  review_type TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  target_queue_size INTEGER NOT NULL DEFAULT 20,
  updated_by TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (username, review_type)
);

CREATE TABLE IF NOT EXISTS livechat_ai_qa_review_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_type TEXT NOT NULL,
  review_id TEXT NOT NULL,
  chat_id TEXT,
  thread_id TEXT,
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  previous_result_json TEXT NOT NULL DEFAULT '[]',
  new_result_json TEXT NOT NULL DEFAULT '[]',
  reviewer TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS livechat_ai_agent_qa_checks (
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
);

CREATE INDEX IF NOT EXISTS idx_livechat_ai_agent_qa_checks_review ON livechat_ai_agent_qa_checks(review_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_livechat_ai_agent_qa_checks_tag ON livechat_ai_agent_qa_checks(selected_tag, result);

CREATE TABLE IF NOT EXISTS livechat_ai_agent_qa_feedback (
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
);

CREATE INDEX IF NOT EXISTS idx_livechat_ai_agent_qa_feedback_review ON livechat_ai_agent_qa_feedback(review_id, created_at);

CREATE TABLE IF NOT EXISTS livechat_ai_agent_qa_knowledge_base (
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
);

CREATE INDEX IF NOT EXISTS idx_livechat_ai_agent_qa_knowledge_base_tag ON livechat_ai_agent_qa_knowledge_base(rule_key, tag, status);
