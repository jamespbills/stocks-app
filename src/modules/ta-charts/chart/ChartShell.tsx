import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { formatDate } from '../../../lib/format'
import {
  computeIndicators,
  detectSignals,
  type IndicatorPeriods,
  type SignalSettings
} from '../indicators'
import type { PriceBar } from '../../price-archive/types'
import type { ReportMarker } from '../types'
import { buildGeometry, indexForX, xForIndex, yForValue } from './geometry'
import {
  axisTicks,
  macdAbs,
  nearestReport,
  priceRange,
  reportAnchors,
  toArrays,
  volMax,
  MARKER,
  type MarkerAnchor
} from './model'
import { ChartStack, type ChartRanges } from './ChartStack'
import { CrosshairOverlay } from './CrosshairOverlay'
import { HoverTooltip } from './HoverTooltip'
import { SignalTooltip } from './SignalTooltip'

interface Props {
  bars: PriceBar[]
  reports: ReportMarker[]
  periods: IndicatorPeriods
  signalSettings: SignalSettings
}

export function ChartShell({ bars, reports, periods, signalSettings }: Props): ReactElement {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [hoveredReport, setHoveredReport] = useState<number | null>(null)
  const [hoveredSignal, setHoveredSignal] = useState<number | null>(null)

  useEffect(() => {
    if (!container) return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect
      setSize({ w: Math.floor(cr.width), h: Math.floor(cr.height) })
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [container])

  const arrays = useMemo(() => toArrays(bars), [bars])
  // Indicators recompute when periods change — the instant calibration loop.
  const indicators = useMemo(() => computeIndicators(bars, periods), [bars, periods])
  const ranges: ChartRanges = useMemo(
    () => ({
      price: priceRange(arrays.close, indicators.sma),
      macdAbs: macdAbs(indicators.macd, indicators.macdSignal),
      volMax: volMax(arrays.volume)
    }),
    [arrays, indicators]
  )
  const ticks = useMemo(() => axisTicks(arrays.dates), [arrays.dates])
  const anchors = useMemo(() => reportAnchors(reports, arrays.dates), [reports, arrays.dates])

  // Signals recompute live when a rule changes (same calibration loop as periods).
  const signals = useMemo(
    () => detectSignals(indicators, signalSettings),
    [indicators, signalSettings]
  )

  const geom = useMemo(
    () => (size ? buildGeometry(size.w, size.h, bars.length) : null),
    [size, bars.length]
  )

  // Marker anchors (x + price-point y) — shared by the drawn triangles and the
  // hover hit-areas so they stay aligned.
  const markers: MarkerAnchor[] = useMemo(() => {
    if (!geom) return []
    return signals.map((signal) => ({
      signal,
      x: xForIndex(geom, signal.index),
      y: yForValue(
        arrays.close[signal.index],
        geom.panelY.price,
        geom.panelH.price,
        ranges.price.lo,
        ranges.price.hi,
        14,
        8
      )
    }))
  }, [signals, geom, arrays.close, ranges.price])

  return (
    <div style={{ flex: 1, minHeight: 0, padding: 16 }}>
      <div
        ref={setContainer}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden'
        }}
        onMouseMove={(e) => {
          if (!geom || !container) return
          const rect = container.getBoundingClientRect()
          setHoverIndex(indexForX(geom, e.clientX - rect.left))
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {geom && (
          <>
            <ChartStack
              geom={geom}
              arrays={arrays}
              indicators={indicators}
              ranges={ranges}
              ticks={ticks}
              reports={anchors}
              markers={markers}
              periods={periods}
            />

            {/* Report hover handles — small markers in the top strip, aligned to
                each report's vertical line. Kept out of the plot body so they
                don't interfere with crosshair tracking. */}
            {anchors.map((a, k) => {
              const x = xForIndex(geom, a.idx)
              return (
                <div
                  key={k}
                  onMouseEnter={() => setHoveredReport(k)}
                  onMouseLeave={() => setHoveredReport(null)}
                  style={{
                    position: 'absolute',
                    left: x - 6,
                    top: geom.panelY.price - 2,
                    width: 12,
                    height: 12,
                    cursor: 'default'
                  }}
                >
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      margin: '0 auto',
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderTop: `6px solid ${
                        a.report.qualifies
                          ? 'var(--color-chart-date-line)'
                          : 'rgba(255,255,255,0.35)'
                      }`
                    }}
                  />
                </div>
              )
            })}

            {/* Signal marker hit-areas — generous targets over each triangle.
                On hover, the signal modal shows and the crosshair read-out is
                suppressed so the two don't stack. */}
            {markers.map((m, k) => {
              const cy = m.signal.type === 'buy' ? m.y + MARKER.dy : m.y - MARKER.dy
              return (
                <div
                  key={k}
                  onMouseEnter={() => setHoveredSignal(k)}
                  onMouseLeave={() => setHoveredSignal(null)}
                  style={{
                    position: 'absolute',
                    left: m.x - MARKER.hit / 2,
                    top: cy - MARKER.hit / 2,
                    width: MARKER.hit,
                    height: MARKER.hit,
                    cursor: 'default'
                  }}
                />
              )
            })}

            {hoverIndex !== null && hoveredSignal === null && (
              <>
                <CrosshairOverlay
                  geom={geom}
                  hoverIndex={hoverIndex}
                  arrays={arrays}
                  indicators={indicators}
                  ranges={ranges}
                />
                <HoverTooltip
                  geom={geom}
                  hoverIndex={hoverIndex}
                  arrays={arrays}
                  indicators={indicators}
                />
              </>
            )}

            {hoveredReport !== null && anchors[hoveredReport] && (
              <ReportTooltip
                anchor={anchors[hoveredReport]}
                x={xForIndex(geom, anchors[hoveredReport].idx)}
                top={geom.panelY.price + 12}
                cardWidth={geom.width}
              />
            )}

            {hoveredSignal !== null &&
              markers[hoveredSignal] &&
              (() => {
                const m = markers[hoveredSignal]
                const i = m.signal.index
                return (
                  <SignalTooltip
                    type={m.signal.type}
                    grade={m.signal.grade}
                    signalDate={arrays.dates[i]}
                    entryClose={arrays.close[i]}
                    rsi={indicators.rsi[i]}
                    stochK={indicators.stochK[i]}
                    macd={indicators.macd[i]}
                    maPosition={indicators.maPosition[i]}
                    stochCrossDate={arrays.dates[m.signal.stochCrossIndex]}
                    daysBetween={m.signal.daysBetween}
                    nearest={nearestReport(arrays.dates[i], reports)}
                    x={m.x}
                    top={geom.panelY.price + 12}
                    cardWidth={geom.width}
                  />
                )
              })()}
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '1px 0' }}>
      <span
        style={{
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          textTransform: 'uppercase',
          letterSpacing: '0.4px'
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11.5
        }}
      >
        {value}
      </span>
    </div>
  )
}

