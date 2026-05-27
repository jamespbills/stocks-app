import type { ReactElement } from 'react'
import type { SignalStrength } from './types'

interface SignalBadgeProps {
  kind: SignalStrength
}

const STYLES: Record<SignalStrength, { bg: string; color: string }> = {
  STRONG: { bg: 'var(--color-play-13-bg)', color: 'var(--color-play-13-text)' },
  PROMISING: { bg: 'var(--color-play-12-bg)', color: 'var(--color-play-12-text)' },
  NEUTRAL: { bg: 'var(--color-interactive-hover)', color: 'var(--color-text-muted)' },
  WEAK: { bg: 'rgba(239, 68, 68, 0.07)', color: 'rgba(248, 113, 113, 0.55)' }
}

export function SignalBadge({ kind }: SignalBadgeProps): ReactElement {
  const { bg, color } = STYLES[kind]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '1px 5px',
        fontFamily: 'var(--font-mono)',
        fontSize: 10.5,
        fontWeight: 500,
        letterSpacing: '0.5px',
        borderRadius: 'var(--radius-sm)',
        background: bg,
        color,
        whiteSpace: 'nowrap'
      }}
    >
      {kind}
    </span>
  )
}
