import type { CSSProperties, ReactElement } from 'react'
import type { ClaimSource } from './types'

// Membership metadata, never a data state — always neutral, never coloured (PA-1).
const SOURCE_LABEL: Record<ClaimSource, string> = {
  play_universe: 'play',
  manual_watch: 'watch',
  isa_holding: 'isa'
}

const chipStyle: CSSProperties = {
  display: 'inline-block',
  padding: '1px 6px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--color-info-bg)',
  color: 'var(--color-text-muted)',
  fontFamily: 'var(--font-mono)',
  fontSize: 10.5,
  letterSpacing: '0.3px'
}

export function SourceTag({ source }: { source: ClaimSource }): ReactElement {
  return <span style={chipStyle}>{SOURCE_LABEL[source]}</span>
}
