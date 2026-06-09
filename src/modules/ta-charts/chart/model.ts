// Pure, geom-independent derived data for the chart: extracted arrays, value
// ranges, x-axis ticks, and report anchor indices. SVG path strings are built in
// ChartStack (they need the live geometry); everything here depends only on data.

import type { PriceBar } from '../../price-archive/types'
import type { Num, Signal } from '../indicators'
import type { ReportMarker } from '../types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parseIso(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export interface ChartArrays {
  dates: string[]
  open: Num[]
  high: Num[]
  low: Num[]
  close: number[]
  volume: Num[]
}

export function toArrays(bars: PriceBar[]): ChartArrays {
  return {
    dates: bars.map((b) => b.tradeDate),
    open: bars.map((b) => b.open),
    high: bars.map((b) => b.high),
    low: bars.map((b) => b.low),
    close: bars.map((b) => b.close),
    volume: bars.map((b) => b.volume)
  }
}

// Price panel range — spans close, the (visible part of the) SMA, and the
// weekly-MA overlay when present, padded.
export function priceRange(
  close: number[],
  sma: Num[],
  weeklyMa: Num[] = []
): { lo: number; hi: number } {
  let lo = Infinity
  let hi = -Infinity
  for (const v of close) {
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  for (const v of [...sma, ...weeklyMa]) {
    if (v === null) continue
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return { lo: 0, hi: 1 }
  const pad = (hi - lo) * 0.04 || 1
  return { lo: lo - pad, hi: hi + pad }
}

// Symmetric MACD range around zero (so the zero line sits centred).
export function macdAbs(macd: Num[], signal: Num[]): number {
  let max = 0
  for (const v of [...macd, ...signal]) {
    if (v === null) continue
    const a = Math.abs(v)
    if (a > max) max = a
  }
  return (max || 1) * 1.1
}

export function volMax(volume: Num[]): number {
  let max = 0
  for (const v of volume) {
    if (v !== null && v > max) max = v
  }
  return max || 1
}

export interface AxisTick {
  idx: number
  label: string
}

// Adaptive ticks: year buckets for multi-year spans, else month buckets.
// Strided to ~12 labels so a decade of history doesn't crowd the axis.
export function axisTicks(dates: string[]): AxisTick[] {
  if (dates.length === 0) return []
  if (dates.length === 1) {
    const d = parseIso(dates[0])
    return [{ idx: 0, label: `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}` }]
  }
  const first = parseIso(dates[0])
  const last = parseIso(dates[dates.length - 1])
  const spanDays = (last.getTime() - first.getTime()) / 86_400_000
  const byYear = spanDays > 365 * 2.2

  const ticks: AxisTick[] = []
  let lastKey = ''
  for (let i = 0; i < dates.length; i++) {
    const d = parseIso(dates[i])
    const key = byYear ? String(d.getFullYear()) : `${d.getFullYear()}-${d.getMonth()}`
    if (key !== lastKey) {
      ticks.push({
        idx: i,
        label: byYear
          ? String(d.getFullYear())
          : `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`
      })
      lastKey = key
    }
  }
  if (ticks.length > 14) {
    const stride = Math.ceil(ticks.length / 12)
    return ticks.filter((_, k) => k % stride === 0)
  }
  return ticks
}

export interface ReportAnchor {
  report: ReportMarker
  idx: number
}

// Anchor each report to the first bar on/after its release date. Reports outside
// the charted price range are dropped (no x to place them on).
export function reportAnchors(reports: ReportMarker[], dates: string[]): ReportAnchor[] {
  if (dates.length === 0) return []
  const firstT = parseIso(dates[0]).getTime()
  const lastT = parseIso(dates[dates.length - 1]).getTime()
  const times = dates.map((d) => parseIso(d).getTime())
  const anchors: ReportAnchor[] = []
  for (const report of reports) {
    if (!report.dateReleased) continue
    const t = parseIso(report.dateReleased).getTime()
    if (t < firstT || t > lastT) continue
    // first bar with time >= t
    let lo = 0
    let hi = times.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (times[mid] < t) lo = mid + 1
      else hi = mid
    }
    anchors.push({ report, idx: lo })
  }
  return anchors
}

// A signal positioned on the price panel: x and the y of its price point.
// Computed once in ChartShell and shared with the hit-areas so the drawn marker
// and its hover target stay aligned.
export interface MarkerAnchor {
  signal: Signal
  x: number
  y: number // y of the close price at the signal bar
}

// Triangle offset from the price point (buy below, sell above) + hit-area size.
export const MARKER = { dy: 15, half: 5.5, height: 9.5, hit: 18 }

export interface NearestReport {
  report: ReportMarker
  days: number // signed entry − report: negative = signal is before the report
}

// The report closest (by absolute day delta) to a given signal date. Used in the
// signal hover modal's "days to nearest report" field. Negative = before.
export function nearestReport(
  signalDateIso: string,
  reports: ReportMarker[]
): NearestReport | null {
  if (!signalDateIso) return null
  const t = parseIso(signalDateIso).getTime()
  let best: NearestReport | null = null
  let bestAbs = Infinity
  for (const r of reports) {
    if (!r.dateReleased) continue
    const days = Math.round((t - parseIso(r.dateReleased).getTime()) / 86_400_000)
    const abs = Math.abs(days)
    if (abs < bestAbs) {
      bestAbs = abs
      best = { report: r, days }
    }
  }
  return best
}
