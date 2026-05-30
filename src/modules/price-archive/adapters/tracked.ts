import { useMemo } from 'react'
import { useIpcQuery } from '../../../hooks/useIpcQuery'
import { formatDate } from '../../../lib/format'
import { SET_TRACKED_ACTIVE_SQL, TRACKED_LIST_SQL, UPSERT_TRACKED_SQL } from '../queries'
import type { TrackedSource, TrackedTicker } from '../types'

interface RawTrackedRow {
  id: number
  ticker: string
  source: TrackedSource
  cover_from: Date | string | null
  cover_to: Date | string | null
  reason: string | null
  is_active: number | boolean
}

function toIso(value: Date | string | null): string | null {
  if (value === null) return null
  const iso = formatDate(value, 'iso', '')
  return iso === '' ? null : iso
}

function toTracked(r: RawTrackedRow): TrackedTicker {
  return {
    id: r.id,
    ticker: r.ticker,
    source: r.source,
    coverFrom: toIso(r.cover_from),
    coverTo: toIso(r.cover_to),
    reason: r.reason,
    isActive: r.is_active === 1 || r.is_active === true
  }
}

export interface TrackedQuery {
  data: TrackedTicker[] | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useTrackedTickers(): TrackedQuery {
  const query = useIpcQuery<RawTrackedRow[]>(TRACKED_LIST_SQL)
  const data = useMemo(() => (query.data ? query.data.map(toTracked) : null), [query.data])
  return { data, loading: query.loading, error: query.error, refetch: query.refetch }
}

// Add or edit a manual-watch ticker. Source is always 'manual_watch' from this UI;
// ISA holdings are owned by the (future) Portfolio importer.
export async function saveTracked(t: {
  ticker: string
  coverFrom: string | null
  coverTo: string | null
  reason: string | null
  isActive: boolean
}): Promise<void> {
  await window.electronAPI.db.query(UPSERT_TRACKED_SQL, [
    t.ticker,
    'manual_watch',
    t.coverFrom,
    t.coverTo,
    t.reason,
    t.isActive ? 1 : 0
  ])
}

export async function setTrackedActive(id: number, active: boolean): Promise<void> {
  await window.electronAPI.db.query(SET_TRACKED_ACTIVE_SQL, [active ? 1 : 0, id])
}
