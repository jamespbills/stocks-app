import type { ReactElement } from 'react'

interface PendingFooterProps {
  count: number
  applying: boolean
  error: string | null
  onApply: () => Promise<void>
  onDiscard: () => void
}

export function PendingFooter({
  count,
  applying,
  error,
  onApply,
  onDiscard
}: PendingFooterProps): ReactElement | null {
  if (count === 0) return null

  return (
    <div
      style={{
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-5)',
        background: 'var(--color-bg-surface)',
        borderTop: '1px solid var(--color-border-default)',
        flexShrink: 0
      }}
    >
      {/* Left: count + description */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
        {!error ? (
          <>
            <span
              style={{
                display: 'inline-block',
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--color-warning)',
                flexShrink: 0
              }}
            />
            <span
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--color-warning)',
                flexShrink: 0
              }}
            >
              {count} {count === 1 ? 'change' : 'changes'} pending
            </span>
            <span
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              Apply writes to dim_sector_play_matrix and recalculates ratings.
            </span>
          </>
        ) : (
          <span
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-danger)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            Apply failed — {error}. Try again.
          </span>
        )}
      </div>

      {/* Right: Discard + Apply */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
        <button
          onClick={onDiscard}
          disabled={applying}
          style={{
            padding: '4px 12px',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-muted)',
            background: 'transparent',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-md)',
            cursor: applying ? 'not-allowed' : 'pointer',
            opacity: applying ? 0.5 : 1,
            transition: 'opacity var(--transition-fast)'
          }}
        >
          Discard
        </button>

        <button
          onClick={() => void onApply()}
          disabled={applying}
          style={{
            padding: '4px 14px',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            color: applying ? 'var(--color-text-disabled)' : 'var(--color-bg-base)',
            background: applying ? 'var(--color-border-strong)' : 'var(--color-text-primary)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: applying ? 'not-allowed' : 'pointer',
            opacity: applying ? 0.6 : 1,
            transition: 'opacity var(--transition-fast), background var(--transition-fast)'
          }}
        >
          {applying ? 'Applying…' : 'Apply changes'}
        </button>
      </div>
    </div>
  )
}
