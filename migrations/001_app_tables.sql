CREATE TABLE IF NOT EXISTS app_watchlist (
  company_id INT NOT NULL,
  added_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes      TEXT,
  PRIMARY KEY (company_id)
);

CREATE TABLE IF NOT EXISTS app_inbox_state (
  id            INT NOT NULL DEFAULT 1,
  last_viewed   DATETIME NOT NULL DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (id)
);

INSERT IGNORE INTO app_inbox_state (id, last_viewed) VALUES (1, '2000-01-01 00:00:00');
