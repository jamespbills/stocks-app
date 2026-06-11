import { useCallback, useEffect, useState, type ReactElement } from 'react'
import { ModuleHeader, type Surface } from './ModuleHeader'
import { Reader } from './Reader'
import { GateList } from './gate/GateList'
import { GatePanel } from './gate/GatePanel'
import { TickerExpanded } from './gate/TickerExpanded'
import { useGateData } from './gate/useGateData'
import type { View } from './types'

// The Reviews tab: qualifiers gate list + 420px slide-over (Approach D), with the panel's ↗
// (or Enter on the selected row) opening the expanded two-material ticker route (Approach C).
// Numeric and qualitative verdicts stay two separate, separately-sourced blocks everywhere —
// never blended. The Reader is reached from review stacks and in-brain links, and returns to
// wherever it was opened from. Library / Dashboards / Inbox stay placeholders.

const SURFACE_BLURB: Record<Exclude<Surface, 'reviews'>, string> = {
  library: 'Signal & play library — lessons as cards with live "currently flags" footers.',
  dashboards: 'Coverage + gate board — which qualifiers your judgement has not caught up with.',
  inbox: 'Drop zone, pending-in-raw, and the unmatched tray for new reviews.'
}

function Placeholder({ surface }: { surface: Exclude<Surface, 'reviews'> }): ReactElement {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-2 text-center"
      style={{ color: 'var(--color-text-muted)', padding: 'var(--space-6)' }}
    >
      <span style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-secondary)' }}>
        {surface.charAt(0).toUpperCase() + surface.slice(1)}
      </span>
      <span style={{ fontSize: 'var(--text-sm)', maxWidth: 420 }}>{SURFACE_BLURB[surface]}</span>
      <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
        coming in a later stage
      </span>
    </div>
  )
}

function ReviewsSurface(): ReactElement {
  const { rows, entries, loading, error } = useGateData()
  const [view, setView] = useState<View>({ kind: 'gate' })
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)

  // Escape: on the expanded ticker route, back to the gate list (selection preserved so the
  // panel re-opens); on the gate list, clear the slide-over selection.
  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if (e.key !== 'Escape') return
      if (view.kind === 'ticker') setView({ kind: 'gate' })
      else if (view.kind === 'gate') setSelectedTicker(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [view])

  const handleSelect = useCallback((ticker: string) => {
    setSelectedTicker((cur) => (cur === ticker ? null : ticker))
  }, [])

  const handleExpand = useCallback((ticker: string) => {
    setSelectedTicker(ticker)
    setView({ kind: 'ticker', ticker })
  }, [])

  if (view.kind === 'reader') {
    const from = view.from
    return (
      <Reader
        key={view.relPath}
        relPath={view.relPath}
        backLabel={from === 'gate' ? 'Reviews' : from.ticker}
        onNavigate={(relPath) => setView({ kind: 'reader', relPath, from })}
        onBack={() =>
          setView(from === 'gate' ? { kind: 'gate' } : { kind: 'ticker', ticker: from.ticker })
        }
      />
    )
  }

  if (error !== null) {
    return (
      <Centered>
        <span style={{ color: 'var(--color-down)' }}>Couldn’t load the gate.</span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          {error}
        </span>
      </Centered>
    )
  }

  if (loading) {
    return (
      <Centered>
        <span style={{ color: 'var(--color-text-muted)' }}>Loading gate…</span>
      </Centered>
    )
  }

  if (rows.length === 0) {
    return (
      <Centered>
        <span style={{ color: 'var(--color-text-secondary)' }}>No qualifiers or ticker pages.</span>
      </Centered>
    )
  }

  // Expanded two-material route (Approach C). If the ticker vanished after a refetch, fall
  // through to the gate list.
  if (view.kind === 'ticker') {
    const tickerRow = rows.find((r) => r.ticker === view.ticker)
    if (tickerRow) {
      return (
        <TickerExpanded
          row={tickerRow}
          entries={entries}
          onBack={() => setView({ kind: 'gate' })}
          onOpenReader={(relPath) =>
            setView({ kind: 'reader', relPath, from: { ticker: tickerRow.ticker } })
          }
        />
      )
    }
  }

  const selectedRow = selectedTicker ? rows.find((r) => r.ticker === selectedTicker) : undefined

  return (
    <div
      className="flex flex-1 min-h-0 overflow-hidden"
      onClick={() => setSelectedTicker(null)}
      style={{ height: '100%' }}
    >
      <div className="flex-1 min-w-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <GateList
          rows={rows}
          selectedTicker={selectedTicker}
          panelOpen={selectedRow !== undefined}
          onSelect={handleSelect}
          onExpand={handleExpand}
        />
      </div>
      {selectedRow && (
        <GatePanel
          row={selectedRow}
          onClose={() => setSelectedTicker(null)}
          onOpenReader={(relPath) => setView({ kind: 'reader', relPath, from: 'gate' })}
          onExpand={() => handleExpand(selectedRow.ticker)}
        />
      )}
    </div>
  )
}

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

export default function MarkdownViewer(): ReactElement {
  const [surface, setSurface] = useState<Surface>('reviews')

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
      <ModuleHeader activeSurface={surface} onSurfaceChange={setSurface} inboxCount={0} />
      <div style={{ flex: 1, minHeight: 0 }}>
        {surface === 'reviews' ? <ReviewsSurface /> : <Placeholder surface={surface} />}
      </div>
    </div>
  )
}
