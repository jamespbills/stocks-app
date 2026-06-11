import type { CSSProperties, ReactElement } from 'react'
import { SlideOverPanel } from '../../../components/SlideOverPanel'
import { MutedLabel } from '../../../components/MutedLabel'
import { formatDate, formatPercent } from '../../../lib/format'
import { usePlayThresholds } from '../../../lib/playThresholds'
import { PlayPill } from '../../watching-dashboard/PlayPill'
import { GATE_META, GATE_STYLE } from '../gate-style'
import { GateIcon } from '../GateIcon'
import { SignsPanel } from './SignsPanel'
import type { GateRow } from '../types'

interface Props {
  row: GateRow
  onClose: () => void
  onOpenReader: (relPath: string) => void
  /** Open the expanded two-material ticker route (Approach C) — the panel's ↗. */
  onExpand: () => void
}

const sectionPad: CSSProperties = { padding: 'var(--space-4) var(--space-5)' }
const sourceTag = (text: string): ReactElement => (
  <MutedLabel as="div" size={10} mono style={{ marginBottom: 'var(--space-3)' }}>
    {text}
  </MutedLabel>
)

const statRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '5px 0',
  fontSize: 'var(--text-sm)'
}
const statKey: CSSProperties = { fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }

function fileName(relPath: string): string {
  const p = relPath.replace(/\\/g, '/')
  return p.slice(p.lastIndexOf('/') + 1)
}

export function GatePanel({ row, onClose, onOpenReader, onExpand }: Props): ReactElement {
  const thresholds = usePlayThresholds()
  const { numeric, brain, market } = row

  return (
    <SlideOverPanel width={520}>
      {/* Identity header (ticker · company · sector only — market data lives in the numeric block) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-2)',
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--color-border-default)',
          flexShrink: 0
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-lg)',
              color: 'var(--color-text-primary)'
            }}
          >
            {row.ticker}
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            {row.company ?? '—'}
          </div>
          {row.sector && <MutedLabel size={11}>{row.sector}</MutedLabel>}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
          <button
            onClick={onExpand}
            aria-label="Expand to full view"
            title="Expand to full view (Enter)"
            style={{
              background: 'none',
              border: 'none',
              padding: 6,
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              fontSize: 14,
              lineHeight: 1
            }}
          >
            ↗
          </button>
          <button
            onClick={onClose}
            aria-label="Close panel"
            style={{
              background: 'none',
              border: 'none',
              padding: 6,
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              fontSize: 16,
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* Numeric block — from the engine */}
        <div style={sectionPad}>
          {sourceTag('from the engine')}
          {numeric ? (
            <>
              <div
                style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <MutedLabel size={10}>play</MutedLabel>
                  <PlayPill
                    score={numeric.play}
                    maxScore={thresholds.play.maxScore}
                    sectorPlay={(numeric.playSectorRating ?? 0) > 0}
                    sectorName={row.sector}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <MutedLabel size={10}>play 2</MutedLabel>
                  <PlayPill
                    score={numeric.play2}
                    maxScore={thresholds.play_2.maxScore}
                    sectorPlay={(numeric.play2SectorRating ?? 0) > 0}
                    sectorName={row.sector}
                  />
                </div>
              </div>
              <div style={statRow}>
                <span style={statKey}>qualifying reports</span>
                <span style={{ color: 'var(--color-text-primary)' }}>{numeric.reportCount}</span>
              </div>
              <div style={statRow}>
                <span style={statKey}>latest report</span>
                <span style={{ color: 'var(--color-text-primary)' }}>
                  {numeric.reportDate ? formatDate(numeric.reportDate, 'long') : '—'}
                </span>
              </div>
              <div style={statRow}>
                <span style={statKey}>last price</span>
                <span style={{ color: 'var(--color-text-primary)' }}>
                  {market?.lastPrice != null ? market.lastPrice.toFixed(2) : '—'}
                </span>
              </div>
              <div style={statRow}>
                <span style={statKey}>from 52-wk high</span>
                <span style={{ color: 'var(--color-text-primary)' }}>
                  {market?.fromHighPct != null
                    ? formatPercent(market.fromHighPct, { signed: true })
                    : '—'}
                </span>
              </div>
            </>
          ) : (
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              Not currently qualifying in the play universe.
            </span>
          )}
        </div>

        {/* Full-bleed divider between the two materials */}
        <div style={{ borderTop: '1px solid var(--color-border-default)' }} />

        {/* Gate block — from the brain */}
        <div style={sectionPad}>
          {sourceTag('from the brain')}
          {brain ? (
            <>
              {/* Verdict hero — square tinted icon chip + large gate word + tagline + summary */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-3)',
                  marginBottom: 'var(--space-4)'
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-md)',
                    background: GATE_STYLE[brain.gate].background,
                    border:
                      brain.gate === 'unset' ? '1px solid var(--color-border-subtle)' : 'none',
                    color: GATE_STYLE[brain.gate].color
                  }}
                >
                  <GateIcon name={GATE_META[brain.gate].icon} size={18} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 22,
                        fontWeight: 'var(--font-medium)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        lineHeight: 1.1,
                        color: GATE_STYLE[brain.gate].color
                      }}
                    >
                      {brain.gate}
                    </span>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                      {GATE_META[brain.gate].tagline}
                    </span>
                  </div>
                  {brain.gateSummary && (
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 'var(--text-sm)',
                        lineHeight: 'var(--leading-normal)',
                        color: 'var(--color-text-secondary)'
                      }}
                    >
                      {brain.gateSummary}
                    </p>
                  )}
                </div>
              </div>
              {brain.signs.length > 0 && (
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <MutedLabel as="div" size={10} style={{ marginBottom: 'var(--space-2)' }}>
                    signs
                  </MutedLabel>
                  <SignsPanel signs={brain.signs} />
                </div>
              )}

              {/* Review stack */}
              <MutedLabel as="div" size={10} style={{ margin: 'var(--space-3) 0 var(--space-2)' }}>
                reviews
              </MutedLabel>
              <ReviewStackButton
                label={fileName(brain.relPath)}
                onClick={() => onOpenReader(brain.relPath)}
                primary
              />
              {brain.sources.map((src) => (
                <ReviewStackButton
                  key={src}
                  label={fileName(src)}
                  onClick={() => onOpenReader(src)}
                />
              ))}
            </>
          ) : (
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              No brain page yet — this qualifier has no written judgement.
            </span>
          )}
        </div>
      </div>
    </SlideOverPanel>
  )
}

function ReviewStackButton({
  label,
  onClick,
  primary
}: {
  label: string
  onClick: () => void
  primary?: boolean
}): ReactElement {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '6px 10px',
        marginBottom: 4,
        fontSize: 'var(--text-sm)',
        fontFamily: 'var(--font-mono)',
        color: primary ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        background: primary ? 'var(--color-interactive-active)' : 'transparent',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer'
      }}
    >
      {label}
    </button>
  )
}
