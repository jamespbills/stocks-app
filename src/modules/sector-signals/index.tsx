import { useState, useEffect, useCallback, useRef, type ReactElement } from 'react'
import type {
  Strategy,
  SectorGroup,
  ComboRow,
  ComboDetail,
  ComboTicker,
  PendingChange
} from './types'
import { fromViewSignal, CRITERION_NAMES } from './types'
import {
  MATRIX_STATS_PLAY_SQL,
  MATRIX_STATS_PLAY2_SQL,
  ACTIVE_MATRIX_PLAY_SQL,
  ACTIVE_MATRIX_PLAY2_SQL,
  COMBO_TICKERS_PLAY_SQL,
  COMBO_TICKERS_PLAY2_SQL,
  UPSERT_ACTIVE_PLAY_SQL,
  UPSERT_ACTIVE_PLAY2_SQL,
  SELECT_COMBO_NOTE_SQL,
  SELECT_TICKER_NOTES_SQL
} from './queries'
import { MatrixHeader } from './MatrixHeader'
import { SectorMatrix } from './SectorMatrix'
import { ComboDetailPanel } from './ComboDetailPanel'
import { PendingFooter } from './PendingFooter'
import { AppliedToast } from './AppliedToast'

// ─── Raw DB row shapes ────────────────────────────────────────────────────────

interface StatsRow {
  sector: string
  missed_criterion: number
  criterion_name: string
  unique_tickers: number
  avg_roi: number | null
  signal: string | null
}

interface ActiveRow {
  sector: string
  criterion_code: number
  is_active: number
}

interface TickerRow {
  ticker: string
  roi: number | null
  report_date: string | null
}

interface NoteRow {
  note: string | null
}

