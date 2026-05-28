import type { ReactElement } from 'react'
import { Popover } from '../../components/Popover'
import { EntryChip } from './EntryChip'
import type { CalendarEntry, EntryStatus } from './types'

interface DayPopoverProps {
  date: string
  entries: CalendarEntry[]
  anchorEl: HTMLElement | null
  onDismiss: () => void
  onEntryClick: (ticker: string) => void
}

function statusText(status: EntryStatus): string {
  if (status === 'released') return 'filed'
  if (status === 'overdue') return 'overdue'
  if (status === 'amber') return 'soon'
  return 'expected'
}

function formatDayLabel(dateStr: string, count: number): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return `${count} reports`
  const day = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${day} · ${count} reports`
}

export function DayPopover({
  date,
  entries,
  anchorEl,
  onDismiss,
  onEntryClick
}: DayPopoverProps): ReactElement {
  return (
    <Popover onDismiss={onDismiss} anchorEl={anchorEl} width={220}>
      <div
        style={{
          fontSize: 10.5,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: 'var(--color-text-muted)',
          marginBottom: 8
        }}
      >
        {formatDayLabel(date, entries.length)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {entries.map((e, i) => (
          <div
            key={`${e.ticker}-${i}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 6px',
              borderRadius: 3,
              cursor: 'pointer'
            }}
            onClick={(ev) => {
              ev.stopPropagation()
              onEntryClick(e.ticker)
            }}
          >
            <EntryChip
              ticker={e.ticker}
              period={e.period}
              status={e.status}
              size="small"
              hasOverride={e.hasOverride}
            />
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {statusText(e.status)}
            </span>
          </div>
        ))}
      </div>
    </Popover>
  )
}
