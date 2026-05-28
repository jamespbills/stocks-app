import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useReducer,
  useRef,
  type ReactElement
} from 'react'
import { useIpcQuery } from '../../hooks/useIpcQuery'
import { useRouter } from '../../hooks/use-router'
import { CalendarGrid } from './CalendarGrid'
import { UpcomingPanel } from './UpcomingPanel'
import { DateOverridesModal } from './DateOverridesModal'
import { ScriptsModal, type ScriptsModalInitial } from './ScriptsModal'
import { rowToEntry } from './types'
import type { CalendarRow, CalendarEntry, PopoverState } from './types'

const CALENDAR_SQL = `
  SELECT
    vec.ticker, dc.name AS company,
    COALESCE(ado.actual_date, vec.relevant_date) AS relevant_date,
    DATEDIFF(COALESCE(ado.actual_date, vec.relevant_date), CURDATE()) AS days_to_go,
    vec.is_already_reviewed, vec.is_past_grace_period,
    vec.meets_play_filter, vec.calendar_status, vec.urgency,
    vec.r_financial_year, vec.r_filing_identifier,
    vec.next_expected_filing, vec.estimated_release_date,
    vec.best_api_date, vec.r_play, vec.r_play_2,
    vec.p_play, vec.p_play_2,
    CASE WHEN ado.ticker IS NOT NULL THEN 1 ELSE 0 END AS has_override,
    ado.reason AS override_reason
  FROM view_earnings_calendar vec
  JOIN dim_companies dc USING (ticker)
  LEFT JOIN app_date_overrides ado USING (ticker)
  WHERE vec.is_past_grace_period = 0 AND vec.is_already_reviewed = 0 AND vec.meets_play_filter = 1
`

const SETTINGS_SQL = `
  SELECT setting_key, setting_value
  FROM app_settings
  WHERE setting_key = 'calendar.panelVisible'
`

const OVERRIDES_COUNT_SQL = `SELECT COUNT(*) AS count FROM app_date_overrides`

type PlayFilter = 'all' | 'plays'
type SettingsRow = { setting_key: string; setting_value: string | null }
type OverridesCountRow = { count: number }

interface NavState {
  year: number
  month: number
}
type NavAction = { type: 'prev' } | { type: 'next' } | { type: 'today' }

