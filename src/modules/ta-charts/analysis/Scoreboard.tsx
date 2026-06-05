import { useState, type CSSProperties, type ReactElement } from 'react'
import type { ScoreboardResult, ScoreboardRow } from '../types'
import { DistributionMini } from './DistributionMini'

// Signed percent (the stats are already in percentage units, so no ×100).
function pct(n: number, digits = 1): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(digits)}%`
}
function retColor(n: number): string {
  return n > 0 ? 'var(--color-up)' : n < 0 ? 'var(--color-down)' : 'var(--color-text-secondary)'
}

type SortKey =
  | 'count'
  | 'winRate'
  | 'cumReturn'
  | 'avgReturn'
  | 'medianReturn'
  | 'stdDev'
  | 'avgHoldDays'

interface Col {
  key: SortKey
  label: string
  render: (r: ScoreboardRow) => ReactElement
}

const th: CSSProperties = {
  padding: '8px 12px',
  textAlign: 'right',
  fontFamily: 'var(--font-mono)',
  fontSize: 10.5,
  fontWeight: 'var(--font-medium)',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  color: 'var(--color-text-muted)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  userSelect: 'none'
}
const td: CSSProperties = {
  padding: '9px 12px',
  textAlign: 'right',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap'
}

const mono = (n: number, digits = 1): ReactElement => (
  <span style={{ color: retColor(n) }}>{pct(n, digits)}</span>
)

const COLS: Col[] = [
  { key: 'count', label: 'Trades', render: (r) => <span>{r.count}</span> },
  {
    key: 'winRate',
    label: 'Win %',
    render: (r) => <span>{r.winRate.toFixed(0)}%</span>
  },
  { key: 'cumReturn', label: 'Cum', render: (r) => mono(r.cumReturn, 0) },
  { key: 'avgReturn', label: 'Avg', render: (r) => mono(r.avgReturn) },
  { key: 'medianReturn', label: 'Median', render: (r) => mono(r.medianReturn) },
  {
    key: 'stdDev',
    label: 'Std',
    render: (r) => (
      <span style={{ color: 'var(--color-text-secondary)' }}>{r.stdDev.toFixed(1)}</span>
    )
  },
  {
    key: 'avgHoldDays',
    label: 'Hold (d)',
    render: (r) => (
      <span style={{ color: 'var(--color-text-secondary)' }}>{Math.round(r.avgHoldDays)}</span>
    )
  }
]

interface Props {
  result: ScoreboardResult
  selectedKey: string | null
  onSelect: (key: string) => void
}

export function Scoreboard({ result, selectedKey, onSelect }: Props): ReactElement {
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [desc, setDesc] = useState(true)

  const overall = result.rows.find((r) => r.key === 'overall')
  const buckets = result.rows.filter((r) => r.key !== 'overall')

  const sorted = sortKey
    ? [...buckets].sort((a, b) => {
        const d = a[sortKey] - b[sortKey]
        return desc ? -d : d
      })
    : buckets

  const ordered = overall ? [overall, ...sorted] : sorted

  const clickHeader = (key: SortKey): void => {
    if (key === sortKey) setDesc((d) => !d)
    else {
      setSortKey(key)
      setDesc(true)
    }
  }

  return (
    <div style={{ overflow: 'auto', flex: 1, minHeight: 0 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border-default)' }}>
            <th style={{ ...th, textAlign: 'left' }}>Bucket</th>
            {COLS.map((c) => (
              <th key={c.key} style={th} onClick={() => clickHeader(c.key)}>
                {c.label}
                {sortKey === c.key ? (desc ? ' ▾' : ' ▴') : ''}
              </th>
            ))}
            <th style={{ ...th, textAlign: 'center', cursor: 'default' }}>Distribution</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((r) => {
            const isOverall = r.key === 'overall'
            const selected = r.key === selectedKey
            return (
              <tr
                key={r.key}
                onClick={() => onSelect(r.key)}
                style={{
                  borderBottom: '1px solid var(--color-border-subtle)',
                  background: selected
                    ? 'var(--color-interactive-active)'
                    : isOverall
                      ? 'var(--color-bg-elevated)'
                      : 'transparent',
                  cursor: 'pointer'
                }}
              >
                <td
                  style={{
                    ...td,
                    textAlign: 'left',
                    color: 'var(--color-text-primary)',
                    fontWeight: isOverall ? 'var(--font-medium)' : 'var(--font-regular)'
                  }}
                >
                  {r.label}
                </td>
                {COLS.map((c) => (
                  <td key={c.key} style={td}>
                    {c.render(r)}
                  </td>
                ))}
                <td style={{ ...td, textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex' }}>
                    <DistributionMini histogram={r.histogram} />
                  </div>
                </td>
              </tr>
            )
          })}
          {ordered.length === 0 && (
            <tr>
              <td
                colSpan={COLS.length + 2}
                style={{
                  ...td,
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  padding: '32px 12px'
                }}
              >
                No trades under the current settings.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
