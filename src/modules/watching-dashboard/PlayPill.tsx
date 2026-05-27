import type { ReactElement } from 'react'
import { CRITERION_NAMES } from '../sector-signals/types'

interface PlayPillProps {
  score: number | null
  maxScore: number
  sectorPlay?: boolean
  sectorName?: string | null
  missedCriterion?: number | null
}

export function PlayPill({
  score,
  maxScore,
  sectorPlay,
  sectorName,
  missedCriterion
}: PlayPillProps): ReactElement {
  if (score === null) {
    return <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>—</span>
  }

  let bg = 'var(--color-play-low-bg)'
  let color = 'var(--color-play-low-text)'

  if (Number(score) === maxScore) {
    bg = 'var(--color-play-13-bg)'
    color = 'var(--color-play-13-text)'
  } else if (Number(score) === maxScore - 1) {
    bg = 'var(--color-play-12-bg)'
    color = 'var(--color-play-12-text)'
  }

  const criterionName =
    missedCriterion != null ? (CRITERION_NAMES[missedCriterion] ?? String(missedCriterion)) : null
  const tooltip =
    sectorPlay && sectorName && criterionName
      ? `Sector play: ${sectorName} × ${criterionName}`
      : undefined

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span
        title={tooltip}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 26,
          padding: '1px 6px',
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          borderRadius: 3,
          background: bg,
          color,
          fontWeight: 500
        }}
      >
        {Math.round(Number(score))}
      </span>
      {sectorPlay && (
        <span
          title={tooltip}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 500,
            color: 'var(--color-up)',
            letterSpacing: '0.5px'
          }}
        >
          SP
        </span>
      )}
    </span>
  )
}
