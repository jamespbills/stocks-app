import type { CSSProperties, ReactElement } from 'react'
import type { Gate } from './types'

// Locked gate colour map (wireframe-decisions → Markdown Reviews):
// pass → up/green · fail → down/red · watch → warning/amber · unset → muted.
const GATE_STYLE: Record<Gate, { color: string; background: string }> = {
  pass: { color: 'var(--color-up)', background: 'var(--color-up-bg)' },
  fail: { color: 'var(--color-down)', background: 'var(--color-down-bg)' },
  watch: { color: 'var(--color-warning)', background: 'var(--color-warning-bg)' },
  unset: { color: 'var(--color-text-muted)', background: 'transparent' }
}

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
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
      {gate}
    </span>
  )
}
