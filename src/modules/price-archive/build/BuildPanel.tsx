import { useState, type CSSProperties, type ReactElement } from 'react'
import { createPortal } from 'react-dom'

const primaryButtonStyle: CSSProperties = {
  padding: '6px 16px',
  height: 32,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-focus)',
  background: 'var(--color-interactive-active)',
  color: 'var(--color-text-primary)',
  fontSize: 12.5,
  fontWeight: 'var(--font-medium)',
  cursor: 'pointer'
}

const ghostButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  border: '1px solid var(--color-border-strong)',
  background: 'transparent'
}

const inputStyle: CSSProperties = {
  background: 'var(--color-bg-input)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-primary)',
  fontSize: 12.5,
  fontFamily: 'var(--font-mono)',
  padding: '5px 9px',
  height: 30,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box'
}

const radioRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 0',
  cursor: 'pointer',
  fontSize: 13,
  color: 'var(--color-text-primary)'
}

interface Props {
  onStart: (args: string[]) => void
  onClose: () => void
}

// State 1 (Configure) of PA-2 — small, blocking, one-time decision. Once started
// the parent swaps in the right-docked BuildProgress so the table stays live.
export function BuildPanel({ onStart, onClose }: Props): ReactElement {
  const [target, setTarget] = useState<'all' | 'ticker'>('all')
  const [ticker, setTicker] = useState('')
  const [force, setForce] = useState(false)

  const canStart = target === 'all' || ticker.trim().length > 0

  const handleStart = (): void => {
    if (!canStart) return
    const args =
      target === 'all'
        ? ['--all']
        : ['--ticker', ticker.trim().toUpperCase(), '--triggered-by', 'single_ticker']
    if (force) args.push('--force')
    onStart(args)
  }

  const modal = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 'var(--z-modal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460,
          background: 'var(--color-bg-overlay)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--color-border-subtle)',
            fontSize: 'var(--text-md)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--color-text-primary)'
          }}
        >
          Build archive
        </div>

        <div style={{ padding: '14px 18px' }}>
          <label style={radioRowStyle} onClick={() => setTarget('all')}>
            <input type="radio" checked={target === 'all'} readOnly />
            <span>All tickers in the coverage target</span>
          </label>
          <label style={radioRowStyle} onClick={() => setTarget('ticker')}>
            <input type="radio" checked={target === 'ticker'} readOnly />
            <span>A single ticker</span>
          </label>
          {target === 'ticker' && (
            <input
              autoFocus
              value={ticker}
              placeholder="TICKER"
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleStart()
              }}
              style={{ ...inputStyle, marginTop: 4, marginBottom: 4 }}
            />
          )}

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 12,
              cursor: 'pointer',
              fontSize: 12.5,
              color: 'var(--color-text-secondary)'
            }}
          >
            <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
            <span>Force re-fetch (overwrite, including manual CSV data)</span>
          </label>

          <p
            style={{
              marginTop: 12,
              marginBottom: 0,
              fontSize: 11.5,
              lineHeight: 1.55,
              color: 'var(--color-text-muted)'
            }}
          >
            Skips tickers already covered. Manual CSV data is preserved unless “Force re-fetch” is
            on.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--space-2)',
            padding: '12px 18px',
            borderTop: '1px solid var(--color-border-subtle)'
          }}
        >
          <button onClick={onClose} style={ghostButtonStyle}>
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={!canStart}
            style={{
              ...primaryButtonStyle,
              opacity: canStart ? 1 : 0.5,
              cursor: canStart ? 'pointer' : 'not-allowed'
            }}
          >
            Start build
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body) as ReactElement
}
