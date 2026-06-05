import { useState, useEffect, useMemo, type ReactElement, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { usePlayThresholds } from '../../lib/playThresholds'
import type { Strategy, ComboLeaderboardRow } from './types'
import { CRITERION_NAMES, signalStrength } from './types'
import { COMBO_LEADERBOARD_PLAY_SQL, COMBO_LEADERBOARD_PLAY2_SQL } from './queries'
import { SignalBadge } from './SignalBadge'

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey =
  | 'nPlays'
  | 'nUniqueTickers'
  | 'wins'
  | 'winPct'
  | 'avgRoi'
  | 'medianRoi'
  | 'cumulativeRoi'

interface Props {
  initialStrategy: Strategy
  onClose: () => void
}

interface LeaderboardDbRow {
  sector: string
  criterion_code: number | string
  n_plays: number | string
  n_unique_tickers: number | string
  wins: number | string
  losses: number | string
  avg_roi: number | string | null
  cumulative_roi: number | string | null
  median_roi: number | string | null
  is_active: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNum(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

function mapRow(r: LeaderboardDbRow): ComboLeaderboardRow {
  const criterionCode = Math.round(Number(r.criterion_code))
  const nPlays = Math.round(Number(r.n_plays) || 0)
  const nUniqueTickers = Math.round(Number(r.n_unique_tickers) || 0)
  const wins = Math.round(Number(r.wins) || 0)
  const losses = Math.round(Number(r.losses) || 0)
  const avgRoi = toNum(r.avg_roi)
  const cumulativeRoi = toNum(r.cumulative_roi)
  const medianRoi = toNum(r.median_roi)
  const total = wins + losses
  return {
    sector: r.sector,
    criterionCode,
    criterionName: CRITERION_NAMES[criterionCode] ?? String(criterionCode),
    nPlays,
    nUniqueTickers,
    wins,
    losses,
    winPct: total > 0 ? wins / total : null,
    avgRoi,
    medianRoi,
    cumulativeRoi,
    signalStrength: signalStrength(nUniqueTickers, avgRoi),
    isActive: r.is_active === 1
  }
}

function fmt(v: number | null, signed = false, digits = 1): string {
  if (v === null) return '—'
  const pct = v * 100
  const sign = signed && pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(digits)}%`
}

function roiColor(v: number | null): string {
  if (v === null) return 'var(--color-text-muted)'
  return v >= 0 ? 'var(--color-up)' : 'var(--color-down)'
}

function winPctColor(v: number | null): string {
  if (v === null) return 'var(--color-text-muted)'
  return v >= 0.5 ? 'var(--color-up)' : 'var(--color-down)'
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_LABELS: Record<SortKey, string> = {
  nPlays: 'plays',
  nUniqueTickers: 'tickers',
  wins: 'wins',
  winPct: 'win%',
  avgRoi: 'avg ROI',
  medianRoi: 'median',
  cumulativeRoi: 'cumulative return'
}

const GRID_COLS = '1fr 1.2fr 56px 64px 52px 60px 64px 80px 72px 88px 96px 52px'

const HDR_BASE: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  userSelect: 'none',
  display: 'flex',
  alignItems: 'center',
  padding: '0 4px',
  borderRadius: 'var(--radius-xs)'
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ComboLeaderboardModal({ initialStrategy, onClose }: Props): ReactElement {
  const thresholds = usePlayThresholds()
  const [strategy, setStrategy] = useState<Strategy>(initialStrategy)
  // loadedStrategy tracks which strategy's data is currently in `rows`.
  // isLoading is derived: true while loadedStrategy !== strategy.
  const [loadedStrategy, setLoadedStrategy] = useState<Strategy | null>(null)
  const [rows, setRows] = useState<ComboLeaderboardRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('cumulativeRoi')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')

  const isLoading = loadedStrategy !== strategy

  useEffect(() => {
    let cancelled = false
    const sql = strategy === 'play' ? COMBO_LEADERBOARD_PLAY_SQL : COMBO_LEADERBOARD_PLAY2_SQL
    const nearMiss = strategy === 'play' ? thresholds.play.nearMiss : thresholds.play_2.nearMiss

    ;(window.electronAPI.db.query(sql, [nearMiss]) as Promise<LeaderboardDbRow[]>)
      .then((dbRows) => {
        if (cancelled) return
        setRows(dbRows.map(mapRow))
        setError(null)
        setLoadedStrategy(strategy)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
        setLoadedStrategy(strategy)
      })

    return () => {
      cancelled = true
    }
  }, [strategy, thresholds.play.nearMiss, thresholds.play_2.nearMiss])

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function handleSort(key: SortKey): void {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const av = a[sortKey] as number | null
        const bv = b[sortKey] as number | null
        if (av === null && bv === null) return 0
        if (av === null) return 1
        if (bv === null) return -1
        return sortDir === 'desc' ? bv - av : av - bv
      }),
    [rows, sortKey, sortDir]
  )

  function hdrSort(
    key: SortKey,
    justify: CSSProperties['justifyContent'] = 'flex-end'
  ): CSSProperties {
    const active = sortKey === key
    return {
      ...HDR_BASE,
      justifyContent: justify,
      cursor: 'pointer',
      color: active ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
      background: active ? 'var(--color-interactive-active)' : 'transparent'
    }
  }

  function hdrStatic(justify: CSSProperties['justifyContent'] = 'flex-end'): CSSProperties {
    return { ...HDR_BASE, justifyContent: justify, color: 'var(--color-text-muted)' }
  }

  function sortIndicator(key: SortKey): string {
    if (sortKey !== key) return ''
    return sortDir === 'desc' ? ' ▼' : ' ▲'
  }

  const modal = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(1000px, calc(100vw - 48px))',
          maxHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-bg-overlay)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          overflow: 'hidden'
        }}
      >
        {/* ── Modal header ───────────────────────────────────── */}
        <div
          style={{
            padding: '14px 20px 12px',
            borderBottom: '1px solid var(--color-border-default)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 'var(--font-medium)',
                color: 'var(--color-text-primary)'
              }}
            >
              Signal Rankings
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Strategy tabs */}
              <div
                style={{
                  display: 'flex',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden'
                }}
              >
                {(['play', 'play_2'] as Strategy[]).map((s) => {
                  const active = strategy === s
                  return (
                    <button
                      key={s}
                      onClick={() => setStrategy(s)}
                      style={{
                        padding: '3px 10px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11.5,
                        fontWeight: 'var(--font-medium)',
                        color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                        background: active ? 'var(--color-interactive-active)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition:
                          'background var(--transition-fast), color var(--transition-fast)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {s === 'play'
                        ? `play · = ${thresholds.play.nearMiss}`
                        : `play_2 · = ${thresholds.play_2.nearMiss}`}
                    </button>
                  )
                })}
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-default)',
                  background: 'transparent',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  fontSize: 16,
                  transition: 'color var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Sub-line */}
          {!isLoading && !error && (
            <div
              style={{
                marginTop: 4,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-text-muted)'
              }}
            >
              {sorted.length} combo{sorted.length !== 1 ? 's' : ''} · sorted by{' '}
              {SORT_LABELS[sortKey]} {sortDir === 'desc' ? '↓' : '↑'}
            </div>
          )}
        </div>

        {/* ── Scrollable body ─────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
          {isLoading && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 200,
                color: 'var(--color-text-muted)',
                fontSize: 12.5
              }}
            >
              Loading…
            </div>
          )}

          {!isLoading && error && (
            <div
              style={{
                padding: '24px 20px',
                fontSize: 12,
                color: 'var(--color-down)',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {error}
            </div>
          )}

          {!isLoading && !error && (
            <>
              {/* Sticky column headers */}
              <div
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  background: 'var(--color-bg-overlay)',
                  borderBottom: '1px solid var(--color-border-subtle)',
                  display: 'grid',
                  gridTemplateColumns: GRID_COLS,
                  padding: '7px 20px',
                  gap: 0
                }}
              >
                <div style={hdrStatic('flex-start')}>SECTOR</div>
                <div style={hdrStatic('flex-start')}>CRITERION</div>
                <div style={hdrSort('nPlays')} onClick={() => handleSort('nPlays')}>
                  PLAYS{sortIndicator('nPlays')}
                </div>
                <div style={hdrSort('nUniqueTickers')} onClick={() => handleSort('nUniqueTickers')}>
                  TICKERS{sortIndicator('nUniqueTickers')}
                </div>
                <div style={hdrSort('wins')} onClick={() => handleSort('wins')}>
                  WINS{sortIndicator('wins')}
                </div>
                <div style={hdrStatic()}>LOSSES</div>
                <div style={hdrSort('winPct')} onClick={() => handleSort('winPct')}>
                  WIN%{sortIndicator('winPct')}
                </div>
                <div style={hdrSort('avgRoi')} onClick={() => handleSort('avgRoi')}>
                  AVG ROI{sortIndicator('avgRoi')}
                </div>
                <div style={hdrSort('medianRoi')} onClick={() => handleSort('medianRoi')}>
                  MEDIAN{sortIndicator('medianRoi')}
                </div>
                <div
                  style={hdrSort('cumulativeRoi')}
                  onClick={() => handleSort('cumulativeRoi')}
                  title="Cumulative Return — sum of all 1Y returns for this combo"
                >
                  CUMUL{sortIndicator('cumulativeRoi')}
                </div>
                <div style={hdrStatic('center')}>SIGNAL</div>
                <div style={hdrStatic('center')}>ACTIVE</div>
              </div>

              {/* Data rows */}
              {sorted.map((row, i) => {
                const baseBg = i % 2 === 1 ? 'rgba(255,255,255,0.016)' : 'transparent'
                const mono: CSSProperties = {
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  textAlign: 'right'
                }
                return (
                  <div
                    key={`${row.sector}:${row.criterionCode}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: GRID_COLS,
                      padding: '0 20px',
                      height: 34,
                      alignItems: 'center',
                      background: baseBg,
                      borderBottom: '1px solid var(--color-border-subtle)',
                      transition: 'background var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLDivElement).style.background =
                        'var(--color-interactive-hover)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLDivElement).style.background = baseBg
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12.5,
                        color: 'var(--color-text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        paddingRight: 8
                      }}
                    >
                      {row.sector}
                    </span>

                    <span
                      style={{
                        fontSize: 12.5,
                        color: 'var(--color-text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        paddingRight: 8
                      }}
                    >
                      {row.criterionName}
                    </span>

                    <span style={{ ...mono, color: 'var(--color-text-muted)' }}>{row.nPlays}</span>

                    <span style={{ ...mono, color: 'var(--color-text-muted)' }}>
                      {row.nUniqueTickers}
                    </span>

                    <span style={{ ...mono, color: 'var(--color-up)' }}>{row.wins}</span>

                    <span style={{ ...mono, color: 'var(--color-down)' }}>{row.losses}</span>

                    <span style={{ ...mono, color: winPctColor(row.winPct) }}>
                      {row.winPct !== null ? `${Math.round(row.winPct * 100)}%` : '—'}
                    </span>

                    <span style={{ ...mono, color: roiColor(row.avgRoi) }}>
                      {fmt(row.avgRoi, true)}
                    </span>

                    <span style={{ ...mono, color: roiColor(row.medianRoi) }}>
                      {fmt(row.medianRoi, true)}
                    </span>

                    <span style={{ ...mono, color: roiColor(row.cumulativeRoi) }}>
                      {fmt(row.cumulativeRoi, true, 0)}
                    </span>

                    <span style={{ display: 'flex', justifyContent: 'center' }}>
                      <SignalBadge kind={row.signalStrength} />
                    </span>

                    <span style={{ display: 'flex', justifyContent: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: row.isActive ? 'var(--color-up)' : 'rgba(255,255,255,0.18)'
                        }}
                      />
                    </span>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body) as ReactElement
}
