import { useMemo, useState, type CSSProperties, type ReactElement } from 'react'
import type { CoverageRow, CoverageStatus } from '../types'
import { CoverageTable } from './CoverageTable'

type Filter = 'all' | CoverageStatus
const FILTERS: Filter[] = ['all', 'fresh', 'stale', 'partial', 'missing']

const FILTER_DOT: Record<CoverageStatus, string> = {
  fresh: 'var(--color-up)',
  stale: 'var(--color-warning)',
  partial: 'var(--color-warning)',
  missing: 'var(--color-danger)'
}

const chipBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 10px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-default)',
  fontFamily: 'var(--font-mono)',
  fontSize: 11.5,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'background var(--transition-fast), color var(--transition-fast)'
}

interface Props {
  rows: CoverageRow[]
  buildingTicker: string | null
  onBuildTicker: (ticker: string) => void
  onUploadCsv: (ticker: string) => void
}

export function CoverageView({
  rows,
  buildingTicker,
  onBuildTicker,
  onUploadCsv
}: Props): ReactElement {
  const [filter, setFilter] = useState<Filter>('all')

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: rows.length,
      fresh: 0,
      stale: 0,
      partial: 0,
      missing: 0
    }
    for (const r of rows) c[r.status] += 1
    return c
  }, [rows])

  const filtered = useMemo(
    () => (filter === 'all' ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter]
  )

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Filter chips */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-3) var(--space-5)',
          borderBottom: '1px solid var(--color-border-subtle)',
          flexShrink: 0
        }}
      >
        {FILTERS.map((f) => {
          const active = filter === f
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...chipBase,
                background: active ? 'var(--color-interactive-active)' : 'transparent',
                color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
              }}
            >
              {f !== 'all' && (
                <span style={{ color: FILTER_DOT[f], fontSize: 10, lineHeight: 1 }}>●</span>
              )}
              <span>{f}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>{counts[f]}</span>
            </button>
          )
        })}
      </div>

      <CoverageTable
        rows={filtered}
        buildingTicker={buildingTicker}
        onBuildTicker={onBuildTicker}
        onUploadCsv={onUploadCsv}
      />
    </div>
  )
}
