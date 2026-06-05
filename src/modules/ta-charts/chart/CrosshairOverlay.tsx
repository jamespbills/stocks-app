import type { ReactElement } from 'react'
import { formatDate } from '../../../lib/format'
import type { IndicatorSeries } from '../indicators'
import { xForIndex, yForValue, type ChartGeometry } from './geometry'
import type { ChartArrays } from './model'
import type { ChartRanges } from './ChartStack'

// Lightweight overlay SVG drawn on top of the static ChartStack. Only this layer
// re-renders on mousemove — one vertical guide, a dot on each panel's primary
// line, and a date pill on the axis row.

interface Props {
  geom: ChartGeometry
  hoverIndex: number
  arrays: ChartArrays
  indicators: IndicatorSeries
  ranges: ChartRanges
}

export function CrosshairOverlay({
  geom,
  hoverIndex,
  arrays,
  indicators,
  ranges
}: Props): ReactElement {
  const x = xForIndex(geom, hoverIndex)
  const { panelY, panelH } = geom

  const dot = (
    value: number | null,
    top: number,
    h: number,
    lo: number,
    hi: number,
    color: string,
    r: number,
    padTop = 8,
    padBot = 8
  ): ReactElement | null => {
    if (value === null) return null
    return (
      <circle
        cx={x}
        cy={yForValue(value, top, h, lo, hi, padTop, padBot)}
        r={r}
        fill={color}
        stroke="var(--color-bg-surface)"
        strokeWidth="1.4"
      />
    )
  }

  const macdLo = -ranges.macdAbs / 2
  const macdHi = ranges.macdAbs / 2

  return (
    <svg
      width={geom.width}
      height={geom.height}
      viewBox={`0 0 ${geom.width} ${geom.height}`}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', display: 'block' }}
    >
      <line
        x1={x}
        x2={x}
        y1={panelY.price}
        y2={panelY.rsi + panelH.rsi}
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      {dot(
        arrays.close[hoverIndex],
        panelY.price,
        panelH.price,
        ranges.price.lo,
        ranges.price.hi,
        'var(--color-chart-price-blue)',
        3,
        14,
        8
      )}
      {dot(
        indicators.stochK[hoverIndex],
        panelY.stoch,
        panelH.stoch,
        0,
        100,
        'var(--color-chart-stoch-k)',
        2.5
      )}
      {dot(
        indicators.macd[hoverIndex],
        panelY.macd,
        panelH.macd,
        macdLo,
        macdHi,
        'var(--color-chart-macd-line)',
        2.5
      )}
      {dot(
        indicators.rsi[hoverIndex],
        panelY.rsi,
        panelH.rsi,
        0,
        100,
        'var(--color-chart-rsi-line)',
        2.5
      )}

      <g transform={`translate(${x}, ${panelY.axis + 9})`}>
        <rect
          x="-42"
          y="-1"
          width="84"
          height="15"
          rx="2"
          fill="var(--color-bg-overlay)"
          stroke="var(--color-border-default)"
          strokeWidth="0.7"
        />
        <text
          x="0"
          y="10"
          fill="var(--color-text-primary)"
          fontSize="10.5"
          fontFamily="var(--font-mono)"
          textAnchor="middle"
        >
          {formatDate(arrays.dates[hoverIndex], 'short')}
        </text>
      </g>
    </svg>
  )
}
