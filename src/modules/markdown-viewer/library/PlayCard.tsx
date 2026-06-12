// One Library play card — light by design (the brain has no play pages yet; this renders
// whatever the translate loop eventually writes). Title · last-updated · related chips,
// the whole card opening the page in the Reader.

import type { CSSProperties, ReactElement } from 'react'
import { MutedLabel } from '../../../components/MutedLabel'
import { formatDate } from '../../../lib/format'
import type { PlayCardModel } from '../types'

const relatedChip: CSSProperties = {
  padding: '1px 7px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border-subtle)',
  fontSize: 11,
  fontFamily: 'var(--font-mono)',
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap'
}

export function PlayCard({
  card,
  onOpenReader
}: {
  card: PlayCardModel
  onOpenReader: (relPath: string) => void
}): ReactElement {
  return (
    <div
      onClick={() => onOpenReader(card.relPath)}
      style={{
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-surface)',
        padding: '14px 16px',
        cursor: 'pointer'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 'var(--font-medium)',
            color: 'var(--color-text-primary)'
          }}
        >
          {card.title}
        </span>
        {card.lastUpdated && (
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text-muted)'
            }}
          >
            {formatDate(card.lastUpdated, 'long')}
          </span>
        )}
      </div>
      {card.related.length > 0 && (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}
        >
          <MutedLabel size={10} mono>
            Related
          </MutedLabel>
          {card.related.map((r) => (
            <span key={r} style={relatedChip}>
              {r}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
