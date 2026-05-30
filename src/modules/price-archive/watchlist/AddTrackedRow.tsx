import { useState, type CSSProperties, type ReactElement } from 'react'
import type { TrackedTicker } from '../types'

export interface TrackedDraft {
  ticker: string
  coverFrom: string | null
  coverTo: string | null
  reason: string | null
  isActive: boolean
}

const inputStyle: CSSProperties = {
  background: 'var(--color-bg-input)',
  border: '1px solid var(--color-border-default)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-primary)',
  fontSize: 12,
  fontFamily: 'var(--font-mono)',
  padding: '0 9px',
  height: 28,
  outline: 'none',
  boxSizing: 'border-box',
  width: '100%'
}

const labelStyle: CSSProperties = {
  fontSize: 9.5,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: 4,
  display: 'block'
}

const lockedChipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '0 9px',
  height: 28,
  background: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-mono)',
  fontSize: 11
}

const primaryButtonStyle: CSSProperties = {
  padding: '6px 14px',
  height: 30,
  background: 'var(--color-interactive-active)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-primary)',
  fontSize: 12.5,
  fontWeight: 'var(--font-medium)',
  cursor: 'pointer'
}

interface Props {
  initial?: TrackedTicker // present = edit mode (ticker locked)
  onSubmit: (draft: TrackedDraft) => void
  onCancel: () => void
}

export function AddTrackedRow({ initial, onSubmit, onCancel }: Props): ReactElement {
  const editing = initial !== undefined
  const [ticker, setTicker] = useState(initial?.ticker ?? '')
  const [coverFrom, setCoverFrom] = useState(initial?.coverFrom ?? '')
  const [ongoing, setOngoing] = useState(initial ? initial.coverTo === null : true)
  const [coverTo, setCoverTo] = useState(initial?.coverTo ?? '')
  const [reason, setReason] = useState(initial?.reason ?? '')

  const canSubmit = ticker.trim().length > 0 && (ongoing || coverTo.trim().length > 0)

  const handleSubmit = (): void => {
    if (!canSubmit) return
    onSubmit({
      ticker: ticker.trim().toUpperCase(),
      coverFrom: coverFrom.trim() === '' ? null : coverFrom,
      coverTo: ongoing ? null : coverTo,
      reason: reason.trim() === '' ? null : reason.trim(),
      isActive: initial?.isActive ?? true
    })
  }

  return (
    <div
      style={{
        borderBottom: '1px solid var(--color-border-default)',
        background: 'var(--color-bg-surface)',
        padding: '14px var(--space-5) 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontSize: 11,
            color: 'var(--color-text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 'var(--font-medium)'
          }}
        >
          {editing ? `Edit ${initial?.ticker}` : 'Add tracked ticker'}
        </span>
        <span
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}
        >
          — source fixed to manual watch
        </span>
        <button
          onClick={onCancel}
          aria-label="Cancel"
          style={{
            marginLeft: 'auto',
            width: 24,
            height: 24,
            border: 'none',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1
          }}
        >
          ×
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '90px 130px 1fr 1fr 90px',
          gap: 14,
          alignItems: 'flex-end'
        }}
      >
        <div>
          <span style={labelStyle}>Source</span>
          <span style={lockedChipStyle}>🔒 watch</span>
        </div>
        <div>
          <span style={labelStyle}>Ticker</span>
          <input
            autoFocus={!editing}
            value={ticker}
            placeholder="e.g. WIZZ.L"
            readOnly={editing}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
              if (e.key === 'Escape') onCancel()
            }}
            style={{ ...inputStyle, opacity: editing ? 0.6 : 1 }}
          />
        </div>
        <div>
          <span style={labelStyle}>From</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="date"
              value={coverFrom}
              onChange={(e) => setCoverFrom(e.target.value)}
              style={{ ...inputStyle, width: 150 }}
            />
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                whiteSpace: 'nowrap'
              }}
            >
              <input
                type="checkbox"
                checked={ongoing}
                onChange={(e) => setOngoing(e.target.checked)}
              />
              ongoing
            </label>
            {!ongoing && (
              <>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>to</span>
                <input
                  type="date"
                  value={coverTo}
                  onChange={(e) => setCoverTo(e.target.value)}
                  style={{ ...inputStyle, width: 150 }}
                />
              </>
            )}
          </div>
        </div>
        <div>
          <span style={labelStyle}>Reason (optional)</span>
          <input
            value={reason}
            placeholder="why are you watching it?"
            onChange={(e) => setReason(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
            }}
            style={{ ...inputStyle, fontFamily: 'var(--font-sans)' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              ...primaryButtonStyle,
              opacity: canSubmit ? 1 : 0.5,
              cursor: canSubmit ? 'pointer' : 'not-allowed'
            }}
          >
            {editing ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
