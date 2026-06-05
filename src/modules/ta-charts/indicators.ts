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
