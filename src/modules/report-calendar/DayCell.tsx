import { useLayoutEffect, useRef, useState, type ReactElement } from 'react'
import { EntryChip } from './EntryChip'
import { EntryPopover } from './EntryPopover'
import { DayPopover } from './DayPopover'
import type { CalendarCell, CalendarEntry, PopoverState } from './types'

interface DayCellProps {
  cell: CalendarCell
  entries: CalendarEntry[]
  popover: PopoverState
  onEntryClick: (date: string, ticker: string, e: React.MouseEvent) => void
  onDayClick: (date: string, e: React.MouseEvent) => void
  onDismissPopover: () => void
  onNavigate: (moduleId: string) => void
  onDisregardEntry: (entry: CalendarEntry) => void
}

const MAX_VISIBLE = 2

export function DayCell({
  cell,
  entries,
  popover,
  onEntryClick,
  onDayClick,
  onDismissPopover,
  onNavigate,
  onDisregardEntry
}: DayCellProps): ReactElement {
  const visible = entries.slice(0, MAX_VISIBLE)
  const hidden = entries.length - visible.length

  const chipRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [moreEl, setMoreEl] = useState<HTMLDivElement | null>(null)
  const [activeChipEl, setActiveChipEl] = useState<HTMLDivElement | null>(null)

  const activeEntry =
    popover?.kind === 'entry' && popover.source === 'grid' && popover.date === cell.date
      ? entries.find((e) => e.ticker === popover.ticker)
      : undefined
  const showDayPopover = popover?.kind === 'day' && popover.date === cell.date

  const activeTicker = activeEntry?.ticker ?? null
  useLayoutEffect(() => {
    setActiveChipEl(activeTicker ? (chipRefs.current.get(activeTicker) ?? null) : null)
  }, [activeTicker])

  return (
    <div
      style={{
        position: 'relative',
        borderRight: '1px solid var(--color-border-subtle)',
        borderBottom: '1px solid var(--color-border-subtle)',
        padding: '6px 6px 4px',
        minHeight: 96,
        background: cell.isToday ? 'var(--color-interactive-hover)' : 'transparent',
        boxShadow: cell.isToday ? 'inset 0 0 0 1px var(--color-border-focus)' : undefined,
        opacity: cell.inMonth ? 1 : 0.4,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: cell.isToday
              ? 'var(--color-text-primary)'
              : cell.inMonth
                ? 'var(--color-text-secondary)'
                : 'var(--color-text-muted)',
            fontWeight: cell.isToday ? 500 : 400
          }}
        >
          {cell.d}
        </span>
        {cell.isToday && (
          <span
            style={{
              fontSize: 9.5,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}
          >
            today
          </span>
        )}
      </div>

      {visible.map((e) => (
        <EntryChip
          key={e.ticker}
          ref={(el) => {
            if (el) chipRefs.current.set(e.ticker, el)
            else chipRefs.current.delete(e.ticker)
          }}
          ticker={e.ticker}
          period={e.period}
          status={e.status}
          hasOverride={e.hasOverride}
          selected={
            popover?.kind === 'entry' &&
            popover.source === 'grid' &&
            popover.date === cell.date &&
            popover.ticker === e.ticker
          }
          onClick={(ev) => onEntryClick(cell.date, e.ticker, ev)}
        />
      ))}

      {hidden > 0 && (
        <div
          ref={setMoreEl}
          onClick={(ev) => onDayClick(cell.date, ev)}
          style={{
            fontSize: 10.5,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
            padding: '1px 6px',
            cursor: 'pointer',
            alignSelf: 'flex-start'
          }}
        >
          +{hidden} more
        </div>
      )}

      {activeEntry && (
        <EntryPopover
          entry={activeEntry}
          anchorEl={activeChipEl}
          onDismiss={onDismissPopover}
          onNavigate={onNavigate}
          onDisregard={() => onDisregardEntry(activeEntry)}
        />
      )}
      {showDayPopover && (
        <DayPopover
          date={cell.date}
          entries={entries}
          anchorEl={moreEl}
          onDismiss={onDismissPopover}
          onEntryClick={(ticker) => {
            const entry = entries.find((e) => e.ticker === ticker)
            if (entry)
              onEntryClick(cell.date, ticker, { stopPropagation: () => {} } as React.MouseEvent)
          }}
        />
      )}
    </div>
  )
}
