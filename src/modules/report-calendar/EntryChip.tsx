import type { ReactElement } from 'react'
import type { EntryStatus } from './types'

interface EntryChipProps {
  ticker: string
  period: string
  status: EntryStatus
  selected?: boolean
  size?: 'normal' | 'small'
  hasOverride?: boolean
  onClick?: (e: React.MouseEvent) => void
}

function chipStyle(
  status: EntryStatus,
  selected: boolean
): { bg: string; color: string; border: string } {
  let bg = 'transparent'
  let color = 'var(--color-text-primary)'
  let border = '1px solid transparent'

  if (status === 'released') {
    bg = 'var(--color-interactive-hover)'
    color = 'var(--color-text-primary)'
  } else if (status === 'overdue') {
    bg = 'var(--color-danger-bg)'
    color = 'var(--color-danger)'
    border = '1px solid rgba(248, 113, 113, 0.4)'
  } else if (status === 'amber') {
    bg = 'var(--color-warning-bg)'
    color = 'var(--color-warning)'
    border = '1px solid rgba(252, 211, 77, 0.4)'
  } else {
    color = 'var(--color-text-muted)'
    border = '1px dashed var(--color-border-strong)'
  }

  if (selected) border = '1px solid var(--color-border-focus)'
  return { bg, color, border }
}

export function EntryChip({
  ticker,
  period,
  status,
  selected = false,
  size = 'normal',
  hasOverride = false,
  onClick
}: EntryChipProps): ReactElement {
  const { bg, color, border } = chipStyle(status, selected)
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: size === 'small' ? '1px 5px' : '2px 6px',
        borderRadius: 3,
        background: bg,
        color,
        border,
        fontSize: size === 'small' ? 10.5 : 11,
        cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        lineHeight: 1.35
      }}
    >
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{ticker}</span>
      <span style={{ opacity: 0.7 }}>·</span>
      <span style={{ fontFamily: 'var(--font-mono)' }}>{period}</span>
      {hasOverride && (
        <span
          style={{
            display: 'inline-block',
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'var(--color-warning)',
            opacity: 0.85,
            flexShrink: 0
          }}
        />
      )}
    </div>
  )
}
