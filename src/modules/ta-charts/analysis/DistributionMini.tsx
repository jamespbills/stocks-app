import type { ReactElement } from 'react'
import { HIST_MIN, HIST_MAX, HIST_BINS } from './trades'

// A 12-bin return histogram, small enough to live in a table column but big
// enough to read shape (fat tail, bimodal cluster). Bins left of the yellow zero
// divider are losses (down colour), right are gains (up colour). Bin boundaries +
// counts surface on native hover. Domain is shared with trades.ts so the divider
// lines up with the maths.
const SPAN = HIST_MAX - HIST_MIN
const ZERO_FRAC = (0 - HIST_MIN) / SPAN // 0.375 for [-30, 50]

function binLabel(i: number, count: number): string {
  const lo = HIST_MIN + (i * SPAN) / HIST_BINS
  const hi = HIST_MIN + ((i + 1) * SPAN) / HIST_BINS
  return `${lo.toFixed(0)}% … ${hi.toFixed(0)}%: ${count}`
}

export function DistributionMini({
  histogram,
  width = 96,
  height = 24
}: {
  histogram: number[]
  width?: number
  height?: number
}): ReactElement {
  const max = Math.max(1, ...histogram)
  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1
      }}
    >
      {histogram.map((count, i) => {
        const center = HIST_MIN + ((i + 0.5) * SPAN) / HIST_BINS
        const isGain = center >= 0
        return (
          <div
            key={i}
            title={binLabel(i, count)}
            style={{
              flex: 1,
              height: `${Math.max(count === 0 ? 0 : 8, (count / max) * 100)}%`,
              background: isGain ? 'var(--color-up)' : 'var(--color-down)',
              opacity: count === 0 ? 0.12 : 0.85,
              borderRadius: 1
            }}
          />
        )
      })}
      {/* zero divider */}
      <div
        style={{
          position: 'absolute',
          left: `${ZERO_FRAC * 100}%`,
          top: 0,
          bottom: 0,
          width: 1,
          background: 'var(--color-warning)',
          opacity: 0.6
        }}
      />
    </div>
  )
}
