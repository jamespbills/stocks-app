import { useEffect, useState, type ReactElement } from 'react'

interface AppliedToastProps {
  count: number
  durationMs: number
  onDone: () => void
}

export function AppliedToast({ count, durationMs, onDone }: AppliedToastProps): ReactElement {
  const [elapsedMs, setElapsedMs] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      setElapsedMs(elapsed)
      if (elapsed >= durationMs) {
        clearInterval(interval)
        onDone()
      }
    }, 100)
    return () => clearInterval(interval)
  }, [durationMs, onDone])

  return (
    <div
      style={{
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-5)',
        background: 'rgba(34, 197, 94, 0.07)',
        borderTop: '1px solid rgba(74, 222, 128, 0.25)',
        flexShrink: 0
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span style={{ color: 'var(--color-up)', fontSize: 15 }}>✓</span>
        <span
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--color-up)'
          }}
        >
          {count} {count === 1 ? 'change' : 'changes'} applied
        </span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          · sector play ratings recalculated
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-text-muted)'
          }}
        >
          calculate_all_sector_play_ratings()
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: 80,
          height: 3,
          background: 'var(--color-border-subtle)',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.max(0, 100 - (elapsedMs / durationMs) * 100)}%`,
            background: 'var(--color-up)',
            borderRadius: 2,
            transition: 'width 100ms linear'
          }}
        />
      </div>
    </div>
  )
}
