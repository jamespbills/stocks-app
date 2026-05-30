import { useState, type CSSProperties, type ReactElement } from 'react'
import type { TrackedTicker } from '../types'
import { SourceTag } from '../SourceTag'
import { Toggle } from './Toggle'

const tdStyle: CSSProperties = {
  padding: '0 var(--space-4)',
  height: 'var(--table-row-height)',
  fontSize: 12,
  color: 'var(--color-text-secondary)',
  borderBottom: '1px solid var(--color-border-subtle)',
  verticalAlign: 'middle'
}

const monoCell: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11.5
}

interface Props {
  row: TrackedTicker
  onToggle: (row: TrackedTicker, next: boolean) => void
  onEdit: (row: TrackedTicker) => void
}

export function TrackedTickerRow({ row, onToggle, onEdit }: Props): ReactElement {
  const [hovered, setHovered] = useState(false)
  const editable = row.source === 'manual_watch'

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? 'var(--color-interactive-hover)' : 'transparent' }}
    >
      <td style={tdStyle}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          {!editable && <span style={{ color: 'var(--color-text-muted)' }}>🔒</span>}
          <span
            style={{
              ...monoCell,
              fontWeight: 'var(--font-medium)',
              color: editable ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
            }}
          >
            {row.ticker}
          </span>
        </span>
      </td>
      <td style={tdStyle}>
        <SourceTag source={row.source} />
      </td>
      <td style={{ ...tdStyle, ...monoCell }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{ color: editable ? 'var(--color-text-secondary)' : 'var(--color-text-muted)' }}
          >
            {row.coverFrom ?? 'auto'}
          </span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>→</span>
          <span style={{ color: 'var(--color-text-muted)' }}>{row.coverTo ?? 'ongoing'}</span>
        </span>
      </td>
      <td style={tdStyle}>
        <span
          style={{
            fontSize: 12,
            color: editable ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
            fontStyle: row.reason ? 'normal' : 'italic',
            lineHeight: 1.45,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {row.reason ?? (editable ? '—' : '(managed by Portfolio)')}
        </span>
      </td>
      <td style={{ ...tdStyle, textAlign: 'center' }}>
        <Toggle on={row.isActive} disabled={!editable} onChange={(next) => onToggle(row, next)} />
      </td>
      <td style={{ ...tdStyle, textAlign: 'right' }}>
        {editable ? (
          hovered ? (
            <button
              onClick={() => onEdit(row)}
              style={{
                padding: '3px 9px',
                height: 24,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-default)',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer'
              }}
            >
              Edit
            </button>
          ) : (
            <span style={{ color: 'var(--color-text-muted)', fontSize: 14, letterSpacing: 1 }}>
              ⋯
            </span>
          )
        ) : (
          <span style={{ ...monoCell, fontSize: 9.5, color: 'var(--color-text-muted)' }}>
            read-only
          </span>
        )}
      </td>
    </tr>
  )
}
