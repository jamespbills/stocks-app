// TA Charts — shared types. House style mirrors price-archive/sector-signals.
// mysql2 quirks (tasks/lessons.md): DATE → JS Date, DECIMAL → string. Adapters
// normalise at the row boundary.

import type { IndicatorPeriods } from './indicators'

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
  chartWindowDaysAfter: number
  exitMode: 'window_end' | 'next_sell_signal'
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
