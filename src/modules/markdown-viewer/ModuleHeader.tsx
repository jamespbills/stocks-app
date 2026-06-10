import type { CSSProperties, ReactElement } from 'react'

export type Surface = 'reviews' | 'library' | 'dashboards' | 'inbox'

interface SurfaceTab {
  id: Surface
  label: string
}

const TABS: SurfaceTab[] = [
  { id: 'reviews', label: 'Reviews' },
  { id: 'library', label: 'Library' },
  { id: 'dashboards', label: 'Dashboards' },
  { id: 'inbox', label: 'Inbox' }
]

const tabBase: CSSProperties = {
  padding: '3px 11px',
  fontFamily: 'var(--font-mono)',
  fontSize: 11.5,
  fontWeight: 'var(--font-medium)',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  transition: 'background var(--transition-fast), color var(--transition-fast)'
}

interface Props {
  activeSurface: Surface
  onSurfaceChange: (s: Surface) => void
  /** Count for the Inbox tab badge (pending-in-raw + unmatched). Badge hidden at 0. */
  inboxCount: number
}

export function ModuleHeader({ activeSurface, onSurfaceChange, inboxCount }: Props): ReactElement {
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
      <span
        style={{
          fontSize: 'var(--text-md)',
          fontWeight: 'var(--font-medium)',
          color: 'var(--color-text-primary)'
        }}
      >
        Reviews
      </span>

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
          const showBadge = tab.id === 'inbox' && inboxCount > 0
          return (
            <button
              key={tab.id}
              onClick={() => onSurfaceChange(tab.id)}
              style={{
                ...tabBase,
                color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                background: active ? 'var(--color-interactive-active)' : 'transparent'
              }}
            >
              {tab.label}
              {showBadge && (
                <span
                  className="flex items-center justify-center rounded-sm px-1 min-w-[18px]"
                  style={{
                    background: 'var(--color-interactive-active)',
                    color: 'var(--color-text-primary)',
                    fontSize: 'var(--text-xs)'
                  }}
                >
                  {inboxCount}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
