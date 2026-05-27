-- App-owned notes for sector × criterion combos
CREATE TABLE IF NOT EXISTS app_sector_combo_notes (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  strategy        ENUM('play','play_2') NOT NULL,
  sector          VARCHAR(100) NOT NULL,
  missed_criterion TINYINT UNSIGNED NOT NULL,
  note            TEXT DEFAULT NULL,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_combo (strategy, sector, missed_criterion)
);

-- App-owned per-ticker notes within a combo
CREATE TABLE IF NOT EXISTS app_sector_ticker_notes (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  strategy        ENUM('play','play_2') NOT NULL,
  sector          VARCHAR(100) NOT NULL,
  missed_criterion TINYINT UNSIGNED NOT NULL,
  ticker          VARCHAR(20) NOT NULL,
  note            TEXT DEFAULT NULL,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ticker_combo (strategy, sector, missed_criterion, ticker)
);
