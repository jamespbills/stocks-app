import { describe, it, expect } from 'vitest'
import fixture from './__fixtures__/cpg-analysis.json'
import {
  computeIndicators,
  detectSignals,
  DEFAULT_SIGNAL_SETTINGS,
  type IndicatorPeriods,
  type OhlcBar,
  type Num
} from './indicators'

// Golden-series parity test. The fixture is the exact output of the legacy
// technical_analysis_batch.py for CPG.L (504 daily bars). We feed its raw OHLC
// into computeIndicators() and assert every indicator column matches the
// legacy values to 6 decimal places. This is the guard that keeps the TS port
// numerically identical to the Python the rest of the ecosystem already trusts.

const TOL = 1e-6

const periods: IndicatorPeriods = {
  smaWindow: fixture.periods.sma,
  macdFast: fixture.periods.macdFast,
  macdSlow: fixture.periods.macdSlow,
  macdSignal: fixture.periods.macdSignal,
  stochK: fixture.periods.stochK,
  stochKSmooth: fixture.periods.stochKSmooth,
  stochDSmooth: fixture.periods.stochDSmooth,
  rsiPeriod: fixture.periods.rsi
}

const bars: OhlcBar[] = fixture.close.map((c, i) => ({
  high: fixture.high[i],
  low: fixture.low[i],
  close: c
}))

const result = computeIndicators(bars, periods)

// Compare a computed numeric series against the expected golden series.
// Asserts null-alignment (both null at the same indices) and ≤TOL elsewhere,
// and that at least one real value was actually checked.
function expectSeriesMatch(name: string, got: Num[], want: (number | null)[]): void {
  expect(got.length, `${name} length`).toBe(want.length)
  let compared = 0
  for (let i = 0; i < want.length; i++) {
    const w = want[i]
    const g = got[i]
    if (w === null) {
      expect(g, `${name}[${i}] expected null`).toBeNull()
    } else {
      expect(g, `${name}[${i}] expected number`).not.toBeNull()
      expect(Math.abs((g as number) - w), `${name}[${i}] = ${g} vs ${w}`).toBeLessThanOrEqual(TOL)
      compared++
    }
  }
  expect(compared, `${name} had comparable values`).toBeGreaterThan(0)
}

describe('computeIndicators — parity with legacy technical_analysis_batch.py (CPG.L)', () => {
  it('SMA(200) matches to 6dp', () => {
    expectSeriesMatch('sma', result.sma, fixture.expected.sma200)
  })

  it('200-MA position (ABOVE/BELOW) matches', () => {
    expect(result.maPosition.length).toBe(fixture.expected.ma200Position.length)
    for (let i = 0; i < result.maPosition.length; i++) {
      expect(result.maPosition[i], `maPosition[${i}]`).toBe(fixture.expected.ma200Position[i])
    }
  })

  it('MACD line / signal / histogram match to 6dp', () => {
    expectSeriesMatch('macd', result.macd, fixture.expected.macd)
    expectSeriesMatch('macdSignal', result.macdSignal, fixture.expected.macdSignal)
    expectSeriesMatch('macdHist', result.macdHist, fixture.expected.macdHist)
  })

  it('Stochastic %K / %D match to 6dp', () => {
    expectSeriesMatch('stochK', result.stochK, fixture.expected.stochK)
    expectSeriesMatch('stochD', result.stochD, fixture.expected.stochD)
  })

  it('RSI(14) matches to 6dp', () => {
    expectSeriesMatch('rsi', result.rsi, fixture.expected.rsi)
  })
})

// Signal-detection parity (Stage 2). detectSignals under the legacy default
// thresholds must reproduce the xlsx Buy_Signal/Buy_Quality/Sell_Signal/
// Sell_Quality columns exactly — same bar indices, same grades.
describe('detectSignals — parity with legacy detect_signals() (CPG.L)', () => {
  const signals = detectSignals(result, DEFAULT_SIGNAL_SETTINGS)

  type Expected = { index: number; grade: string }
  const expectedOf = (flags: boolean[], grades: (string | null)[]): Expected[] => {
    const out: Expected[] = []
    for (let i = 0; i < flags.length; i++) {
      if (flags[i]) out.push({ index: i, grade: grades[i] ?? 'C' })
    }
    return out
  }
  const gotOf = (type: 'buy' | 'sell'): Expected[] =>
    signals
      .filter((s) => s.type === type)
      .map((s) => ({ index: s.index, grade: s.grade }))
      .sort((a, b) => a.index - b.index)

  it('buy signals + grades match the legacy columns', () => {
    const want = expectedOf(fixture.expected.buySignal, fixture.expected.buyQuality)
    expect(want.length, 'fixture should contain buy signals').toBeGreaterThan(0)
    expect(gotOf('buy')).toEqual(want)
  })

  it('sell signals + grades match the legacy columns', () => {
    const want = expectedOf(fixture.expected.sellSignal, fixture.expected.sellQuality)
    expect(want.length, 'fixture should contain sell signals').toBeGreaterThan(0)
    expect(gotOf('sell')).toEqual(want)
  })
})
