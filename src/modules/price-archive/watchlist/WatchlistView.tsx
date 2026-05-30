import { useMemo, useState, type CSSProperties, type ReactElement } from 'react'
import type { TrackedTicker } from '../types'
import { saveTracked, setTrackedActive } from '../adapters/tracked'
import { AddTrackedRow, type TrackedDraft } from './AddTrackedRow'
import { TrackedTickerRow } from './TrackedTickerRow'

const thStyle: CSSProperties = {
  padding: '0 var(--space-4)',
  height: 32,
  fontSize: 10.5,
  fontWeight: 'var(--font-medium)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: 'var(--color-text-muted)',
  textAlign: 'left',
  position: 'sticky',
  top: 0,
  background: 'var(--color-bg-surface)',
  borderBottom: '1px solid var(--color-border-default)',
  whiteSpace: 'nowrap'
}

const headerButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 11px',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-interactive-active)',
  color: 'var(--color-text-primary)',
  fontSize: 12.5,
  fontWeight: 'var(--font-medium)',
  cursor: 'pointer',
  whiteSpace: 'nowrap'
}

type Filter = 'all' | 'watch'
type FormState = { mode: 'add' } | { mode: 'edit'; row: TrackedTicker } | null

interface Props {
  rows: TrackedTicker[]
  onMutate: () => void
}

export function WatchlistView({ rows, onMutate }: Props): ReactElement {
  const [filter, setFilter] = useState<Filter>('all')
  const [form, setForm] = useState<FormState>(null)
  const [error, setError] = useState<string | null>(null)

  const visible = useMemo(
    () => (filter === 'watch' ? rows.filter((r) => r.source === 'manual_watch') : rows),
    [rows, filter]
  )

  const handleSubmit = async (draft: TrackedDraft): Promise<void> => {
    try {
      await saveTracked(draft)
      setForm(null)
      setError(null)
      onMutate()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleToggle = async (row: TrackedTicker, next: boolean): Promise<void> => {
    try {
      await setTrackedActive(row.id, next)
      onMutate()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--color-border-subtle)',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span
            style={{
              fontSize: 'var(--text-md)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--color-text-primary)'
            }}
          >
            Watchlist
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text-muted)'
            }}
          >
            Tickers tracked beyond the play universe. The archive keeps these covered too.
          </span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'inline-flex', gap: 8 }}>
          <button
            onClick={() => setFilter((f) => (f === 'all' ? 'watch' : 'all'))}
            style={{
              ...headerButtonStyle,
              background: filter === 'watch' ? 'var(--color-interactive-active)' : 'transparent',
              borderColor: 'var(--color-border-default)',
              color:
                filter === 'watch' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontWeight: 'var(--font-regular)'
            }}
          >
            watch only
          </button>
          <button onClick={() => setForm({ mode: 'add' })} style={headerButtonStyle}>
            + Add tracked ticker
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '8px var(--space-5)', color: 'var(--color-danger)', fontSize: 12 }}>
          {error}
        </div>
      )}

      {form?.mode === 'add' && (
        <AddTrackedRow onSubmit={handleSubmit} onCancel={() => setForm(null)} />
      )}
      {form?.mode === 'edit' && (
        <AddTrackedRow initial={form.row} onSubmit={handleSubmit} onCancel={() => setForm(null)} />
      )}

      {/* Table */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {visible.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--text-sm)'
            }}
          >
            No tracked tickers yet. Add one to cover it beyond the play universe.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 120 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 220 }} />
              <col style={{ width: 'auto' }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 80 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={thStyle}>Ticker</th>
                <th style={thStyle}>Source</th>
                <th style={thStyle}>Window</th>
                <th style={thStyle}>Reason</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Active</th>
                <th style={{ ...thStyle, textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <TrackedTickerRow
                  key={row.id}
                  row={row}
                  onToggle={(r, next) => void handleToggle(r, next)}
                  onEdit={(r) => setForm({ mode: 'edit', row: r })}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
