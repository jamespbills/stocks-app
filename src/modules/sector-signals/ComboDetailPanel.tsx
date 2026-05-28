import { type ReactElement } from 'react'
import type { ComboDetail, Strategy } from './types'
import { SignalBadge } from './SignalBadge'
import { UPSERT_COMBO_NOTE_SQL } from './queries'
import { formatPercent } from '../../lib/format'
import { MutedLabel } from '../../components/MutedLabel'
import { useDebouncedSave } from '../../hooks/useDebouncedSave'

interface ComboDetailPanelProps {
  detail: ComboDetail
  strategy: Strategy
  onClose: () => void
  onNoteChange: (note: string) => void
}

function roiColor(roi: number | null): string {
  if (roi === null) return 'var(--color-text-muted)'
  return roi > 0 ? 'var(--color-up)' : 'var(--color-down)'
}

function formatReportId(year: number | null, filing: string | null): string {
  if (year === null || filing === null) return '—'
  return `${year}-${filing}`
}

function computeWinRate(tickers: ComboDetail['tickers']): number | null {
  const withReturns = tickers.filter((t) => t.roi !== null)
  if (withReturns.length === 0) return null
  const wins = withReturns.filter((t) => (t.roi ?? 0) > 0).length
  return Math.round((wins / withReturns.length) * 100)
}

function computeMedianRoi(tickers: ComboDetail['tickers']): number | null {
  const values = tickers.filter((t) => t.roi !== null).map((t) => t.roi as number)
  if (values.length === 0) return null
  values.sort((a, b) => a - b)
  const mid = Math.floor(values.length / 2)
  return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2
}

