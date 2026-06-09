-- ============================================================================
-- 009_weekly_prices.sql — Weekly close store for the 200-week MA overlay
--
-- The TA chart's 200-week MA is the professional calculation: a simple average
-- of the last N WEEKLY closes (the close of each week's final trading day) —
-- the same series Yahoo/TradingView average. yfinance serves these directly via
-- interval='1wk', so archiving ~250–460 weekly rows per ticker sidesteps ever
-- ingesting 4 years of daily history for the warm-up.
--
-- fact_weekly_prices is app-owned (Price Archive is its single writer, same as
-- fact_historical_prices — CLAUDE.md §6). Closes only: the MA needs nothing
-- else, and the SMA itself stays a live-TypeScript computation downstream
-- (ta-charts/indicators.ts computeWeeklyOverlay), per the v2 principle.
--
-- Also: ma_weekly_window on app_ta_settings (drives both the TS compute and the
-- fetch lead in archive_prices.py), and a 'yfinance_weekly' source value on
-- dim_price_runs so weekly fetches log their own provenance rows — a weekly
-- failure never poisons the daily run's status. The enum value is appended
-- LAST (metadata-only change, no ordinal remap).
--
-- Re-executed on every app boot by runMigrations() — every statement MUST be
-- idempotent. MySQL 8.0 has no `ADD COLUMN IF NOT EXISTS` / conditional MODIFY
-- (MariaDB extensions), so both ALTERs are guarded via information_schema +
-- PREPARE (DO 0 = no-op when already applied). No DROP/DELETE/TRUNCATE.
-- ============================================================================

CREATE TABLE IF NOT EXISTS fact_weekly_prices (
  ticker        VARCHAR(20)      NOT NULL,
  week_date     DATE             NOT NULL,   -- yfinance week-start label (Monday)
  close_price   DECIMAL(18,6)    NOT NULL,
  source        ENUM('yfinance') NOT NULL DEFAULT 'yfinance',
  source_run_id INT UNSIGNED     DEFAULT NULL,
  ingested_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ticker, week_date),
  KEY idx_source_run (source_run_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── app_ta_settings.ma_weekly_window — the weekly MA window (weeks) ─────────

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'app_ta_settings'
    AND COLUMN_NAME  = 'ma_weekly_window'
);
SET @ddl := IF(
  @col_exists = 0,
  'ALTER TABLE app_ta_settings ADD COLUMN ma_weekly_window SMALLINT UNSIGNED NOT NULL DEFAULT 200 AFTER buy_entry_window_days',
  'DO 0'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── dim_price_runs.source — append 'yfinance_weekly' to the enum ────────────

SET @src_has_weekly := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'dim_price_runs'
    AND COLUMN_NAME  = 'source'
    AND COLUMN_TYPE LIKE '%yfinance_weekly%'
);
SET @ddl := IF(
  @src_has_weekly = 0,
  'ALTER TABLE dim_price_runs MODIFY COLUMN source ENUM(''yfinance'',''manual_investingcom'',''manual_csv'',''yfinance_weekly'') NOT NULL',
  'DO 0'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
