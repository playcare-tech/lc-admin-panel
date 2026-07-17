-- Emergency D1 cleanup for live_chat_admin.
-- Keeps admin_users, admin_login_rate_limits, helpdesk_workflows, and sync metadata.
-- Drops cache/raw/history tables that can be rebuilt by the app.

DROP TABLE IF EXISTS analytics_agent_daily;
DROP TABLE IF EXISTS analytics_agent_daily_fetches;

DROP TABLE IF EXISTS helpdesk_analytics_daily;
DROP TABLE IF EXISTS helpdesk_analytics_daily_fetches;
DROP TABLE IF EXISTS helpdesk_analytics_agent_fetches;

DROP TABLE IF EXISTS helpdesk_analytics_daily_v2;
DROP TABLE IF EXISTS helpdesk_analytics_daily_fetches_v2;
DROP TABLE IF EXISTS helpdesk_analytics_agent_fetches_v2;

DROP TABLE IF EXISTS helpdesk_analytics_daily_v3;
DROP TABLE IF EXISTS helpdesk_analytics_handled_tickets_v3;
DROP TABLE IF EXISTS helpdesk_analytics_daily_fetches_v3;
DROP TABLE IF EXISTS helpdesk_analytics_agent_fetches_v3;

DROP TABLE IF EXISTS helpdesk_analytics_daily_v4;
DROP TABLE IF EXISTS helpdesk_analytics_handled_tickets_v4;
DROP TABLE IF EXISTS helpdesk_analytics_daily_fetches_v4;
DROP TABLE IF EXISTS helpdesk_analytics_agent_fetches_v4;

DROP TABLE IF EXISTS helpdesk_analytics_daily_v5;
DROP TABLE IF EXISTS helpdesk_analytics_message_events;
DROP TABLE IF EXISTS helpdesk_analytics_message_events_v2;
DROP TABLE IF EXISTS helpdesk_analytics_reply_details_v1;
DROP TABLE IF EXISTS helpdesk_analytics_reply_details_v2;
DROP TABLE IF EXISTS helpdesk_analytics_daily_v6;
DROP TABLE IF EXISTS helpdesk_analytics_message_events_v3;
DROP TABLE IF EXISTS helpdesk_analytics_reply_details_v3;
DROP TABLE IF EXISTS helpdesk_analytics_daily_v7;
DROP TABLE IF EXISTS helpdesk_analytics_message_events_v4;
DROP TABLE IF EXISTS helpdesk_analytics_reply_details_v4;

DROP TABLE IF EXISTS helpdesk_webhook_events;
DROP TABLE IF EXISTS helpdesk_workflow_run_stats;
DROP TABLE IF EXISTS helpdesk_workflow_runs;
DROP TABLE IF EXISTS livechat_translation_events;
DROP TABLE IF EXISTS livechat_translation_chats;
DROP TABLE IF EXISTS livechat_translation_settings;

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

CREATE TABLE IF NOT EXISTS helpdesk_analytics_webhook_stats (
  stat_hour TEXT PRIMARY KEY,
  received_count INTEGER NOT NULL DEFAULT 0,
  assigned_points_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

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

DELETE FROM logs
WHERE created_at < datetime('now', '-7 days')
   OR action IN ('run_workflow', 'create_ticket_webhook')
   OR actor = 'system:helpdesk-webhook';

CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs (created_at DESC);
