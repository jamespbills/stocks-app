-- ============================================================================
-- 005_price_archive.sql — Price Archive module foundation (Layer 0 + Layer 1)
--
-- The Price Archive is the upstream foundational module: the single writer of
-- historical OHLCV prices into new_stocks_db. Downstream modules (TA, Release
-- Date Analysis, Portfolio) READ fact_historical_prices; none of them fetch.
--
-- The app OWNS the price domain end-to-end and may read AND write
-- fact_historical_prices + dim_price_runs (a deliberate exception to the
-- "app_* tables only" rule — see CLAUDE.md §6). Existing financial tables
-- (fact_reports, fact_metrics, stock_archive_flat, dim_* financial dims) remain
-- read-only — this module only READS from stock_archive_flat via view_play_universe.
--
-- This file is re-executed on every app boot by runMigrations() (no applied-
-- migration tracking), so every statement MUST be idempotent and MUST NEVER
-- drop, delete, or truncate. CREATE … IF NOT EXISTS / CREATE OR REPLACE VIEW /
-- INSERT … ON DUPLICATE KEY only.
-- ============================================================================

-- ── Layer 0: canonical OHLCV store ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fact_historical_prices (
  ticker            VARCHAR(20)     NOT NULL,
  trade_date        DATE            NOT NULL,
  open_price        DECIMAL(18,6)   DEFAULT NULL,
  high_price        DECIMAL(18,6)   DEFAULT NULL,
  low_price         DECIMAL(18,6)   DEFAULT NULL,
  close_price       DECIMAL(18,6)   NOT NULL,
  adj_close_price   DECIMAL(18,6)   DEFAULT NULL,
  volume            BIGINT UNSIGNED DEFAULT NULL,
  source            ENUM('yfinance','manual_investingcom','manual_csv') NOT NULL,
  source_run_id     INT UNSIGNED    DEFAULT NULL,
  ingested_at       DATETIME        DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ticker, trade_date),
  KEY idx_date (trade_date),
  KEY idx_source_run (source_run_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One row per fetch attempt — gives every price row a provenance link and
-- powers the Runs log.
CREATE TABLE IF NOT EXISTS dim_price_runs (
  run_id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticker          VARCHAR(20) NOT NULL,
  source          ENUM('yfinance','manual_investingcom','manual_csv') NOT NULL,
  requested_from  DATE NOT NULL,
  requested_to    DATE NOT NULL,
  rows_inserted   INT UNSIGNED DEFAULT 0,
  rows_updated    INT UNSIGNED DEFAULT 0,
  status          ENUM('running','ok','partial','failed','no_data') NOT NULL,
  error_message   TEXT DEFAULT NULL,
  triggered_by    ENUM('coverage_build','single_ticker','manual_upload',
                       'watchlist_refresh','scheduled') NOT NULL,
  started_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  finished_at     DATETIME DEFAULT NULL,
  KEY idx_ticker_started (ticker, started_at),
  KEY idx_status (status, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── App-owned config: tracked tickers, settings, coverage notes ────────────

-- Stores only non-derivable coverage claims (manual_watch, isa_holding).
-- Play-universe claims are derived live in vw_archive_coverage_target.
CREATE TABLE IF NOT EXISTS app_tracked_tickers (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticker      VARCHAR(20) NOT NULL,
  source      ENUM('manual_watch','isa_holding') NOT NULL,
  cover_from  DATE DEFAULT NULL,          -- NULL → default start (settings)
  cover_to    DATE DEFAULT NULL,          -- NULL → ongoing (today)
  reason      VARCHAR(255) DEFAULT NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ticker_source (ticker, source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Single-row archive settings — the windows that shape what the archive fetches.
CREATE TABLE IF NOT EXISTS app_archive_settings (
  id                         TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  play_lead_days             SMALLINT UNSIGNED NOT NULL DEFAULT 90,    -- before first release
  play_trail_days            SMALLINT UNSIGNED NOT NULL DEFAULT 456,   -- after last release (~15 months)
  stale_after_days           SMALLINT UNSIGNED NOT NULL DEFAULT 7,     -- freshness threshold
  isa_history_start          DATE NOT NULL DEFAULT '2016-07-01',       -- ISA opened Jul 2016
  manual_watch_lookback_days SMALLINT UNSIGNED NOT NULL DEFAULT 730,   -- fallback start for pure-manual tickers
  updated_at                 DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO app_archive_settings (id) VALUES (1) ON DUPLICATE KEY UPDATE id = id;

-- Per-ticker manual coverage notes (e.g. "investing.com CSV for 2019–2020, delisted on yfinance").
CREATE TABLE IF NOT EXISTS app_archive_notes (
  ticker     VARCHAR(20) PRIMARY KEY,
  note       TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Layer 1: shared upstream universe + coverage target ────────────────────

-- The four play categories, one row per qualifying report. Reusable upstream
-- object — downstream modules consume this rather than re-deriving the filter.
-- Mirrors view_watching's qualification logic WITHOUT its return_1y IS NULL
-- (current-only) filter: the archive wants every historically-qualifying report.
-- Sourced from stock_archive_flat (the canonical denormalised surface).
CREATE OR REPLACE VIEW view_play_universe AS
SELECT
  ticker,
  date_released,
  play,
  play_2,
  play_sector_rating,
  play_2_sector_rating
FROM stock_archive_flat
WHERE play = 13
   OR play_2 = 14
   OR (play = 12 AND play_sector_rating = 1)
   OR (play_2 = 13 AND play_2_sector_rating = 1);

-- The coalesced fetch plan: for every ticker any source cares about, one
-- (target_from, target_to). target_to IS NULL means "ongoing — fetch to today".
-- Play claims are derived live (follow criteria changes for free); manual_watch
-- and isa_holding claims come from app_tracked_tickers.
CREATE OR REPLACE VIEW vw_archive_coverage_target AS
WITH play_claims AS (
  SELECT
    u.ticker,
    DATE_SUB(MIN(u.date_released),
             INTERVAL (SELECT play_lead_days  FROM app_archive_settings WHERE id = 1) DAY) AS claim_from,
    DATE_ADD(MAX(u.date_released),
             INTERVAL (SELECT play_trail_days FROM app_archive_settings WHERE id = 1) DAY) AS claim_to,
    'play_universe' AS source
  FROM view_play_universe u
  GROUP BY u.ticker
),
tracked_claims AS (
  SELECT
    t.ticker,
    CASE
      WHEN t.source = 'isa_holding'
        THEN COALESCE(t.cover_from,
             (SELECT isa_history_start FROM app_archive_settings WHERE id = 1))
      WHEN t.source = 'manual_watch'
        -- Pad an explicit cover_from by the play lead (treat it like a play reference),
        -- so manual-watch windows are consistent with play windows. A blank cover_from
        -- falls through to the (un-padded) lookback fallback.
        THEN COALESCE(
             DATE_SUB(t.cover_from,
               INTERVAL (SELECT play_lead_days FROM app_archive_settings WHERE id = 1) DAY),
             DATE_SUB(CURDATE(),
               INTERVAL (SELECT manual_watch_lookback_days FROM app_archive_settings WHERE id = 1) DAY))
    END AS claim_from,
    t.cover_to AS claim_to,                       -- NULL = ongoing
    t.source
  FROM app_tracked_tickers t
  WHERE t.is_active = 1
),
all_claims AS (
  SELECT ticker, claim_from, claim_to, source FROM play_claims
  UNION ALL
  SELECT ticker, claim_from, claim_to, source FROM tracked_claims
)
SELECT
  ticker,
  MIN(claim_from)                               AS target_from,
  -- any ongoing (NULL) claim_to makes the whole target ongoing
  CASE WHEN SUM(claim_to IS NULL) > 0 THEN NULL
       ELSE MAX(claim_to) END                   AS target_to,
  GROUP_CONCAT(DISTINCT source ORDER BY source SEPARATOR ',') AS sources
FROM all_claims
GROUP BY ticker;
