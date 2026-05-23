import type { ReactElement } from 'react'

interface PlayPillProps {
  score: number | null
  maxScore: number
}

export function PlayPill({ score, maxScore }: PlayPillProps): ReactElement {
  if (score === null) {
    return <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>—</span>
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

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 22,
        padding: '1px 6px',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        borderRadius: 3,
        background: bg,
        color,
        fontWeight: 500
      }}
    >
      {score}
    </span>
  )
}
