// Price Archive — SQL strings (bare strings, logic lives in adapters; house style
// matches sector-signals/queries.ts). Validated against new_stocks_db, 2026-05-29.

// 5.1 Coverage log — the home surface. Joins the coalesced coverage target to
// what's actually held and the latest successful run, plus any manual note.
export const COVERAGE_TABLE_SQL = `
  SELECT
    ct.ticker,
    ct.sources,
    ct.target_from,
    ct.target_to,
    cov.first_held,
    cov.last_held,
    COALESCE(cov.bar_count, 0)        AS bar_count,
    COALESCE(cov.manual_bar_count, 0) AS manual_bar_count,
    lr.last_run_at,
    an.note
  FROM vw_archive_coverage_target ct
  LEFT JOIN (
    SELECT ticker,
           MIN(trade_date) AS first_held,
           MAX(trade_date) AS last_held,
           COUNT(*)        AS bar_count,
           SUM(source IN ('manual_investingcom','manual_csv')) AS manual_bar_count
    FROM fact_historical_prices
    GROUP BY ticker
  ) cov ON cov.ticker = ct.ticker
  LEFT JOIN (
    SELECT ticker, MAX(finished_at) AS last_run_at
    FROM dim_price_runs WHERE status IN ('ok','partial')
    GROUP BY ticker
  ) lr ON lr.ticker = ct.ticker
  LEFT JOIN app_archive_notes an ON an.ticker = ct.ticker
  ORDER BY ct.ticker
`

// 5.2 Runs log — newest first.
export const RUNS_LOG_SQL = `
  SELECT run_id, ticker, source, requested_from, requested_to,
         rows_inserted, rows_updated, status, error_message,
         triggered_by, started_at, finished_at
  FROM dim_price_runs
  ORDER BY started_at DESC
  LIMIT 200
`

// 5.3 Price series for a ticker — the shared read other modules import via
// adapters/prices.ts. Params: [ticker, from, to].
export const PRICE_SERIES_SQL = `
  SELECT trade_date, open_price, high_price, low_price, close_price, adj_close_price, volume
  FROM fact_historical_prices
  WHERE ticker = ?
    AND trade_date BETWEEN ? AND ?
  ORDER BY trade_date
`

// Batched price series for many tickers at once — one round-trip for the TA
// Stage 3 cohort run (~92 tickers) instead of N IPC calls. Build the IN list of
// placeholders dynamically; params are [...tickers, from, to]. Same column shape
// as PRICE_SERIES_SQL (+ ticker so the rows can be grouped).
export function priceSeriesBatchSql(tickerCount: number): string {
  const placeholders = Array.from({ length: tickerCount }, () => '?').join(', ')
  return `
    SELECT ticker, trade_date, open_price, high_price, low_price, close_price, adj_close_price, volume
    FROM fact_historical_prices
    WHERE ticker IN (${placeholders})
      AND trade_date BETWEEN ? AND ?
    ORDER BY ticker, trade_date
  `
}

// Weekly closes for a ticker — the full archived weekly series (it already spans
// only the coverage window + MA warm-up lead, so no date filter). Feeds the TA
// chart's weekly-MA overlay via adapters/prices.ts. Param: [ticker].
export const WEEKLY_SERIES_SQL = `
  SELECT week_date, close_price
  FROM fact_weekly_prices
  WHERE ticker = ?
  ORDER BY week_date
`

// 5.6 Settings (read).
export const SETTINGS_SQL = `SELECT * FROM app_archive_settings WHERE id = 1`

// 5.6 Settings (write). Params:
// [playLeadDays, playTrailDays, staleAfterDays, isaHistoryStart, manualWatchLookbackDays].
export const UPDATE_SETTINGS_SQL = `
  UPDATE app_archive_settings
  SET play_lead_days = ?, play_trail_days = ?, stale_after_days = ?,
      isa_history_start = ?, manual_watch_lookback_days = ?
  WHERE id = 1
`

// Header counts — distinct in-scope tickers.
export const COVERAGE_COUNT_SQL = `SELECT COUNT(*) AS n FROM vw_archive_coverage_target`

// Per-ticker manual coverage note upsert. Params: [ticker, note].
export const UPSERT_NOTE_SQL = `
  INSERT INTO app_archive_notes (ticker, note) VALUES (?, ?)
  ON DUPLICATE KEY UPDATE note = VALUES(note)
`

// 5.4 Tracked-ticker CRUD.
export const TRACKED_LIST_SQL = `
  SELECT id, ticker, source, cover_from, cover_to, reason, is_active
  FROM app_tracked_tickers
  ORDER BY source, ticker
`

// Params: [ticker, source, coverFrom, coverTo, reason, isActive].
export const UPSERT_TRACKED_SQL = `
  INSERT INTO app_tracked_tickers (ticker, source, cover_from, cover_to, reason, is_active)
  VALUES (?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    cover_from = VALUES(cover_from), cover_to = VALUES(cover_to),
    reason = VALUES(reason), is_active = VALUES(is_active), updated_at = NOW()
`

// Soft enable/disable (no hard delete — keeps history, honours the never-destroy rule).
// Params: [isActive, id].
export const SET_TRACKED_ACTIVE_SQL = `
  UPDATE app_tracked_tickers SET is_active = ? WHERE id = ?
`
