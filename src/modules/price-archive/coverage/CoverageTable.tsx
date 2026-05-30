import { useState, type CSSProperties, type ReactElement } from 'react'
import type { CoverageRow } from '../types'
import { SourceTag } from '../SourceTag'
import { StatusPill } from './StatusPill'
import { CoverageRowActions } from './CoverageRowActions'

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '0 var(--space-4)',
  height: 32,
  fontSize: 10.5,
  fontWeight: 'var(--font-medium)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: 'var(--color-text-muted)',
  position: 'sticky',
  top: 0,
  background: 'var(--color-bg-surface)',
  borderBottom: '1px solid var(--color-border-default)',
  whiteSpace: 'nowrap'
}

const tdStyle: CSSProperties = {
  padding: '0 var(--space-4)',
  height: 'var(--table-row-height)',
  fontSize: 12.5,
  color: 'var(--color-text-secondary)',
  borderBottom: '1px solid var(--color-border-subtle)',
  whiteSpace: 'nowrap'
}

const monoCell: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11.5,
  color: 'var(--color-text-secondary)'
}

function range(from: string | null, to: string | null, ongoingLabel = 'ongoing'): string {
  const left = from ?? '—'
  const right = to ?? ongoingLabel
  return `${left} → ${right}`
}

interface Props {
  rows: CoverageRow[]
  buildingTicker: string | null
  onBuildTicker: (ticker: string) => void
  onUploadCsv: (ticker: string) => void
}

export function CoverageTable({
  rows,
  buildingTicker,
  onBuildTicker,
  onUploadCsv
}: Props): ReactElement {
  const [hoveredTicker, setHoveredTicker] = useState<string | null>(null)

  if (rows.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--text-sm)'
        }}
      >
        No tickers match this filter.
      </div>
    )
  }

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>Ticker</th>
            <th style={thStyle}>Sources</th>
            <th style={thStyle}>Target</th>
            <th style={thStyle}>Held</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Bars</th>
            <th style={thStyle}>Status</th>
            <th style={{ ...thStyle, textAlign: 'right', width: 90 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const hovered = hoveredTicker === row.ticker
            return (
              <tr
                key={row.ticker}
                onMouseEnter={() => setHoveredTicker(row.ticker)}
                onMouseLeave={() => setHoveredTicker((t) => (t === row.ticker ? null : t))}
                style={{ background: hovered ? 'var(--color-interactive-hover)' : 'transparent' }}
              >
                <td style={{ ...tdStyle, ...monoCell, color: 'var(--color-text-primary)' }}>
                  {row.ticker}
                </td>
                <td style={tdStyle}>
                  <span style={{ display: 'inline-flex', gap: 4 }}>
                    {row.sources.map((s) => (
                      <SourceTag key={s} source={s} />
                    ))}
                  </span>
                </td>
                <td style={{ ...tdStyle, ...monoCell }}>{range(row.targetFrom, row.targetTo)}</td>
                <td style={{ ...tdStyle, ...monoCell }}>
                  {row.barCount === 0 ? (
                    <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                  ) : (
                    range(row.firstHeld, row.lastHeld, '—')
                  )}
                </td>
                <td style={{ ...tdStyle, ...monoCell, textAlign: 'right' }}>
                  {row.barCount.toLocaleString()}
                  {row.manualBarCount > 0 && (
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      {' '}
                      ({row.manualBarCount} man)
                    </span>
                  )}
                </td>
                <td style={tdStyle}>
                  <StatusPill status={row.status} />
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <CoverageRowActions
                    row={row}
                    hovered={hovered}
                    building={buildingTicker === row.ticker}
                    onBuild={onBuildTicker}
                    onUploadCsv={onUploadCsv}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
