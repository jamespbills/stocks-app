import type { ReactElement } from 'react'

interface Props {
  on: boolean
  disabled?: boolean
  onChange?: (next: boolean) => void
}

// Pill toggle (PA-4): green when on, dimmed + non-interactive when disabled (ISA rows).
export function Toggle({ on, disabled = false, onChange }: Props): ReactElement {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onChange?.(!on)
      }}
      style={{
        display: 'inline-block',
        position: 'relative',
        width: 28,
        height: 16,
        padding: 0,
        borderRadius: 999,
        background: on ? 'var(--color-up)' : 'var(--color-bg-elevated)',
        opacity: disabled ? 0.5 : 1,
        border: `1px solid ${on ? 'var(--color-up)' : 'var(--color-border-default)'}`,
        cursor: disabled ? 'default' : 'pointer',
        verticalAlign: 'middle'
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 1,
          left: on ? 13 : 1,
          width: 12,
          height: 12,
          borderRadius: 999,
          background: on ? 'var(--color-bg-base)' : 'var(--color-text-muted)',
          transition: 'left var(--transition-fast)'
        }}
      />
    </button>
  )
}
