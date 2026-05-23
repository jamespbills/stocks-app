import { useRef, useEffect, useCallback, type ReactElement } from 'react'
import { PlayPill } from './PlayPill'
import { ChangeCell } from './ChangeCell'
import type { WatchingRow, SortState } from './types'

interface ColDef {
  key: string
  label: string
  align: 'left' | 'right'
  width: number | null
  dropAt: number | null // drop column when container width < this px
}

const COLS: ColDef[] = [
  { key: 'ticker', label: 'TICKER', align: 'left', width: 76, dropAt: null },
  { key: 'company', label: 'COMPANY', align: 'left', width: null, dropAt: 980 },
  { key: 'live_price', label: 'LAST', align: 'right', width: 88, dropAt: null },
  { key: 'pct_change', label: 'CHG %', align: 'right', width: 86, dropAt: null },
  { key: 'play', label: 'PLAY', align: 'left', width: 56, dropAt: null },
  { key: 'play_2', label: 'PLAY 2', align: 'left', width: 64, dropAt: null },
  { key: 'date_released', label: 'LAST REPORT', align: 'left', width: 110, dropAt: 820 },
  { key: 'portfolio', label: '', align: 'left', width: 30, dropAt: null }
]

interface WatchingTableProps {
  rows: WatchingRow[]
  portfolioTickers: Set<string>
  selectedTicker: string | null
  sort: SortState
  filter: string
  containerWidth: number
  slideOverOpen: boolean
  onRowClick: (ticker: string) => void
  onSortClick: (key: string) => void
  onPortfolioToggle: (ticker: string) => void
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function dateUrgencyColor(dateStr: string | null): string {
  if (!dateStr) return 'var(--color-danger)'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'var(--color-text-muted)'
  const now = new Date()
  const msDiff = now.getTime() - d.getTime()
  const daysSince = msDiff / (1000 * 60 * 60 * 24)
  if (daysSince > 180) return 'var(--color-danger)'
  if (daysSince > 120) return 'var(--color-warning)'
  return 'var(--color-text-muted)'
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' | null }): ReactElement {
  const color = active ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
  if (active && dir === 'asc') {
    return <span style={{ color, fontSize: 9 }}>▲</span>
  }
  if (active && dir === 'desc') {
    return <span style={{ color, fontSize: 9 }}>▼</span>
  }
  return <span style={{ color, fontSize: 9, opacity: 0.4 }}>⇅</span>
}

export function WatchingTable({
  rows,
  portfolioTickers,
  selectedTicker,
  sort,
  filter,
  containerWidth,
  slideOverOpen,
  onRowClick,
  onSortClick,
  onPortfolioToggle
}: WatchingTableProps): ReactElement {
  const tbodyRef = useRef<HTMLTableSectionElement>(null)

  const visibleCols = COLS.filter((c) => {
    if (c.dropAt === null) return true
    if (slideOverOpen) {
      // when slide-over open, apply the drop rules for the compressed state
      if (c.key === 'company') return false
      if (c.key === 'date_released') return false
    }
    return containerWidth === 0 || containerWidth >= c.dropAt
  })

  const filteredRows = filter
    ? rows.filter(
        (r) =>
          r.ticker.toLowerCase().includes(filter.toLowerCase()) ||
          r.company.toLowerCase().includes(filter.toLowerCase())
      )
    : rows

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (!sort.key || !sort.dir) return 0
    const av = a[sort.key as keyof WatchingRow]
    const bv = b[sort.key as keyof WatchingRow]
    if (av === null && bv === null) return 0
    if (av === null) return 1
    if (bv === null) return -1
    if (typeof av === 'number' && typeof bv === 'number') {
      return sort.dir === 'asc' ? av - bv : bv - av
    }
    const as = String(av)
    const bs = String(bv)
    return sort.dir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as)
  })

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!selectedTicker) return
      const idx = sortedRows.findIndex((r) => r.ticker === selectedTicker)
      if (idx === -1) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = sortedRows[idx + 1]
        if (next) onRowClick(next.ticker)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = sortedRows[idx - 1]
        if (prev) onRowClick(prev.ticker)
      }
    },
    [selectedTicker, sortedRows, onRowClick]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Scroll selected row into view
  useEffect(() => {
    if (!selectedTicker || !tbodyRef.current) return
    const row = tbodyRef.current.querySelector(`[data-ticker="${selectedTicker}"]`)
    row?.scrollIntoView({ block: 'nearest' })
  }, [selectedTicker])

  function renderCell(col: ColDef, row: WatchingRow): ReactElement {
    const cellStyle: React.CSSProperties = {
      padding: '8px 10px',
      textAlign: col.align,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }

    switch (col.key) {
      case 'ticker':
        return (
          <td
            key={col.key}
            style={{
              ...cellStyle,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-primary)',
              fontWeight: 500
            }}
          >
            {row.ticker}
          </td>
        )
      case 'company':
        return (
          <td key={col.key} style={{ ...cellStyle, color: 'var(--color-text-secondary)' }}>
            {row.company}
          </td>
        )
      case 'live_price':
        return (
          <td
            key={col.key}
            style={{
              ...cellStyle,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-primary)',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {row.live_price !== null ? Number(row.live_price).toFixed(2) : '—'}
          </td>
        )
      case 'pct_change':
        return (
          <td key={col.key} style={cellStyle}>
            <ChangeCell value={row.pct_change} />
          </td>
        )
      case 'play':
        return (
          <td key={col.key} style={cellStyle}>
            <PlayPill score={row.play} maxScore={13} />
          </td>
        )
      case 'play_2':
        return (
          <td key={col.key} style={cellStyle}>
            <PlayPill score={row.play_2} maxScore={14} />
          </td>
        )
      case 'date_released':
        return (
          <td
            key={col.key}
            style={{
              ...cellStyle,
              fontFamily: 'var(--font-mono)',
              color: dateUrgencyColor(row.date_released)
            }}
          >
            {formatDate(row.date_released)}
          </td>
        )
      case 'portfolio':
        return (
          <td key={col.key} style={cellStyle}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPortfolioToggle(row.ticker)
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: 2,
                cursor: 'pointer',
                color: portfolioTickers.has(row.ticker) ? '#EAB308' : 'var(--color-text-muted)',
                fontSize: 10,
                lineHeight: 1,
                opacity: portfolioTickers.has(row.ticker) ? 1 : 0.3
              }}
              title={
                portfolioTickers.has(row.ticker) ? 'Remove from portfolio' : 'Add to portfolio'
              }
            >
              ●
            </button>
          </td>
        )
      default:
        return <td key={col.key} />
    }
  }

  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 12.5,
        color: 'var(--color-text-secondary)',
        tableLayout: 'fixed'
      }}
    >
      <colgroup>
        {visibleCols.map((c) => (
          <col key={c.key} style={{ width: c.width ? `${c.width}px` : 'auto' }} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {visibleCols.map((c) => (
            <th
              key={c.key}
              onClick={() => c.key !== 'portfolio' && onSortClick(c.key)}
              style={{
                fontSize: 10.5,
                fontWeight: 400,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                padding: '10px 10px',
                borderBottom: '1px solid var(--color-border-subtle)',
                textAlign: c.align,
                background: 'var(--color-bg-base)',
                position: 'sticky',
                top: 0,
                cursor: c.key !== 'portfolio' ? 'pointer' : 'default',
                userSelect: 'none'
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {c.label}
                {c.key !== 'portfolio' && (
                  <SortIcon
                    active={sort.key === c.key}
                    dir={sort.key === c.key ? sort.dir : null}
                  />
                )}
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody ref={tbodyRef}>
        {sortedRows.map((row) => {
          const selected = row.ticker === selectedTicker
          return (
            <tr
              key={row.ticker}
              data-ticker={row.ticker}
              onClick={() => onRowClick(row.ticker)}
              style={{
                borderBottom: '1px solid var(--color-border-subtle)',
                background: selected ? 'var(--color-interactive-active)' : 'transparent',
                height: 36,
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!selected) {
                  ;(e.currentTarget as HTMLTableRowElement).style.background =
                    'var(--color-interactive-hover)'
                }
              }}
              onMouseLeave={(e) => {
                if (!selected) {
                  ;(e.currentTarget as HTMLTableRowElement).style.background = 'transparent'
                }
              }}
            >
              {visibleCols.map((col) => renderCell(col, row))}
            </tr>
          )
        })}
        {sortedRows.length === 0 && (
          <tr>
            <td
              colSpan={visibleCols.length}
              style={{
                padding: 32,
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: 12.5
              }}
            >
              No results
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}
