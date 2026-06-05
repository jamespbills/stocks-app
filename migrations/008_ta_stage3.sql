-- ============================================================================
-- TA Charts — Stage 3 (Analysis surface) settings.
--
-- Adds the buy-entry-window knob to app_ta_settings. The holding-window fallback
-- reuses the existing chart_window_days_after column (relabelled in the UI), so
-- no new column is needed for it.
--
-- Re-executed on every app boot by runMigrations() — every statement MUST be
-- idempotent. MySQL 8.0 does NOT support `ADD COLUMN IF NOT EXISTS` (a MariaDB
-- extension), so we guard the ALTER by checking information_schema first and
-- running it through a prepared statement (DO 0 = no-op when the column already
-- exists). The runner uses multipleStatements, so the ;-separated block runs as
-- one query. No DROP/DELETE/TRUNCATE.
-- ============================================================================

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'app_ta_settings'
    AND COLUMN_NAME  = 'buy_entry_window_days'
);
SET @ddl := IF(
  @col_exists = 0,
  'ALTER TABLE app_ta_settings ADD COLUMN buy_entry_window_days SMALLINT UNSIGNED NOT NULL DEFAULT 90 AFTER exit_mode',
  'DO 0'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
