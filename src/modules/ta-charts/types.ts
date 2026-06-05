// TA Charts — shared types. House style mirrors price-archive/sector-signals.
// mysql2 quirks (tasks/lessons.md): DATE → JS Date, DECIMAL → string. Adapters
// normalise at the row boundary.

import type { Grade, IndicatorPeriods, MaPosition, SignalSettings } from './indicators'

// The single persisted strategy record (app_ta_settings row 1). Stage 1 only
// edits the indicator periods; the signal/grade/window fields are seeded for
// Stages 2–3 and carried through unchanged on save.
export interface TaSettings {
  // Indicator periods (Stage 1)
  smaWindow: number
  macdFast: number
  macdSlow: number
  macdSignal: number
  stochK: number
  stochKSmooth: number
  stochDSmooth: number
  rsiPeriod: number
  // Signal-detection rules (Stage 2)
  buyStochThreshold: number
  sellStochThreshold: number
  macdLookaheadDays: number
  // Grade thresholds (Stage 2)
  rsiAPlusBuy: number
  rsiABuy: number
  rsiBBuy: number
  rsiAPlusSell: number
  rsiASell: number
  rsiBSell: number
  // Cohort windows + exit rule (Stage 3)
  chartWindowDaysBefore: number
  chartWindowDaysAfter: number // reused as the holding-window fallback (days)
  exitMode: 'window_end' | 'next_sell_signal'
  buyEntryWindowDays: number // days after a report's release a buy signal can enter
}

// Pull just the indicator periods out of a settings record (what the chart needs).
export function toPeriods(s: TaSettings): IndicatorPeriods {
  return {
    smaWindow: s.smaWindow,
    macdFast: s.macdFast,
    macdSlow: s.macdSlow,
    macdSignal: s.macdSignal,
    stochK: s.stochK,
    stochKSmooth: s.stochKSmooth,
    stochDSmooth: s.stochDSmooth,
    rsiPeriod: s.rsiPeriod
  }
}

// Just the backtest knobs the Stage 3 trade-forming needs.
export interface BacktestSettings {
  buyEntryWindowDays: number // a buy signal must enter within this many days of release
  holdingFallbackDays: number // when a report has no next same-type successor
}

export function toBacktestSettings(s: TaSettings): BacktestSettings {
  return {
    buyEntryWindowDays: s.buyEntryWindowDays,
    holdingFallbackDays: s.chartWindowDaysAfter
  }
}

// One qualifying-play report from the Stage 3 cohort (COHORT_SQL), normalised.
// `nextSameTypeRelease` is the holding-window upper bound (next report of the
// same filing_identifier); null when this is the latest of its type.
export interface CohortReport {
  ticker: string
  dateReleased: string // ISO
  filingIdentifier: string | null
  financialYear: number | null
  nextSameTypeRelease: string | null // ISO
}

// One formed buy trade. Entry = first buy signal within the entry window of a
// qualifying report; exit = window-end (next same-type report / fallback).
export interface Trade {
  ticker: string
  reportDate: string // ISO — the qualifying report's date_released
  filingIdentifier: string | null
  entryDate: string // ISO
  exitDate: string // ISO
  grade: Grade
  maPosition: MaPosition // at entry
  entryClose: number
  exitClose: number
  returnPct: number
  holdDays: number // calendar days entry → exit
  daysFromReport: number // entryDate − reportDate (calendar days)
}

// One scoreboard row — a (grade × MA position) bucket, or the Overall total.
export interface ScoreboardRow {
  key: string // 'overall' | `${grade}|${maPosition}`
  label: string // 'Overall' | 'A+ · above'
  grade: Grade | null // null for Overall
  maPosition: MaPosition | 'ALL'
  count: number
  winRate: number // 0–100, % of trades with returnPct > 0
  cumReturn: number // sum of returnPct
  avgReturn: number
  medianReturn: number
  stdDev: number
  minReturn: number
  maxReturn: number
  avgHoldDays: number
  medianHoldDays: number
  histogram: number[] // 12 bins of returnPct for the distribution mini
}

export interface ScoreboardResult {
  rows: ScoreboardRow[] // Overall first, then grade × MA buckets
  trades: Trade[] // every trade, for the drill-down
}

// Pull just the signal-detection rules + grade thresholds (what detectSignals needs).
export function toSignalSettings(s: TaSettings): SignalSettings {
  return {
    buyStochThreshold: s.buyStochThreshold,
    sellStochThreshold: s.sellStochThreshold,
    macdLookaheadDays: s.macdLookaheadDays,
    rsiAPlusBuy: s.rsiAPlusBuy,
    rsiABuy: s.rsiABuy,
    rsiBBuy: s.rsiBBuy,
    rsiAPlusSell: s.rsiAPlusSell,
    rsiASell: s.rsiASell,
    rsiBSell: s.rsiBSell
  }
}

// One report overlaid on the chart. Every report for the ticker is shown —
// `qualifies` flags those that meet the view_play_universe play criteria
// (drives the solid-vs-dimmed marker treatment).
export interface ReportMarker {
  dateReleased: string // ISO — the x-anchor for the marker line
  reportDate: string | null
  financialYear: number | null
  filingIdentifier: string | null
  play: number | null
  play2: number | null
  playSectorRating: number | null
  play2SectorRating: number | null
  qualifies: boolean
}
