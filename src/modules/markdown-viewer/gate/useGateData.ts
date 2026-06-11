import { useCallback, useMemo } from 'react'
import { useIpcQuery } from '../../../hooks/useIpcQuery'
import { usePlayThresholds } from '../../../lib/playThresholds'
import { useBrainIndex } from '../adapters/useBrainIndex'
import { buildGateRows } from './build-gate-rows'
import { buildMarketMap } from './market'
import {
  HIGH_52W_SQL,
  LIVE_PRICES_SQL,
  QUALIFIERS_SQL,
  type High52Row,
  type LivePriceRow,
  type QualifierRow
} from './queries'
import type { GateRow, ReviewEntry } from '../types'

interface GateData {
  rows: GateRow[]
  /** The full brain index — the expanded ticker route enriches its review stack from this. */
  entries: ReviewEntry[]
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Composes the brain index (Stage 2) with the read-only numeric + market queries and joins
 * them via the pure builder. Market data lags gracefully — the list shows as soon as the
 * brain and qualifiers resolve.
 */
export function useGateData(): GateData {
  const thresholds = usePlayThresholds()
  const brain = useBrainIndex()
  const qualifiers = useIpcQuery<QualifierRow[]>(QUALIFIERS_SQL)
  const live = useIpcQuery<LivePriceRow[]>(LIVE_PRICES_SQL)
  const high = useIpcQuery<High52Row[]>(HIGH_52W_SQL)

  const rows = useMemo(() => {
    const market = buildMarketMap(live.data ?? [], high.data ?? [])
    const brainTickers = brain.entries.filter((e) => e.pageType === 'ticker')
    return buildGateRows(qualifiers.data ?? [], brainTickers, market, thresholds)
  }, [qualifiers.data, live.data, high.data, brain.entries, thresholds])

  const refetch = useCallback(() => {
    qualifiers.refetch()
    live.refetch()
    high.refetch()
    brain.refetch()
  }, [qualifiers, live, high, brain])

  return {
    rows,
    entries: brain.entries,
    loading: brain.loading || qualifiers.loading,
    error: qualifiers.error ?? brain.error ?? null,
    refetch
  }
}
