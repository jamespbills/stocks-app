import { useEffect, type ReactNode, type ReactElement } from 'react'

interface PopoverProps {
  children: ReactNode
  onDismiss: () => void
  width?: number
}

export function Popover({ children, onDismiss, width = 240 }: PopoverProps): ReactElement {
  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onDismiss])

  useEffect(() => {
    function handleClick(): void {
      onDismiss()
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [onDismiss])

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        left: '100%',
        top: -1,
        marginLeft: 6,
        width,
        background: 'var(--color-bg-overlay)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 8,
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        padding: 12,
        zIndex: 20
      }}
    >
      {children}
    </div>
  )
}
