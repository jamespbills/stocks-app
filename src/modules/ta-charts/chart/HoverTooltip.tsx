import type { CSSProperties, ReactElement } from 'react'
import { formatDate, formatPercent } from '../../../lib/format'
import type { IndicatorSeries, Num } from '../indicators'
import { xForIndex, type ChartGeometry } from './geometry'
import type { ChartArrays } from './model'

// The unified hover read-out — a single stacked tooltip reading every panel's
// value at the hovered bar (the legacy tool's `hovermode='x unified'` feel).

interface Props {
  geom: ChartGeometry
  hoverIndex: number
  arrays: ChartArrays
  indicators: IndicatorSeries
}

const TT_W = 200

function fmt(v: Num, digits = 2): string {
  return v === null ? '—' : v.toFixed(digits)
}

function fmtVolume(v: Num): string {
  if (v === null) return '—'
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return String(Math.round(v))
}

function Row({
  k,
  v,
  c,
  swatch
}: {
  k: string
  v: string
  c?: string
  swatch?: string
}): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        padding: '2px 0'
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          textTransform: 'uppercase',
          letterSpacing: '0.4px'
        }}
      >
        {swatch && (
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 2,
              borderRadius: 1,
              background: swatch
            }}
          />
        )}
        {k}
      </span>
      <span
        style={{
          color: c || 'var(--color-text-primary)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11.5,
          fontVariantNumeric: 'tabular-nums'
        }}
      >
        {v}
      </span>
    </div>
  )
}

function SectionHead({ label }: { label: string }): ReactElement {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9.5,
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
        paddingTop: 6,
        marginTop: 4,
        marginBottom: 2,
        borderTop: '1px solid var(--color-border-subtle)'
      }}
    >
      {label}
    </div>
  )
}

export function HoverTooltip({ geom, hoverIndex, arrays, indicators }: Props): ReactElement {
  const i = hoverIndex
  const px = xForIndex(geom, i)
  const margin = 14
  let left = px + 14
  if (left + TT_W > geom.width - margin) left = px - 14 - TT_W
  if (left < margin) left = margin

  const close = arrays.close[i]
  const prev = i > 0 ? arrays.close[i - 1] : null
  const chg = prev !== null && prev !== 0 ? (close - prev) / prev : null
  const chgColor = chg !== null && chg < 0 ? 'var(--color-down)' : 'var(--color-up)'
  const sma = indicators.sma[i]
  const maPos = indicators.maPosition[i]
  const maColor =
    maPos === 'ABOVE' ? 'var(--color-up)' : maPos === 'BELOW' ? 'var(--color-down)' : undefined
  const hist = indicators.macdHist[i]

  const box: CSSProperties = {
    position: 'absolute',
    left,
    top: geom.panelY.price + 6,
    width: TT_W,
    background: 'var(--color-bg-overlay)',
    border: '1px solid var(--color-border-default)',
    borderRadius: 5,
    padding: '10px 12px 11px',
    boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
    pointerEvents: 'none',
    fontFamily: 'var(--font-sans)',
    lineHeight: 1.4
  }

  return (
    <div style={box}>
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 500,
          color: 'var(--color-text-primary)',
          marginBottom: 6
        }}
      >
        {formatDate(arrays.dates[i], 'long')}
      </div>

      <Row k="Close" v={fmt(close)} swatch="var(--color-chart-price-blue)" />
      <Row k="Chg" v={formatPercent(chg, { signed: true, digits: 2 })} c={chgColor} />
      <Row k="SMA" v={fmt(sma)} swatch="var(--color-chart-sma)" />
      <Row k="MA pos" v={maPos ?? '—'} c={maColor} />

      <SectionHead label="Volume" />
      <Row k="Vol" v={fmtVolume(arrays.volume[i])} />

      <SectionHead label="Stochastic" />
      <Row k="%K" v={fmt(indicators.stochK[i], 1)} swatch="var(--color-chart-stoch-k)" />
      <Row k="%D" v={fmt(indicators.stochD[i], 1)} swatch="var(--color-chart-stoch-d)" />

      <SectionHead label="MACD" />
      <Row k="MACD" v={fmt(indicators.macd[i], 3)} swatch="var(--color-chart-macd-line)" />
      <Row
        k="Signal"
        v={fmt(indicators.macdSignal[i], 3)}
        swatch="var(--color-chart-macd-signal)"
      />
      <Row
        k="Hist"
        v={hist === null ? '—' : (hist >= 0 ? '+' : '') + hist.toFixed(3)}
        c={hist !== null && hist < 0 ? 'var(--color-down)' : 'var(--color-up)'}
      />

      <SectionHead label="RSI" />
      <Row k="RSI" v={fmt(indicators.rsi[i], 1)} swatch="var(--color-chart-rsi-line)" />
    </div>
  )
}
