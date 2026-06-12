import type { ReactElement, ReactNode } from 'react'

/** The Dashboards card shell (wireframe `DashCard`): title + sub header, padded body. */
export function DashCard({
  title,
  sub,
  children
}: {
  title: string
  sub: string
  children: ReactNode
}): ReactElement {
  return (
    <div
      style={{
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-surface)',
        overflow: 'hidden'
      }}
    >
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 'var(--font-medium)',
            color: 'var(--color-text-primary)'
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  )
}
