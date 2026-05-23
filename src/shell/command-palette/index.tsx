import { useEffect, useRef, useState, type ReactElement } from 'react'
import { Search } from 'lucide-react'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps): ReactElement | null {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount (parent remounts via key when palette opens)
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop — 40% black, no blur */}
      <div
        className="fixed inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.40)', zIndex: 'var(--z-palette)' }}
        onClick={onClose}
      />

      {/* Palette panel */}
      <div
        className="fixed left-1/2 -translate-x-1/2"
        style={{
          top: '20vh',
          width: 560,
          background: 'var(--color-bg-overlay)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-lg)',
          zIndex: 'calc(var(--z-palette) + 1)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)'
        }}
      >
        {/* Input row */}
        <div
          className="flex items-center gap-3 px-4"
          style={{
            height: 52,
            borderBottom: '1px solid var(--color-border-subtle)'
          }}
        >
          <Search size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tickers, reviews, reports, and scripts"
            className="flex-1 bg-transparent outline-none"
            style={{
              color: 'var(--color-text-primary)',
              fontSize: 'var(--text-md)',
              caretColor: 'var(--color-text-primary)'
            }}
          />
          <kbd
            className="flex-shrink-0 rounded px-1.5 py-0.5"
            style={{
              background: 'var(--color-interactive-active)',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-sans)'
            }}
          >
            Esc
          </kbd>
        </div>

        {/* Empty state */}
        <div
          className="px-4 py-8 text-center"
          style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}
        >
          {query.length === 0
            ? 'Search coming in Phase 2'
            : `No results for "${query}" — search coming in Phase 2`}
        </div>
      </div>
    </>
  )
}
