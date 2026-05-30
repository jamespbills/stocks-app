import type { CSSProperties, ReactElement } from 'react'

export type Surface = 'coverage' | 'runs' | 'watchlist' | 'settings'

interface SurfaceTab {
  id: Surface
  label: string
  enabled: boolean
}

const TABS: SurfaceTab[] = [
  { id: 'coverage', label: 'Coverage', enabled: true },
  { id: 'runs', label: 'Runs', enabled: true },
  { id: 'watchlist', label: 'Watchlist', enabled: true },
  { id: 'settings', label: 'Settings', enabled: true }
]

const buildButtonStyle: CSSProperties = {
  padding: '5px 12px',
  height: 28,
  fontSize: 12,
  fontWeight: 'var(--font-medium)',
  color: 'var(--color-text-primary)',
  background: 'var(--color-interactive-active)',
  border: '1px solid var(--color-border-focus)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  whiteSpace: 'nowrap'
}

interface Props {
  activeSurface: Surface
  onSurfaceChange: (s: Surface) => void
  tickerCount: number | null
  buildDisabled: boolean
  onBuild: () => void
  onRefresh: () => void
}

export function ModuleHeader({
  activeSurface,
  onSurfaceChange,
  tickerCount,
  buildDisabled,
  onBuild,
  onRefresh
}: Props): ReactElement {
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
          Price archive
        </span>
        {tickerCount !== null && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11.5,
              color: 'var(--color-text-muted)'
            }}
          >
            {tickerCount} ticker{tickerCount !== 1 ? 's' : ''} in scope
          </span>
        )}
      </div>

      {/* Right: surface switcher + build + refresh */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <div
          style={{
            display: 'flex',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden'
          }}
        >
          {TABS.map((tab) => {
            const active = activeSurface === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => tab.enabled && onSurfaceChange(tab.id)}
                disabled={!tab.enabled}
                title={tab.enabled ? undefined : 'Coming in a later session'}
                style={{
                  padding: '3px 11px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11.5,
                  fontWeight: 'var(--font-medium)',
                  color: active
                    ? 'var(--color-text-primary)'
                    : tab.enabled
                      ? 'var(--color-text-muted)'
                      : 'var(--color-text-disabled)',
                  background: active ? 'var(--color-interactive-active)' : 'transparent',
                  border: 'none',
                  cursor: tab.enabled ? 'pointer' : 'not-allowed',
                  transition: 'background var(--transition-fast), color var(--transition-fast)'
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <button
          onClick={onBuild}
          disabled={buildDisabled}
          style={{
            ...buildButtonStyle,
            opacity: buildDisabled ? 0.5 : 1,
            cursor: buildDisabled ? 'not-allowed' : 'pointer'
          }}
        >
          Build archive
        </button>

        <button
          onClick={onRefresh}
          title="Refresh"
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
            fontSize: 13
          }}
        >
          ↻
        </button>
      </div>
    </div>
  )
}
