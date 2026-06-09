import { useEffect, useState } from 'react'
import { fetchPriceSeries, fetchWeeklySeries } from '../../price-archive/adapters/prices'
import { usePlayThresholds } from '../../../lib/playThresholds'
import type { PriceBar, WeeklyBar } from '../../price-archive/types'
import { fetchReports } from './reports'
import type { ReportMarker } from '../types'

// TA charts the ticker's ENTIRE archived history — not a report-anchored window
// (James, 2026-05-30). Wide bounds pull everything held; the BETWEEN is inclusive.
const FULL_FROM = '1900-01-01'
const FULL_TO = '2999-12-31'

export interface ChartData {
  bars: PriceBar[]
  reports: ReportMarker[]
  weekly: WeeklyBar[] // empty when the ticker has no weekly rows yet
}

export interface ChartDataQuery {
  data: ChartData | null
  loading: boolean
  error: string | null
}

// Loads raw bars + report overlays for a ticker. Indicators are NOT computed
// here — the component derives them with useMemo so changing an indicator period
// recomputes instantly without refetching (the calibration loop). Refetches only
// when the ticker changes.
export function useChartData(ticker: string | null): ChartDataQuery {
  const thresholds = usePlayThresholds()
  const [result, setResult] = useState<{ ticker: string; data: ChartData } | null>(null)
  const [errState, setErrState] = useState<{ ticker: string; message: string } | null>(null)

  useEffect(() => {
    if (ticker === null) return
    let cancelled = false
    Promise.all([
      fetchPriceSeries(ticker, FULL_FROM, FULL_TO),
      fetchReports(ticker, thresholds),
      // The weekly-MA overlay is optional decoration — a failed weekly read
      // degrades to "no overlay", never an error screen.
      fetchWeeklySeries(ticker).catch((): WeeklyBar[] => [])
    ])
      .then(([bars, reports, weekly]) => {
        if (!cancelled) setResult({ ticker, data: { bars, reports, weekly } })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setErrState({ ticker, message: err instanceof Error ? err.message : String(err) })
        }
      })
    return () => {
      cancelled = true
    }
  }, [ticker, thresholds])

  // Only surface state that belongs to the currently-selected ticker, so a
  // ticker switch reads as "loading" until its own fetch lands.
  const data = result && result.ticker === ticker ? result.data : null
  const error = errState && errState.ticker === ticker ? errState.message : null
  const loading = ticker !== null && data === null && error === null
  return { data, loading, error }
}
