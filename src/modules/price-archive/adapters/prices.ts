// The public price-series seam. TA, Release Date Analysis, and Portfolio import
// fetchPriceSeries() from here rather than re-declaring the read — the Price
// Archive is the single owner of how prices are read out of the store.

import { formatDate } from '../../../lib/format'
import { PRICE_SERIES_SQL } from '../queries'
import type { PriceBar } from '../types'

interface RawPriceRow {
  trade_date: Date | string | null
  open_price: string | number | null
  high_price: string | number | null
  low_price: string | number | null
  close_price: string | number | null
  adj_close_price: string | number | null
  volume: string | number | null
}

function num(v: string | number | null): number | null {
  if (v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * Fetch a clean OHLCV series for a ticker between two ISO dates (inclusive).
 * DECIMAL columns arrive as strings from mysql2 — parsed here at the boundary.
 */
export async function fetchPriceSeries(
  ticker: string,
  from: string,
  to: string
): Promise<PriceBar[]> {
  const rows = (await window.electronAPI.db.query(PRICE_SERIES_SQL, [
    ticker,
    from,
    to
  ])) as RawPriceRow[]
  return rows.map((r) => ({
    tradeDate: formatDate(r.trade_date, 'iso', ''),
    open: num(r.open_price),
    high: num(r.high_price),
    low: num(r.low_price),
    close: num(r.close_price) ?? 0,
    adjClose: num(r.adj_close_price),
    volume: num(r.volume)
  }))
}
