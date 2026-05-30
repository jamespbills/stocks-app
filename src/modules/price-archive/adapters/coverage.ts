import { useMemo } from 'react'
import { useIpcQuery } from '../../../hooks/useIpcQuery'
import { formatDate } from '../../../lib/format'
import { COVERAGE_TABLE_SQL } from '../queries'
import type { ClaimSource, CoverageRow, CoverageStatus } from '../types'

interface RawCoverageRow {
  ticker: string
  sources: string | null
  target_from: Date | string | null
  target_to: Date | string | null
  first_held: Date | string | null
  last_held: Date | string | null
  bar_count: number | string
  manual_bar_count: number | string
  last_run_at: Date | string | null
  note: string | null
}

// Non-trading days mean held ranges never align exactly to the target window;
// tolerate a few days of slack before calling a ticker partial / stale.
const SLACK_DAYS = 5
const DAY_MS = 86_400_000

function toIso(value: Date | string | null): string | null {
  if (value === null) return null
  const iso = formatDate(value, 'iso', '')
  return iso === '' ? null : iso
}

function parseSources(raw: string | null): ClaimSource[] {
  if (!raw) return []
  return raw.split(',').map((s) => s.trim()) as ClaimSource[]
}

function diffDays(a: string, b: string): number {
  return (new Date(a).getTime() - new Date(b).getTime()) / DAY_MS
}

function deriveStatus(
  barCount: number,
  targetFrom: string | null,
  targetTo: string | null,
  firstHeld: string | null,
  lastHeld: string | null,
  lastRunAt: string | null,
  staleAfterDays: number
): CoverageStatus {
  if (barCount === 0 || firstHeld === null || lastHeld === null) return 'missing'

  const todayIso = formatDate(new Date(), 'iso')
  // A target end in the future can't be filled yet (recent report + trail not elapsed),
  // so treat it like an ongoing window: expected coverage only ever runs up to today.
  const futureEnd = targetTo !== null && targetTo > todayIso
  const ongoing = targetTo === null || futureEnd
  const effectiveTo = !ongoing && targetTo !== null ? targetTo : todayIso

  // Held range must cover the target window (allowing slack for non-trading days).
  const headGap = targetFrom !== null && diffDays(firstHeld, targetFrom) > SLACK_DAYS
  const tailGap = diffDays(effectiveTo, lastHeld) > SLACK_DAYS
  if (headGap || tailGap) return 'partial'

  // A fully-covered closed window is never stale; only ongoing (incl. future-end) targets can.
  if (ongoing) {
    const since = lastRunAt ?? lastHeld
    if (diffDays(todayIso, since) > staleAfterDays) return 'stale'
  }
  return 'fresh'
}

function toCoverageRow(r: RawCoverageRow, staleAfterDays: number): CoverageRow {
  const targetFrom = toIso(r.target_from)
  const targetTo = toIso(r.target_to)
  const firstHeld = toIso(r.first_held)
  const lastHeld = toIso(r.last_held)
  const barCount = Number(r.bar_count)
  const lastRunAt = toIso(r.last_run_at)
  return {
    ticker: r.ticker,
    sources: parseSources(r.sources),
    targetFrom,
    targetTo,
    firstHeld,
    lastHeld,
    barCount,
    manualBarCount: Number(r.manual_bar_count),
    lastRunAt,
    status: deriveStatus(
      barCount,
      targetFrom,
      targetTo,
      firstHeld,
      lastHeld,
      lastRunAt,
      staleAfterDays
    ),
    note: r.note
  }
}

export interface CoverageQuery {
  data: CoverageRow[] | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useCoverage(staleAfterDays: number): CoverageQuery {
  const query = useIpcQuery<RawCoverageRow[]>(COVERAGE_TABLE_SQL)
  const data = useMemo(
    () => (query.data ? query.data.map((r) => toCoverageRow(r, staleAfterDays)) : null),
    [query.data, staleAfterDays]
  )
  return { data, loading: query.loading, error: query.error, refetch: query.refetch }
}
