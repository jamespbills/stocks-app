import type { CSSProperties, ReactElement } from 'react'
import { formatDate } from '../../../lib/format'
import type { Trade } from '../types'

function pct(n: number, digits = 1): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(digits)}%`
}
function retColor(n: number): string {
  return n > 0 ? 'var(--color-up)' : n < 0 ? 'var(--color-down)' : 'var(--color-text-secondary)'
}

const th: CSSProperties = {
  padding: '7px 10px',
  textAlign: 'right',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  fontWeight: 'var(--font-medium)',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  color: 'var(--color-text-muted)',
  whiteSpace: 'nowrap',
  position: 'sticky',
  top: 0,
  background: 'var(--color-bg-elevated)'
}
const td: CSSProperties = {
  padding: '8px 10px',
  textAlign: 'right',
  fontFamily: 'var(--font-mono)',
  fontSize: 11.5,
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap'
}

interface Props {
  label: string
  trades: Trade[]
  onClose: () => void
}

// Slide-over listing every trade behind the selected scoreboard bucket — the
// buy/sell detail James moved off the chart. Sorted best return first.
export function TradeDrillDown({ label, trades, onClose }: Props): ReactElement {
  const sorted = [...trades].sort((a, b) => b.returnPct - a.returnPct)

  return (
    <div
      style={{
        width: 520,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg-elevated)',
        borderLeft: '1px solid var(--color-border-default)'
      }}
    >
      <div
        style={{
          height: 44,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid var(--color-border-subtle)'
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 'var(--font-medium)',
              color: 'var(--color-text-primary)'
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text-muted)'
            }}
          >
            {trades.length} trade{trades.length !== 1 ? 's' : ''}
          </span>
        </span>
        <button
          type="button"
          aria-label="Close trade list"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
            padding: 4
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: 'left' }}>Ticker</th>
              <th style={{ ...th, textAlign: 'left' }}>Report</th>
              <th style={{ ...th, textAlign: 'left' }}>Entry</th>
              <th style={th}>+d</th>
              <th style={th}>Grade</th>
              <th style={th}>MA</th>
              <th style={th}>In</th>
              <th style={th}>Out</th>
              <th style={th}>Return</th>
              <th style={th}>Hold</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ ...td, textAlign: 'left', color: 'var(--color-text-primary)' }}>
                  {t.ticker}
                </td>
                <td style={{ ...td, textAlign: 'left', color: 'var(--color-text-secondary)' }}>
                  {formatDate(t.reportDate, 'short')}
                  {t.filingIdentifier ? ` · ${t.filingIdentifier}` : ''}
                </td>
                <td style={{ ...td, textAlign: 'left', color: 'var(--color-text-secondary)' }}>
                  {formatDate(t.entryDate, 'short')}
                </td>
                <td style={{ ...td, color: 'var(--color-text-muted)' }}>{t.daysFromReport}</td>
                <td style={td}>{t.grade}</td>
                <td style={{ ...td, color: 'var(--color-text-muted)' }}>
                  {t.maPosition === 'ABOVE' ? '▲' : t.maPosition === 'BELOW' ? '▼' : '—'}
                </td>
                <td style={{ ...td, color: 'var(--color-text-secondary)' }}>
                  {t.entryClose.toFixed(2)}
                </td>
                <td style={{ ...td, color: 'var(--color-text-secondary)' }}>
                  {t.exitClose.toFixed(2)}
                </td>
                <td style={{ ...td, color: retColor(t.returnPct) }}>{pct(t.returnPct)}</td>
                <td style={{ ...td, color: 'var(--color-text-muted)' }}>{t.holdDays}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
