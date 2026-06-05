import { memo, type ReactElement } from 'react'
import type { IndicatorPeriods, IndicatorSeries, Num } from '../indicators'
import { xForIndex, yForValue, type ChartGeometry } from './geometry'
import type { AxisTick, ChartArrays, ReportAnchor } from './model'

// The static four-panel chart. Deliberately independent of hover state so it
// renders once per ticker/period/size change — the crosshair + tooltip live in
// lightweight overlays on top (CrosshairOverlay, HoverTooltip), so mousemoves
// never re-rasterise this (potentially multi-thousand-element) SVG.

export interface ChartRanges {
  price: { lo: number; hi: number }
  macdAbs: number
  volMax: number
}

interface Props {
  geom: ChartGeometry
  arrays: ChartArrays
  indicators: IndicatorSeries
  ranges: ChartRanges
  ticks: AxisTick[]
  reports: ReportAnchor[]
  periods: IndicatorPeriods
}

function ChartStackBase({
  geom,
  arrays,
  indicators,
  ranges,
  ticks,
  reports,
  periods
}: Props): ReactElement {
  const { panelY, panelH, plotL, plotR, plotW, n } = geom
  const xFor = (i: number): number => xForIndex(geom, i)

  // Build an "M … L …" polyline path, breaking on nulls.
  const polyD = (
    series: Num[],
    top: number,
    h: number,
    lo: number,
    hi: number,
    padTop = 8,
    padBot = 8
  ): string => {
    let d = ''
    let started = false
    for (let i = 0; i < series.length; i++) {
      const v = series[i]
      if (v === null) {
        started = false
        continue
      }
      const x = xFor(i)
      const y = yForValue(v, top, h, lo, hi, padTop, padBot)
      d += (started ? ' L ' : ' M ') + x.toFixed(1) + ' ' + y.toFixed(1)
      started = true
    }
    return d.trim()
  }

  const barW = Math.max(1, (plotW / Math.max(1, n)) * 0.7)

  // ── Volume bars (zero-floored, coloured by up/down day) ──
  const volTop = panelY.vol + 4
  const volBot = panelY.vol + panelH.vol - 2
  const volUsable = volBot - volTop

  // ── MACD histogram (sign-coloured, centred on zero) ──
  const macdTop = panelY.macd
  const macdH = panelH.macd
  const macdLo = -ranges.macdAbs / 2
  const macdHi = ranges.macdAbs / 2
  const macdZeroY = yForValue(0, macdTop, macdH, macdLo, macdHi)

  // ── Stochastic / RSI band edges ──
  const sy = (v: number): number => yForValue(v, panelY.stoch, panelH.stoch, 0, 100)
  const ry = (v: number): number => yForValue(v, panelY.rsi, panelH.rsi, 0, 100)

  // RSI area fill (line down to the panel's bottom plot edge).
  const rsiFillBottom = panelY.rsi + panelH.rsi - 8
  const rsiLineD = polyD(indicators.rsi, panelY.rsi, panelH.rsi, 0, 100)
  const firstRsi = indicators.rsi.findIndex((v) => v !== null)
  const rsiAreaD =
    firstRsi >= 0 && rsiLineD
      ? `${rsiLineD} L ${xFor(n - 1).toFixed(1)} ${rsiFillBottom.toFixed(1)} L ${xFor(firstRsi).toFixed(1)} ${rsiFillBottom.toFixed(1)} Z`
      : ''

  const priceLo = ranges.price.lo
  const priceHi = ranges.price.hi
  const py = (v: number): number =>
    yForValue(v, panelY.price, panelH.price, priceLo, priceHi, 14, 8)

  return (
    <svg
      width={geom.width}
      height={geom.height}
      viewBox={`0 0 ${geom.width} ${geom.height}`}
      style={{ display: 'block' }}
    >
      {/* Panel separators */}
      {(['vol', 'stoch', 'macd', 'rsi'] as const).map((k) => (
        <line
          key={k}
          x1={0}
          x2={geom.width}
          y1={panelY[k] - 3}
          y2={panelY[k] - 3}
          stroke="var(--color-border-subtle)"
          strokeWidth="1"
        />
      ))}

      {/* Report markers — across all panels. Qualifying = solid amber, others dimmed. */}
      {reports.map((a, k) => {
        const x = xFor(a.idx)
        return (
          <line
            key={k}
            x1={x}
            x2={x}
            y1={panelY.price}
            y2={panelY.rsi + panelH.rsi}
            stroke={a.report.qualifies ? 'var(--color-chart-date-line)' : 'rgba(255,255,255,0.18)'}
            strokeWidth={a.report.qualifies ? 1.1 : 0.8}
            strokeDasharray={a.report.qualifies ? undefined : '3 4'}
            opacity={a.report.qualifies ? 0.8 : 0.6}
          />
        )
      })}

      {/* ════ PRICE ════ */}
      {[0.25, 0.5, 0.75].map((t, i) => {
        const yy = panelY.price + 14 + (panelH.price - 14 - 8) * t
        return (
          <line
            key={i}
            x1={plotL}
            x2={plotR}
            y1={yy}
            y2={yy}
            stroke="var(--color-chart-grid)"
            strokeWidth="1"
          />
        )
      })}
      <path
        d={polyD(indicators.sma, panelY.price, panelH.price, priceLo, priceHi, 14, 8)}
        fill="none"
        stroke="var(--color-chart-sma)"
        strokeWidth="1.2"
        strokeDasharray="4 4"
      />
      <path
        d={polyD(arrays.close, panelY.price, panelH.price, priceLo, priceHi, 14, 8)}
        fill="none"
        stroke="var(--color-chart-price-blue)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {[priceHi, priceHi * 0.67 + priceLo * 0.33, priceHi * 0.33 + priceLo * 0.67, priceLo].map(
        (p, i) => (
          <text
            key={i}
            x={plotL - 8}
            y={py(p)}
            fill="var(--color-chart-axis-text)"
            fontSize="9.5"
            fontFamily="var(--font-mono)"
            textAnchor="end"
            dominantBaseline="middle"
          >
            {p.toFixed(p > 50 ? 0 : 2)}
          </text>
        )
      )}
      <PanelLabel
        x={plotL}
        y={panelY.price + 10}
        name="PRICE"
        sub={`SMA(${periods.smaWindow}) dashed · close`}
      />

      {/* ════ VOLUME ════ */}
      {arrays.volume.map((v, i) => {
        if (v === null) return null
        const h = Math.max(1, (v / ranges.volMax) * volUsable)
        const up = (arrays.close[i] ?? 0) >= (arrays.open[i] ?? arrays.close[i] ?? 0)
        return (
          <rect
            key={i}
            x={xFor(i) - barW / 2}
            y={volBot - h}
            width={barW}
            height={h}
            fill={up ? 'var(--color-chart-volume-up)' : 'var(--color-chart-volume-down)'}
          />
        )
      })}
      <PanelLabel x={plotL} y={panelY.vol + 10} name="VOL" />

      {/* ════ STOCHASTIC ════ */}
      <rect
        x={plotL}
        y={sy(100)}
        width={plotW}
        height={sy(80) - sy(100)}
        fill="var(--color-chart-overbought-band)"
      />
      <rect
        x={plotL}
        y={sy(20)}
        width={plotW}
        height={sy(0) - sy(20)}
        fill="var(--color-chart-oversold-band)"
      />
      <RefLine x1={plotL} x2={plotR} y={sy(20)} />
      <RefLine x1={plotL} x2={plotR} y={sy(80)} />
      <path
        d={polyD(indicators.stochD, panelY.stoch, panelH.stoch, 0, 100)}
        fill="none"
        stroke="var(--color-chart-stoch-d)"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d={polyD(indicators.stochK, panelY.stoch, panelH.stoch, 0, 100)}
        fill="none"
        stroke="var(--color-chart-stoch-k)"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <PanelLabel
        x={plotL}
        y={panelY.stoch + 10}
        name="STOCH"
        sub={`(${periods.stochK}, ${periods.stochKSmooth}, ${periods.stochDSmooth}) · %K %D`}
      />
      {[100, 80, 20, 0].map((t) => (
        <YLabel key={t} x={plotL - 8} y={sy(t)} text={t} />
      ))}

      {/* ════ MACD ════ */}
      <RefLine x1={plotL} x2={plotR} y={macdZeroY} dashed={false} />
      {indicators.macdHist.map((v, i) => {
        if (v === null) return null
        const yv = yForValue(v, macdTop, macdH, macdLo, macdHi)
        const top = Math.min(yv, macdZeroY)
        const h = Math.max(0.8, Math.abs(yv - macdZeroY))
        return (
          <rect
            key={i}
            x={xFor(i) - barW / 2}
            y={top}
            width={barW}
            height={h}
            fill={v >= 0 ? 'var(--color-chart-macd-hist-pos)' : 'var(--color-chart-macd-hist-neg)'}
            opacity="0.5"
          />
        )
      })}
      <path
        d={polyD(indicators.macdSignal, macdTop, macdH, macdLo, macdHi)}
        fill="none"
        stroke="var(--color-chart-macd-signal)"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d={polyD(indicators.macd, macdTop, macdH, macdLo, macdHi)}
        fill="none"
        stroke="var(--color-chart-macd-line)"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <PanelLabel
        x={plotL}
        y={macdTop + 10}
        name="MACD"
        sub={`(${periods.macdFast}, ${periods.macdSlow}, ${periods.macdSignal}) · line signal hist`}
      />
      {[macdHi, 0, macdLo].map((t, i) => (
        <YLabel
          key={i}
          x={plotL - 8}
          y={yForValue(t, macdTop, macdH, macdLo, macdHi)}
          text={(t > 0 ? '+' : '') + t.toFixed(1)}
        />
      ))}

      {/* ════ RSI ════ */}
      <rect
        x={plotL}
        y={ry(100)}
        width={plotW}
        height={ry(70) - ry(100)}
        fill="var(--color-chart-overbought-band)"
      />
      <rect
        x={plotL}
        y={ry(30)}
        width={plotW}
        height={ry(0) - ry(30)}
        fill="var(--color-chart-oversold-band)"
      />
      <RefLine x1={plotL} x2={plotR} y={ry(30)} />
      <RefLine x1={plotL} x2={plotR} y={ry(50)} />
      <RefLine x1={plotL} x2={plotR} y={ry(70)} />
      <path d={rsiAreaD} fill="var(--color-chart-rsi-fill)" stroke="none" />
      <path
        d={rsiLineD}
        fill="none"
        stroke="var(--color-chart-rsi-line)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <PanelLabel x={plotL} y={panelY.rsi + 10} name="RSI" sub={`(${periods.rsiPeriod})`} />
      {[100, 70, 50, 30, 0].map((t) => (
        <YLabel key={t} x={plotL - 8} y={ry(t)} text={t} />
      ))}

      {/* ════ X-AXIS ════ */}
      {ticks.map((t) => (
        <g key={t.idx}>
          <line
            x1={xFor(t.idx)}
            x2={xFor(t.idx)}
            y1={panelY.axis - 1}
            y2={panelY.axis + 3}
            stroke="var(--color-chart-axis-text)"
            strokeWidth="0.8"
          />
          <text
            x={xFor(t.idx)}
            y={panelY.axis + 16}
            fill="var(--color-chart-axis-text)"
            fontSize="10"
            fontFamily="var(--font-mono)"
            textAnchor="middle"
          >
            {t.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

function RefLine({
  x1,
  x2,
  y,
  dashed = true
}: {
  x1: number
  x2: number
  y: number
  dashed?: boolean
}): ReactElement {
  return (
    <line
      x1={x1}
      x2={x2}
      y1={y}
      y2={y}
      stroke="rgba(255,255,255,0.16)"
      strokeWidth="0.8"
      strokeDasharray={dashed ? '3 4' : undefined}
    />
  )
}

function YLabel({ x, y, text }: { x: number; y: number; text: number | string }): ReactElement {
  return (
    <text
      x={x}
      y={y}
      fill="var(--color-chart-axis-text)"
      fontSize="9.5"
      fontFamily="var(--font-mono)"
      textAnchor="end"
      dominantBaseline="middle"
    >
      {text}
    </text>
  )
}

function PanelLabel({
  x,
  y,
  name,
  sub
}: {
  x: number
  y: number
  name: string
  sub?: string
}): ReactElement {
  return (
    <text
      x={x}
      y={y}
      fontFamily="var(--font-mono)"
      fontSize="10"
      fill="var(--color-text-secondary)"
      style={{ letterSpacing: '0.5px' }}
    >
      <tspan>{name}</tspan>
      {sub && (
        <tspan dx="6" fill="var(--color-text-muted)">
          {sub}
        </tspan>
      )}
    </text>
  )
}

export const ChartStack = memo(ChartStackBase)
