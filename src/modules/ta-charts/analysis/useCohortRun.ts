import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchPriceSeriesBatch } from '../../price-archive/adapters/prices'
import type { PriceBar } from '../../price-archive/types'
import { toPeriods, toSignalSettings, toBacktestSettings, type TaSettings } from '../types'
import type { ScoreboardResult } from '../types'
import { fetchCohort } from './cohort'
import { runCohort } from './runCohort'

// Wide bounds pull each ticker's entire archived history — the 200-SMA warm-up
// and up-to-1-year holding windows both need it (mirrors series.ts).
const FULL_FROM = '1900-01-01'
const FULL_TO = '2999-12-31'

interface BaseData {
  cohort: Awaited<ReturnType<typeof fetchCohort>>
  priceMap: Map<string, PriceBar[]>
  tickerCount: number
}

export interface CohortRunState {
  result: ScoreboardResult | null
  loading: boolean
  error: string | null
  reportCount: number
  tickerCount: number
}

interface WorkerReply {
  ok: boolean
  result?: ScoreboardResult
  error?: string
}

// Loads the qualifying-play cohort + batched prices ONCE, then re-runs the
// backtest (in a Web Worker) whenever the strategy settings change — the
// calibration loop. Prices don't depend on settings, so a settings tweak never
// refetches; it only recomputes.
export function useCohortRun(settings: TaSettings): CohortRunState {
  const [base, setBase] = useState<BaseData | null>(null)
  const [baseError, setBaseError] = useState<string | null>(null)

  const periods = useMemo(() => toPeriods(settings), [settings])
  const signalSettings = useMemo(() => toSignalSettings(settings), [settings])
  const backtest = useMemo(() => toBacktestSettings(settings), [settings])

  // A primitive key over just the fields the backtest depends on — drives re-runs
  // without re-running on unrelated TaSettings churn or new object identities.
  const settingsKey = useMemo(
    () =>
      JSON.stringify([
        periods,
        signalSettings,
        backtest.buyEntryWindowDays,
        backtest.holdingFallbackDays
      ]),
    [periods, signalSettings, backtest]
  )

  const [run, setRun] = useState<{ key: string; result: ScoreboardResult } | null>(null)
  const [runError, setRunError] = useState<string | null>(null)

  // One worker for the hook's lifetime.
  const workerRef = useRef<Worker | null>(null)
  useEffect(() => {
    const w = new Worker(new URL('./aggregate.worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = w
    return () => {
      w.terminate()
      workerRef.current = null
    }
  }, [])

  // Phase A — load cohort + prices once.
  useEffect(() => {
    let cancelled = false
    fetchCohort()
      .then(async (cohort) => {
        const tickers = [...new Set(cohort.map((c) => c.ticker))]
        const priceMap = await fetchPriceSeriesBatch(tickers, FULL_FROM, FULL_TO)
        if (!cancelled) setBase({ cohort, priceMap, tickerCount: tickers.length })
      })
      .catch((err: unknown) => {
        if (!cancelled) setBaseError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Phase B — (re)run the backtest when the base data or settings change.
  useEffect(() => {
    const worker = workerRef.current
    if (!base || !worker) return
    let cancelled = false
    setRunError(null)

    const input = {
      priceMap: base.priceMap,
      cohort: base.cohort,
      periods,
      signalSettings,
      backtest
    }

    worker.onmessage = (e: MessageEvent<WorkerReply>): void => {
      if (cancelled) return
      if (e.data.ok && e.data.result) setRun({ key: settingsKey, result: e.data.result })
      else setRunError(e.data.error ?? 'Cohort run failed')
    }
    worker.onerror = (): void => {
      if (cancelled) return
      // Fallback: the worker failed to spin up (or threw at the boundary) — run
      // inline. The data is tiny, so this stays sub-second on the main thread.
      try {
        setRun({ key: settingsKey, result: runCohort(input) })
      } catch (err) {
        setRunError(err instanceof Error ? err.message : String(err))
      }
    }
    worker.postMessage(input)

    return () => {
      cancelled = true
    }
  }, [base, settingsKey, periods, signalSettings, backtest])

  const result = run && run.key === settingsKey ? run.result : null
  const error = baseError ?? runError
  const loading = error === null && result === null

  return {
    result,
    loading,
    error,
    reportCount: base?.cohort.length ?? 0,
    tickerCount: base?.tickerCount ?? 0
  }
}
