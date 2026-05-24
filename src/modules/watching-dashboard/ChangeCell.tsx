import type { ReactElement } from 'react'

function intensityColor(value: number): string {
  const magnitude = Math.abs(value) * 100
  const t = Math.min(Math.max((magnitude - 5) / 55, 0), 1)
  const alpha = (0.35 + t * 0.65).toFixed(2)
  return value >= 0 ? `rgba(74, 222, 128, ${alpha})` : `rgba(248, 113, 113, ${alpha})`
}

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
        color: intensityColor(value),
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
