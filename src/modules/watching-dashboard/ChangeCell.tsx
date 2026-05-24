import type { ReactElement } from 'react'

interface ChangeCellProps {
  value: number | null
  size?: number
  withArrow?: boolean
}

export function ChangeCell({
  value,
  size = 13.5,
  withArrow = true
}: ChangeCellProps): ReactElement {
  if (value === null) {
    return (
      <span
        style={{ fontFamily: 'var(--font-mono)', fontSize: size, color: 'var(--color-text-muted)' }}
      >
        —
      </span>
    )
  }

  const up = value >= 0
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: size,
        fontVariantNumeric: 'tabular-nums',
        color: up ? 'var(--color-up)' : 'var(--color-down)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        justifyContent: 'flex-end'
      }}
    >
      {withArrow && <span style={{ fontSize: size - 2.5, lineHeight: 1 }}>{up ? '▲' : '▼'}</span>}
      <span>
        {up ? '+' : ''}
        {(value * 100).toFixed(1)}%
      </span>
    </span>
  )
}
