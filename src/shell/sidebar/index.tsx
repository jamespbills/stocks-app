import { useEffect, useState, type ReactElement } from 'react'
import {
  LayoutDashboard,
  Calendar,
  TrendingUp,
  FileText,
  Terminal,
  BarChart2,
  Settings,
  type LucideIcon
} from 'lucide-react'
import { modules, type ModuleDefinition } from '../../module-registry'
import { useRouter } from '../../hooks/use-router'

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Calendar,
  TrendingUp,
  FileText,
  Terminal,
  BarChart2
}

interface NavItemProps {
  mod: ModuleDefinition
  isActive: boolean
  signalsCount?: number
  onSelect: () => void
}

function NavItem({ mod, isActive, signalsCount, onSelect }: NavItemProps): ReactElement {
  const Icon = ICON_MAP[mod.icon]
  const showBadge = mod.id === 'sector-signals' && signalsCount != null && signalsCount > 0

  return (
    <button
      onClick={onSelect}
      className="flex items-center gap-[10px] w-full rounded-md text-left transition-[background,color] duration-[var(--transition-fast)]"
      style={{
        padding: 'var(--space-2) var(--space-3)',
        margin: '1px var(--space-2)',
        width: 'calc(100% - var(--space-4))',
        background: isActive ? 'var(--color-interactive-active)' : 'transparent',
        color: isActive
          ? 'var(--color-interactive-text-active)'
          : 'var(--color-interactive-text-inactive)',
        fontSize: 'var(--text-md)'
      }}
    >
      {Icon && <Icon size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />}
      <span className="flex-1 truncate">{mod.label}</span>
      {showBadge && (
        <span
          className="flex items-center justify-center rounded-sm text-xs font-medium px-1 min-w-[18px]"
          style={{
            background: 'var(--color-interactive-active)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--text-xs)'
          }}
        >
          {signalsCount}
        </span>
      )}
    </button>
  )
}

function DBIndicator({ connected }: { connected: boolean | null }): ReactElement {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2"
      style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}
    >
      <span
        className="rounded-full flex-shrink-0"
        style={{
          width: 6,
          height: 6,
          background:
            connected === null
              ? 'var(--color-text-muted)'
              : connected
                ? 'var(--color-up)'
                : 'var(--color-down)'
        }}
      />
      <span>
        {connected === null ? 'Connecting…' : connected ? 'DB connected' : 'DB disconnected'}
      </span>
    </div>
  )
}

const dataModules = modules.filter((m) => m.group === 'data')
const toolModules = modules.filter((m) => m.group === 'tools')

export function Sidebar(): ReactElement {
  const { activeId, navigate } = useRouter()
  const [dbConnected, setDbConnected] = useState<boolean | null>(null)

  useEffect(() => {
    const unsub = window.electronAPI.db.onStatus((status) => {
      setDbConnected(status.connected)
    })
    return unsub
  }, [])

  function renderGroup(label: string, mods: ModuleDefinition[]): ReactElement {
    return (
      <div className="mb-2">
        <div
          className="px-4 mb-1 uppercase tracking-wider"
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.5px',
            paddingTop: 'var(--space-3)',
            paddingBottom: 'var(--space-1)'
          }}
        >
          {label}
        </div>
        {mods.map((mod) => (
          <NavItem
            key={mod.id}
            mod={mod}
            isActive={activeId === mod.id}
            onSelect={() => navigate(mod.id)}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className="flex flex-col flex-shrink-0 h-full"
      style={{
        width: 'var(--sidebar-width)',
        background: 'var(--color-bg-surface)',
        borderRight: '1px solid var(--color-border-subtle)'
      }}
    >
      <nav className="flex-1 overflow-y-auto pt-2">
        {renderGroup('Data', dataModules)}
        <div
          style={{
            height: 1,
            margin: 'var(--space-2) var(--space-4)',
            background: 'var(--color-border-subtle)'
          }}
        />
        {renderGroup('Tools', toolModules)}
      </nav>

      {/* Bottom section */}
      <div style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
        <button
          className="flex items-center gap-[10px] w-full transition-[background,color] duration-[var(--transition-fast)]"
          style={{
            padding: 'var(--space-2) var(--space-3)',
            margin: '4px var(--space-2)',
            width: 'calc(100% - var(--space-4))',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-interactive-text-inactive)',
            fontSize: 'var(--text-md)'
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = 'var(--color-interactive-hover)')
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Settings size={15} style={{ opacity: 0.7 }} />
          <span>Settings</span>
        </button>
        <DBIndicator connected={dbConnected} />
      </div>
    </div>
  )
}
