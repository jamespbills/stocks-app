import { useState, type ReactElement } from 'react'
import { MutedLabel } from '../../components/MutedLabel'
import { formatDate } from '../../lib/format'
import { EntryPopover } from './EntryPopover'
import { usePlayThresholds } from '../../lib/playThresholds'
import type { CalendarEntry, PopoverState } from './types'

interface UpcomingPanelProps {
  entries: CalendarEntry[]
  popover: PopoverState
  onEntryClick: (date: string, ticker: string, e: React.MouseEvent) => void
  onDismissPopover: () => void
  onNavigate: (moduleId: string) => void
  onDisregardEntry: (entry: CalendarEntry) => void
}

function formatShortDate(dateStr: string): string {
  return formatDate(dateStr, 'short', '?')
}

function SectionLabel({ children, color }: { children: string; color?: string }): ReactElement {
  return (
    <MutedLabel as="div" style={{ padding: '8px 16px 4px', ...(color ? { color } : {}) }}>
      {children}
    </MutedLabel>
  )
}

interface UpcomingRowProps {
  entry: CalendarEntry
  highlight?: boolean
  active: boolean
  onClick: (e: React.MouseEvent) => void
  onDismiss: () => void
  onNavigate: (moduleId: string) => void
  onDisregard: () => void
}

function UpcomingRow({
  entry,
  highlight = false,
  active,
  onClick,
  onDismiss,
  onNavigate,
  onDisregard
}: UpcomingRowProps): ReactElement {
  const [rowEl, setRowEl] = useState<HTMLDivElement | null>(null)
  const thresholds = usePlayThresholds()

  function playColor(score: number | null): string {
    if (score === thresholds.play.maxScore) return 'var(--color-play-13-text)'
    if (score === thresholds.play.nearMiss) return 'var(--color-play-12-text)'
    return 'rgba(255,255,255,0.22)'
  }

  function play2Color(score: number | null): string {
    if (score === thresholds.play_2.maxScore) return 'var(--color-play-13-text)'
    if (score === thresholds.play_2.nearMiss) return 'var(--color-play-12-text)'
    return 'rgba(255,255,255,0.22)'
  }

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
      ref={setRowEl}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 16px',
        paddingLeft: highlight ? 14 : 16,
        cursor: 'pointer',
        background: active
          ? 'var(--color-interactive-active)'
          : highlight
            ? 'var(--color-interactive-hover)'
            : 'transparent',
        borderLeft: active
          ? '2px solid var(--color-border-focus)'
          : highlight
            ? '2px solid var(--color-up)'
            : '2px solid transparent'
      }}
    >
      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
          {(entry.r_play != null || entry.r_play_2 != null) && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: playColor(entry.r_play),
                  flexShrink: 0,
                  display: 'inline-block'
                }}
              />
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: play2Color(entry.r_play_2),
                  flexShrink: 0,
                  display: 'inline-block'
                }}
              />
            </span>
          )}
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
      {active && (
        <EntryPopover
          entry={entry}
          anchorEl={rowEl}
          onDismiss={onDismiss}
          onNavigate={onNavigate}
          onDisregard={onDisregard}
        />
      )}
    </div>
  )
}

export function UpcomingPanel({
  entries,
  popover,
  onEntryClick,
  onDismissPopover,
  onNavigate,
  onDisregardEntry
}: UpcomingPanelProps): ReactElement {
  const missed = entries.filter((e) => e.days_to_go < 0).sort((a, b) => a.days_to_go - b.days_to_go)

  const today = entries.filter((e) => e.days_to_go === 0)

  const upcoming = entries
    .filter((e) => e.days_to_go > 0)
    .sort((a, b) => a.days_to_go - b.days_to_go)

  function isActive(e: CalendarEntry): boolean {
    return (
      popover?.kind === 'entry' &&
      popover.source === 'upcoming' &&
      popover.date === e.date &&
      popover.ticker === e.ticker
    )
  }

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
          {missed.length > 0 ? `${missed.length} missed` : 'next 30 days'}
        </span>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, padding: '6px 0' }}>
        {missed.length > 0 && (
          <>
            <SectionLabel color="var(--color-danger)">{`MISSED (${missed.length})`}</SectionLabel>
            {missed.map((e) => (
              <UpcomingRow
                key={e.ticker}
                entry={e}
                active={isActive(e)}
                onClick={(ev) => onEntryClick(e.date, e.ticker, ev)}
                onDismiss={onDismissPopover}
                onNavigate={onNavigate}
                onDisregard={() => onDisregardEntry(e)}
              />
            ))}
            <div style={{ height: 6 }} />
          </>
        )}
        {today.length > 0 && (
          <>
            <SectionLabel color="var(--color-up)">TODAY</SectionLabel>
            {today.map((e) => (
              <UpcomingRow
                key={e.ticker}
                entry={e}
                highlight
                active={isActive(e)}
                onClick={(ev) => onEntryClick(e.date, e.ticker, ev)}
                onDismiss={onDismissPopover}
                onNavigate={onNavigate}
                onDisregard={() => onDisregardEntry(e)}
              />
            ))}
            <div style={{ height: 6 }} />
          </>
        )}
        {upcoming.length > 0 && (
          <>
            <SectionLabel>UPCOMING</SectionLabel>
            {upcoming.map((e) => (
              <UpcomingRow
                key={e.ticker}
                entry={e}
                active={isActive(e)}
                onClick={(ev) => onEntryClick(e.date, e.ticker, ev)}
                onDismiss={onDismissPopover}
                onNavigate={onNavigate}
                onDisregard={() => onDisregardEntry(e)}
              />
            ))}
          </>
        )}
        {missed.length === 0 && today.length === 0 && upcoming.length === 0 && (
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
