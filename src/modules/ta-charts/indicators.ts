// ⭐ Pure indicator maths — the highest-risk file in the module. Ported VERBATIM
// (numerically) from the legacy reference
//   …\Stocks\Database Project\Technical Analysis\technical_analysis_batch.py
// `add_all_indicators()`. The single-chart view and (later) the calibration
// dashboard both derive from this one file, so a silent bug here corrupts
// everything downstream. It is unit-tested against a legacy golden series
// (indicators.test.ts) to 6 decimal places.
//
// Parity traps — DO NOT "simplify" these (see tasks/lessons.md):
//  • EMA = pandas ewm(span, adjust=False): recursive, seeded at the first value
//    (out[0] = x[0]), α = 2/(span+1). NOT an SMA-seeded EMA.
//  • Stochastic uses HIGH/LOW for the channel, not Close.
//  • RSI = pandas ewm(alpha=1/period, adjust=False) over gains/losses where the
//    first delta is treated as 0 and the average is seeded at 0 — NOT the
//    textbook Wilder simple-average-of-first-N seed.

export type Num = number | null
export type MaPosition = 'ABOVE' | 'BELOW' | null

export interface IndicatorPeriods {
  smaWindow: number
  macdFast: number
  macdSlow: number
  macdSignal: number
  stochK: number
  stochKSmooth: number
  stochDSmooth: number
  rsiPeriod: number
}

export const DEFAULT_PERIODS: IndicatorPeriods = {
  smaWindow: 200,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  stochK: 14,
  stochKSmooth: 3,
  stochDSmooth: 3,
  rsiPeriod: 14
}

// Minimal OHLC shape — structurally satisfied by price-archive's PriceBar.
export interface OhlcBar {
  high: number | null
  low: number | null
  close: number
}

export interface IndicatorSeries {
  sma: Num[]
  maPosition: MaPosition[]
  macd: Num[]
  macdSignal: Num[]
  macdHist: Num[]
  stochK: Num[]
  stochD: Num[]
  rsi: Num[]
}

// NaN/±Infinity → null, so non-finite results read as "no value" (matches how
// pandas NaN lands as an empty cell in the legacy xlsx).
function finite(x: number): Num {
  return Number.isFinite(x) ? x : null
}

/** Rolling simple moving average. null until `window` valid points; any null in
 *  the window yields null (mirrors pandas rolling(window).mean() over NaNs). */
export function sma(values: Num[], window: number): Num[] {
  const out: Num[] = new Array(values.length).fill(null)
  for (let i = window - 1; i < values.length; i++) {
    let total = 0
    let ok = true
    for (let j = i - window + 1; j <= i; j++) {
      const v = values[j]
      if (v === null) {
        ok = false
        break
      }
      total += v
    }
    if (ok) out[i] = total / window
  }
  return out
}

/** pandas ewm(span, adjust=False): seeded at the first value, recursive. */
export function ema(values: number[], span: number): number[] {
  const out: number[] = new Array(values.length)
  if (values.length === 0) return out
  const alpha = 2 / (span + 1)
  let prev = values[0]
  out[0] = prev
  for (let i = 1; i < values.length; i++) {
    prev = values[i] * alpha + prev * (1 - alpha)
    out[i] = prev
  }
  return out
}

/** RSI via pandas ewm(alpha=1/period, adjust=False) over gains/losses, with the
 *  first delta treated as 0 and the averages seeded at 0. */
export function rsi(close: number[], period: number): Num[] {
  const n = close.length
  const out: Num[] = new Array(n).fill(null)
  if (n === 0) return out
  const alpha = 1 / period
  // index 0: delta undefined → gain/loss 0 → averages seed at 0
  let avgGain = 0
  let avgLoss = 0
  out[0] = finite(100 - 100 / (1 + avgGain / avgLoss)) // 0/0 → NaN → null
  for (let i = 1; i < n; i++) {
    const delta = close[i] - close[i - 1]
    const gain = delta > 0 ? delta : 0
    const loss = delta < 0 ? -delta : 0
    avgGain = gain * alpha + avgGain * (1 - alpha)
    avgLoss = loss * alpha + avgLoss * (1 - alpha)
    const rs = avgGain / avgLoss
    out[i] = finite(100 - 100 / (1 + rs))
  }
  return out
}

/** Slow stochastic: fast %K from the HIGH/LOW channel, then K = SMA(fastK,
 *  kSmooth), D = SMA(K, dSmooth). */
export function stochastic(
  high: Num[],
  low: Num[],
  close: number[],
  kPeriod: number,
  kSmooth: number,
  dSmooth: number
): { k: Num[]; d: Num[] } {
  const n = close.length
  const fastK: Num[] = new Array(n).fill(null)
  for (let i = kPeriod - 1; i < n; i++) {
    let hi = -Infinity
    let lo = Infinity
    let ok = true
    for (let j = i - kPeriod + 1; j <= i; j++) {
      const h = high[j]
      const l = low[j]
      if (h === null || l === null) {
        ok = false
        break
      }
      if (h > hi) hi = h
      if (l < lo) lo = l
    }
    if (ok) fastK[i] = finite((100 * (close[i] - lo)) / (hi - lo))
  }
  const k = sma(fastK, kSmooth)
  const d = sma(k, dSmooth)
  return { k, d }
}

