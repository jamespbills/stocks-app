// Pure market-stats derivation for the Ticker Gate. No fs/DB — fed coerced rows from the hook
// and unit-tested directly. Keyed by the full ticker (`tickerKey`, suffix preserved) so it
// joins cleanly to the gate rows and never conflates `ABC.L` with `ABC`.

import { tickerKey } from '../ticker'
import type { MarketStats } from '../types'
import type { High52Row, LivePriceRow } from './queries'

function num(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** Combine a live price and a 52-week high into the market block (null-safe throughout). */
export function deriveMarketStats(lastPrice: number | null, high52: number | null): MarketStats {
  const fromHighPct =
    lastPrice !== null && high52 !== null && high52 !== 0 ? (lastPrice - high52) / high52 : null
  return { lastPrice, high52, fromHighPct }
}

/** Build a full-ticker-keyed market map from the live-price and 52-wk-high query rows. */
export function buildMarketMap(
  liveRows: LivePriceRow[],
  high52Rows: High52Row[]
): Map<string, MarketStats> {
  const live = new Map<string, number | null>()
  for (const r of liveRows) {
    const key = tickerKey(r.ticker)
    if (key !== '') live.set(key, num(r.live_price))
  }
  const high = new Map<string, number | null>()
  for (const r of high52Rows) {
    const key = tickerKey(r.ticker)
    if (key !== '') high.set(key, num(r.high_52w))
  }

  const out = new Map<string, MarketStats>()
  for (const key of new Set([...live.keys(), ...high.keys()])) {
    out.set(key, deriveMarketStats(live.get(key) ?? null, high.get(key) ?? null))
  }
  return out
}
