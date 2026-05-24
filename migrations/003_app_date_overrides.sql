CREATE TABLE IF NOT EXISTS app_date_overrides (
  ticker       VARCHAR(10)  NOT NULL,
  actual_date  DATE         NOT NULL,
  reason       VARCHAR(500) NOT NULL DEFAULT '',
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ticker)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
