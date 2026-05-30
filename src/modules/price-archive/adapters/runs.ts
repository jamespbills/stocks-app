import { useMemo } from 'react'
import { useIpcQuery } from '../../../hooks/useIpcQuery'
import { formatDate } from '../../../lib/format'
import { RUNS_LOG_SQL } from '../queries'
import type { PriceRun, PriceSource, RunStatus, TriggeredBy } from '../types'

interface RawRunRow {
  run_id: number
  ticker: string
  source: PriceSource
  requested_from: Date | string | null
  requested_to: Date | string | null
  rows_inserted: number | string
  rows_updated: number | string
  status: RunStatus
  error_message: string | null
  triggered_by: TriggeredBy
  started_at: Date | string | null
  finished_at: Date | string | null
}

function toIso(value: Date | string | null): string | null {
  if (value === null) return null
  const iso = formatDate(value, 'iso', '')
  return iso === '' ? null : iso
}

function toDateTime(value: Date | string | null): string | null {
  if (value === null) return null
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return null
  // local "YYYY-MM-DD HH:mm" — avoids the UTC shift of toISOString (lessons.md)
  const date = formatDate(d, 'iso')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${date} ${hh}:${mm}`
}

function toRun(r: RawRunRow): PriceRun {
  return {
    runId: r.run_id,
    ticker: r.ticker,
    source: r.source,
    requestedFrom: toIso(r.requested_from),
    requestedTo: toIso(r.requested_to),
    rowsInserted: Number(r.rows_inserted),
    rowsUpdated: Number(r.rows_updated),
    status: r.status,
    errorMessage: r.error_message,
    triggeredBy: r.triggered_by,
    startedAt: toDateTime(r.started_at),
    finishedAt: toDateTime(r.finished_at)
  }
}

export interface RunsQuery {
  data: PriceRun[] | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useRuns(): RunsQuery {
  const query = useIpcQuery<RawRunRow[]>(RUNS_LOG_SQL)
  const data = useMemo(() => (query.data ? query.data.map(toRun) : null), [query.data])
  return { data, loading: query.loading, error: query.error, refetch: query.refetch }
}
