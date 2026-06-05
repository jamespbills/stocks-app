// ⭐ Stage 3 trade-forming + aggregation — pure TS, unit-tested (trades.test.ts).
// Like indicators.ts this is silent-bug territory: the scoreboard is only as
// trustworthy as this file. Reuses indicators.ts output verbatim (the chart and
// the scoreboard must never disagree). Nothing persisted.
//
// The model (James, 2026-06-05): buy-only. For each qualifying-play report, the
// entry is the FIRST buy signal within `buyEntryWindowDays` of the release date,
// and a signal is never consumed by two reports. Exit is window-end — the next
// report of the same filing_identifier (≈1yr), or `holdingFallbackDays` after
// release when there's no successor — clamped to the last available bar. Sell
// signals are ignored for the backtest. Returns use raw close.

import type { IndicatorSeries, Signal, Grade, MaPosition } from '../indicators'
import type { PriceBar } from '../../price-archive/types'
import type {
  BacktestSettings,
  CohortReport,
  ScoreboardResult,
  ScoreboardRow,
  Trade
} from '../types'

// ── Distribution-mini histogram domain (shared with DistributionMini.tsx so the
//    zero divider lines up). Returns outside the range clamp into the end bins.
export const HIST_MIN = -30
export const HIST_MAX = 50
export const HIST_BINS = 12

// ── Pure ISO-date arithmetic (UTC, so no DST drift; operates on 'YYYY-MM-DD'). ──
function epochDay(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
}
function addDays(iso: string, n: number): string {
  const ms = (epochDay(iso) + n) * 86_400_000
  const dt = new Date(ms)
  const y = dt.getUTCFullYear()
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const d = String(dt.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
function diffDays(fromIso: string, toIso: string): number {
  return epochDay(toIso) - epochDay(fromIso)
}

/**
 * Form buy trades for ONE ticker. `bars` must be the ticker's full series sorted
 * ascending by date; `indicators` and `signals` are computed from those same
 * bars; `reports` are this ticker's qualifying-play reports (any order — sorted
 * here). The same buy signal is never used by two reports.
 */
export function formTrades(
  ticker: string,
  bars: PriceBar[],
  indicators: IndicatorSeries,
  signals: Signal[],
  reports: CohortReport[],
  settings: BacktestSettings
): Trade[] {
  if (bars.length === 0) return []

  // Buy signals only, in chronological (bar-index) order.
  const buys = signals.filter((s) => s.type === 'buy').sort((a, b) => a.index - b.index)

  // Reports in release-date order so the earliest claims a contested signal.
  const ordered = [...reports].sort((a, b) => a.dateReleased.localeCompare(b.dateReleased))

  const consumed = new Set<number>()
  const lastIdx = bars.length - 1
  const lastDate = bars[lastIdx].tradeDate
  const trades: Trade[] = []

  for (const report of ordered) {
    const entryEnd = addDays(report.dateReleased, settings.buyEntryWindowDays)

    // First unconsumed buy whose bar date is within [release, release + window].
    const entry = buys.find((b) => {
      if (consumed.has(b.index)) return false
      const date = bars[b.index].tradeDate
      return date >= report.dateReleased && date <= entryEnd
    })
    if (!entry) continue
    consumed.add(entry.index)

    // Holding window end = next same-type report, else fallback days after release.
    const holdEnd =
      report.nextSameTypeRelease ?? addDays(report.dateReleased, settings.holdingFallbackDays)

    // Window-end exit: the last bar on or before holdEnd (never before entry).
    let exitIndex = entry.index
    for (let j = entry.index + 1; j <= lastIdx; j++) {
      if (bars[j].tradeDate <= holdEnd) exitIndex = j
      else break
    }
    // Beyond all data → clamp to the last bar (the window hasn't closed yet).
    if (holdEnd > lastDate) exitIndex = lastIdx

    const entryClose = bars[entry.index].close
    const exitClose = bars[exitIndex].close
    const entryDate = bars[entry.index].tradeDate
    const exitDate = bars[exitIndex].tradeDate

    trades.push({
      ticker,
      reportDate: report.dateReleased,
      filingIdentifier: report.filingIdentifier,
      entryDate,
      exitDate,
      grade: entry.grade,
      maPosition: indicators.maPosition[entry.index],
      entryClose,
      exitClose,
      returnPct: entryClose === 0 ? 0 : ((exitClose - entryClose) / entryClose) * 100,
      holdDays: diffDays(entryDate, exitDate),
      daysFromReport: diffDays(report.dateReleased, entryDate)
    })
  }

  return trades
}

// ── Aggregation ─────────────────────────────────────────────────────────────

const GRADE_ORDER: Grade[] = ['A+', 'A', 'B', 'C']
const MA_ORDER: MaPosition[] = ['ABOVE', 'BELOW', null]

function mean(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length
}
function median(xs: number[]): number {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid]
}
function stdDev(xs: number[]): number {
  if (xs.length === 0) return 0
  const m = mean(xs)
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))) // population std
}
function histogram(returns: number[]): number[] {
  const bins = new Array(HIST_BINS).fill(0)
  const span = HIST_MAX - HIST_MIN
  for (const r of returns) {
    let bin = Math.floor(((r - HIST_MIN) / span) * HIST_BINS)
    if (bin < 0) bin = 0
    if (bin >= HIST_BINS) bin = HIST_BINS - 1
    bins[bin] += 1
  }
  return bins
}

function maLabel(ma: MaPosition): string {
  return ma === 'ABOVE' ? 'above' : ma === 'BELOW' ? 'below' : 'n/a'
}

function buildRow(
  key: string,
  label: string,
  grade: Grade | null,
  maPosition: MaPosition | 'ALL',
  trades: Trade[]
): ScoreboardRow {
  const returns = trades.map((t) => t.returnPct)
  const holds = trades.map((t) => t.holdDays)
  const wins = returns.filter((r) => r > 0).length
  return {
    key,
    label,
    grade,
    maPosition,
    count: trades.length,
    winRate: trades.length === 0 ? 0 : (wins / trades.length) * 100,
    cumReturn: returns.reduce((a, b) => a + b, 0),
    avgReturn: mean(returns),
    medianReturn: median(returns),
    stdDev: stdDev(returns),
    minReturn: returns.length === 0 ? 0 : Math.min(...returns),
    maxReturn: returns.length === 0 ? 0 : Math.max(...returns),
    avgHoldDays: mean(holds),
    medianHoldDays: median(holds),
    histogram: histogram(returns)
  }
}

/**
 * Aggregate all trades into the scoreboard: an Overall row first, then one row
 * per (grade × MA position) bucket that has trades, ordered A+→C, above→below.
 */
export function aggregate(trades: Trade[]): ScoreboardResult {
  const rows: ScoreboardRow[] = [buildRow('overall', 'Overall', null, 'ALL', trades)]

  for (const grade of GRADE_ORDER) {
    for (const ma of MA_ORDER) {
      const bucket = trades.filter((t) => t.grade === grade && t.maPosition === ma)
      if (bucket.length === 0) continue
      rows.push(buildRow(`${grade}|${ma ?? 'NA'}`, `${grade} · ${maLabel(ma)}`, grade, ma, bucket))
    }
  }

  return { rows, trades }
}
