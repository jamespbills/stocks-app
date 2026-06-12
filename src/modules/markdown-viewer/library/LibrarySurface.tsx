// The Library tab (wireframe-decisions → Markdown Reviews → "Library / Lessons"): the
// brain's signal and play pages as typed, browsable cards. Signals carry the "Currently
// flags" live-tripwire footer; filters are sector + play-tag (opaque labels); the
// Signals/Plays segment switches page type. Reader and the expanded ticker route are
// breadcrumbed drill-ins, returning here.

import { useEffect, useMemo, useState, type CSSProperties, type ReactElement } from 'react'
import { MutedLabel } from '../../../components/MutedLabel'
import { Reader } from '../Reader'
import { TickerExpanded } from '../gate/TickerExpanded'
import { useGateData } from '../gate/useGateData'
import { useSignalLibrary } from '../adapters/useSignalLibrary'
import {
  buildPlayCards,
  buildSignalCards,
  matchesPlayTag,
  matchesSector,
  playTagOptions,
  sectorOptions
} from './build-library'
import { PlayCard } from './PlayCard'
import { SignalCard } from './SignalCard'
import { tickerKey } from '../ticker'

type Segment = 'signals' | 'plays'

type LibraryView =
  | { kind: 'cards' }
  | { kind: 'reader'; relPath: string; from: 'cards' | { ticker: string } }
  | { kind: 'ticker'; ticker: string }

const ALL = '__all__'

const segBtn = (active: boolean): CSSProperties => ({
  padding: '3px 11px',
  fontFamily: 'var(--font-mono)',
  fontSize: 11.5,
  fontWeight: 'var(--font-medium)',
  border: 'none',
  cursor: 'pointer',
  color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
  background: active ? 'var(--color-interactive-active)' : 'transparent',
  transition: 'background var(--transition-fast), color var(--transition-fast)'
})

const selectStyle: CSSProperties = {
  height: 26,
  background: 'var(--color-bg-input)',
  border: '1px solid var(--color-border-default)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-primary)',
  fontSize: 12,
  fontFamily: 'inherit',
  cursor: 'pointer',
  outline: 'none',
  padding: '0 6px',
  maxWidth: 200
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

export function LibrarySurface(): ReactElement {
  const { rows, entries, loading: gateLoading, error } = useGateData()
  const library = useSignalLibrary()

  const [view, setView] = useState<LibraryView>({ kind: 'cards' })
  const [segment, setSegment] = useState<Segment>('signals')
  const [sector, setSector] = useState(ALL)
  const [playTag, setPlayTag] = useState(ALL)
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)

  // Esc walks the ticker route back to the cards (mirrors the Reviews tab).
  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape' && view.kind === 'ticker') setView({ kind: 'cards' })
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [view])

  const cards = useMemo(
    () => buildSignalCards(entries, library.signals, rows),
    [entries, library.signals, rows]
  )
  const plays = useMemo(() => buildPlayCards(entries), [entries])
  const sectors = useMemo(() => sectorOptions(cards), [cards])
  const tags = useMemo(() => playTagOptions(entries), [entries])

  const filtered = useMemo(
    () =>
      cards.filter(
        (c) =>
          (sector === ALL || matchesSector(c, sector)) &&
          (playTag === ALL || matchesPlayTag(c, playTag))
      ),
    [cards, sector, playTag]
  )

  // Only tickers with a gate row can drill into the expanded route.
  const rowTickers = useMemo(() => new Set(rows.map((r) => tickerKey(r.ticker))), [rows])

  if (view.kind === 'reader') {
    const from = view.from
    return (
      <Reader
        key={view.relPath}
        relPath={view.relPath}
        backLabel={from === 'cards' ? 'Library' : from.ticker}
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
          backLabel="Library"
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
        <span style={{ color: 'var(--color-down)' }}>Couldn’t load the library.</span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          {error}
        </span>
      </Centered>
    )
  }

  if (gateLoading || library.loading) {
    return (
      <Centered>
        <span style={{ color: 'var(--color-text-muted)' }}>Loading library…</span>
      </Centered>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Filter bar */}
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
        <span
          style={{
            display: 'inline-flex',
            flexShrink: 0,
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden'
          }}
        >
          <button style={segBtn(segment === 'signals')} onClick={() => setSegment('signals')}>
            Signals
          </button>
          <button style={segBtn(segment === 'plays')} onClick={() => setSegment('plays')}>
            Plays
          </button>
        </span>

        {segment === 'signals' && (
          <>
            <span style={{ width: 1, height: 20, background: 'var(--color-border-subtle)' }} />
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
                whiteSpace: 'nowrap'
              }}
            >
              <MutedLabel size={10} mono>
                Sector
              </MutedLabel>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                style={selectStyle}
              >
                <option value={ALL}>All sectors</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
                whiteSpace: 'nowrap'
              }}
            >
              <MutedLabel size={10} mono>
                Play tag
              </MutedLabel>
              <select
                value={playTag}
                onChange={(e) => setPlayTag(e.target.value)}
                style={selectStyle}
              >
                <option value={ALL}>All tags</option>
                {tags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        <span
          style={{
            marginLeft: 'auto',
            fontSize: 11.5,
            color: 'var(--color-text-muted)',
            whiteSpace: 'nowrap',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {cards.length} signals · {plays.length} play pages
          {segment === 'signals' && ' · sorted by outcome severity'}
        </span>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--space-5)' }}>
        {segment === 'signals' ? (
          filtered.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((c) => (
                <SignalCard
                  key={c.relPath}
                  card={c}
                  expanded={expandedSlug === c.slug}
                  onToggle={() => setExpandedSlug((cur) => (cur === c.slug ? null : c.slug))}
                  onOpenReader={(relPath) => setView({ kind: 'reader', relPath, from: 'cards' })}
                  onOpenTicker={(ticker) => setView({ kind: 'ticker', ticker })}
                  canOpenTicker={(ticker) => rowTickers.has(tickerKey(ticker))}
                />
              ))}
            </div>
          ) : (
            <Centered>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {cards.length === 0
                  ? 'No signal pages in the brain yet.'
                  : 'No signals match the current filters.'}
              </span>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                {cards.length === 0
                  ? 'Drop a post-mortem in the Inbox to seed the library.'
                  : 'Clear the sector / play-tag filters to see the full library.'}
              </span>
            </Centered>
          )
        ) : plays.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {plays.map((p) => (
              <PlayCard
                key={p.relPath}
                card={p}
                onOpenReader={(relPath) => setView({ kind: 'reader', relPath, from: 'cards' })}
              />
            ))}
          </div>
        ) : (
          <Centered>
            <span style={{ color: 'var(--color-text-secondary)' }}>No play pages yet.</span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              The translate loop creates one the first time a review references a play.
            </span>
          </Centered>
        )}
      </div>
    </div>
  )
}
