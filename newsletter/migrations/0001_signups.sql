-- One row per address per project. The newsletter database is shared, so every project writes its own source.
CREATE TABLE IF NOT EXISTS signups (
  email TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (email, source)
);