/** Compute every chart indicator for a series, under the given periods. */
export function computeIndicators(
  bars: OhlcBar[],
  periods: IndicatorPeriods = DEFAULT_PERIODS
): IndicatorSeries {
  const close = bars.map((b) => b.close)
  const high = bars.map((b) => b.high)
  const low = bars.map((b) => b.low)

  const smaSeries = sma(close, periods.smaWindow)
  const maPosition: MaPosition[] = smaSeries.map((m, i) =>
    m === null ? null : close[i] > m ? 'ABOVE' : 'BELOW'
  )

  const emaFast = ema(close, periods.macdFast)
  const emaSlow = ema(close, periods.macdSlow)
  const macd = close.map((_, i) => emaFast[i] - emaSlow[i])
  const macdSignalLine = ema(macd, periods.macdSignal)
  const macdHist = macd.map((v, i) => v - macdSignalLine[i])

  const { k: stochK, d: stochD } = stochastic(
    high,
    low,
    close,
    periods.stochK,
    periods.stochKSmooth,
    periods.stochDSmooth
  )

  return {
    sma: smaSeries,
    maPosition,
    macd: macd.map(finite),
    macdSignal: macdSignalLine.map(finite),
    macdHist: macdHist.map(finite),
    stochK,
    stochD,
    rsi: rsi(close, periods.rsiPeriod)
  }
}

// ── Signal detection (Stage 2) ──────────────────────────────────────────────
// Ported VERBATIM from technical_analysis_batch.py detect_signals(). Like the
// indicators, this is unit-tested to exact parity against the legacy golden xlsx
// (Buy_Signal/Buy_Quality/Sell_Signal/Sell_Quality columns). Computed live in
// the renderer — nothing persisted.

export type Grade = 'A+' | 'A' | 'B' | 'C'

export interface SignalSettings {
  buyStochThreshold: number
  sellStochThreshold: number
  macdLookaheadDays: number
  // RSI grade cutoffs (evaluated on the MACD-cross day)
  rsiAPlusBuy: number
  rsiABuy: number
  rsiBBuy: number
  rsiAPlusSell: number
  rsiASell: number
  rsiBSell: number
}

export const DEFAULT_SIGNAL_SETTINGS: SignalSettings = {
  buyStochThreshold: 20,
  sellStochThreshold: 80,
  macdLookaheadDays: 5,
  rsiAPlusBuy: 30,
  rsiABuy: 40,
  rsiBBuy: 50,
  rsiAPlusSell: 70,
  rsiASell: 60,
  rsiBSell: 50
}

export interface Signal {
  type: 'buy' | 'sell'
  index: number // the MACD-cross bar — the signal date
  grade: Grade
  stochCrossIndex: number // the preceding Stochastic-cross bar
  daysBetween: number // index − stochCrossIndex (bars, mirrors legacy Days_Between)
}

// A crossover of `a` above `b` at bar i. Any null operand → false (matches the
// pandas NaN-comparison-is-false semantics of the legacy shift() crosses).
function crossesUp(a: Num[], b: Num[], i: number): boolean {
  const ai = a[i]
  const bi = b[i]
  const ap = a[i - 1]
  const bp = b[i - 1]
  if (ai === null || bi === null || ap === null || bp === null) return false
  return ai > bi && ap <= bp
}

function crossesDown(a: Num[], b: Num[], i: number): boolean {
  const ai = a[i]
  const bi = b[i]
  const ap = a[i - 1]
  const bp = b[i - 1]
  if (ai === null || bi === null || ap === null || bp === null) return false
  return ai < bi && ap >= bp
}

function buyGrade(rsiVal: number, s: SignalSettings): Grade {
  if (rsiVal <= s.rsiAPlusBuy) return 'A+'
  if (rsiVal <= s.rsiABuy) return 'A'
  if (rsiVal <= s.rsiBBuy) return 'B'
  return 'C'
}

function sellGrade(rsiVal: number, s: SignalSettings): Grade {
  if (rsiVal >= s.rsiAPlusSell) return 'A+'
  if (rsiVal >= s.rsiASell) return 'A'
  if (rsiVal >= s.rsiBSell) return 'B'
  return 'C'
}

/**
 * Detect buy + sell signals across a computed indicator series.
 *
 * Buy:  Stochastic crosses up with %K below `buyStochThreshold` the day before,
 *       then MACD crosses up within 0–`macdLookaheadDays` days with MACD negative
 *       the day before and a positive histogram on the cross. Grade by RSI.
 * Sell: the mirror image. (See detect_signals() for the canonical statement.)
 */
