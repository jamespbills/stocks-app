import { describe, it, expect } from 'vitest'
import { computeWeeklyOverlay, type WeeklyClose } from './indicators'

// Hand-computed fixtures for the weekly-MA overlay (no legacy golden exists —
// the overlay is new). Covers the SMA values + warm-up nulls, the running-week
// forward-fill mapping onto the daily axis, holiday-gap weeks, carry-forward
// past the last weekly bar, leading daily bars before the first weekly bar,
// empty input, and the ABOVE/BELOW position alignment.

// Six consecutive Monday-labelled weekly closes (matches yfinance interval='1wk').
const weekly: WeeklyClose[] = [
  { weekDate: '2026-01-05', close: 10 },
  { weekDate: '2026-01-12', close: 12 },
  { weekDate: '2026-01-19', close: 14 },
  { weekDate: '2026-01-26', close: 13 },
  { weekDate: '2026-02-02', close: 15 },
  { weekDate: '2026-02-09', close: 16 }
]
// SMA(3) over the closes: null, null, 12, 13, 14, 14.666667

const TOL = 1e-6

describe('computeWeeklyOverlay', () => {
  it('computes the weekly SMA with warm-up nulls and maps week-start labels to their days', () => {
    // One daily bar per week, mid-week (Wednesday) — each must take its OWN
    // week's MA (running-week semantics).
    const dailyDates = [
      '2026-01-07',
      '2026-01-14',
      '2026-01-21',
      '2026-01-28',
      '2026-02-04',
      '2026-02-11'
    ]
    const dailyCloses = [10, 12, 14, 13, 15, 16]
    const { ma } = computeWeeklyOverlay(weekly, dailyDates, dailyCloses, 3)
    expect(ma[0]).toBeNull()
    expect(ma[1]).toBeNull()
    expect(Math.abs((ma[2] as number) - 12)).toBeLessThanOrEqual(TOL)
    expect(Math.abs((ma[3] as number) - 13)).toBeLessThanOrEqual(TOL)
    expect(Math.abs((ma[4] as number) - 14)).toBeLessThanOrEqual(TOL)
    expect(Math.abs((ma[5] as number) - (13 + 15 + 16) / 3)).toBeLessThanOrEqual(TOL)
  })

  it('forward-fills every weekday (and a weekend date) within the same week', () => {
    // All five trading days of the 2026-01-19 week + the Saturday — same MA.
    const dailyDates = [
      '2026-01-19',
      '2026-01-20',
      '2026-01-21',
      '2026-01-22',
      '2026-01-23',
      '2026-01-24'
    ]
    const dailyCloses = [14, 14, 14, 14, 14, 14]
    const { ma } = computeWeeklyOverlay(weekly, dailyDates, dailyCloses, 3)
    for (let i = 0; i < dailyDates.length; i++) {
      expect(Math.abs((ma[i] as number) - 12)).toBeLessThanOrEqual(TOL)
    }
  })

  it('a missing week (holiday gap) forward-fills the previous week’s MA', () => {
    // Weekly series with the 2026-01-26 week absent.
    const gappy: WeeklyClose[] = [
      { weekDate: '2026-01-05', close: 10 },
      { weekDate: '2026-01-12', close: 12 },
      { weekDate: '2026-01-19', close: 14 },
      { weekDate: '2026-02-02', close: 15 }
    ]
    // A daily date inside the missing week takes the 2026-01-19 bar's MA (12).
    const { ma } = computeWeeklyOverlay(gappy, ['2026-01-28'], [13], 3)
    expect(Math.abs((ma[0] as number) - 12)).toBeLessThanOrEqual(TOL)
  })

  it('carries the last MA forward past the final weekly bar', () => {
    // MA at the final weekly bar = mean(13, 15, 16) = 14.666667
    const dailyDates = ['2026-02-25', '2026-03-04']
    const { ma } = computeWeeklyOverlay(weekly, dailyDates, [16, 16], 3)
    expect(Math.abs((ma[0] as number) - (13 + 15 + 16) / 3)).toBeLessThanOrEqual(TOL)
    expect(ma[1]).toBe(ma[0])
  })

  it('daily bars before the first weekly bar stay null', () => {
    const { ma, position } = computeWeeklyOverlay(weekly, ['2026-01-02'], [10], 3)
    expect(ma[0]).toBeNull()
    expect(position[0]).toBeNull()
  })

  it('empty weekly input yields all nulls', () => {
    const { ma, position } = computeWeeklyOverlay([], ['2026-01-07', '2026-01-08'], [10, 11], 3)
    expect(ma).toEqual([null, null])
    expect(position).toEqual([null, null])
  })

  it('position is ABOVE/BELOW vs the daily close and null while the MA warms up', () => {
    const dailyDates = ['2026-01-07', '2026-01-21', '2026-01-28']
    const dailyCloses = [10, 14, 12.5] // vs MA: (warm-up), 12 → ABOVE, 13 → BELOW
    const { position } = computeWeeklyOverlay(weekly, dailyDates, dailyCloses, 3)
    expect(position[0]).toBeNull()
    expect(position[1]).toBe('ABOVE')
    expect(position[2]).toBe('BELOW')
  })
})
