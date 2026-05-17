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

CREATE TABLE IF NOT EXISTS helpdesk_analytics_daily_v4 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  agent_name TEXT,
  agent_email TEXT,
  handled_tickets INTEGER NOT NULL DEFAULT 0,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_daily_v4_date ON helpdesk_analytics_daily_v4(date);
CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_daily_v4_agent ON helpdesk_analytics_daily_v4(agent_id);

CREATE TABLE IF NOT EXISTS helpdesk_analytics_sync_meta (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
