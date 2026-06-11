// Approach C — the expanded two-material ticker route (wireframe-decisions → Markdown
// Reviews, "Ticker Review — expanded full route"). Separation by MATERIAL, not just
// position: the engine renders as a terminal-style mono ledger (machine output) and the
// brain verdict as an authored prose card with a gate-coloured edge. Source tags +
// timestamps (`scored` vs `authored`) reinforce the module's core decoupling lock — the
// number and the judgement are never blended.

import { useMemo, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import { MutedLabel } from '../../../components/MutedLabel'
import { formatDate, formatPercent } from '../../../lib/format'
import { usePlayThresholds } from '../../../lib/playThresholds'
import { PlayPill } from '../../watching-dashboard/PlayPill'
import { GATE_STYLE } from '../gate-style'
import type { GateRow, ReviewEntry } from '../types'
import { SignsPanel } from './SignsPanel'

interface Props {
  row: GateRow
  /** The full brain index, used to enrich the review stack (title / type / date). */
  entries: ReviewEntry[]
  /** Return to the gate list (breadcrumb; Esc is handled by the parent). */
  onBack: () => void
  onOpenReader: (relPath: string) => void
}

const timestampStyle: CSSProperties = {
  marginLeft: 'auto',
  fontFamily: 'var(--font-mono)',
  fontSize: 10.5,
  color: 'var(--color-text-disabled)'
}

function fileName(relPath: string): string {
  const p = relPath.replace(/\\/g, '/')
  return p.slice(p.lastIndexOf('/') + 1)
}

// ── Engine card (terminal material) ─────────────────────────────────────────

function LedgerRow({
  k,
  value,
  valueColor
}: {
  k: string
  value: ReactNode
  valueColor?: string
}): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: '6px 10px',
        borderBottom: '1px solid var(--color-border-subtle)'
      }}
    >
      <span style={{ color: 'var(--color-text-muted)' }}>{k}</span>
      <span
        style={{
          marginLeft: 'auto',
          color: valueColor ?? 'var(--color-text-primary)',
          fontVariantNumeric: 'tabular-nums'
        }}
      >
        {value}
      </span>
    </div>
  )
}

function EngineCard({ row }: { row: GateRow }): ReactElement {
  const thresholds = usePlayThresholds()
  const { numeric, market } = row

  const marketRows = (
    <>
      <LedgerRow
        k="last_price"
        value={market?.lastPrice != null ? market.lastPrice.toFixed(2) : '—'}
        valueColor="var(--color-text-muted)"
      />
      <LedgerRow
        k="from_52w_high"
        value={
          market?.fromHighPct != null ? formatPercent(market.fromHighPct, { signed: true }) : '—'
        }
        valueColor={
          market?.fromHighPct != null && market.fromHighPct < 0 ? 'var(--color-down)' : undefined
        }
      />
    </>
  )

  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-terminal-bg)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          borderBottom: '1px solid var(--color-border-subtle)',
          background: 'var(--color-bg-base)'
        }}
      >
        <MutedLabel size={10} mono>
          from the engine
        </MutedLabel>
        {numeric?.reportDate && (
          <span style={timestampStyle}>scored {formatDate(numeric.reportDate, 'long')}</span>
        )}
      </div>
      <div style={{ padding: '4px 4px 6px', fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>
        {numeric ? (
          <>
            <LedgerRow
              k="play"
              value={
                <PlayPill
                  score={numeric.play}
                  maxScore={thresholds.play.maxScore}
                  sectorPlay={(numeric.playSectorRating ?? 0) > 0}
                  sectorName={row.sector}
                />
              }
            />
            <LedgerRow
              k="play_2"
              value={
                <PlayPill
                  score={numeric.play2}
                  maxScore={thresholds.play_2.maxScore}
                  sectorPlay={(numeric.play2SectorRating ?? 0) > 0}
                  sectorName={row.sector}
                />
              }
            />
            <LedgerRow k="qualifying_reports" value={numeric.reportCount} />
            <LedgerRow
              k="latest_report"
              value={numeric.reportDate ? formatDate(numeric.reportDate, 'iso') : '—'}
            />
            {marketRows}
          </>
        ) : (
          <>
            <div
              style={{
                padding: '8px 10px',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-muted)',
                borderBottom: '1px solid var(--color-border-subtle)'
              }}
            >
              not in the play universe
            </div>
            {market && marketRows}
          </>
        )}
      </div>
    </div>
  )
}

// ── Brain card (authored material) ──────────────────────────────────────────

const RISK_COLOR: Record<string, string> = {
  low: 'var(--color-up)',
  moderate: 'var(--color-warning)',
  high: 'var(--color-down)'
}

function Advisory({
  conviction,
  riskRating
}: {
  conviction: number | null
  riskRating: string | null
}): ReactElement | null {
  if (conviction === null && riskRating === null) return null
  const dots = conviction !== null ? Math.min(Math.max(Math.round(conviction), 0), 5) : null
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-5)',
        marginTop: 'auto',
        paddingTop: 'var(--space-4)'
      }}
    >
      {dots !== null && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <MutedLabel size={10}>conviction</MutedLabel>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2 }}>
            <span style={{ color: 'var(--color-text-primary)' }}>{'●'.repeat(dots)}</span>
            <span style={{ color: 'var(--color-text-disabled)' }}>{'○'.repeat(5 - dots)}</span>
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text-muted)'
            }}
          >
            {dots}/5
          </span>
        </span>
      )}
      {riskRating !== null && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <MutedLabel size={10}>risk</MutedLabel>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10.5,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '1px 7px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)',
              color: RISK_COLOR[riskRating.toLowerCase()] ?? 'var(--color-text-secondary)'
            }}
          >
            {riskRating}
          </span>
        </span>
      )}
    </div>
  )
}

