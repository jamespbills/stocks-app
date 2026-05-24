import type { ReactElement } from 'react'
import type { CalendarEntry } from './types'

interface UpcomingPanelProps {
  entries: CalendarEntry[]
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '?'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function SectionLabel({ children }: { children: string }): ReactElement {
  return (
    <div
      style={{
        padding: '8px 16px 4px',
        fontSize: 10.5,
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: 0.5
      }}
    >
      {children}
    </div>
  )
}

interface UpcomingRowProps {
  entry: CalendarEntry
  highlight?: boolean
}

function UpcomingRow({ entry, highlight = false }: UpcomingRowProps): ReactElement {
  let dateColor = 'var(--color-text-muted)'
  if (entry.status === 'overdue') dateColor = 'var(--color-danger)'
  else if (entry.status === 'amber') dateColor = 'var(--color-warning)'

  const daysLabel =
    entry.days_to_go < 0
      ? `${Math.abs(entry.days_to_go)}d late`
      : entry.days_to_go === 0
        ? 'today'
        : `in ${entry.days_to_go}d`

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 16px',
        paddingLeft: highlight ? 14 : 16,
        cursor: 'pointer',
        background: highlight ? 'var(--color-interactive-hover)' : 'transparent',
        borderLeft: highlight ? '2px solid var(--color-border-focus)' : '2px solid transparent'
      }}
    >
      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12.5,
              fontWeight: 500,
              color: 'var(--color-text-primary)'
            }}
          >
            {entry.ticker}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text-muted)'
            }}
          >
            {entry.period}
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {entry.company}
        </span>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11.5,
            color: dateColor,
            fontWeight: 500
          }}
        >
          {formatShortDate(entry.date)}
        </div>
        <div
          style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}
        >
          {daysLabel}
        </div>
      </div>
    </div>
  )
}

export function UpcomingPanel({ entries }: UpcomingPanelProps): ReactElement {
  const overdue = entries
    .filter((e) => e.status === 'overdue')
    .sort((a, b) => a.days_to_go - b.days_to_go)

  const upcoming = entries
    .filter((e) => e.status !== 'overdue' && e.status !== 'released')
    .sort((a, b) => a.days_to_go - b.days_to_go)

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        height: '100%',
        borderLeft: '1px solid var(--color-border-subtle)',
        background: 'var(--color-bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          height: 49,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          borderBottom: '1px solid var(--color-border-subtle)'
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
          Upcoming
        </span>
        <span
          style={{
            marginLeft: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-text-muted)'
          }}
        >
          {overdue.length > 0 ? `${overdue.length} overdue` : 'next 30 days'}
        </span>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, padding: '6px 0' }}>
        {overdue.length > 0 && (
          <>
            <SectionLabel>{`Overdue (${overdue.length})`}</SectionLabel>
            {overdue.map((e) => (
              <UpcomingRow key={e.ticker} entry={e} />
            ))}
            <div style={{ height: 6 }} />
          </>
        )}
        {upcoming.length > 0 && (
          <>
            <SectionLabel>Upcoming</SectionLabel>
            {upcoming.map((e, i) => (
              <UpcomingRow key={e.ticker} entry={e} highlight={i === 0} />
            ))}
          </>
        )}
        {overdue.length === 0 && upcoming.length === 0 && (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: 12.5
            }}
          >
            No upcoming reports
          </div>
        )}
      </div>
    </div>
  )
}