function ReportTooltip({
  anchor,
  x,
  top,
  cardWidth
}: {
  anchor: { report: ReportMarker; idx: number }
  x: number
  top: number
  cardWidth: number
}): ReactElement {
  const r = anchor.report
  const W = 220
  let left = x + 10
  if (left + W > cardWidth - 12) left = x - 10 - W
  if (left < 12) left = 12
  const play = r.play !== null ? String(r.play) : '—'
  const play2 = r.play2 !== null ? String(r.play2) : '—'
  const rating = (v: number | null): string =>
    v === null ? '—' : v > 0 ? '+1' : v < 0 ? '−1' : '0'

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: W,
        background: 'var(--color-bg-overlay)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 5,
        padding: '10px 12px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
        pointerEvents: 'none',
        zIndex: 'var(--z-dropdown)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6
        }}
      >
        <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--color-text-primary)' }}>
          {formatDate(r.dateReleased, 'long')}
        </span>
        <span
          style={{
            fontSize: 9.5,
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: r.qualifies ? 'var(--color-chart-date-line)' : 'var(--color-text-muted)'
          }}
        >
          {r.qualifies ? 'play universe' : 'report'}
        </span>
      </div>
      <Field label="FY" value={r.financialYear !== null ? String(r.financialYear) : '—'} />
      <Field label="Filing" value={r.filingIdentifier ?? '—'} />
      <Field label="Play" value={`${play}  ·  sector ${rating(r.playSectorRating)}`} />
      <Field label="Play 2" value={`${play2}  ·  sector ${rating(r.play2SectorRating)}`} />
    </div>
  )
}
