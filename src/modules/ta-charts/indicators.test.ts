import { describe, it, expect } from 'vitest'
import fixture from './__fixtures__/cpg-analysis.json'
import { computeIndicators, type IndicatorPeriods, type OhlcBar, type Num } from './indicators'

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
