-- ============================================================================
-- 006_ta_settings.sql — Technical Analysis module settings (single-row config)
--
-- The TA module is a pure DOWNSTREAM CONSUMER of the Price Archive. It reads
-- prices via fetchPriceSeries() and computes every indicator + signal LIVE in
-- TypeScript — there is NO fact_ta_signals, NO dim_ta_generation_runs, NO Python.
-- This file's ONLY job is to persist the single configurable strategy record:
-- indicator periods (Stage 1), signal/grade rules (Stage 2), and the cohort
-- window/exit rule (Stage 3). Stage 1 wires only the indicator-period columns;
-- the rest are seeded now so later stages need no further migration.
--
-- Re-executed on every app boot by runMigrations() (electron/migrations.ts) with
-- no applied-migration tracking, so every statement MUST be idempotent and MUST
-- NEVER drop/delete/truncate: CREATE TABLE IF NOT EXISTS + INSERT … ON DUPLICATE
-- KEY only.
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_ta_settings (
  id              TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  -- Indicator periods (drive the chart panels) — Stage 1
  sma_window      SMALLINT UNSIGNED NOT NULL DEFAULT 200,
  macd_fast       SMALLINT UNSIGNED NOT NULL DEFAULT 12,
  macd_slow       SMALLINT UNSIGNED NOT NULL DEFAULT 26,
  macd_signal     SMALLINT UNSIGNED NOT NULL DEFAULT 9,
  stoch_k         SMALLINT UNSIGNED NOT NULL DEFAULT 14,
  stoch_k_smooth  SMALLINT UNSIGNED NOT NULL DEFAULT 3,
  stoch_d_smooth  SMALLINT UNSIGNED NOT NULL DEFAULT 3,
  rsi_period      SMALLINT UNSIGNED NOT NULL DEFAULT 14,
  -- Signal-detection rules — Stage 2
  buy_stoch_threshold   DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  sell_stoch_threshold  DECIMAL(5,2) NOT NULL DEFAULT 80.00,
  macd_lookahead_days   TINYINT UNSIGNED NOT NULL DEFAULT 5,
  -- Grade thresholds (RSI on the MACD-cross day) — Stage 2
  rsi_a_plus_buy  DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  rsi_a_buy       DECIMAL(5,2) NOT NULL DEFAULT 40.00,
  rsi_b_buy       DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  rsi_a_plus_sell DECIMAL(5,2) NOT NULL DEFAULT 70.00,
  rsi_a_sell      DECIMAL(5,2) NOT NULL DEFAULT 60.00,
  rsi_b_sell      DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  -- Cohort aggregation windows around each report — Stage 3 (unused in Stage 1)
  chart_window_days_before SMALLINT UNSIGNED NOT NULL DEFAULT 365,
  chart_window_days_after  SMALLINT UNSIGNED NOT NULL DEFAULT 365,
  -- Aggregation exit rule (Stage 3): how a trade closes
  exit_mode       ENUM('window_end','next_sell_signal') NOT NULL DEFAULT 'window_end',
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO app_ta_settings (id) VALUES (1) ON DUPLICATE KEY UPDATE id = id;
