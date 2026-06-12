// One Library signal card (wireframe: reviews-more.jsx → SignalCard). The lesson as a full
// card: identity + origin outcome, the canonical metric/danger/lead-time from the signal
// library, and the "Currently flags" live-tripwire footer. Flags are brain-sourced; the
// amber/muted split records engine PRESENCE only (live = currently in the play universe).

import { TrendingUp, TriangleAlert } from 'lucide-react'
import type { CSSProperties, ReactElement } from 'react'
import { MutedLabel } from '../../../components/MutedLabel'
import { GateChip } from '../GateChip'
import type { SignalCardModel, SignalFlag } from '../types'

interface Props {
  card: SignalCardModel
  expanded: boolean
  /** Toggle the inline flag-row expansion (card body click). */
  onToggle: () => void
  /** Open the signal's wiki page in the Reader (title click). */
  onOpenReader: (relPath: string) => void
  /** Jump to a flagged ticker's expanded gate route; null when the ticker has no gate row. */
  onOpenTicker: ((ticker: string) => void) | null
  /** Whether a given flag can drill into the gate route. */
  canOpenTicker: (ticker: string) => boolean
}

const POLARITY_STYLE = {
  warning: { color: 'var(--color-down)', background: 'var(--color-down-bg)' },
  encouraging: { color: 'var(--color-up)', background: 'var(--color-up-bg)' }
} as const

const sectorChip: CSSProperties = {
  padding: '1px 7px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border-subtle)',
  fontSize: 11,
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap'
}

function flagChipStyle(live: boolean): CSSProperties {
  return {
    fontFamily: 'var(--font-mono)',
    fontSize: 11.5,
    padding: '1px 7px',
    borderRadius: 'var(--radius-sm)',
    color: live ? 'var(--color-warning)' : 'var(--color-text-muted)',
    background: live ? 'var(--color-warning-bg)' : 'var(--color-bg-elevated)',
    whiteSpace: 'nowrap'
  }
}

function MetricCell({
  label,
  value,
  danger
}: {
  label: string
  value: string
  danger?: boolean
}): ReactElement {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <MutedLabel size={10} mono>
        {label}
      </MutedLabel>
      <span
        style={{
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          color: danger ? 'var(--color-warning)' : 'var(--color-text-primary)',
          lineHeight: 1.45
        }}
      >
        {value}
      </span>
    </span>
  )
}

function FlagRow({
  flag,
  onOpen
}: {
  flag: SignalFlag
  onOpen: (() => void) | null
}): ReactElement {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        onOpen?.()
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '7px 12px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-bg-base)',
        border: '1px solid var(--color-border-subtle)',
        cursor: onOpen ? 'pointer' : 'default'
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12.5,
          fontWeight: 'var(--font-medium)',
          color: 'var(--color-text-primary)',
          width: 72,
          flexShrink: 0
        }}
      >
        {flag.ticker}
      </span>
      <span
        style={{
          fontSize: 12.5,
          color: 'var(--color-text-secondary)',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {flag.company ?? '—'}
      </span>
      {!flag.live && (
        <MutedLabel size={10} mono>
          not in universe
        </MutedLabel>
      )}
      <GateChip gate={flag.gate} />
    </div>
  )
}

export function SignalCard({
  card,
  expanded,
  onToggle,
  onOpenReader,
  onOpenTicker,
  canOpenTicker
}: Props): ReactElement {
  const polarity = POLARITY_STYLE[card.polarity]
  const PolarityIcon = card.polarity === 'warning' ? TriangleAlert : TrendingUp
  const expandable = card.flags.length > 0

  return (
    <div
      onClick={() => expandable && onToggle()}
      style={{
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-surface)',
        overflow: 'hidden',
        cursor: expandable ? 'pointer' : 'default'
      }}
    >
      {/* Header block */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px' }}>
        <div
          style={{
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: 'var(--radius-md)',
            background: polarity.background,
            color: polarity.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <PolarityIcon size={17} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenReader(card.relPath)
              }}
              title="Open in Reader"
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                fontSize: 14,
                fontWeight: 'var(--font-medium)',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              {card.name}
            </button>
            <span
              style={{
                padding: '1px 7px',
                borderRadius: 'var(--radius-sm)',
                background: polarity.background,
                color: polarity.color,
                fontSize: 10.5,
                fontWeight: 'var(--font-medium)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              {card.polarity}
            </span>
            {(card.originTicker || card.originSector || card.outcomePct !== null) && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11.5,
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap'
                }}
              >
                {card.originTicker && <>from {card.originTicker}</>}
                {card.originSector && <> · {card.originSector}</>}
                {card.outcomePct !== null && (
                  <>
                    {' · '}
                    <span
                      style={{
                        color: card.outcomePct < 0 ? 'var(--color-down)' : 'var(--color-up)'
                      }}
                    >
                      {card.outcomePct}%
                    </span>
                  </>
                )}
              </span>
            )}
          </div>
          {card.description && (
            <p
              style={{
                fontSize: 12.5,
                color: 'var(--color-text-secondary)',
                lineHeight: 1.55,
                margin: '6px 0 0'
              }}
            >
              {card.description}
            </p>
          )}
          {(card.metric || card.danger || card.leadTimeMonths !== null) && (
            <div style={{ display: 'flex', gap: 22, marginTop: 12, flexWrap: 'wrap' }}>
              {card.metric && <MetricCell label="Metric" value={card.metric} />}
              {card.danger && <MetricCell label="Danger" value={card.danger} danger />}
              {card.leadTimeMonths !== null && (
                <MetricCell label="Lead time" value={`~${card.leadTimeMonths} mo`} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Applies-to / currently-flags footer */}
      <div
        style={{
          borderTop: '1px solid var(--color-border-subtle)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--color-bg-base)',
          flexWrap: 'wrap'
        }}
      >
        <MutedLabel size={10} mono>
          Applies to
        </MutedLabel>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
          {card.appliesTo.length > 0 ? (
            card.appliesTo.map((s) => (
              <span key={s} style={sectorChip}>
                {s}
              </span>
            ))
          ) : (
            <span style={{ fontSize: 12, color: 'var(--color-text-disabled)' }}>—</span>
          )}
        </div>
        <span
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap'
          }}
        >
          <MutedLabel size={10} mono>
            Currently flags
          </MutedLabel>
          {card.flags.length > 0 ? (
            card.flags.map((f) => (
              <span key={f.ticker} style={flagChipStyle(f.live)}>
                {f.ticker}
              </span>
            ))
          ) : (
            <span style={{ fontSize: 12, color: 'var(--color-text-disabled)' }}>none flagged</span>
          )}
        </span>
      </div>

      {/* Inline flag rows (expanded) */}
      {expanded && expandable && (
        <div style={{ borderTop: '1px solid var(--color-border-subtle)', padding: '12px 16px' }}>
          <div style={{ marginBottom: 10 }}>
            <MutedLabel size={10} mono>
              Tickers this signal flags right now
            </MutedLabel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {card.flags.map((f) => (
              <FlagRow
                key={f.ticker}
                flag={f}
                onOpen={
                  onOpenTicker && canOpenTicker(f.ticker) ? () => onOpenTicker(f.ticker) : null
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
