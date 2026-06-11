import type { CSSProperties, ReactElement } from 'react'
import { MutedLabel } from '../../../components/MutedLabel'
import type { Polarity, Sign } from '../types'

// Locked sign-polarity colour map (wireframe-decisions → Markdown Reviews):
// encouraging → green · warning → amber. The data model carries no severity,
// so every warning bands amber — red stays reserved for gate=fail / price-down.
const POLARITY_STYLE: Record<Polarity, { dot: string; band: string; heading: string }> = {
  warning: { dot: 'var(--color-warning)', band: 'var(--color-warning-bg)', heading: 'warning' },
  encouraging: { dot: 'var(--color-up)', band: 'var(--color-up-bg)', heading: 'encouraging' }
}

const dotStyle = (color: string): CSSProperties => ({
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: color,
  flexShrink: 0
})

function SignGroup({ polarity, signs }: { polarity: Polarity; signs: Sign[] }): ReactElement {
  const palette = POLARITY_STYLE[polarity]
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-2)'
        }}
      >
        <span style={dotStyle(palette.dot)} />
        <MutedLabel size={10}>
          {palette.heading} · {signs.length}
        </MutedLabel>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {signs.map((sign, i) => (
          <li
            key={i}
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              padding: '7px 10px',
              marginBottom: 6,
              borderRadius: 'var(--radius-md)',
              background: palette.band
            }}
          >
            {/* nudge the dot to centre on the first text line */}
            <span style={{ ...dotStyle(palette.dot), marginTop: 6 }} />
            <span
              style={{
                fontSize: 'var(--text-sm)',
                lineHeight: 1.5,
                color: 'var(--color-text-primary)'
              }}
            >
              {sign.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Grouped, colour-banded warning/encouraging signs (wireframe: `WARNING · 4` /
 * `ENCOURAGING · 3` headers over tinted full-width rows). Warnings always lead.
 * `columns` lays the two groups side by side (expanded route); default stacks
 * them (the slide-over panel).
 */
export function SignsPanel({
  signs,
  columns = false
}: {
  signs: Sign[]
  columns?: boolean
}): ReactElement | null {
  const warnings = signs.filter((s) => s.polarity === 'warning')
  const encouraging = signs.filter((s) => s.polarity === 'encouraging')
  const groups = (
    [
      ['warning', warnings],
      ['encouraging', encouraging]
    ] as const
  ).filter(([, list]) => list.length > 0)
  if (groups.length === 0) return null

  return (
    <div
      style={
        columns && groups.length > 1
          ? {
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              columnGap: 'var(--space-6)',
              alignItems: 'start'
            }
          : { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }
      }
    >
      {groups.map(([polarity, list]) => (
        <SignGroup key={polarity} polarity={polarity} signs={list} />
      ))}
    </div>
  )
}
