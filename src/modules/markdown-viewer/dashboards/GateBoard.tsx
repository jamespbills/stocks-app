import type { ReactElement } from 'react'
import { GATE_STYLE } from '../gate-style'
import type { GateBoardColumn } from '../types'

/** The Gate board: the same universe as Coverage, regrouped by verdict (wireframe columns). */
export function GateBoard({
  columns,
  onOpenTicker
}: {
  columns: GateBoardColumn[]
  onOpenTicker: (ticker: string) => void
}): ReactElement {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {columns.map((col) => (
        <div key={col.gate} style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: GATE_STYLE[col.gate].color,
                flexShrink: 0
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10.5,
                color: GATE_STYLE[col.gate].color,
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {col.label}
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-text-muted)'
              }}
            >
              {col.tickers.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minHeight: 30 }}>
            {col.tickers.length > 0 ? (
              col.tickers.map((t) => (
                <button
                  key={t}
                  onClick={() => onOpenTicker(t)}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--color-text-primary)',
                    padding: '5px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-bg-base)',
                    border: '1px solid var(--color-border-subtle)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {t}
                </button>
              ))
            ) : (
              <span
                style={{ fontSize: 11.5, color: 'var(--color-text-disabled)', padding: '5px 0' }}
              >
                —
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
