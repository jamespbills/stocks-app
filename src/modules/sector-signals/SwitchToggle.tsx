import type { ReactElement } from 'react'

interface SwitchToggleProps {
  on: boolean
  pending: boolean | null
}

export function SwitchToggle({ on, pending }: SwitchToggleProps): ReactElement {
  // When a change is queued, display the target state
  const displayOn = pending !== null ? pending : on
  const hasPending = pending !== null

  const trackBg = displayOn ? 'rgba(74, 222, 128, 0.35)' : 'rgba(255, 255, 255, 0.12)'

  const trackBorder = displayOn
    ? '1px solid rgba(74, 222, 128, 0.55)'
    : '1px solid rgba(255, 255, 255, 0.18)'

  const knobBg = displayOn ? '#4ADE80' : 'rgba(255, 255, 255, 0.55)'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        width: 28,
        height: 16,
        borderRadius: 8,
        background: trackBg,
        border: trackBorder,
        padding: '0 2px',
        flexShrink: 0,
        outline: hasPending ? '1.5px dashed var(--color-warning)' : 'none',
        outlineOffset: 2,
        transition: 'background var(--transition-fast), border var(--transition-fast)',
        cursor: 'default',
        justifyContent: displayOn ? 'flex-end' : 'flex-start'
      }}
    >
      <span
        style={{
          display: 'block',
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: knobBg,
          transition: 'transform var(--transition-fast)',
          flexShrink: 0
        }}
      />
    </span>
  )
}
