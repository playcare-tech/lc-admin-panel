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

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users (username);

CREATE TABLE IF NOT EXISTS analytics_agent_daily (
  date TEXT NOT NULL,
  agent_scope TEXT NOT NULL,
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
  PRIMARY KEY (date, agent_scope, agent_key)
);

CREATE TABLE IF NOT EXISTS analytics_agent_daily_fetches (
  date TEXT NOT NULL,
  agent_scope TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  PRIMARY KEY (date, agent_scope)
);

CREATE TABLE IF NOT EXISTS helpdesk_analytics_daily (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  handled_tickets INTEGER NOT NULL DEFAULT 0,
  avg_ftr_ms REAL NOT NULL DEFAULT 0,
  avg_resolution_time_ms REAL NOT NULL DEFAULT 0,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_daily_date ON helpdesk_analytics_daily(date);
CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_daily_agent ON helpdesk_analytics_daily(agent_id);

CREATE TABLE IF NOT EXISTS helpdesk_analytics_daily_fetches (
  date TEXT PRIMARY KEY,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS helpdesk_analytics_daily_v3 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  agent_name TEXT,
  agent_email TEXT,
  handled_tickets INTEGER NOT NULL DEFAULT 0,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_daily_v3_date ON helpdesk_analytics_daily_v3(date);
CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_daily_v3_agent ON helpdesk_analytics_daily_v3(agent_id);

CREATE TABLE IF NOT EXISTS helpdesk_analytics_handled_tickets_v3 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  agent_name TEXT,
  agent_email TEXT,
  ticket_id TEXT,
  short_id TEXT NOT NULL,
  last_public_reply_at TEXT NOT NULL,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, agent_id, short_id)
);

CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_handled_tickets_v3_date ON helpdesk_analytics_handled_tickets_v3(date);
CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_handled_tickets_v3_agent ON helpdesk_analytics_handled_tickets_v3(agent_id);
CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_handled_tickets_v3_short ON helpdesk_analytics_handled_tickets_v3(short_id);

CREATE TABLE IF NOT EXISTS helpdesk_analytics_daily_fetches_v3 (
  date TEXT PRIMARY KEY,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

CREATE TABLE IF NOT EXISTS helpdesk_analytics_handled_tickets_v4 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  agent_name TEXT,
  agent_email TEXT,
  ticket_id TEXT,
  short_id TEXT NOT NULL,
  ticket_link TEXT,
  subject TEXT,
  agent_reply_count INTEGER NOT NULL DEFAULT 0,
  incoming_message_count INTEGER NOT NULL DEFAULT 0,
  ticket_created_at TEXT,
  ticket_solved_at TEXT,
  ticket_closed_at TEXT,
  last_public_reply_at TEXT NOT NULL,
  conversation_json TEXT,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, agent_id, short_id)
);

CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_handled_tickets_v4_date ON helpdesk_analytics_handled_tickets_v4(date);
CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_handled_tickets_v4_agent ON helpdesk_analytics_handled_tickets_v4(agent_id);
CREATE INDEX IF NOT EXISTS idx_helpdesk_analytics_handled_tickets_v4_short ON helpdesk_analytics_handled_tickets_v4(short_id);

CREATE TABLE IF NOT EXISTS helpdesk_analytics_daily_fetches_v4 (
  date TEXT PRIMARY KEY,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS helpdesk_analytics_sync_meta (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
