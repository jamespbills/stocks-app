import { useState, useEffect, useRef, useCallback, type ReactElement } from 'react'
import type { ComboDetail, Strategy } from './types'
import { SignalBadge } from './SignalBadge'
import { UPSERT_COMBO_NOTE_SQL, UPSERT_TICKER_NOTE_SQL } from './queries'

interface ComboDetailPanelProps {
  detail: ComboDetail
  strategy: Strategy
  onClose: () => void
  onNoteChange: (note: string) => void
  onTickerNoteChange: (ticker: string, note: string) => void
}

function formatRoi(roi: number | null): string {
  if (roi === null) return '—'
  return `${(roi * 100).toFixed(1)}%`
}

function roiColor(roi: number | null): string {
  if (roi === null) return 'var(--color-text-muted)'
  return roi > 0 ? 'var(--color-up)' : 'var(--color-down)'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return d.toISOString().slice(0, 10)
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

interface EditingTickerNote {
  ticker: string
  value: string
}

export function ComboDetailPanel({
  detail,
  strategy,
  onClose,
  onNoteChange,
  onTickerNoteChange
}: ComboDetailPanelProps): ReactElement {
  const [noteValue, setNoteValue] = useState(detail.comboNote)
  const [savedSecondsAgo, setSavedSecondsAgo] = useState<number | null>(null)
  const [editingNote, setEditingNote] = useState<EditingTickerNote | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedAtRef = useRef<number | null>(null)

  // Tick "saved N seconds ago" — starts once a save is recorded, runs until component unmounts
  useEffect(() => {
    const interval = setInterval(() => {
      if (savedAtRef.current === null) return
      const secs = Math.round((Date.now() - savedAtRef.current) / 1000)
      setSavedSecondsAgo(secs)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleNoteInput = useCallback(
    (value: string) => {
      setNoteValue(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        window.electronAPI.db
          .query(UPSERT_COMBO_NOTE_SQL, [strategy, detail.sector, detail.criterionCode, value])
          .then(() => {
            savedAtRef.current = Date.now()
            setSavedSecondsAgo(0)
            onNoteChange(value)
          })
          .catch(() => {
            /* silent — autosave; user can retry on blur */
          })
      }, 400)
    },
    [strategy, detail.sector, detail.criterionCode, onNoteChange]
  )

  const handleNoteBlur = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    window.electronAPI.db
      .query(UPSERT_COMBO_NOTE_SQL, [strategy, detail.sector, detail.criterionCode, noteValue])
      .then(() => {
        savedAtRef.current = Date.now()
        setSavedSecondsAgo(0)
        onNoteChange(noteValue)
      })
      .catch(() => {
        /* silent */
      })
  }, [strategy, detail.sector, detail.criterionCode, noteValue, onNoteChange])

  const commitTickerNote = useCallback(
    (ticker: string, note: string) => {
      window.electronAPI.db
        .query(UPSERT_TICKER_NOTE_SQL, [
          strategy,
          detail.sector,
          detail.criterionCode,
          ticker,
          note
        ])
        .then(() => {
          onTickerNoteChange(ticker, note)
        })
        .catch(() => {
          /* silent */
        })
    },
    [strategy, detail.sector, detail.criterionCode, onTickerNoteChange]
  )

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
              {formatRoi(detail.avgRoi)}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              avg ROI
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <SignalBadge kind={detail.signalStrength} />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10.5,
                color: detail.isActive ? 'var(--color-up)' : 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {detail.isActive ? 'active' : 'inactive'}
            </span>
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
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Tickers
              </span>
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
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Win Rate
              </span>
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
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Median ROI
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 600,
                  color: roiColor(medianRoi)
                }}
              >
                {formatRoi(medianRoi)}
              </span>
            </div>
          </div>
        )}

        {/* Combo note */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Combo Note
          </span>
          <div style={{ position: 'relative' }}>
            <textarea
              value={noteValue}
              onChange={(e) => handleNoteInput(e.target.value)}
              onBlur={handleNoteBlur}
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
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Reports ({detail.tickers.length})
          </span>

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
                  gridTemplateColumns: '68px 72px 96px 1fr',
                  columnGap: 8,
                  padding: '6px 10px',
                  background: 'var(--color-bg-overlay)',
                  borderBottom: '1px solid var(--color-border-subtle)'
                }}
              >
                {['TICKER', 'RETURN', 'DATE', 'NOTE'].map((col) => (
                  <span
                    key={col}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {col}
                  </span>
                ))}
              </div>

              {/* Rows */}
              {detail.tickers.map((t, i) => {
                const isEditingThisNote = editingNote !== null && editingNote.ticker === t.ticker

                return (
                  <div
                    key={`${t.ticker}-${i}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '68px 72px 96px 1fr',
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
                        fontSize: 'var(--text-sm)',
                        color: roiColor(t.roi),
                        textAlign: 'right',
                        paddingRight: 4
                      }}
                    >
                      {formatRoi(t.roi)}
                    </span>

                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11.5,
                        color: 'var(--color-text-muted)'
                      }}
                    >
                      {formatDate(t.reportDate)}
                    </span>

                    {/* Note — click to edit inline */}
                    {isEditingThisNote ? (
                      <input
                        autoFocus
                        value={editingNote.value}
                        onChange={(e) =>
                          setEditingNote({ ticker: t.ticker, value: e.target.value })
                        }
                        onBlur={() => {
                          commitTickerNote(t.ticker, editingNote.value)
                          setEditingNote(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Escape') {
                            if (e.key === 'Enter') {
                              commitTickerNote(t.ticker, editingNote.value)
                            }
                            setEditingNote(null)
                          }
                        }}
                        style={{
                          width: '100%',
                          background: 'var(--color-bg-input)',
                          border: '1px solid var(--color-border-focus)',
                          borderRadius: 'var(--radius-xs)',
                          color: 'var(--color-text-primary)',
                          fontSize: 'var(--text-sm)',
                          fontFamily: 'var(--font-sans)',
                          padding: '1px 4px',
                          outline: 'none'
                        }}
                      />
                    ) : (
                      <div
                        onClick={() => setEditingNote({ ticker: t.ticker, value: t.note })}
                        title="Click to edit"
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: 'var(--text-sm)',
                          color: t.note ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'text',
                          opacity: t.note ? 1 : 0.4,
                          borderRadius: 'var(--radius-xs)',
                          padding: '0 4px',
                          transition: 'background var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => {
                          ;(e.currentTarget as HTMLDivElement).style.background =
                            'var(--color-bg-overlay)'
                        }}
                        onMouseLeave={(e) => {
                          ;(e.currentTarget as HTMLDivElement).style.background = 'transparent'
                        }}
                      >
                        {t.note || 'add note…'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
