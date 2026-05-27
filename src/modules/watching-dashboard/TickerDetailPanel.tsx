import type { ReactElement } from 'react'
import { SlideOverPanel } from '../../components/SlideOverPanel'
import { MutedLabel } from '../../components/MutedLabel'
import { PlayPill } from './PlayPill'
import { ChangeCell } from './ChangeCell'
import { formatDate, formatPercent } from '../../lib/format'
import type { WatchingRow } from './types'

interface TickerDetailPanelProps {
  row: WatchingRow
  onClose: () => void
  onNavigate: (moduleId: string) => void
}

function SectionLabel({ children }: { children: string }): ReactElement {
  return (
    <MutedLabel as="div" style={{ marginBottom: 8 }}>
      {children}
    </MutedLabel>
  )
}

function StatCard({ label, children }: { label: string; children: ReactElement }): ReactElement {
  return (
    <div
      style={{
        border: '1px solid var(--color-border-default)',
        borderRadius: 5,
        padding: '8px 10px',
        background: 'var(--color-bg-surface)',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <span
        style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}
      >
        {label}
      </span>
      <span style={{ marginLeft: 'auto' }}>{children}</span>
    </div>
  )
}

function SectorBadge({ rating }: { rating: number | null }): ReactElement {
  if (rating === null) {
    return <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>—</span>
  }
  let color = 'var(--color-text-muted)'
  let label = '0'
  if (rating > 0) {
    color = 'var(--color-up)'
    label = '+1'
  } else if (rating < 0) {
    color = 'var(--color-down)'
    label = '−1'
  }
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color, fontWeight: 500 }}>
      {label}
    </span>
  )
}

function ActionBtn({
  label,
  icon,
  primary,
  onClick
}: {
  label: string
  icon: ReactElement
  primary?: boolean
  onClick: () => void
}): ReactElement {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        padding: '7px 10px',
        borderRadius: 5,
        border: '1px solid var(--color-border-strong)',
        background: primary ? 'var(--color-interactive-active)' : 'transparent',
        color: 'var(--color-text-primary)',
        fontSize: 12.5,
        cursor: 'pointer',
        fontFamily: 'inherit'
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

const ChartIcon = (): ReactElement => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
)

const NotesIcon = (): ReactElement => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const CloseIcon = (): ReactElement => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const FileIcon = (): ReactElement => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
)

function filingLabel(identifier: string | null): string {
  if (identifier === 'A') return 'Annual'
  if (identifier === 'H') return 'Semi-annual'
  return identifier ?? ''
}

export function TickerDetailPanel({
  row,
  onClose,
  onNavigate
}: TickerDetailPanelProps): ReactElement {
  return (
    <SlideOverPanel width={420}>
      {/* Header */}
      <div
        style={{
          height: 48,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px 0 20px',
          borderBottom: '1px solid var(--color-border-subtle)'
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--color-text-primary)'
          }}
        >
          {row.ticker}
        </span>
        <span style={{ marginLeft: 10, fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {row.company}
        </span>
        <button
          onClick={onClose}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            padding: 6,
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 5
          }}
          aria-label="Close panel"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '18px 20px', flex: 1, overflowY: 'auto' }}>
        {/* Price block */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 28,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {row.live_price !== null ? Number(row.live_price).toFixed(2) : '—'}
          </span>
          <ChangeCell value={row.pct_change} size={14} />
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
            marginBottom: 18
          }}
        >
          {row.live_price === null ? 'No live price — showing report price' : 'Live price'}
          {row.share_price !== null && row.live_price === null && (
            <span style={{ marginLeft: 8 }}>Report: {Number(row.share_price).toFixed(2)}</span>
          )}
        </div>

        {/* Play scores */}
        <SectionLabel>Play scores</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
          <StatCard label="play">
            <PlayPill score={row.play} maxScore={13} />
          </StatCard>
          <StatCard label="play_2">
            <PlayPill score={row.play_2} maxScore={14} />
          </StatCard>
        </div>

        {/* Sector ratings */}
        <SectionLabel>Sector ratings</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
          <StatCard label="play sector">
            <SectorBadge rating={row.play_sector_rating} />
          </StatCard>
          <StatCard label="play_2 sector">
            <SectorBadge rating={row.play_2_sector_rating} />
          </StatCard>
        </div>

        {/* Last report */}
        <SectionLabel>Last report</SectionLabel>
        {!row.date_released ? (
          <div
            style={{
              border: '1px dashed var(--color-border-strong)',
              borderRadius: 5,
              padding: 12,
              fontSize: 12.5,
              color: 'var(--color-text-muted)',
              textAlign: 'center'
            }}
          >
            No reports on file. <span style={{ color: 'var(--color-danger)' }}>Overdue.</span>
          </div>
        ) : (
          <div
            style={{
              border: '1px solid var(--color-border-default)',
              borderRadius: 5,
              padding: '10px 12px',
              background: 'var(--color-bg-surface)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <FileIcon />
              <span style={{ fontSize: 12.5, color: 'var(--color-text-primary)', fontWeight: 500 }}>
                {filingLabel(row.filing_identifier)} {row.financial_year}
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-muted)'
                }}
              >
                {formatDate(row.date_released)}
              </span>
            </div>
            {row.return_6m !== null && (
              <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)' }}>
                6m return:{' '}
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: row.return_6m >= 0 ? 'var(--color-up)' : 'var(--color-down)'
                  }}
                >
                  {formatPercent(row.return_6m, { signed: true })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <ActionBtn
            label="TA Charts"
            icon={<ChartIcon />}
            primary
            onClick={() => onNavigate('ta-charts')}
          />
          <ActionBtn
            label="Reviews"
            icon={<NotesIcon />}
            onClick={() => onNavigate('markdown-viewer')}
          />
        </div>
      </div>
    </SlideOverPanel>
  )
}
