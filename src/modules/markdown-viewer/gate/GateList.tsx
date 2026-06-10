import { useCallback, useEffect, useRef, type CSSProperties, type ReactElement } from 'react'
import { MutedLabel } from '../../../components/MutedLabel'
import { usePlayThresholds } from '../../../lib/playThresholds'
import { PlayPill } from '../../watching-dashboard/PlayPill'
import { GateChip } from '../GateChip'
import type { GateRow } from '../types'

interface Props {
  rows: GateRow[]
  selectedTicker: string | null
  panelOpen: boolean
  onSelect: (ticker: string) => void
}

const th: CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  fontFamily: 'var(--font-mono)',
  fontSize: 10.5,
  fontWeight: 'var(--font-medium)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--color-text-muted)',
  borderBottom: '1px solid var(--color-border-default)',
  whiteSpace: 'nowrap'
}

const td: CSSProperties = {
  padding: '9px 12px',
  fontSize: 'var(--text-sm)',
  borderBottom: '1px solid var(--color-border-subtle)',
  whiteSpace: 'nowrap'
}

export function GateList({ rows, selectedTicker, panelOpen, onSelect }: Props): ReactElement {
  const thresholds = usePlayThresholds()
  const tbodyRef = useRef<HTMLTableSectionElement>(null)

  // Arrow-key navigation while a row is selected (mirrors Watching Dashboard).
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!selectedTicker) return
      const idx = rows.findIndex((r) => r.ticker === selectedTicker)
      if (idx === -1) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = rows[idx + 1]
        if (next) onSelect(next.ticker)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = rows[idx - 1]
        if (prev) onSelect(prev.ticker)
      }
    },
    [selectedTicker, rows, onSelect]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (!selectedTicker || !tbodyRef.current) return
    tbodyRef.current
      .querySelector(`[data-ticker="${selectedTicker}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [selectedTicker])

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Ticker</th>
            {!panelOpen && <th style={th}>Company</th>}
            {!panelOpen && <th style={th}>Sector</th>}
            <th style={{ ...th, textAlign: 'right' }}>Play</th>
            <th style={{ ...th, textAlign: 'right' }}>Play 2</th>
            <th style={{ ...th, textAlign: 'right' }}>Gate</th>
          </tr>
        </thead>
        <tbody ref={tbodyRef}>
          {rows.map((row) => {
            const selected = row.ticker === selectedTicker
            return (
              <tr
                key={row.ticker}
                data-ticker={row.ticker}
                onClick={() => onSelect(row.ticker)}
                style={{
                  cursor: 'pointer',
                  background: selected ? 'var(--color-interactive-active)' : 'transparent'
                }}
              >
                <td
                  style={{
                    ...td,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {row.ticker}
                </td>
                {!panelOpen && (
                  <td
                    style={{
                      ...td,
                      color: 'var(--color-text-secondary)',
                      maxWidth: 220,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {row.company ?? '—'}
                  </td>
                )}
                {!panelOpen && (
                  <td style={{ ...td, color: 'var(--color-text-muted)' }}>{row.sector ?? '—'}</td>
                )}
                <td style={{ ...td, textAlign: 'right' }}>
                  <PlayPill score={row.numeric?.play ?? null} maxScore={thresholds.play.maxScore} />
                </td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <PlayPill
                    score={row.numeric?.play2 ?? null}
                    maxScore={thresholds.play_2.maxScore}
                  />
                </td>
                <td style={{ ...td, textAlign: 'right' }}>
                  {row.brain ? (
                    <GateChip gate={row.brain.gate} />
                  ) : (
                    <MutedLabel size={10} mono>
                      none
                    </MutedLabel>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
