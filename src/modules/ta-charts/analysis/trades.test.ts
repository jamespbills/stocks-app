import { describe, it, expect } from 'vitest'
import { formTrades, aggregate } from './trades'
import type { IndicatorSeries, MaPosition, Signal } from '../indicators'
import type { PriceBar } from '../../price-archive/types'
import type { BacktestSettings, CohortReport } from '../types'

// ── Synthetic fixture: 10 daily bars, hand-computed expectations ─────────────
const DATES = [
  '2024-01-01',
  '2024-01-02',
  '2024-01-03',
  '2024-01-04',
  '2024-01-05',
  '2024-01-08',
  '2024-01-09',
  '2024-01-10',
  '2024-01-11',
  '2024-01-12'
]
const CLOSES = [100, 102, 101, 105, 110, 108, 112, 120, 118, 125]

function bar(date: string, close: number): PriceBar {
  return {
    tradeDate: date,
    open: close,
    high: close,
    low: close,
    close,
    adjClose: close,
    volume: 1000
  }
}
const BARS: PriceBar[] = DATES.map((d, i) => bar(d, CLOSES[i]))

const MA: MaPosition[] = [
  null,
  'ABOVE', // idx 1 — R1 entry
  null,
  'BELOW', // idx 3 — R2 entry
  null,
  null,
  'ABOVE',
  null,
  null,
  null
]
const IND: IndicatorSeries = {
  sma: new Array(10).fill(null),
  maPosition: MA,
  macd: new Array(10).fill(null),
  macdSignal: new Array(10).fill(null),
  macdHist: new Array(10).fill(null),
  stochK: new Array(10).fill(null),
  stochD: new Array(10).fill(null),
  rsi: new Array(10).fill(null)
}

function buy(index: number, grade: Signal['grade']): Signal {
  return { type: 'buy', index, grade, stochCrossIndex: index - 1, daysBetween: 1 }
}
const SIGNALS: Signal[] = [
  buy(1, 'A+'),
  buy(3, 'A'),
  buy(6, 'B'), // never inside any report's entry window → no trade
  { type: 'sell', index: 4, grade: 'A', stochCrossIndex: 3, daysBetween: 1 } // ignored
]

const REPORTS: CohortReport[] = [
  // R1: entry = idx1 (A+), exit window-end = next same-type 2024-01-09 (idx6).
  {
    ticker: 'TST.L',
    dateReleased: '2024-01-01',
    filingIdentifier: 'FY',
    financialYear: 2023,
    nextSameTypeRelease: '2024-01-09'
  },
  // R2: entry = idx3 (A), no successor → fallback (365d) clamps exit to last bar.
  {
    ticker: 'TST.L',
    dateReleased: '2024-01-04',
    filingIdentifier: 'H1',
    financialYear: 2023,
    nextSameTypeRelease: null
  },
  // R3: no buy signal inside [2024-01-11, 2024-01-14] → no trade.
  {
    ticker: 'TST.L',
    dateReleased: '2024-01-11',
    filingIdentifier: 'Q1',
    financialYear: 2024,
    nextSameTypeRelease: null
  }
]

const SETTINGS: BacktestSettings = { buyEntryWindowDays: 3, holdingFallbackDays: 365 }

describe('formTrades', () => {
  const trades = formTrades('TST.L', BARS, IND, SIGNALS, REPORTS, SETTINGS)

  it('forms exactly one trade per report with a qualifying entry signal', () => {
    expect(trades).toHaveLength(2)
  })

  it('R1: first buy within window, window-end exit at next same-type report', () => {
    const t = trades[0]
    expect(t.entryDate).toBe('2024-01-02') // idx1, the first buy ≤ 3d after release
    expect(t.grade).toBe('A+')
    expect(t.maPosition).toBe('ABOVE')
    expect(t.exitDate).toBe('2024-01-09') // last bar ≤ nextSameTypeRelease
    expect(t.entryClose).toBe(102)
    expect(t.exitClose).toBe(112)
    expect(t.returnPct).toBeCloseTo(9.80392157, 6)
    expect(t.holdDays).toBe(7)
    expect(t.daysFromReport).toBe(1)
  })

  it('R2: fallback holding window clamps the exit to the last available bar', () => {
    const t = trades[1]
    expect(t.entryDate).toBe('2024-01-04') // idx3
    expect(t.grade).toBe('A')
    expect(t.maPosition).toBe('BELOW')
    expect(t.exitDate).toBe('2024-01-12') // clamped to last bar
    expect(t.returnPct).toBeCloseTo(19.04761905, 6)
  })

  it('never consumes the same buy signal twice and respects the entry window', () => {
    // idx6 buy (2024-01-09) falls in no report's 3-day window → unused.
    expect(trades.every((t) => t.entryDate !== '2024-01-09')).toBe(true)
  })
})

describe('aggregate', () => {
  const trades = formTrades('TST.L', BARS, IND, SIGNALS, REPORTS, SETTINGS)
  const { rows } = aggregate(trades)

  it('puts Overall first with the right roll-up', () => {
    const overall = rows[0]
    expect(overall.key).toBe('overall')
    expect(overall.count).toBe(2)
    expect(overall.winRate).toBe(100)
    expect(overall.cumReturn).toBeCloseTo(28.85154062, 6)
    expect(overall.avgReturn).toBeCloseTo(14.42577031, 6)
    expect(overall.medianReturn).toBeCloseTo(14.42577031, 6)
  })

  it('emits one bucket per populated grade × MA cell, ordered A+→C', () => {
    const buckets = rows.slice(1)
    expect(buckets.map((r) => r.key)).toEqual(['A+|ABOVE', 'A|BELOW'])
    expect(buckets[0].count).toBe(1)
    expect(buckets[1].count).toBe(1)
  })
})