interface TickerNoteRow {
  ticker: string
  note: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pendingKey(strategy: Strategy, sector: string, criterionCode: number): string {
  return `${strategy}:${sector}:${criterionCode}`
}

function buildGroups(
  statsRows: StatsRow[],
  activeRows: ActiveRow[],
  pendingChanges: Map<string, PendingChange>,
  strategy: Strategy
): SectorGroup[] {
  const activeMap = new Map<string, boolean>()
  for (const r of activeRows) {
    activeMap.set(`${r.sector}:${r.criterion_code}`, r.is_active === 1)
  }

  // Collect all sector/criterion pairs
  const comboMap = new Map<string, ComboRow>()

  for (const r of statsRows) {
    const key = `${r.sector}:${r.missed_criterion}`
    const isActive = activeMap.get(key) ?? false
    const pending = pendingChanges.get(pendingKey(strategy, r.sector, r.missed_criterion)) ?? null
    comboMap.set(key, {
      sector: r.sector,
      criterionCode: r.missed_criterion,
      criterionName:
        r.criterion_name ?? CRITERION_NAMES[r.missed_criterion] ?? String(r.missed_criterion),
      nTickers: r.unique_tickers ?? 0,
      avgRoi: r.avg_roi !== null && r.avg_roi !== undefined ? Number(r.avg_roi) : null,
      winRate: null,
      signalStrength: fromViewSignal(r.signal),
      isActive,
      pendingActive: pending !== null ? pending.targetActive : null
    })
  }

  // Also include dim table rows with no stats evidence
  for (const r of activeRows) {
    const key = `${r.sector}:${r.criterion_code}`
    if (!comboMap.has(key)) {
      const pending = pendingChanges.get(pendingKey(strategy, r.sector, r.criterion_code)) ?? null
      comboMap.set(key, {
        sector: r.sector,
        criterionCode: r.criterion_code,
        criterionName: CRITERION_NAMES[r.criterion_code] ?? String(r.criterion_code),
        nTickers: 0,
        avgRoi: null,
        winRate: null,
        signalStrength: 'WEAK',
        isActive: r.is_active === 1,
        pendingActive: pending !== null ? pending.targetActive : null
      })
    }
  }

  // Group by sector, sorted alphabetically
  const sectorMap = new Map<string, ComboRow[]>()
  for (const combo of comboMap.values()) {
    const list = sectorMap.get(combo.sector) ?? []
    list.push(combo)
    sectorMap.set(combo.sector, list)
  }

  const sectors = Array.from(sectorMap.keys()).sort()
  return sectors.map((sector) => ({
    sector,
    combos: (sectorMap.get(sector) ?? []).sort((a, b) => {
      if (a.avgRoi === null && b.avgRoi === null) return 0
      if (a.avgRoi === null) return 1
      if (b.avgRoi === null) return -1
      return b.avgRoi - a.avgRoi
    }),
    isExpanded: false
  }))
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SectorSignals(): ReactElement {
  const [strategy, setStrategy] = useState<Strategy>('play')
  const [groups, setGroups] = useState<SectorGroup[]>([])
  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingChange>>(new Map())
  const [selectedCombo, setSelectedCombo] = useState<{
    sector: string
    criterionCode: number
  } | null>(null)
  const [comboDetail, setComboDetail] = useState<ComboDetail | null>(null)
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [appliedCount, setAppliedCount] = useState<number | null>(null)

  const latestStatsRef = useRef<StatsRow[]>([])
  const latestActiveRef = useRef<ActiveRow[]>([])
  const [fetchTick, setFetchTick] = useState(0)
  const pendingChangesRef = useRef(pendingChanges)
  const lastStrategyRef = useRef<Strategy>(strategy)

  // Sync ref after every render so .then() callbacks always see latest pending
  useEffect(() => {
    pendingChangesRef.current = pendingChanges
  })

  // ── Fetch matrix data ──────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false
    const statsSql = strategy === 'play' ? MATRIX_STATS_PLAY_SQL : MATRIX_STATS_PLAY2_SQL
    const activeSql = strategy === 'play' ? ACTIVE_MATRIX_PLAY_SQL : ACTIVE_MATRIX_PLAY2_SQL

    Promise.all([
      window.electronAPI.db.query(statsSql) as Promise<StatsRow[]>,
      window.electronAPI.db.query(activeSql) as Promise<ActiveRow[]>
    ])
      .then(([statsRows, activeRows]) => {
        if (cancelled) return
        latestStatsRef.current = statsRows
        latestActiveRef.current = activeRows
        const built = buildGroups(statsRows, activeRows, pendingChangesRef.current, strategy)
        setGroups((prev) => {
          const isStrategyChange = strategy !== lastStrategyRef.current
          lastStrategyRef.current = strategy
          const prevExpanded =
            !isStrategyChange && prev.length > 0
              ? new Set(prev.filter((g) => g.isExpanded).map((g) => g.sector))
              : null
          return built.map((g) => ({
            ...g,
            isExpanded: prevExpanded !== null ? prevExpanded.has(g.sector) : false
          }))
        })
      })
      .catch(() => {
        // Leave groups unchanged on error
      })

    return () => {
      cancelled = true
    }
  }, [strategy, fetchTick])

  const fetchMatrix = useCallback(() => {
    setFetchTick((t) => t + 1)
  }, [])

  // ── Rebuild groups when pending changes update ─────────────────────────────

  const rebuildGroups = useCallback((newPending: Map<string, PendingChange>, strat: Strategy) => {
    const built = buildGroups(latestStatsRef.current, latestActiveRef.current, newPending, strat)
    setGroups((prev) =>
      built.map((g) => {
        const match = prev.find((p) => p.sector === g.sector)
        return { ...g, isExpanded: match ? match.isExpanded : g.isExpanded }
      })
    )
  }, [])

  // ── Strategy switch guard ──────────────────────────────────────────────────