function navReducer(state: NavState, action: NavAction): NavState {
  if (action.type === 'prev') {
    return state.month === 0
      ? { year: state.year - 1, month: 11 }
      : { year: state.year, month: state.month - 1 }
  }
  if (action.type === 'next') {
    return state.month === 11
      ? { year: state.year + 1, month: 0 }
      : { year: state.year, month: state.month + 1 }
  }
  const t = new Date()
  return { year: t.getFullYear(), month: t.getMonth() }
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export default function ReportCalendar(): ReactElement {
  const { navigate } = useRouter()

  const { data: rows, refetch: refetchCalendar } = useIpcQuery<CalendarRow[]>(CALENDAR_SQL)
  const { data: settingsRows } = useIpcQuery<SettingsRow[]>(SETTINGS_SQL)
  const { data: overridesCountRows, refetch: refetchOverridesCount } =
    useIpcQuery<OverridesCountRow[]>(OVERRIDES_COUNT_SQL)
  const overridesCount = overridesCountRows?.[0]?.count ?? 0

  const now = new Date()
  const [nav, dispatchNav] = useReducer(navReducer, {
    year: now.getFullYear(),
    month: now.getMonth()
  })
  const [playFilter, setPlayFilter] = useState<PlayFilter>('all')
  const [panelVisible, setPanelVisible] = useState(true)
  const [popover, setPopover] = useState<PopoverState>(null)
  const [overridesOpen, setOverridesOpen] = useState(false)
  const [scriptsOpen, setScriptsOpen] = useState(false)
  const [scriptsInitial, setScriptsInitial] = useState<ScriptsModalInitial | undefined>(undefined)
  const settingsRestoredRef = useRef(false)

  // Restore panel visibility from settings (one-time on first load)
  useEffect(() => {
    if (settingsRestoredRef.current || !settingsRows) return
    const val = settingsRows.find((r) => r.setting_key === 'calendar.panelVisible')?.setting_value
    if (val !== undefined) {
      settingsRestoredRef.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPanelVisible(val !== 'false')
    } else {
      settingsRestoredRef.current = true
    }
  }, [settingsRows])

  // Keyboard shortcut Ctrl+\ to toggle panel
  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        setPanelVisible((v) => !v)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const togglePanel = useCallback(() => {
    setPanelVisible((v) => {
      const next = !v
      void window.electronAPI.db.query(
        `INSERT INTO app_settings (setting_key, setting_value) VALUES ('calendar.panelVisible', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [next ? 'true' : 'false']
      )
      return next
    })
  }, [])

  const prevMonth = useCallback(() => {
    dispatchNav({ type: 'prev' })
    setPopover(null)
  }, [])

  const nextMonth = useCallback(() => {
    dispatchNav({ type: 'next' })
    setPopover(null)
  }, [])

  const goToday = useCallback(() => {
    dispatchNav({ type: 'today' })
    setPopover(null)
  }, [])

  const handleGridEntryClick = useCallback((date: string, ticker: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setPopover((prev) =>
      prev?.kind === 'entry' &&
      prev.source === 'grid' &&
      prev.date === date &&
      prev.ticker === ticker
        ? null
        : { kind: 'entry', source: 'grid', date, ticker }
    )
  }, [])

  const handleUpcomingEntryClick = useCallback(
    (date: string, ticker: string, e: React.MouseEvent) => {
      e.stopPropagation()
      setPopover((prev) =>
        prev?.kind === 'entry' &&
        prev.source === 'upcoming' &&
        prev.date === date &&
        prev.ticker === ticker
          ? null
          : { kind: 'entry', source: 'upcoming', date, ticker }
      )
    },
    []
  )

  const handleDayClick = useCallback((date: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setPopover((prev) =>
      prev?.kind === 'day' && prev.date === date ? null : { kind: 'day', date }
    )
  }, [])

  const dismissPopover = useCallback(() => setPopover(null), [])

  const handleOverrideMutate = useCallback(() => {
    refetchCalendar()
    refetchOverridesCount()
  }, [refetchCalendar, refetchOverridesCount])

  const handleScriptsMutate = useCallback(() => {
    refetchCalendar()
  }, [refetchCalendar])

  const handleDisregardEntry = useCallback((entry: CalendarEntry) => {
    setPopover(null)
    setScriptsInitial({
      section: 'disregard',
      ticker: entry.ticker,
      year: entry.date.slice(0, 4),
      filing: entry.expectedFiling ?? 'A',
      date: entry.date
    })
    setScriptsOpen(true)
  }, [])

  const handleScriptsClose = useCallback(() => {
    setScriptsOpen(false)
    setScriptsInitial(undefined)
  }, [])

  // Derive all calendar entries from DB rows
  const allEntries = useMemo<CalendarEntry[]>(() => {
    if (!rows) return []
    return rows.flatMap((r) => {
      const e = rowToEntry(r)
      return e ? [e] : []
    })
  }, [rows])

  // Apply play filter
  const filteredEntries = useMemo<CalendarEntry[]>(() => {
    if (playFilter === 'all') return allEntries
    return allEntries.filter((e) => {
      const row = rows?.find((r) => r.ticker === e.ticker)
      return row?.meets_play_filter === 1
    })
  }, [allEntries, playFilter, rows])

  // Index all entries by date for O(1) grid lookup
  const entriesByDate = useMemo<Map<string, CalendarEntry[]>>(() => {
    const map = new Map<string, CalendarEntry[]>()
    for (const e of filteredEntries) {
      const existing = map.get(e.date) ?? []
      existing.push(e)
      map.set(e.date, existing)
    }
    return map
  }, [filteredEntries])

  // Upcoming panel: non-released entries (overdue + future), for all time
  const upcomingEntries = useMemo(
    () => filteredEntries.filter((e) => e.status !== 'released'),
    [filteredEntries]
  )

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--color-bg-base)' }}
      onClick={() => setPopover(null)}
    >
      {/* Module header */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 20px',
          height: 48,
          borderBottom: '1px solid var(--color-border-subtle)'
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
          Report Calendar
        </span>
      </div>

      {/* Calendar sub-header: month nav + filters */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 20px',
          borderBottom: '1px solid var(--color-border-subtle)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <NavButton onClick={prevMonth} dir="left" />
          <NavButton onClick={nextMonth} dir="right" />
        </div>

        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            minWidth: 160
          }}
        >
          {monthLabel(nav.year, nav.month)}
        </span>

        <button
          onClick={goToday}
          style={{
            padding: '3px 8px',
            borderRadius: 5,
            border: '1px solid var(--color-border-default)',
            background: 'transparent',
            fontSize: 11.5,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-muted)',
            cursor: 'pointer'
          }}
        >
          Today
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 28,
              padding: '0 8px',
              background: 'var(--color-bg-input)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 5,
              fontSize: 12.5
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: 0.4,
                fontFamily: 'inherit',
                flexShrink: 0
              }}
            >
              Play
            </span>
            <select
              value={playFilter}
              onChange={(e) => setPlayFilter(e.target.value as PlayFilter)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-primary)',
                fontSize: 12.5,
                fontFamily: 'inherit',
                cursor: 'pointer',
                outline: 'none',
                padding: 0
              }}
            >
              <option value="all">All scores</option>
              <option value="plays">Plays only</option>
            </select>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setOverridesOpen(true)
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: 5,
              border: '1px solid var(--color-border-strong)',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              fontSize: 12.5,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            Date overrides
            {overridesCount > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                  borderRadius: 8,
                  background: 'var(--color-warning-bg)',
                  color: 'var(--color-warning)',
                  fontSize: 10.5,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 500,
                  lineHeight: 1
                }}
              >
                {overridesCount}
              </span>
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setScriptsInitial(undefined)
              setScriptsOpen(true)
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: 5,
              border: '1px solid var(--color-border-strong)',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              fontSize: 12.5,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            Scripts
          </button>

          <button
            onClick={togglePanel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: 5,
              border: '1px solid var(--color-border-strong)',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              fontSize: 12.5,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            {panelVisible ? 'Hide upcoming' : 'Show upcoming'}
          </button>
        </div>
      </div>

      {/* Body: grid + optional upcoming panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <CalendarGrid
          year={nav.year}
          month={nav.month}
          entriesByDate={entriesByDate}
          popover={popover}
          onEntryClick={handleGridEntryClick}
          onDayClick={handleDayClick}
          onDismissPopover={dismissPopover}
          onNavigate={navigate}
          onDisregardEntry={handleDisregardEntry}
        />

        {panelVisible && (
          <UpcomingPanel
            entries={upcomingEntries}
            popover={popover}
            onEntryClick={handleUpcomingEntryClick}
            onDismissPopover={dismissPopover}
            onNavigate={navigate}
            onDisregardEntry={handleDisregardEntry}
          />
        )}
      </div>

      {overridesOpen && (
        <DateOverridesModal
          onClose={() => setOverridesOpen(false)}
          onMutate={handleOverrideMutate}
        />
      )}

      {scriptsOpen && (
        <ScriptsModal
          onClose={handleScriptsClose}
          onMutate={handleScriptsMutate}
          initial={scriptsInitial}
        />
      )}
    </div>
  )
}

function NavButton({ onClick, dir }: { onClick: () => void; dir: 'left' | 'right' }): ReactElement {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 26,
        height: 26,
        borderRadius: 5,
        border: 'none',
        background: 'transparent',
        color: 'var(--color-text-muted)',
        cursor: 'pointer',
        fontSize: 14
      }}
    >
      {dir === 'left' ? '‹' : '›'}
    </button>
  )
}
