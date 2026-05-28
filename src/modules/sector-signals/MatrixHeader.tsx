import type { ReactElement } from 'react'
import type { Strategy } from './types'

interface MatrixHeaderProps {
  strategy: Strategy
  onStrategyChange: (s: Strategy) => void
  totalActive: number
  totalTracked: number
  totalSectors: number
  onRefresh: () => void
  onOpenLeaderboard: () => void
}

export function MatrixHeader({
  strategy,
  onStrategyChange,
  totalActive,
  totalTracked,
  totalSectors,
  onRefresh,
  onOpenLeaderboard
}: MatrixHeaderProps): ReactElement {
  return (
    <div
      style={{
        height: 'var(--topbar-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-5)',
        borderBottom: '1px solid var(--color-border-default)',
        flexShrink: 0
      }}
    >
      {/* Left: title + counts */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
        <span
          style={{
            fontSize: 'var(--text-md)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--color-text-primary)'
          }}
        >
          Sector signals
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11.5,
            color: 'var(--color-text-muted)'
          }}
        >
          {totalActive} active · {totalTracked} tracked · {totalSectors} sector
          {totalSectors !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Right: segmented control + refresh */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {/* Segmented control */}
        <div
          style={{
            display: 'flex',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden'
          }}
        >
          {(['play', 'play_2'] as Strategy[]).map((s) => {
            const active = strategy === s
            return (
              <button
                key={s}
                onClick={() => onStrategyChange(s)}
                style={{
                  padding: '3px 10px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11.5,
                  fontWeight: 'var(--font-medium)',
                  color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  background: active ? 'var(--color-interactive-active)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast), color var(--transition-fast)',
                  whiteSpace: 'nowrap'
                }}
              >
                {s === 'play' ? 'play · = 12' : 'play_2 · = 13'}
              </button>
            )
          })}
        </div>

        {/* Rankings button */}
        <button
          onClick={onOpenLeaderboard}
          style={{
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 'var(--font-medium)',
            color: 'var(--color-text-secondary)',
            background: 'transparent',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            transition: 'color var(--transition-fast), background var(--transition-fast)',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'var(--color-interactive-hover)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)'
            ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          }}
        >
          Rankings
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          title="Refresh matrix data"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-default)',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: 13,
            transition: 'color var(--transition-fast), background var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'var(--color-interactive-hover)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'
            ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          }}
        >
          ↻
        </button>
      </div>
    </div>
  )
}
