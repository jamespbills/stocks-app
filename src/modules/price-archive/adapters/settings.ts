import { useMemo } from 'react'
import { useIpcQuery } from '../../../hooks/useIpcQuery'
import { formatDate } from '../../../lib/format'
import { SETTINGS_SQL, UPDATE_SETTINGS_SQL } from '../queries'
import type { ArchiveSettings } from '../types'

interface RawSettingsRow {
  play_lead_days: number | string
  play_trail_days: number | string
  stale_after_days: number | string
  isa_history_start: Date | string | null
  manual_watch_lookback_days: number | string
}

export const DEFAULT_SETTINGS: ArchiveSettings = {
  playLeadDays: 90,
  playTrailDays: 365,
  staleAfterDays: 7,
  isaHistoryStart: '2016-07-01',
  manualWatchLookbackDays: 730
}

function toSettings(r: RawSettingsRow): ArchiveSettings {
  return {
    playLeadDays: Number(r.play_lead_days),
    playTrailDays: Number(r.play_trail_days),
    staleAfterDays: Number(r.stale_after_days),
    isaHistoryStart: formatDate(r.isa_history_start, 'iso', DEFAULT_SETTINGS.isaHistoryStart),
    manualWatchLookbackDays: Number(r.manual_watch_lookback_days)
  }
}

export interface SettingsQuery {
  data: ArchiveSettings | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useArchiveSettings(): SettingsQuery {
  const query = useIpcQuery<RawSettingsRow[]>(SETTINGS_SQL)
  const data = useMemo(
    () => (query.data && query.data.length > 0 ? toSettings(query.data[0]) : null),
    [query.data]
  )
  return { data, loading: query.loading, error: query.error, refetch: query.refetch }
}

// Persist the five archive knobs. Changing lead/trail reshapes vw_archive_coverage_target
// (it reads these live), so callers should refetch coverage after a successful save.
export async function saveSettings(s: ArchiveSettings): Promise<void> {
  await window.electronAPI.db.query(UPDATE_SETTINGS_SQL, [
    s.playLeadDays,
    s.playTrailDays,
    s.staleAfterDays,
    s.isaHistoryStart,
    s.manualWatchLookbackDays
  ])
}
