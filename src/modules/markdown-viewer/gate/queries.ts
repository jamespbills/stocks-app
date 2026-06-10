// Read-only SQL for the Ticker Gate. All three statements are SELECT-only (asserted by
// queries.test.ts) — the Markdown Reviews module never writes to MySQL. Paramless so they
// cache cleanly under useIpcQuery.

/** Every qualifying report in the play universe, with company + sector identity. */
export const QUALIFIERS_SQL = `
  SELECT pu.ticker, pu.date_released, pu.play, pu.play_2,
         pu.play_sector_rating, pu.play_2_sector_rating,
         dc.name AS company, dc.sector
  FROM view_play_universe pu
  JOIN dim_companies dc USING (ticker)
  ORDER BY pu.ticker, pu.date_released DESC
`

/** Latest live price per ticker (small set — ~13 tickers in dim_live_prices). */
export const LIVE_PRICES_SQL = `
  SELECT ticker, live_price, updated_at
  FROM dim_live_prices
`

/** 52-week high (max close) per archived ticker — graceful absence for unarchived tickers. */
export const HIGH_52W_SQL = `
  SELECT ticker, MAX(close_price) AS high_52w
  FROM fact_historical_prices
  WHERE trade_date >= DATE_SUB(CURDATE(), INTERVAL 52 WEEK)
  GROUP BY ticker
`

/** Raw row shapes (mysql2 returns DATE as Date, DECIMAL as string — coerced at the boundary). */
export interface QualifierRow {
  ticker: string
  date_released: Date | string | null
  play: number | string | null
  play_2: number | string | null
  play_sector_rating: number | string | null
  play_2_sector_rating: number | string | null
  company: string | null
  sector: string | null
}

export interface LivePriceRow {
  ticker: string
  live_price: number | string | null
  updated_at: Date | string | null
}

export interface High52Row {
  ticker: string
  high_52w: number | string | null
}