function BrainCard({ row }: { row: GateRow }): ReactElement {
  const { brain } = row

  if (!brain) {
    return (
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-2)',
          border: '1px dashed var(--color-border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5)',
          textAlign: 'center'
        }}
      >
        <span style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-secondary)' }}>
          Awaiting review
        </span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          No judgement on file — the engine qualifies it, the brain hasn’t spoken yet.
        </span>
      </div>
    )
  }

  const palette = GATE_STYLE[brain.gate]
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-default)',
        borderLeft: `3px solid ${palette.color}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4) var(--space-5)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <MutedLabel size={10} mono>
          from the brain
        </MutedLabel>
        {brain.authoredDate && (
          <span style={timestampStyle}>authored {formatDate(brain.authoredDate, 'long')}</span>
        )}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 28,
          fontWeight: 'var(--font-medium)',
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          lineHeight: 1,
          color: palette.color
        }}
      >
        {brain.gate}
      </div>
      {brain.gateSummary && (
        <p
          style={{
            margin: 'var(--space-3) 0 0',
            fontSize: 'var(--text-md)',
            lineHeight: 'var(--leading-relaxed)',
            color: 'var(--color-text-secondary)'
          }}
        >
          {brain.gateSummary}
        </p>
      )}
      <Advisory conviction={brain.conviction} riskRating={brain.riskRating} />
    </div>
  )
}

// ── Reviews stack (enriched from the brain index) ───────────────────────────

interface StackRow {
  relPath: string
  title: string
  typeLabel: string
  date: string | null
  primary: boolean
}

function buildStack(row: GateRow, entries: ReviewEntry[]): StackRow[] {
  const brain = row.brain
  if (!brain) return []
  const byRelPath = new Map(entries.map((e) => [e.relPath, e]))

  const page = byRelPath.get(brain.relPath)
  const head: StackRow = {
    relPath: brain.relPath,
    title: page?.title ?? fileName(brain.relPath),
    typeLabel: 'wiki page',
    date: brain.authoredDate ?? (page ? formatDate(page.mtime, 'iso') : null),
    primary: true
  }

  const sources: StackRow[] = brain.sources.map((src) => {
    const entry = byRelPath.get(src)
    return {
      relPath: src,
      title: entry?.title ?? fileName(src),
      typeLabel: entry?.frontmatter.review_type ?? 'review',
      date: entry?.frontmatter.review_date ?? (entry ? formatDate(entry.mtime, 'iso') : null),
      primary: false
    }
  })
  // Newest first; undated sources sink to the bottom.
  sources.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))

  return [head, ...sources]
}

function StackRowButton({ item, onClick }: { item: StackRow; onClick: () => void }): ReactElement {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        width: '100%',
        textAlign: 'left',
        padding: '7px 12px',
        fontSize: 'var(--text-sm)',
        background: item.primary ? 'var(--color-interactive-active)' : 'transparent',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer'
      }}
    >
      <span
        style={{
          color: item.primary ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {item.title}
      </span>
      <MutedLabel size={10} mono>
        {item.typeLabel}
      </MutedLabel>
      <span
        style={{
          marginLeft: 'auto',
          flexShrink: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          color: 'var(--color-text-muted)'
        }}
      >
        {item.date ? formatDate(item.date, 'long') : '—'}
      </span>
    </button>
  )
}

// ── The route ───────────────────────────────────────────────────────────────

export function TickerExpanded({ row, entries, onBack, onOpenReader }: Props): ReactElement {
  const stack = useMemo(() => buildStack(row, entries), [row, entries])
  const wikiPath = row.brain?.relPath ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Breadcrumb bar (mirrors the Reader) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-3) var(--space-5)',
          borderBottom: '1px solid var(--color-border-subtle)',
          flexShrink: 0
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            padding: 0
          }}
        >
          Reviews
        </button>
        <span style={{ color: 'var(--color-text-disabled)' }}>/</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-primary)'
          }}
        >
          {row.ticker}
        </span>
        {wikiPath && (
          <button
            onClick={() => onOpenReader(wikiPath)}
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              background: 'transparent',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer'
            }}
          >
            Open in reader
          </button>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <div style={{ maxWidth: 980, padding: 'var(--space-5) var(--space-6)' }}>
          {/* Identity — ticker · company · sector only (market data lives in the engine card) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-5)'
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xl)',
                color: 'var(--color-text-primary)'
              }}
            >
              {row.ticker}
            </span>
            <span style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-secondary)' }}>
              {row.company ?? '—'}
            </span>
            {row.sector && <MutedLabel size={11}>{row.sector}</MutedLabel>}
          </div>

          {/* Two materials, side by side — never blended */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-4)',
              alignItems: 'stretch',
              marginBottom: 'var(--space-6)'
            }}
          >
            <EngineCard row={row} />
            <BrainCard row={row} />
          </div>

          {/* Signs — from the brain */}
          {row.brain && row.brain.signs.length > 0 && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <MutedLabel as="div" size={10} style={{ marginBottom: 'var(--space-3)' }}>
                signs · from the brain
              </MutedLabel>
              <SignsPanel signs={row.brain.signs} columns />
            </div>
          )}

          {/* Reviews stack — newest first */}
          {stack.length > 0 && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  marginBottom: 'var(--space-3)'
                }}
              >
                <MutedLabel size={10}>reviews on file · {stack.length}</MutedLabel>
                <span style={{ flex: 1, height: 1, background: 'var(--color-border-subtle)' }} />
                <MutedLabel size={10}>newest first</MutedLabel>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {stack.map((item) => (
                  <StackRowButton
                    key={item.relPath}
                    item={item}
                    onClick={() => onOpenReader(item.relPath)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
