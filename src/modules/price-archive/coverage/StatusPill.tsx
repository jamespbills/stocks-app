import type { CSSProperties, ReactElement } from 'react'
import type { CoverageStatus } from '../types'

// Locked colour map (wireframe PA-1): semantic colour lives ONLY in the status
// column. fresh=green dot · stale=amber dot · partial=amber half · missing=red ring.
const STATUS_META: Record<CoverageStatus, { glyph: string; color: string; label: string }> = {
  fresh: { glyph: '●', color: 'var(--color-up)', label: 'fresh' },
  stale: { glyph: '●', color: 'var(--color-warning)', label: 'stale' },
  partial: { glyph: '◐', color: 'var(--color-warning)', label: 'partial' },
  missing: { glyph: '○', color: 'var(--color-danger)', label: 'missing' }
}

const wrapStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: 'var(--font-mono)',
  fontSize: 11.5
}

export function StatusPill({ status }: { status: CoverageStatus }): ReactElement {
  const meta = STATUS_META[status]
  return (
    <span style={wrapStyle}>
      <span style={{ color: meta.color, fontSize: 12, lineHeight: 1 }}>{meta.glyph}</span>
      <span style={{ color: 'var(--color-text-secondary)' }}>{meta.label}</span>
    </span>
  )
}
