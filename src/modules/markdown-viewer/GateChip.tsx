import type { CSSProperties, ReactElement } from 'react'
import { GATE_META, GATE_STYLE } from './gate-style'
import { GateIcon } from './GateIcon'
import type { Gate } from './types'

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '1px 7px',
  borderRadius: 'var(--radius-sm)',
  fontFamily: 'var(--font-mono)',
  fontSize: 10.5,
  fontWeight: 'var(--font-medium)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
}

/** A small uppercase chip rendering a ticker page's gate verdict in its locked colour. */
export function GateChip({ gate }: { gate: Gate }): ReactElement {
  const palette = GATE_STYLE[gate]
  return (
    <span
      style={{
        ...baseStyle,
        color: palette.color,
        background: palette.background,
        border: gate === 'unset' ? '1px solid var(--color-border-subtle)' : 'none'
      }}
    >
      <GateIcon name={GATE_META[gate].icon} size={11} />
      {gate}
    </span>
  )
}
