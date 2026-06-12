import type { CSSProperties, ReactElement } from 'react'
import { Check } from 'lucide-react'
import { usePlayThresholds } from '../../../lib/playThresholds'
import { PlayPill } from '../../watching-dashboard/PlayPill'
import { GateChip } from '../GateChip'
import type { CoverageRow, CoverageStatus } from '../types'

const th: CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  fontFamily: 'var(--font-mono)',
  fontSize: 10.5,
  fontWeight: 'var(--font-medium)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--color-text-muted)',
  borderBottom: '1px solid var(--color-border-subtle)',
  whiteSpace: 'nowrap'
}

const td: CSSProperties = {
  padding: '7px 10px',
  fontSize: 12.5,
  borderBottom: '1px solid var(--color-border-subtle)',
  whiteSpace: 'nowrap'
}

// Wireframe attention colours: the two act-on-it states are amber; an orphan reads red
// (it needs matching, not judging); reviewed-and-current stays muted.
const STATUS_META: Record<CoverageStatus, { label: string; color: string }> = {
  'needs-review': { label: 'needs review', color: 'var(--color-warning)' },
  stale: { label: 'stale — report since review', color: 'var(--color-warning)' },
  'up-to-date': { label: 'up to date', color: 'var(--color-text-muted)' },
  unmatched: { label: 'unmatched', color: 'var(--color-down)' }
}

/** The Coverage dashboard table — which qualifiers the brain has (not) caught up with. */
export function CoverageTable({
  rows,
  onOpenTicker
}: {
  rows: CoverageRow[]
  onOpenTicker: (ticker: string) => void
}): ReactElement {
  const thresholds = usePlayThresholds()

  return (
    // The card body clips overflow, so the table scrolls horizontally when the window is
    // narrow (mirrors the Watching breakpoints philosophy: scroll, don't silently clip).
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Ticker</th>
            <th style={th}>Company</th>
            <th style={{ ...th, textAlign: 'right' }}>Play</th>
            <th style={{ ...th, textAlign: 'right' }}>Play 2</th>
            <th style={th}>Review?</th>
            <th style={th}>Gate</th>
            <th style={th}>Last review</th>
            <th style={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.ticker}
              onClick={() => onOpenTicker(row.ticker)}
              style={{ cursor: 'pointer' }}
            >
              <td
                style={{
                  ...td,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 'var(--font-medium)',
                  color: 'var(--color-text-primary)'
                }}
              >
                {row.ticker}
              </td>
              <td style={{ ...td, color: 'var(--color-text-secondary)' }}>
                {/* Block span: td max-width is ignored in auto table layout, a span's isn't. */}
                <span
                  style={{
                    display: 'block',
                    maxWidth: 220,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {row.company ?? '—'}
                </span>
              </td>
              <td style={{ ...td, textAlign: 'right' }}>
                <PlayPill score={row.play} maxScore={thresholds.play.maxScore} />
              </td>
              <td style={{ ...td, textAlign: 'right' }}>
                <PlayPill score={row.play2} maxScore={thresholds.play_2.maxScore} />
              </td>
              <td style={td}>
                {row.hasReview ? (
                  <span
                    style={{
                      color: 'var(--color-up)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12
                    }}
                  >
                    <Check size={13} strokeWidth={2} aria-hidden />
                    {row.status === 'unmatched' ? 'orphan' : 'yes'}
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--color-text-disabled)' }}>none</span>
                )}
              </td>
              <td style={td}>
                <GateChip gate={row.gate} />
              </td>
              <td
                style={{
                  ...td,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-muted)',
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {row.lastReview?.slice(0, 10) ?? '—'}
              </td>
              <td style={{ ...td, fontSize: 11.5, color: STATUS_META[row.status].color }}>
                {STATUS_META[row.status].label}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
