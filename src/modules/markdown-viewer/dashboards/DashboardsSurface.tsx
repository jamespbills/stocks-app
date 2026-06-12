// The Dashboards tab (wireframe-decisions → Markdown Reviews → "Dashboards"): the overview
// over the same GateRow universe the Reviews tab works on — Coverage answers "which
// qualifiers has my judgement not caught up with?", the Gate board regroups by verdict, and
// the Theme tracker (pulled forward into v1, 2026-06-12) shows each signal's current reach.
// Drill-ins (expanded ticker route, Reader) are breadcrumbed and return here.

import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { RefreshCw } from 'lucide-react'
import { Reader } from '../Reader'
import { TickerExpanded } from '../gate/TickerExpanded'
import { useGateData } from '../gate/useGateData'
import { useSignalLibrary } from '../adapters/useSignalLibrary'
import { buildSignalCards } from '../library/build-library'
import { buildCoverageRows, buildGateBoard, buildThemes } from './build-dashboards'
import { CoverageTable } from './CoverageTable'
import { DashCard } from './DashCard'
import { GateBoard } from './GateBoard'
import { ThemeTracker } from './ThemeTracker'

type DashView =
  | { kind: 'cards' }
  | { kind: 'reader'; relPath: string; from: 'cards' | { ticker: string } }
  | { kind: 'ticker'; ticker: string }

function Centered({ children }: { children: ReactElement | ReactElement[] }): ReactElement {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-2 text-center"
      style={{ padding: 'var(--space-6)' }}
    >
      {children}
    </div>
  )
}

export function DashboardsSurface(): ReactElement {
  const { rows, entries, loading: gateLoading, error, refetch } = useGateData()
  const library = useSignalLibrary()
  const [view, setView] = useState<DashView>({ kind: 'cards' })

  // Esc walks the ticker route back to the cards (mirrors the Reviews and Library tabs).
  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape' && view.kind === 'ticker') setView({ kind: 'cards' })
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [view])

  const coverage = useMemo(() => buildCoverageRows(rows), [rows])
  const board = useMemo(() => buildGateBoard(rows), [rows])
  const themes = useMemo(
    () => buildThemes(buildSignalCards(entries, library.signals, rows)),
    [entries, library.signals, rows]
  )

  const counts = useMemo(() => {
    const qualifiers = coverage.filter((r) => r.status !== 'unmatched')
    return {
      qualifiers: qualifiers.length,
      reviewed: qualifiers.filter((r) => r.hasReview).length,
      unmatched: coverage.length - qualifiers.length
    }
  }, [coverage])

  if (view.kind === 'reader') {
    const from = view.from
    return (
      <Reader
        key={view.relPath}
        relPath={view.relPath}
        backLabel={from === 'cards' ? 'Dashboards' : from.ticker}
        onNavigate={(relPath) => setView({ kind: 'reader', relPath, from })}
        onBack={() =>
          setView(from === 'cards' ? { kind: 'cards' } : { kind: 'ticker', ticker: from.ticker })
        }
      />
    )
  }

  if (view.kind === 'ticker') {
    const row = rows.find((r) => r.ticker === view.ticker)
    if (row) {
      return (
        <TickerExpanded
          row={row}
          entries={entries}
          backLabel="Dashboards"
          onBack={() => setView({ kind: 'cards' })}
          onOpenReader={(relPath) =>
            setView({ kind: 'reader', relPath, from: { ticker: row.ticker } })
          }
        />
      )
    }
    // Row vanished after a refetch — fall through to the cards.
  }

  if (error !== null) {
    return (
      <Centered>
        <span style={{ color: 'var(--color-down)' }}>Couldn’t load the dashboards.</span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          {error}
        </span>
      </Centered>
    )
  }

  if (gateLoading || library.loading) {
    return (
      <Centered>
        <span style={{ color: 'var(--color-text-muted)' }}>Loading dashboards…</span>
      </Centered>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Slim bar: counts + Re-scan (mirrors the Library's filter bar) */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px var(--space-5)',
          borderBottom: '1px solid var(--color-border-subtle)'
        }}
      >
        <span style={{ fontSize: 11.5, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {counts.qualifiers} qualifiers · {counts.reviewed} reviewed · {counts.unmatched} unmatched
        </span>
        <button
          onClick={refetch}
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 26,
            padding: '0 10px',
            background: 'transparent',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-secondary)',
            fontSize: 12,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <RefreshCw size={12} strokeWidth={2} aria-hidden />
          Re-scan
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--space-5)' }}>
        <DashCard
          title="Coverage"
          sub="Currently-qualified plays vs whether the brain has caught up"
        >
          {coverage.length > 0 ? (
            <CoverageTable
              rows={coverage}
              onOpenTicker={(ticker) => setView({ kind: 'ticker', ticker })}
            />
          ) : (
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              No qualifiers or ticker pages.
            </span>
          )}
        </DashCard>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16, marginTop: 16 }}>
          <DashCard title="Gate board" sub="Qualifiers grouped by verdict">
            <GateBoard
              columns={board}
              onOpenTicker={(ticker) => setView({ kind: 'ticker', ticker })}
            />
          </DashCard>

          <DashCard title="Theme tracker" sub="Each signal’s current flag reach across the brain">
            <ThemeTracker
              themes={themes}
              onOpenReader={(relPath) => setView({ kind: 'reader', relPath, from: 'cards' })}
            />
          </DashCard>
        </div>
      </div>
    </div>
  )
}
