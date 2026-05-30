import { useCallback, useState, type CSSProperties, type ReactElement } from 'react'
import { createPortal } from 'react-dom'
import type { ColumnMap, ColumnTarget, CsvImportResult, CsvPreview } from '../types'
import { importCsv, previewCsv } from '../adapters/archive'

type Step = 'drop' | 'preview' | 'mapping' | 'committed'

const TARGETS: { key: ColumnTarget; label: string; required: boolean }[] = [
  { key: 'date', label: 'Date', required: true },
  { key: 'close', label: 'Close', required: true },
  { key: 'open', label: 'Open', required: false },
  { key: 'high', label: 'High', required: false },
  { key: 'low', label: 'Low', required: false },
  { key: 'volume', label: 'Volume', required: false }
]

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(13,15,18,0.78)',
  zIndex: 'var(--z-modal)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const ghostBtn: CSSProperties = {
  padding: '6px 13px',
  height: 32,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-default)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  fontSize: 12.5,
  cursor: 'pointer'
}

const primaryBtn: CSSProperties = {
  ...ghostBtn,
  border: '1px solid var(--color-border-strong)',
  background: 'var(--color-interactive-active)',
  color: 'var(--color-text-primary)',
  fontWeight: 'var(--font-medium)'
}

const cellStyle: CSSProperties = {
  padding: '5px var(--space-3)',
  borderBottom: '1px solid var(--color-border-subtle)',
  fontFamily: 'var(--font-mono)',
  fontSize: 11.5
}

interface Props {
  initialTicker: string
  onClose: () => void
  onImported: () => void
}

