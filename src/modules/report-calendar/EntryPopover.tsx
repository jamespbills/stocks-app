import type { ReactElement } from 'react'
import { Popover } from '../../components/Popover'
import type { CalendarEntry, EntryStatus } from './types'

interface EntryPopoverProps {
  entry: CalendarEntry
  onDismiss: () => void
  onNavigate: (moduleId: string) => void
}

function statusLabel(status: EntryStatus, daysToGo: number): string {
  if (status === 'released') return 'Filed'
  if (status === 'overdue') return `${Math.abs(daysToGo)}d overdue`
  if (status === 'amber') return `in ${daysToGo}d`
  return `in ${daysToGo}d`
}

function statusColor(status: EntryStatus): string {
  if (status === 'overdue') return 'var(--color-danger)'
  if (status === 'amber') return 'var(--color-warning)'
  return 'var(--color-text-muted)'
}

export function EntryPopover({ entry, onDismiss, onNavigate }: EntryPopoverProps): ReactElement {
  return (
    <Popover onDismiss={onDismiss} width={240}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--color-text-primary)'
          }}
        >
          {entry.ticker}
        </span>
        <span
          style={{
            fontSize: 12,
            color: 'var(--color-text-secondary)',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {entry.company}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: statusColor(entry.status),
            flexShrink: 0
          }}
        >
          {statusLabel(entry.status, entry.days_to_go)}
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
          {entry.period}
        </span>{' '}
        {entry.status === 'released' ? 'results' : 'expected'}
      </div>
      {entry.hasOverride && (
        <div
          style={{
            marginBottom: 12,
            padding: '6px 8px',
            borderRadius: 4,
            background: 'var(--color-warning-bg)',
            border: '1px solid rgba(252, 211, 77, 0.2)'
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              color: 'var(--color-warning)',
              marginBottom: entry.overrideReason ? 3 : 0,
              fontFamily: 'var(--font-mono)'
            }}
          >
            Manual override
          </div>
          {entry.overrideReason && (
            <div style={{ fontSize: 11.5, color: 'var(--color-text-secondary)' }}>
              {entry.overrideReason}
            </div>
          )}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => {
            onNavigate('markdown-viewer')
            onDismiss()
          }}
          style={{
            flex: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            padding: '5px 8px',
            borderRadius: 5,
            border: '1px solid var(--color-border-strong)',
            background: 'transparent',
            color: 'var(--color-text-primary)',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          Reviews
        </button>
        <button
          onClick={() => {
            onNavigate('watching-dashboard')
            onDismiss()
          }}
          style={{
            flex: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            padding: '5px 8px',
            borderRadius: 5,
            border: '1px solid var(--color-border-strong)',
            background: 'transparent',
            color: 'var(--color-text-primary)',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          Watching
        </button>
      </div>
    </Popover>
  )
}
