import { useRef, useEffect, useCallback, useMemo, type ReactElement } from 'react'
import { PlayPill } from './PlayPill'
import { ChangeCell } from './ChangeCell'
import { formatDate } from '../../lib/format'
import { usePlayThresholds } from '../../lib/playThresholds'
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
  { key: 'play', label: 'PLAY', align: 'left', width: 90, dropAt: null },
  { key: 'play_2', label: 'PLAY 2', align: 'left', width: 90, dropAt: null },
  { key: 'sector', label: 'SECTOR', align: 'left', width: 130, dropAt: 1100 },
  { key: 'date_released', label: 'LAST REPORT', align: 'left', width: 145, dropAt: 820 },
  { key: 'portfolio', label: '', align: 'left', width: 36, dropAt: null }
]

interface WatchingTableProps {
  rows: WatchingRow[]
  portfolioTickers: Set<string>
  selectedRowKey: string | null
  sort: SortState
  filter: string
  containerWidth: number
  slideOverOpen: boolean
  onRowClick: (rk: string, ticker: string) => void
  onSortClick: (key: string) => void
  onPortfolioToggle: (ticker: string) => void
}

function isSectorPlay(row: WatchingRow): boolean {
  return (row.play_sector_rating ?? 0) > 0 || (row.play_2_sector_rating ?? 0) > 0
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

function toSortable(v: unknown): number | string {
  if (v instanceof Date) return v.getTime()
  if (typeof v === 'number') return v
  return String(v ?? '')
}

function rowKey(row: WatchingRow): string {
  return `${row.ticker}|${row.filing_identifier ?? String(row.date_released ?? row.financial_year ?? row.report_date ?? 'x')}`
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' | null }): ReactElement {
  const color = active ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
  if (active && dir === 'asc') {
    return <span style={{ color, fontSize: 10 }}>▲</span>
  }
  if (active && dir === 'desc') {
    return <span style={{ color, fontSize: 10 }}>▼</span>
  }
  return <span style={{ color, fontSize: 10, opacity: 0.4 }}>⇅</span>
}

export function WatchingTable({
  rows,
  portfolioTickers,
  selectedRowKey,
  sort,
  filter,
  containerWidth,
  slideOverOpen,
  onRowClick,
  onSortClick,
  onPortfolioToggle
}: WatchingTableProps): ReactElement {
  const tbodyRef = useRef<HTMLTableSectionElement>(null)
  const thresholds = usePlayThresholds()

  const sectorWidth = useMemo(() => {
    if (!rows.length) return 160
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return 160
    ctx.font = '400 13.5px -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
    const maxW = Math.max(...rows.map((r) => ctx.measureText(r.sector ?? '').width))
    return Math.ceil(maxW) + 32 // 24px cell padding + 8px buffer
  }, [rows])

  const effectiveCols = useMemo(
    () => COLS.map((c) => (c.key === 'sector' ? { ...c, width: sectorWidth } : c)),
    [sectorWidth]
  )

  const visibleCols = effectiveCols.filter((c) => {
    if (c.dropAt === null) return true
    if (slideOverOpen) {
      // when slide-over open, apply the drop rules for the compressed state
      if (c.key === 'company') return false
      if (c.key === 'sector') return false
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
    const as = toSortable(av)
    const bs = toSortable(bv)
    if (typeof as === 'number' && typeof bs === 'number') {
      return sort.dir === 'asc' ? as - bs : bs - as
    }
    return sort.dir === 'asc'
      ? String(as).localeCompare(String(bs))
      : String(bs).localeCompare(String(as))
  })

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!selectedRowKey) return
      const idx = sortedRows.findIndex((r) => rowKey(r) === selectedRowKey)
      if (idx === -1) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = sortedRows[idx + 1]
        if (next) onRowClick(rowKey(next), next.ticker)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = sortedRows[idx - 1]
        if (prev) onRowClick(rowKey(prev), prev.ticker)
      }
    },
    [selectedRowKey, sortedRows, onRowClick]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Scroll selected row into view
  useEffect(() => {
    if (!selectedRowKey || !tbodyRef.current) return
    const row = tbodyRef.current.querySelector(`[data-rowkey="${selectedRowKey}"]`)
    row?.scrollIntoView({ block: 'nearest' })
  }, [selectedRowKey])

  function renderCell(col: ColDef, row: WatchingRow): ReactElement {
    const cellStyle: React.CSSProperties = {
      padding: '9px 12px',
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
              fontWeight: 600
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
          <td key={col.key} style={{ ...cellStyle, textOverflow: 'clip' }}>
            <PlayPill
              score={row.play}
              maxScore={thresholds.play.maxScore}
              sectorPlay={(row.play_sector_rating ?? 0) > 0}
              sectorName={row.sector}
              missedCriterion={row.missed_upon}
            />
          </td>
        )
      case 'play_2':
        return (
          <td key={col.key} style={{ ...cellStyle, textOverflow: 'clip' }}>
            <PlayPill
              score={row.play_2}
              maxScore={thresholds.play_2.maxScore}
              sectorPlay={(row.play_2_sector_rating ?? 0) > 0}
              sectorName={row.sector}
              missedCriterion={row.missed_upon_2}
            />
          </td>
        )
      case 'sector':
        return (
          <td key={col.key} style={{ ...cellStyle, color: 'var(--color-text-secondary)' }}>
            {row.sector ?? '—'}
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
          <td
            key={col.key}
            style={{
              padding: '9px 6px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden'
            }}
          >
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
                fontSize: 14,
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
        fontSize: 13.5,
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
                fontSize: 11.5,
                fontWeight: 400,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                padding: '10px 12px',
                borderBottom: '1px solid var(--color-border-subtle)',
                textAlign: c.align,
                background: 'var(--color-bg-base)',
                position: 'sticky',
                top: 0,
                cursor: c.key !== 'portfolio' ? 'pointer' : 'default',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                overflow: 'hidden'
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
          const rk = rowKey(row)
          const selected = rk === selectedRowKey
          const sectorPlay = isSectorPlay(row)
          const defaultBg = sectorPlay ? 'rgba(245, 158, 11, 0.07)' : 'transparent'
          return (
            <tr
              key={rk}
              data-rowkey={rk}
              onClick={() => onRowClick(rk, row.ticker)}
              style={{
                borderBottom: '1px solid var(--color-border-subtle)',
                background: selected ? 'var(--color-interactive-active)' : defaultBg,
                height: 42,
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
                  ;(e.currentTarget as HTMLTableRowElement).style.background = defaultBg
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
