import { useEffect, useMemo, useState, type ReactElement } from 'react'

// A compact search-combobox over the archived tickers, shown in the module header.
// Only tickers actually held in the archive are offered (the list is upstream).

interface Props {
  tickers: string[]
  value: string | null
  onChange: (ticker: string) => void
}

export function TickerPicker({ tickers, value, onChange }: Props): ReactElement {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [el, setEl] = useState<HTMLDivElement | null>(null)

  // Outside-click dismiss. React's stopPropagation doesn't stop native bubbling
  // to window (lessons.md), so check containment explicitly.
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent): void => {
      if (el && !el.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [open, el])

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase()
    const list = q ? tickers.filter((t) => t.toUpperCase().includes(q)) : tickers
    return list.slice(0, 200)
  }, [tickers, query])

  const select = (t: string): void => {
    onChange(t)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={setEl} style={{ position: 'relative' }}>
      <input
        value={open ? query : (value ?? '')}
        placeholder={value ?? 'Select ticker…'}
        onFocus={() => {
          setOpen(true)
          setQuery('')
        }}
        onChange={(e) => {
          setQuery(e.target.value)
          if (!open) setOpen(true)
        }}
        style={{
          width: 180,
          height: 28,
          background: 'var(--color-bg-input)',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12.5,
          padding: '0 10px',
          outline: 'none'
        }}
      />
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 32,
            left: 0,
            width: 180,
            maxHeight: 320,
            overflowY: 'auto',
            background: 'var(--color-bg-overlay)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            zIndex: 'var(--z-dropdown)',
            padding: 4
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '8px 10px', color: 'var(--color-text-muted)', fontSize: 12 }}>
              No match
            </div>
          ) : (
            filtered.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => select(t)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 10px',
                  background: t === value ? 'var(--color-interactive-active)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12.5,
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-interactive-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    t === value ? 'var(--color-interactive-active)' : 'transparent'
                }}
              >
                {t}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
