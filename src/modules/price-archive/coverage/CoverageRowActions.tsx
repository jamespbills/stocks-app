import type { CSSProperties, ReactElement } from 'react'
import type { CoverageRow } from '../types'

const actionButtonStyle: CSSProperties = {
  padding: '3px 9px',
  height: 24,
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border-default)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  fontSize: 11,
  fontFamily: 'var(--font-mono)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'color var(--transition-fast), background var(--transition-fast)'
}

// Promoted (filled) style — used for Upload CSV on a missing row, the only way
// forward when yfinance has no data (PA-1).
const promotedStyle: CSSProperties = {
  ...actionButtonStyle,
  border: '1px solid var(--color-border-strong)',
  background: 'var(--color-interactive-active)',
  color: 'var(--color-text-primary)'
}

interface Props {
  row: CoverageRow
  hovered: boolean
  building: boolean
  onBuild: (ticker: string) => void
  onUploadCsv: (ticker: string) => void
}

// At rest the cell shows a quiet ⋯; Build + Upload CSV reveal on row hover.
// A `missing` row promotes Upload CSV (yfinance can't help — manual is the path).
export function CoverageRowActions({
  row,
  hovered,
  building,
  onBuild,
  onUploadCsv
}: Props): ReactElement {
  if (!hovered) {
    return <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>⋯</span>
  }
  const missing = row.status === 'missing'
  return (
    <span style={{ display: 'inline-flex', gap: 6, justifyContent: 'flex-end' }}>
      <button
        type="button"
        disabled={building}
        onClick={(e) => {
          e.stopPropagation()
          onBuild(row.ticker)
        }}
        style={{
          ...actionButtonStyle,
          opacity: building ? 0.5 : 1,
          cursor: building ? 'not-allowed' : 'pointer'
        }}
      >
        Build
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onUploadCsv(row.ticker)
        }}
        style={missing ? promotedStyle : actionButtonStyle}
      >
        Upload CSV
      </button>
    </span>
  )
}
