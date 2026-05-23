import type { ReactElement, CSSProperties } from 'react'
import { Minus, Square, X } from 'lucide-react'
import { useRouter } from '../../hooks/use-router'
import { moduleMap } from '../../module-registry'

const IS_WINDOWS = navigator.platform.toLowerCase().includes('win')

function WindowControls(): ReactElement {
  function handleMinimize(): void {
    window.electronAPI.win.minimize()
  }
  function handleMaximize(): void {
    window.electronAPI.win.maximize()
  }
  function handleClose(): void {
    window.electronAPI.win.close()
  }

  return (
    <div
      className="flex items-stretch h-full"
      style={{ WebkitAppRegion: 'no-drag' } as CSSProperties}
    >
      <button
        onClick={handleMinimize}
        className="flex items-center justify-center w-[46px] h-full"
        style={{ color: 'var(--color-text-muted)' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-interactive-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        aria-label="Minimize"
      >
        <Minus size={12} />
      </button>
      <button
        onClick={handleMaximize}
        className="flex items-center justify-center w-[46px] h-full"
        style={{ color: 'var(--color-text-muted)' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-interactive-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        aria-label="Maximize"
      >
        <Square size={10} />
      </button>
      <button
        onClick={handleClose}
        className="flex items-center justify-center w-[46px] h-full"
        style={{ color: 'var(--color-text-muted)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.80)'
          e.currentTarget.style.color = 'white'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--color-text-muted)'
        }}
        aria-label="Close"
      >
        <X size={12} />
      </button>
    </div>
  )
}

export function TitleBar(): ReactElement {
  const { activeId } = useRouter()
  const activeModule = moduleMap.get(activeId)

  return (
    <div
      className="flex items-center justify-between flex-shrink-0"
      style={
        {
          height: 'var(--topbar-height)',
          background: 'var(--color-bg-surface)',
          borderBottom: '1px solid var(--color-border-subtle)',
          WebkitAppRegion: 'drag'
        } as CSSProperties
      }
    >
      <div className="w-[88px] flex-shrink-0" />

      <div
        className="flex-1 text-center font-medium truncate"
        style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}
      >
        {activeModule?.label ?? 'Stocks App'}
      </div>

      <div className="w-[138px] flex-shrink-0 flex justify-end h-full">
        {IS_WINDOWS && <WindowControls />}
      </div>
    </div>
  )
}
