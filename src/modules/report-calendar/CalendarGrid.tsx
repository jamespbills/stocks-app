import type { ReactElement } from 'react'
import { DayCell } from './DayCell'
import { PeriodMarker } from './PeriodMarker'
import { buildMonthGrid, PERIOD_ENDS } from './types'
import type { CalendarEntry, PopoverState } from './types'

const DOW_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

interface CalendarGridProps {
  year: number
  month: number
  entriesByDate: Map<string, CalendarEntry[]>
  popover: PopoverState
  onEntryClick: (date: string, ticker: string, e: React.MouseEvent) => void
  onDayClick: (date: string, e: React.MouseEvent) => void
  onDismissPopover: () => void
  onNavigate: (moduleId: string) => void
  onDisregardEntry: (entry: CalendarEntry) => void
}

export function CalendarGrid({
  year,
  month,
  entriesByDate,
  popover,
  onEntryClick,
  onDayClick,
  onDismissPopover,
  onNavigate,
  onDisregardEntry
}: CalendarGridProps): ReactElement {
  const cells = buildMonthGrid(year, month)
  const rows: (typeof cells)[] = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Day-of-week header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: '1px solid var(--color-border-subtle)',
          flexShrink: 0
        }}
      >
        {DOW_LABELS.map((d) => (
          <div
            key={d}
            style={{
              padding: '8px 8px',
              fontSize: 10.5,
              color: 'var(--color-text-muted)',
              letterSpacing: 0.5,
              borderRight: '1px solid var(--color-border-subtle)'
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid rows */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateRows: `repeat(${rows.length}, 1fr)`
        }}
      >
        {rows.map((row, ri) => {
          // Find any period-end markers in this row
          const markers = PERIOD_ENDS.filter(({ month: pm, day: pd }) =>
            row.some((c) => {
              const d = new Date(c.date)
              return d.getMonth() === pm && d.getDate() === pd
            })
          ).map(({ month: pm, day: pd, label }) => ({
            label,
            colIdx: row.findIndex((c) => {
              const d = new Date(c.date)
              return d.getMonth() === pm && d.getDate() === pd
            })
          }))

          return (
            <div
              key={ri}
              style={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)'
              }}
            >
              {row.map((cell) => (
                <DayCell
                  key={cell.date}
                  cell={cell}
                  entries={entriesByDate.get(cell.date) ?? []}
                  popover={popover}
                  onEntryClick={onEntryClick}
                  onDayClick={onDayClick}
                  onDismissPopover={onDismissPopover}
                  onNavigate={onNavigate}
                  onDisregardEntry={onDisregardEntry}
                />
              ))}
              {markers.map(({ label, colIdx }) => (
                <PeriodMarker key={label} label={label} colIdx={colIdx} />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
