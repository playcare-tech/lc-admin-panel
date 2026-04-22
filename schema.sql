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