export function ManualImportPanel({ initialTicker, onClose, onImported }: Props): ReactElement {
  const [ticker, setTicker] = useState(initialTicker)
  const [editingTicker, setEditingTicker] = useState(false)
  const [step, setStep] = useState<Step>('drop')
  const [csvText, setCsvText] = useState('')
  const [preview, setPreview] = useState<CsvPreview | null>(null)
  const [rawHeaders, setRawHeaders] = useState<string[]>([])
  const [columnMap, setColumnMap] = useState<ColumnMap>({})
  const [result, setResult] = useState<CsvImportResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runPreview = useCallback(
    async (csv: string, map?: ColumnMap) => {
      setBusy(true)
      setError(null)
      try {
        const p = await previewCsv(ticker.trim().toUpperCase(), csv, map)
        if (p.recognised) {
          setPreview(p)
          setStep('preview')
        } else {
          setRawHeaders(p.rawHeaders)
          // seed a best-guess mapping from header names
          const guess: ColumnMap = {}
          for (const t of TARGETS) {
            const hit = p.rawHeaders.find((h) => h.toLowerCase().includes(t.key))
            if (hit) guess[t.key] = hit
          }
          setColumnMap((prev) => (Object.keys(prev).length ? prev : guess))
          setStep('mapping')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setBusy(false)
      }
    },
    [ticker]
  )

  const handleFile = useCallback(
    async (file: File) => {
      const text = await file.text()
      setCsvText(text)
      await runPreview(text)
    },
    [runPreview]
  )

  const handleImport = useCallback(async () => {
    if (!preview) return
    setBusy(true)
    setError(null)
    try {
      const res = await importCsv(ticker.trim().toUpperCase(), preview.rows)
      setResult(res)
      setStep('committed')
      onImported()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }, [preview, ticker, onImported])

  const tickerChip = (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
      <span style={{ color: 'var(--color-text-muted)' }}>Importing for</span>
      {editingTicker ? (
        <input
          autoFocus
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          onBlur={() => setEditingTicker(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') setEditingTicker(false)
          }}
          style={{
            width: 100,
            height: 24,
            background: 'var(--color-bg-input)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            padding: '0 6px'
          }}
        />
      ) : (
        <>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--color-text-primary)'
            }}
          >
            {ticker || '—'}
          </span>
          <span
            onClick={() => setEditingTicker(true)}
            style={{
              color: 'var(--color-text-secondary)',
              borderBottom: '1px solid var(--color-border-strong)',
              fontSize: 11,
              cursor: 'pointer'
            }}
          >
            change
          </span>
        </>
      )}
    </div>
  )

  const width = step === 'preview' ? 720 : 560

  return createPortal(
    <div style={overlayStyle} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          maxWidth: '92%',
          maxHeight: '90%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
          overflow: 'hidden'
        }}
      >
        {/* Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 18px',
            borderBottom: '1px solid var(--color-border-default)'
          }}
        >
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 'var(--font-medium)',
              color: 'var(--color-text-primary)'
            }}
          >
            Import prices from CSV
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10.5,
              color: 'var(--color-text-muted)'
            }}
          >
            manual_investingcom source
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              marginLeft: 'auto',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            minHeight: 0,
            overflow: 'auto'
          }}
        >
          {error && <div style={{ color: 'var(--color-danger)', fontSize: 12 }}>{error}</div>}

          {step === 'drop' && (
            <>
              {tickerChip}
              <DropZone busy={busy} onFile={handleFile} />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-text-muted)'
                }}
              >
                Other formats can be mapped manually after upload. Manual rows overwrite yfinance
                data on the same dates.
              </span>
            </>
          )}

          {step === 'mapping' && (
            <>
              {tickerChip}
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '10px 12px',
                  border: '1px solid var(--color-warning)',
                  background: 'var(--color-warning-bg)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <span style={{ color: 'var(--color-warning)' }}>⚠</span>
                <div>
                  <div style={{ fontSize: 12.5, color: 'var(--color-text-primary)' }}>
                    Unrecognised format
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    Map each target field to a CSV column, then re-parse. {rawHeaders.length}{' '}
                    columns detected.
                  </div>
                </div>
              </div>
              {TARGETS.map((t) => (
                <div
                  key={t.key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr',
                    gap: 12,
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: 12.5, color: 'var(--color-text-primary)' }}>
                    {t.label}
                    {t.required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
                  </span>
                  <select
                    value={columnMap[t.key] ?? ''}
                    onChange={(e) =>
                      setColumnMap((prev) => ({ ...prev, [t.key]: e.target.value || undefined }))
                    }
                    style={{
                      height: 30,
                      background: 'var(--color-bg-input)',
                      border: '1px solid var(--color-border-default)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--color-text-primary)',
                      fontSize: 12,
                      padding: '0 8px'
                    }}
                  >
                    <option value="">— ignore —</option>
                    {rawHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </>
          )}

          {step === 'preview' && preview && (
            <>
              {tickerChip}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 14,
                  padding: '12px 14px',
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--color-text-primary)' }}>
                    Detected ·{' '}
                    {preview.variant === 'investing_com'
                      ? 'investing.com export'
                      : 'mapped columns'}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    {preview.dateFormat} · {preview.count} rows · {preview.from} → {preview.to}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10.5,
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    overwrites
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: 'var(--color-warning)'
                    }}
                  >
                    {preview.overwrites} existing rows
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: 'var(--color-text-muted)'
                }}
              >
                First {preview.sample.length} of {preview.count} rows
              </div>
              <div
                style={{
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'auto',
                  maxHeight: 280
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Date', 'Open', 'High', 'Low', 'Close', 'Volume'].map((h, i) => (
                        <th
                          key={h}
                          style={{
                            ...cellStyle,
                            textAlign: i === 0 ? 'left' : 'right',
                            color: 'var(--color-text-muted)',
                            textTransform: 'uppercase',
                            fontSize: 10,
                            position: 'sticky',
                            top: 0,
                            background: 'var(--color-bg-surface)'
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample.map((r) => (
                      <tr key={r.tradeDate}>
                        <td style={{ ...cellStyle, color: 'var(--color-text-primary)' }}>
                          {r.tradeDate}
                        </td>
                        <td style={{ ...cellStyle, textAlign: 'right' }}>{r.open ?? '—'}</td>
                        <td style={{ ...cellStyle, textAlign: 'right' }}>{r.high ?? '—'}</td>
                        <td style={{ ...cellStyle, textAlign: 'right' }}>{r.low ?? '—'}</td>
                        <td style={{ ...cellStyle, textAlign: 'right' }}>{r.close}</td>
                        <td
                          style={{
                            ...cellStyle,
                            textAlign: 'right',
                            color: 'var(--color-text-muted)'
                          }}
                        >
                          {r.volume?.toLocaleString() ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {step === 'committed' && result && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                padding: '20px 0',
                textAlign: 'center'
              }}
            >
              <span style={{ fontSize: 32, color: 'var(--color-up)' }}>✓</span>
              <div style={{ fontSize: 15, color: 'var(--color-text-primary)' }}>
                Imported {result.rowsInserted + result.rowsUpdated} rows for{' '}
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'var(--font-medium)' }}>
                  {ticker}
                </span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--color-text-muted)'
                }}
              >
                {result.rowsInserted} new · {result.rowsUpdated} overwritten · source
                manual_investingcom
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 18px',
            borderTop: '1px solid var(--color-border-default)',
            background: 'var(--color-bg-surface)'
          }}
        >
          {step === 'preview' && preview && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10.5,
                color: 'var(--color-text-muted)'
              }}
            >
              overwrites {preview.overwrites} · adds {preview.count - preview.overwrites} new
            </span>
          )}
          <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 8 }}>
            {step === 'drop' && (
              <button onClick={onClose} style={ghostBtn}>
                Cancel
              </button>
            )}
            {step === 'mapping' && (
              <>
                <button onClick={() => setStep('drop')} style={ghostBtn}>
                  Back
                </button>
                <button
                  onClick={() => void runPreview(csvText, columnMap)}
                  disabled={busy || !columnMap.date || !columnMap.close}
                  style={{
                    ...primaryBtn,
                    opacity: busy || !columnMap.date || !columnMap.close ? 0.5 : 1
                  }}
                >
                  Parse with this mapping
                </button>
              </>
            )}
            {step === 'preview' && preview && (
              <>
                <button onClick={() => setStep('drop')} style={ghostBtn}>
                  Cancel
                </button>
                <button
                  onClick={() => void handleImport()}
                  disabled={busy}
                  style={{ ...primaryBtn, opacity: busy ? 0.5 : 1 }}
                >
                  {busy ? 'Importing…' : `Import ${preview.count} rows`}
                </button>
              </>
            )}
            {step === 'committed' && (
              <>
                <button
                  onClick={() => {
                    setStep('drop')
                    setPreview(null)
                    setResult(null)
                    setCsvText('')
                  }}
                  style={ghostBtn}
                >
                  Import another
                </button>
                <button onClick={onClose} style={primaryBtn}>
                  Back to coverage
                </button>
              </>
            )}
          </span>
        </div>
      </div>
    </div>,
    document.body
  ) as ReactElement
}

function DropZone({ busy, onFile }: { busy: boolean; onFile: (f: File) => void }): ReactElement {
  const [over, setOver] = useState(false)
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const file = e.dataTransfer.files[0]
        if (file) onFile(file)
      }}
      style={{
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '36px 24px',
        border: `1.5px dashed ${over ? 'var(--color-border-focus)' : 'var(--color-border-strong)'}`,
        borderRadius: 'var(--radius-lg)',
        background: over ? 'var(--color-interactive-hover)' : 'var(--color-bg-base)',
        textAlign: 'center',
        cursor: 'pointer'
      }}
    >
      <input
        type="file"
        accept=".csv,text/csv"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
        }}
      />
      <span style={{ fontSize: 24, color: 'var(--color-text-secondary)' }}>⭳</span>
      <div style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>
        {busy ? 'Parsing…' : 'Drop an investing.com CSV here, or browse'}
      </div>
      <span
        style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}
      >
        Expected: Date · Price · Open · High · Low · Vol. · Change %
      </span>
    </label>
  )
}
