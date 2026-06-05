// TA Charts — SQL reads (bare strings; logic lives in adapters, house style
// matches sector-signals/price-archive queries.ts). Validated against new_stocks_db.
//
// TA WRITES nothing here beyond its single settings row — prices come from the
// Price Archive seam (adapters/prices.ts), never re-queried here.

// Distinct tickers actually held in the archive — the picker only offers
// chartable tickers.
export const TICKERS_SQL = `
  SELECT DISTINCT ticker
  FROM fact_historical_prices
  ORDER BY ticker
`

// Every report for a ticker (qualifying or not) — overlaid as chart markers.
// Read-only against the canonical denormalised surface. Param: [ticker].
export const REPORTS_FOR_TICKER_SQL = `
  SELECT report_date, date_released, financial_year, filing_identifier,
         play, play_2, play_sector_rating, play_2_sector_rating
  FROM stock_archive_flat
  WHERE ticker = ?
  ORDER BY date_released
`

// Settings (read). Single row.
export const TA_SETTINGS_SQL = `SELECT * FROM app_ta_settings WHERE id = 1`

// Settings (write). Stage 1 only edits the indicator periods, but we write the
// full row so later stages need no new SQL. Params in column order below.
export const UPDATE_TA_SETTINGS_SQL = `
  UPDATE app_ta_settings SET
    sma_window = ?, macd_fast = ?, macd_slow = ?, macd_signal = ?,
    stoch_k = ?, stoch_k_smooth = ?, stoch_d_smooth = ?, rsi_period = ?,
    buy_stoch_threshold = ?, sell_stoch_threshold = ?, macd_lookahead_days = ?,
    rsi_a_plus_buy = ?, rsi_a_buy = ?, rsi_b_buy = ?,
    rsi_a_plus_sell = ?, rsi_a_sell = ?, rsi_b_sell = ?,
    chart_window_days_before = ?, chart_window_days_after = ?, exit_mode = ?
  WHERE id = 1
`
