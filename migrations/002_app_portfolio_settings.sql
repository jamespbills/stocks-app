CREATE TABLE IF NOT EXISTS app_portfolio (
  ticker   VARCHAR(10) NOT NULL,
  added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ticker)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO app_portfolio (ticker) VALUES
  ('MTL.L'), ('POWL'), ('SPSY.L'), ('SFM'), ('YELP'), ('URBN'), ('THC');

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key   VARCHAR(100) NOT NULL,
  setting_value TEXT,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
