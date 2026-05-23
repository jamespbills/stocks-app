import type { ReactNode, ReactElement } from 'react'

interface SlideOverPanelProps {
  children: ReactNode
  width?: number
}

export function SlideOverPanel({ children, width = 420 }: SlideOverPanelProps): ReactElement {
  return (
    <div
      style={{
        width,
        flexShrink: 0,
        height: '100%',
        background: 'var(--color-bg-elevated)',
        borderLeft: '1px solid var(--color-border-default)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}
