// Pure cohort run — the whole Stage 3 backtest in one function, shared by the
// Web Worker (aggregate.worker.ts) and the inline fallback. Reuses indicators.ts
// (computeIndicators + detectSignals) so the scoreboard and the chart can never
// disagree. All inputs are structured-clone-friendly so this runs unchanged in a
// worker. Nothing persisted.

import { computeIndicators, detectSignals } from '../indicators'
import type { IndicatorPeriods, SignalSettings } from '../indicators'
import type { PriceBar } from '../../price-archive/types'
import type { BacktestSettings, CohortReport, ScoreboardResult, Trade } from '../types'
import { formTrades, aggregate } from './trades'

export interface CohortRunInput {
  priceMap: Map<string, PriceBar[]>
  cohort: CohortReport[]
  periods: IndicatorPeriods
  signalSettings: SignalSettings
  backtest: BacktestSettings
}

export function runCohort(input: CohortRunInput): ScoreboardResult {
  const { priceMap, cohort, periods, signalSettings, backtest } = input

  // Group qualifying reports by ticker.
  const byTicker = new Map<string, CohortReport[]>()
  for (const report of cohort) {
    const list = byTicker.get(report.ticker)
    if (list) list.push(report)
    else byTicker.set(report.ticker, [report])
  }

  const allTrades: Trade[] = []
  for (const [ticker, reports] of byTicker) {
    const bars = priceMap.get(ticker)
    if (!bars || bars.length === 0) continue // no archived prices for this ticker
    const indicators = computeIndicators(bars, periods)
    const signals = detectSignals(indicators, signalSettings)
    allTrades.push(...formTrades(ticker, bars, indicators, signals, reports, backtest))
  }

  return aggregate(allTrades)
}