  const handleStrategyChange = useCallback(
    (newStrat: Strategy) => {
      if (newStrat === strategy) return
      if (pendingChanges.size > 0) {
        const label = strategy === 'play' ? 'play · = 12' : 'play_2 · = 13'
        const ok = window.confirm(
          `You have ${pendingChanges.size} pending ${pendingChanges.size === 1 ? 'change' : 'changes'} for ${label}. Switch without applying? Changes will be discarded.`
        )
        if (!ok) return
        setPendingChanges(new Map())
      }
      setSelectedCombo(null)
      setComboDetail(null)
      setApplyError(null)
      setStrategy(newStrat)
    },
    [strategy, pendingChanges]
  )

  // ── Expand / collapse ──────────────────────────────────────────────────────

  const handleToggleExpand = useCallback((sector: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.sector === sector ? { ...g, isExpanded: !g.isExpanded } : g))
    )
  }, [])

  // ── Combo click → detail panel ─────────────────────────────────────────────

  const handleComboClick = useCallback(
    async (sector: string, criterionCode: number) => {
      setSelectedCombo({ sector, criterionCode })
      setComboDetail(null) // clear previous; panel won't mount until fetch completes with real data

      const combo = groups
        .find((g) => g.sector === sector)
        ?.combos.find((c) => c.criterionCode === criterionCode)

      if (!combo) return

      const criterionName =
        combo.criterionName ?? CRITERION_NAMES[criterionCode] ?? String(criterionCode)

      try {
        const tickerSql = strategy === 'play' ? COMBO_TICKERS_PLAY_SQL : COMBO_TICKERS_PLAY2_SQL

        const [tickerRows, noteRows, tickerNoteRows] = await Promise.all([
          window.electronAPI.db.query(tickerSql, [sector, criterionCode]) as Promise<TickerRow[]>,
          window.electronAPI.db.query(SELECT_COMBO_NOTE_SQL, [
            strategy,
            sector,
            criterionCode
          ]) as Promise<NoteRow[]>,
          window.electronAPI.db.query(SELECT_TICKER_NOTES_SQL, [
            strategy,
            sector,
            criterionCode
          ]) as Promise<TickerNoteRow[]>
        ])

        const noteMap = new Map<string, string>()
        for (const r of tickerNoteRows) {
          noteMap.set(r.ticker, r.note ?? '')
        }

        const tickers: ComboTicker[] = tickerRows.map((r) => ({
          ticker: r.ticker,
          roi: r.roi !== null && r.roi !== undefined ? Number(r.roi) : null,
          reportDate: r.report_date
            ? (r.report_date as unknown) instanceof Date
              ? (r.report_date as unknown as Date).toISOString()
              : String(r.report_date)
            : null,
          note: noteMap.get(r.ticker) ?? ''
        }))

        const withReturns = tickers.filter((t) => t.roi !== null)
        const winRate =
          withReturns.length > 0
            ? Math.round(
                (withReturns.filter((t) => (t.roi ?? 0) > 0).length / withReturns.length) * 100
              )
            : null

        setComboDetail({
          sector,
          criterionCode,
          criterionName,
          nTickers: combo.nTickers,
          avgRoi: combo.avgRoi,
          winRate,
          signalStrength: combo.signalStrength,
          isActive: combo.isActive,
          comboNote: noteRows[0]?.note ?? '',
          tickers
        })
      } catch {
        // Detail panel stays with empty tickers
      }
    },
    [groups, strategy]
  )

  // ── Toggle a combo's active state (queue a pending change) ─────────────────

  const handleComboToggle = useCallback(
    (sector: string, criterionCode: number) => {
      const combo = groups
        .find((g) => g.sector === sector)
        ?.combos.find((c) => c.criterionCode === criterionCode)
      if (!combo) return

      const key = pendingKey(strategy, sector, criterionCode)
      const newPending = new Map(pendingChanges)

      const currentTarget = combo.pendingActive !== null ? combo.pendingActive : combo.isActive

      // If toggling back to the current DB state, remove the pending change
      const newTarget = !currentTarget
      if (newTarget === combo.isActive && combo.pendingActive !== null) {
        newPending.delete(key)
      } else {
        newPending.set(key, { strategy, sector, criterionCode, targetActive: newTarget })
      }

      setPendingChanges(newPending)
      rebuildGroups(newPending, strategy)
      setApplyError(null)
    },
    [groups, strategy, pendingChanges, rebuildGroups]
  )

  // ── Apply ──────────────────────────────────────────────────────────────────

  const handleApply = useCallback(async () => {
    if (applying || pendingChanges.size === 0) return
    setApplying(true)
    setApplyError(null)

    const count = pendingChanges.size
    try {
      for (const change of pendingChanges.values()) {
        const sql = change.strategy === 'play' ? UPSERT_ACTIVE_PLAY_SQL : UPSERT_ACTIVE_PLAY2_SQL
        await window.electronAPI.db.query(sql, [
          change.sector,
          change.criterionCode,
          change.targetActive ? 1 : 0
        ])
      }

      await window.electronAPI.db.callProc('calculate_all_sector_play_ratings')

      setPendingChanges(new Map())
      setAppliedCount(count)
      setApplyError(null)
      fetchMatrix()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setApplyError(msg)
    } finally {
      setApplying(false)
    }
  }, [applying, pendingChanges, fetchMatrix])

  const handleDiscard = useCallback(() => {
    setPendingChanges(new Map())
    rebuildGroups(new Map(), strategy)
    setApplyError(null)
  }, [rebuildGroups, strategy])

  // ── Keyboard: Escape closes detail panel ──────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && selectedCombo) {
        setSelectedCombo(null)
        setComboDetail(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedCombo])

  // ── Derived counts ────────────────────────────────────────────────────────

  const totalActive = groups.reduce(
    (sum, g) =>
      sum +
      g.combos.filter((c) => (c.pendingActive !== null ? c.pendingActive : c.isActive)).length,
    0
  )
  const totalTracked = groups.reduce((sum, g) => sum + g.combos.length, 0)
  const totalSectors = groups.length

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--color-bg-base)'
      }}
    >
      <MatrixHeader
        strategy={strategy}
        onStrategyChange={handleStrategyChange}
        totalActive={totalActive}
        totalTracked={totalTracked}
        totalSectors={totalSectors}
        onRefresh={fetchMatrix}
      />

      {groups.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-muted)',
            fontSize: 'var(--text-sm)'
          }}
        >
          Loading…
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <SectorMatrix
            groups={groups}
            selectedCombo={selectedCombo}
            onToggleExpand={handleToggleExpand}
            onComboClick={handleComboClick}
            onComboToggle={handleComboToggle}
          />

          {selectedCombo && !comboDetail && (
            <div
              style={{
                width: 400,
                flexShrink: 0,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-bg-elevated)',
                borderLeft: '1px solid var(--color-border-default)',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--text-sm)'
              }}
            >
              Loading…
            </div>
          )}

          {selectedCombo && comboDetail && (
            <ComboDetailPanel
              key={`${selectedCombo.sector}:${selectedCombo.criterionCode}`}
              detail={comboDetail}
              strategy={strategy}
              onClose={() => {
                setSelectedCombo(null)
                setComboDetail(null)
              }}
              onNoteChange={(note) =>
                setComboDetail((prev) => (prev ? { ...prev, comboNote: note } : prev))
              }
              onTickerNoteChange={(ticker, note) =>
                setComboDetail((prev) =>
                  prev
                    ? {
                        ...prev,
                        tickers: prev.tickers.map((t) => (t.ticker === ticker ? { ...t, note } : t))
                      }
                    : prev
                )
              }
            />
          )}
        </div>
      )}

      {appliedCount !== null && (
        <AppliedToast count={appliedCount} durationMs={6000} onDone={() => setAppliedCount(null)} />
      )}

      {appliedCount === null && (pendingChanges.size > 0 || applyError !== null) && (
        <PendingFooter
          count={pendingChanges.size}
          applying={applying}
          error={applyError}
          onApply={handleApply}
          onDiscard={handleDiscard}
        />
      )}
    </div>
  )
}
