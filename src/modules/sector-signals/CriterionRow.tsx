import type { ReactElement } from 'react'
import type { ComboRow } from './types'
import { SignalBadge } from './SignalBadge'
import { SwitchToggle } from './SwitchToggle'

interface CriterionRowProps {
  row: ComboRow
  selected: boolean
  onClick: () => void
  onToggle: () => void
}

function formatRoi(roi: number | null): string {
  if (roi === null) return '—'
  return `${(roi * 100).toFixed(1)}%`
}

function roiColor(roi: number | null): string {
  if (roi === null) return 'var(--color-text-muted)'
  return roi >= 0 ? 'var(--color-up)' : 'var(--color-down)'
}

export function CriterionRow({
  row,
  selected,
  onClick,
  onToggle
}: CriterionRowProps): ReactElement {
  const insufficient = row.nTickers < 3
  const hasPending = row.pendingActive !== null

  let bg = 'transparent'
  let leftBorder = '2px solid transparent'

  if (selected) {
    bg = 'var(--color-interactive-active)'
  } else if (hasPending) {
    bg = 'rgba(252, 211, 77, 0.04)'
    leftBorder = '2px solid var(--color-warning)'
  }

  const pendingLabel = hasPending ? `queued · ${row.isActive ? 'on → off' : 'off → on'}` : null

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        minHeight: 34,
        paddingLeft: 12,
        paddingRight: 'var(--space-5)',
        background: bg,
        borderBottom: '1px solid var(--color-border-subtle)',
        borderLeft: leftBorder,
        cursor: 'pointer',
        transition: 'background var(--transition-fast)'
      }}
      onMouseEnter={(e) => {
        if (!selected && !hasPending) {
          ;(e.currentTarget as HTMLDivElement).style.background = 'var(--color-interactive-hover)'
        }
      }}
      onMouseLeave={(e) => {
        if (!selected && !hasPending) {
          ;(e.currentTarget as HTMLDivElement).style.background = bg
        }
      }}
    >
      {/* chevron spacer */}
      <span style={{ width: 18, flexShrink: 0 }} />

      {/* criterion name + pending pill */}
      <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-primary)',
            opacity: insufficient ? 0.45 : 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {row.criterionName}
        </span>

        {pendingLabel && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-warning)',
              background: 'rgba(252, 211, 77, 0.10)',
              padding: '1px 5px',
              borderRadius: 'var(--radius-xs)',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            {pendingLabel}
          </span>
        )}

        {insufficient && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-text-muted)',
              background: 'var(--color-interactive-hover)',
              padding: '1px 5px',
              borderRadius: 'var(--radius-xs)',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            insufficient data
          </span>
        )}
      </span>

      {/* N */}
      <span
        style={{
          width: 72,
          textAlign: 'right',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
          opacity: insufficient ? 0.45 : 1,
          flexShrink: 0
        }}
      >
        {row.nTickers}
      </span>

      {/* AVG ROI */}
      <span
        style={{
          width: 96,
          textAlign: 'right',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          color: roiColor(row.avgRoi),
          opacity: insufficient ? 0.45 : 1,
          flexShrink: 0
        }}
      >
        {formatRoi(row.avgRoi)}
      </span>

      {/* WIN — always — in v1 */}
      <span
        style={{
          width: 72,
          textAlign: 'right',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          flexShrink: 0
        }}
      >
        —
      </span>

      {/* SIGNAL */}
      <span style={{ width: 100, paddingLeft: 8, flexShrink: 0, opacity: insufficient ? 0.45 : 1 }}>
        <SignalBadge kind={row.signalStrength} />
      </span>

      {/* ACTIVE toggle */}
      <span
        style={{
          width: 76,
          display: 'flex',
          justifyContent: 'flex-end',
          flexShrink: 0,
          opacity: insufficient ? 0.6 : 1
        }}
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
      >
        <SwitchToggle on={row.isActive} pending={row.pendingActive} />
      </span>
    </div>
  )
}
