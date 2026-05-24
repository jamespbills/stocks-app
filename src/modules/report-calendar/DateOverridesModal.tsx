import { useState, useEffect, useCallback, type ReactElement, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'

interface DateOverridesModalProps {
  onClose: () => void
  onMutate: () => void
}

interface OverrideRow {
  ticker: string
  actual_date: string
  reason: string
}

const FETCH_SQL = `
  SELECT ticker,
         DATE_FORMAT(actual_date, '%Y-%m-%d') AS actual_date,
         reason
  FROM app_date_overrides
  ORDER BY ticker ASC
`

const inputStyle: CSSProperties = {
  background: 'var(--color-bg-input)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 5,
  color: 'var(--color-text-primary)',
  fontSize: 12.5,
  fontFamily: 'inherit',
  padding: '4px 7px',
  outline: 'none',
  height: 28,
  boxSizing: 'border-box'
}

const iconButtonStyle: CSSProperties = {
  width: 28,
  height: 28,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 4,
  border: 'none',
  background: 'transparent',
  color: 'var(--color-text-muted)',
  fontSize: 16,
  cursor: 'pointer',
  flexShrink: 0,
  lineHeight: 1
}

const ghostButtonStyle: CSSProperties = {
  padding: '4px 10px',
  height: 28,
  borderRadius: 5,
  border: '1px solid var(--color-border-strong)',
  background: 'transparent',
  color: 'var(--color-text-primary)',
  fontSize: 12,
  cursor: 'pointer',
  fontFamily: 'inherit',
  boxSizing: 'border-box'
}

const colHeaderStyle: CSSProperties = {
  fontSize: 10.5,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.4,
  color: 'var(--color-text-muted)',
  userSelect: 'none' as const
}

interface RowEditorProps {
  row: OverrideRow
  saving: boolean
  onSaveField: (ticker: string, field: 'actual_date' | 'reason', value: string) => void
  onDelete: (ticker: string) => void
}

function RowEditor({ row, saving, onSaveField, onDelete }: RowEditorProps): ReactElement {
  const [date, setDate] = useState(row.actual_date)
  const [reason, setReason] = useState(row.reason)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDate(row.actual_date)
  }, [row.actual_date])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReason(row.reason)
  }, [row.reason])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 0',
        borderBottom: '1px solid var(--color-border-subtle)'
      }}
    >
      <span
        style={{
          width: 80,
          fontFamily: 'var(--font-mono)',
          fontSize: 12.5,
          color: 'var(--color-text-primary)',
          flexShrink: 0
        }}
      >
        {row.ticker}
      </span>
      <input
        type="date"
        value={date}
        disabled={saving}
        onChange={(e) => setDate(e.target.value)}
        onBlur={() => {
          if (date !== row.actual_date) onSaveField(row.ticker, 'actual_date', date)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
        style={{ ...inputStyle, width: 130 }}
      />
      <input
        type="text"
        value={reason}
        placeholder="reason"
        disabled={saving}
        onChange={(e) => setReason(e.target.value)}
        onBlur={() => {
          if (reason !== row.reason) onSaveField(row.ticker, 'reason', reason)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
        style={{ ...inputStyle, flex: 1 }}
      />
      <button
        onClick={() => onDelete(row.ticker)}
        disabled={saving}
        style={{
          ...iconButtonStyle,
          color: saving ? 'var(--color-text-muted)' : 'var(--color-text-secondary)'
        }}
        title="Remove override"
      >
        ×
      </button>
    </div>
  )
}

export function DateOverridesModal({ onClose, onMutate }: DateOverridesModalProps): ReactElement {
  const [rows, setRows] = useState<OverrideRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingTicker, setSavingTicker] = useState<string | null>(null)
  const [newRow, setNewRow] = useState<OverrideRow | null>(null)
  const [addError, setAddError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void window.electronAPI.db
      .query(FETCH_SQL)
      .then((r) => {
        if (!cancelled) {
          setRows(r as OverrideRow[])
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSaveField = useCallback(
    (ticker: string, field: 'actual_date' | 'reason', value: string) => {
      setSavingTicker(ticker)
      const sql =
        field === 'actual_date'
          ? `UPDATE app_date_overrides SET actual_date = ?, updated_at = CURRENT_TIMESTAMP WHERE ticker = ?`
          : `UPDATE app_date_overrides SET reason = ?, updated_at = CURRENT_TIMESTAMP WHERE ticker = ?`
      void window.electronAPI.db
        .query(sql, [value, ticker])
        .then(() => {
          setRows((prev) => prev.map((r) => (r.ticker === ticker ? { ...r, [field]: value } : r)))
          onMutate()
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : String(err))
        })
        .finally(() => setSavingTicker(null))
    },
    [onMutate]
  )

  const handleDelete = useCallback(
    (ticker: string) => {
      setSavingTicker(ticker)
      void window.electronAPI.db
        .query(`DELETE FROM app_date_overrides WHERE ticker = ?`, [ticker])
        .then(() => {
          setRows((prev) => prev.filter((r) => r.ticker !== ticker))
          onMutate()
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : String(err))
        })
        .finally(() => setSavingTicker(null))
    },
    [onMutate]
  )

  const handleAddSave = useCallback(() => {
    if (!newRow) return
    const ticker = newRow.ticker.trim().toUpperCase()
    if (!ticker) {
      setAddError('Ticker is required')
      return
    }
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(newRow.actual_date) ||
      isNaN(new Date(newRow.actual_date).getTime())
    ) {
      setAddError('Enter a valid date')
      return
    }
    if (rows.some((r) => r.ticker === ticker)) {
      setAddError(`Override for ${ticker} already exists`)
      return
    }
    setAddError(null)
    void window.electronAPI.db
      .query(`INSERT INTO app_date_overrides (ticker, actual_date, reason) VALUES (?, ?, ?)`, [
        ticker,
        newRow.actual_date,
        newRow.reason
      ])
      .then(() => {
        setRows((prev) =>
          [...prev, { ticker, actual_date: newRow.actual_date, reason: newRow.reason }].sort(
            (a, b) => a.ticker.localeCompare(b.ticker)
          )
        )
        setNewRow(null)
        onMutate()
      })
      .catch((err: unknown) => {
        setAddError(err instanceof Error ? err.message : String(err))
      })
  }, [newRow, rows, onMutate])

  const modal = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 'var(--z-modal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 640,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-bg-overlay)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 10,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px 16px',
            borderBottom: '1px solid var(--color-border-subtle)',
            flexShrink: 0
          }}
        >
          <span
            style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', flex: 1 }}
          >
            Date overrides
          </span>
          <button onClick={onClose} style={{ ...iconButtonStyle, fontSize: 18 }}>
            ×
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div
            style={{
              padding: '8px 16px',
              background: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              fontSize: 12,
              flexShrink: 0
            }}
          >
            {error}
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
          {/* Column headers */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 0 6px',
              borderBottom: '1px solid var(--color-border-default)'
            }}
          >
            <span style={{ ...colHeaderStyle, width: 80 }}>Ticker</span>
            <span style={{ ...colHeaderStyle, width: 130 }}>Override date</span>
            <span style={{ ...colHeaderStyle, flex: 1 }}>Reason</span>
            <span style={{ width: 28 }} />
          </div>

          {loading && (
            <div style={{ padding: '20px 0', color: 'var(--color-text-muted)', fontSize: 12 }}>
              Loading…
            </div>
          )}

          {!loading && rows.length === 0 && newRow === null && (
            <div style={{ padding: '20px 0', color: 'var(--color-text-muted)', fontSize: 12 }}>
              No overrides yet
            </div>
          )}

          {rows.map((row) => (
            <RowEditor
              key={row.ticker}
              row={row}
              saving={savingTicker === row.ticker}
              onSaveField={handleSaveField}
              onDelete={handleDelete}
            />
          ))}

          {/* Add new row form */}
          {newRow !== null && (
            <div
              style={{
                padding: '10px 0',
                borderBottom: '1px solid var(--color-border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="text"
                  placeholder="TICKER"
                  value={newRow.ticker}
                  autoFocus
                  onChange={(e) => {
                    setAddError(null)
                    setNewRow((p) => (p ? { ...p, ticker: e.target.value.toUpperCase() } : p))
                  }}
                  style={{ ...inputStyle, width: 80, fontFamily: 'var(--font-mono)' }}
                />
                <input
                  type="date"
                  value={newRow.actual_date}
                  onChange={(e) => {
                    setAddError(null)
                    setNewRow((p) => (p ? { ...p, actual_date: e.target.value } : p))
                  }}
                  style={{ ...inputStyle, width: 130 }}
                />
                <input
                  type="text"
                  placeholder="reason (optional)"
                  value={newRow.reason}
                  onChange={(e) => setNewRow((p) => (p ? { ...p, reason: e.target.value } : p))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSave()
                  }}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={handleAddSave} style={ghostButtonStyle}>
                  Save
                </button>
                <button
                  onClick={() => {
                    setNewRow(null)
                    setAddError(null)
                  }}
                  style={{ ...ghostButtonStyle, color: 'var(--color-text-muted)' }}
                >
                  Cancel
                </button>
              </div>
              {addError && (
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--color-danger)',
                    display: 'block',
                    marginTop: 5
                  }}
                >
                  {addError}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {newRow === null && (
          <div
            style={{
              padding: '10px 16px',
              borderTop: '1px solid var(--color-border-subtle)',
              flexShrink: 0
            }}
          >
            <button
              onClick={() => setNewRow({ ticker: '', actual_date: '', reason: '' })}
              style={ghostButtonStyle}
            >
              + Add override
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body) as ReactElement
}
