// The public price-series seam. TA, Release Date Analysis, and Portfolio import
// fetchPriceSeries() from here rather than re-declaring the read — the Price
// Archive is the single owner of how prices are read out of the store.

import { formatDate } from '../../../lib/format'
import { PRICE_SERIES_SQL, priceSeriesBatchSql } from '../queries'
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

interface RawBatchPriceRow extends RawPriceRow {
  ticker: string
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
  return rows.map(toBar)
}

function toBar(r: RawPriceRow): PriceBar {
  return {
    tradeDate: formatDate(r.trade_date, 'iso', ''),
    open: num(r.open_price),
    high: num(r.high_price),
    low: num(r.low_price),
    close: num(r.close_price) ?? 0,
    adjClose: num(r.adj_close_price),
    volume: num(r.volume)
  }
}

/**
 * Fetch clean OHLCV series for many tickers in one query — the batched seam the
 * TA Stage 3 cohort run uses (one round-trip instead of N). Returns a
 * Map<ticker, PriceBar[]>; tickers with no rows in range are simply absent.
 * Empty input short-circuits (avoids an `IN ()` syntax error).
 */
export async function fetchPriceSeriesBatch(
  tickers: string[],
  from: string,
  to: string
): Promise<Map<string, PriceBar[]>> {
  const out = new Map<string, PriceBar[]>()
  if (tickers.length === 0) return out
  const rows = (await window.electronAPI.db.query(priceSeriesBatchSql(tickers.length), [
    ...tickers,
    from,
    to
  ])) as RawBatchPriceRow[]
  for (const r of rows) {
    let series = out.get(r.ticker)
    if (!series) {
      series = []
      out.set(r.ticker, series)
    }
    series.push(toBar(r))
  }
  return out
}