export function ComboDetailPanel({
  detail,
  strategy,
  onClose,
  onNoteChange
}: ComboDetailPanelProps): ReactElement {
  const {
    value: noteValue,
    setValue: setNoteValue,
    flush: flushNote,
    savedSecondsAgo
  } = useDebouncedSave<string>({
    initialValue: detail.comboNote,
    delayMs: 400,
    onSave: async (value) => {
      await window.electronAPI.db.query(UPSERT_COMBO_NOTE_SQL, [
        strategy,
        detail.sector,
        detail.criterionCode,
        value
      ])
      onNoteChange(value)
    }
  })

  const winRate = computeWinRate(detail.tickers)
  const medianRoi = computeMedianRoi(detail.tickers)
  const noData = detail.tickers.filter((t) => t.roi !== null).length === 0

  const statCardStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    padding: 'var(--space-3)',
    background: 'var(--color-bg-overlay)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-subtle)'
  }

  return (
    <div
      style={{
        width: 400,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg-elevated)',
        borderLeft: '1px solid var(--color-border-default)',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 'var(--topbar-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--space-4)',
          borderBottom: '1px solid var(--color-border-default)',
          flexShrink: 0
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--color-text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {detail.sector}
          <span style={{ color: 'var(--color-text-muted)', margin: '0 5px' }}>×</span>
          {detail.criterionName}
        </span>

        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: 16,
            flexShrink: 0,
            marginLeft: 'var(--space-2)',
            transition: 'color var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'
          }}
        >
          ×
        </button>
      </div>

      {/* Scrollable body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)'
        }}
      >
        {/* Hero stat row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-3xl)',
                fontWeight: 600,
                color: roiColor(detail.avgRoi),
                lineHeight: 1
              }}
            >
              {formatPercent(detail.avgRoi)}
            </span>
            <MutedLabel mono size="var(--text-xs)">
              avg ROI
            </MutedLabel>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <SignalBadge kind={detail.signalStrength} />
            <MutedLabel
              mono
              color={detail.isActive ? 'var(--color-up)' : 'var(--color-text-muted)'}
            >
              {detail.isActive ? 'active' : 'inactive'}
            </MutedLabel>
          </div>
        </div>

        {/* Stat cards */}
        {noData ? (
          <div
            style={{
              padding: 'var(--space-4)',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--text-sm)',
              background: 'var(--color-bg-overlay)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)'
            }}
          >
            No return data yet for this combo.
          </div>
        ) : (
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' }}
          >
            <div style={statCardStyle}>
              <MutedLabel mono size={10}>
                Tickers
              </MutedLabel>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)'
                }}
              >
                {detail.nTickers}
              </span>
            </div>

            <div style={statCardStyle}>
              <MutedLabel mono size={10}>
                Win Rate
              </MutedLabel>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 600,
                  color:
                    winRate !== null && winRate >= 50
                      ? 'var(--color-up)'
                      : 'var(--color-text-primary)'
                }}
              >
                {winRate !== null ? `${winRate}%` : '—'}
              </span>
            </div>

            <div style={statCardStyle}>
              <MutedLabel mono size={10}>
                Median ROI
              </MutedLabel>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 600,
                  color: roiColor(medianRoi)
                }}
              >
                {formatPercent(medianRoi)}
              </span>
            </div>
          </div>
        )}

        {/* Combo note */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <MutedLabel mono size={10}>
            Combo Note
          </MutedLabel>
          <div style={{ position: 'relative' }}>
            <textarea
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
              onBlur={flushNote}
              placeholder="Add a note about this combo…"
              rows={3}
              style={{
                width: '100%',
                background: 'var(--color-bg-input)',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-sans)',
                padding: 'var(--space-2) var(--space-3)',
                resize: 'vertical',
                outline: 'none',
                lineHeight: 'var(--leading-normal)',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                ;(e.currentTarget as HTMLTextAreaElement).style.borderColor =
                  'var(--color-border-focus)'
              }}
              onBlurCapture={(e) => {
                ;(e.currentTarget as HTMLTextAreaElement).style.borderColor =
                  'var(--color-border-default)'
              }}
            />
            {savedSecondsAgo !== null && (
              <span
                style={{
                  position: 'absolute',
                  bottom: 6,
                  right: 8,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--color-text-muted)',
                  pointerEvents: 'none'
                }}
              >
                saved {savedSecondsAgo === 0 ? 'just now' : `${savedSecondsAgo}s ago`}
              </span>
            )}
          </div>
        </div>

        {/* Ticker table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <MutedLabel mono size={10}>
            Reports ({detail.tickers.length})
          </MutedLabel>

          {detail.tickers.length === 0 ? (
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              No tickers found for this combo.
            </span>
          ) : (
            <div
              style={{
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden'
              }}
            >
              {/* Table header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 58px 68px 60px',
                  columnGap: 8,
                  padding: '6px 10px',
                  background: 'var(--color-bg-overlay)',
                  borderBottom: '1px solid var(--color-border-subtle)'
                }}
              >
                <MutedLabel mono size={10}>TICKER</MutedLabel>
                <div style={{ textAlign: 'right' }}>
                  <MutedLabel mono size={10}>6M</MutedLabel>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <MutedLabel mono size={10}>1Y</MutedLabel>
                </div>
                <div style={{ paddingLeft: 12 }}>
                  <MutedLabel mono size={10}>REPORT</MutedLabel>
                </div>
              </div>

              {/* Rows */}
              {detail.tickers.map((t, i) => (
                <div
                  key={`${t.ticker}-${i}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 58px 68px 60px',
                    columnGap: 8,
                    padding: '6px 10px',
                    borderBottom:
                      i < detail.tickers.length - 1
                        ? '1px solid var(--color-border-subtle)'
                        : 'none',
                    alignItems: 'center'
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 500,
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    {t.ticker}
                  </span>

                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: roiColor(t.roi6m),
                      textAlign: 'right',
                      opacity: 0.75
                    }}
                  >
                    {formatPercent(t.roi6m)}
                  </span>

                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-sm)',
                      color: roiColor(t.roi),
                      textAlign: 'right'
                    }}
                  >
                    {formatPercent(t.roi)}
                  </span>

                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--color-text-muted)',
                      paddingLeft: 12
                    }}
                  >
                    {formatReportId(t.financialYear, t.filingIdentifier)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
