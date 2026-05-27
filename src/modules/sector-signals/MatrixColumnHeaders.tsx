import type { ReactElement } from 'react'

const headerStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10.5,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
}

export function MatrixColumnHeaders(): ReactElement {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1,
        height: 30,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 12,
        paddingRight: 'var(--space-5)',
        background: 'var(--color-bg-base)',
        borderBottom: '1px solid var(--color-border-subtle)',
        flexShrink: 0
      }}
    >
      {/* chevron spacer */}
      <span style={{ width: 18, flexShrink: 0 }} />

      {/* MISSED CRITERION — flex grow */}
      <span style={{ ...headerStyle, flex: 1 }}>Missed Criterion</span>

      {/* TICKERS */}
      <span style={{ ...headerStyle, width: 72, textAlign: 'right', flexShrink: 0 }}>Tickers</span>

      {/* AVG ROI */}
      <span style={{ ...headerStyle, width: 96, textAlign: 'right', flexShrink: 0 }}>Avg ROI</span>

      {/* WIN */}
      <span style={{ ...headerStyle, width: 72, textAlign: 'right', flexShrink: 0 }}>Win</span>

      {/* SIGNAL */}
      <span style={{ ...headerStyle, width: 100, paddingLeft: 8, flexShrink: 0 }}>Signal</span>

      {/* ACTIVE */}
      <span style={{ ...headerStyle, width: 76, textAlign: 'right', flexShrink: 0 }}>Active</span>
    </div>
  )
}