export function detectSignals(
  ind: IndicatorSeries,
  settings: SignalSettings = DEFAULT_SIGNAL_SETTINGS
): Signal[] {
  const { stochK, stochD, macd, macdSignal, macdHist, rsi: rsiSeries } = ind
  const n = stochK.length
  const lookahead = settings.macdLookaheadDays
  // Keyed by the MACD-cross bar. The legacy code writes a boolean column, so two
  // Stochastic crosses resolving to the same MACD cross collapse to one signal —
  // and because it loops i ascending and overwrites, the LAST (largest) stoch
  // cross wins for the recorded cross-date/days-between. A Map with set() in i
  // order reproduces both behaviours.
  const buys = new Map<number, Signal>()
  const sells = new Map<number, Signal>()

  for (let i = 2; i < n; i++) {
    if (!crossesUp(stochK, stochD, i)) continue
    const kPrev = stochK[i - 1]
    if (kPrev === null || kPrev >= settings.buyStochThreshold) continue
    for (let j = i; j < Math.min(i + lookahead + 1, n); j++) {
      if (!crossesUp(macd, macdSignal, j)) continue
      const macdPrev = macd[j - 1]
      const hist = macdHist[j]
      if (macdPrev === null || hist === null) continue
      if (macdPrev < 0 && hist > 0) {
        const r = rsiSeries[j]
        buys.set(j, {
          type: 'buy',
          index: j,
          grade: r === null ? 'C' : buyGrade(r, settings),
          stochCrossIndex: i,
          daysBetween: j - i
        })
        break
      }
    }
  }

  for (let i = 2; i < n; i++) {
    if (!crossesDown(stochK, stochD, i)) continue
    const kPrev = stochK[i - 1]
    if (kPrev === null || kPrev <= settings.sellStochThreshold) continue
    for (let j = i; j < Math.min(i + lookahead + 1, n); j++) {
      if (!crossesDown(macd, macdSignal, j)) continue
      const macdPrev = macd[j - 1]
      const hist = macdHist[j]
      if (macdPrev === null || hist === null) continue
      if (macdPrev > 0 && hist < 0) {
        const r = rsiSeries[j]
        sells.set(j, {
          type: 'sell',
          index: j,
          grade: r === null ? 'C' : sellGrade(r, settings),
          stochCrossIndex: i,
          daysBetween: j - i
        })
        break
      }
    }
  }

  const byIndex = (a: Signal, b: Signal): number => a.index - b.index
  return [...[...buys.values()].sort(byIndex), ...[...sells.values()].sort(byIndex)]
}

// ── Weekly MA overlay (display-only) ────────────────────────────────────────
// The 200-week MA the professional way: a rolling SMA over WEEKLY closes (the
// close of each week's last trading day — what Yahoo/TradingView average), then
// forward-filled onto the daily x-axis as a step function. Weekly closes come
// from fact_weekly_prices (yfinance interval='1wk', week-start Monday labels).
// Deliberately separate from computeIndicators/IndicatorPeriods — this overlay
// feeds NO signals, trades, or backtest numbers.

// One weekly close — structurally satisfied by price-archive's WeeklyBar.
export interface WeeklyClose {
  weekDate: string // ISO, the week-start (Monday) label
  close: number
}

export interface WeeklyOverlay {
  ma: Num[] // weekly SMA mapped onto the daily axis (null while warming up)
  position: MaPosition[] // daily close vs the weekly MA
}

/**
 * Compute the weekly-close SMA and map it onto the daily axis.
 *
 * Each daily bar takes the MA of the weekly bar containing it (week_date ≤ day,
 * i.e. the running week — matching how Yahoo/TradingView render a weekly MA on
 * a daily chart), carried forward past the last weekly bar. ISO string
 * comparison is chronologically safe. Empty weekly input → all nulls.
 */
export function computeWeeklyOverlay(
  weekly: WeeklyClose[],
  dailyDates: string[],
  dailyCloses: number[],
  window: number
): WeeklyOverlay {
  const n = dailyDates.length
  const ma: Num[] = new Array(n).fill(null)
  const position: MaPosition[] = new Array(n).fill(null)
  if (weekly.length === 0 || n === 0) return { ma, position }

  const weeklyMa = sma(
    weekly.map((w) => w.close),
    window
  )

  // Two-pointer forward-fill: advance the weekly index while the NEXT weekly
  // bar still starts on/before the daily date.
  let p = -1
  for (let i = 0; i < n; i++) {
    while (p + 1 < weekly.length && weekly[p + 1].weekDate <= dailyDates[i]) p++
    if (p < 0) continue // daily bar before the first weekly bar
    const m = weeklyMa[p]
    ma[i] = m
    if (m !== null) position[i] = dailyCloses[i] > m ? 'ABOVE' : 'BELOW'
  }
  return { ma, position }
}
