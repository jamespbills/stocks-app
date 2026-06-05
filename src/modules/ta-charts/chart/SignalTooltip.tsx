import type { ReactElement } from 'react'
import { formatDate } from '../../../lib/format'
import type { Grade, MaPosition, Num } from '../indicators'
import type { NearestReport } from './model'

// The signal hover modal — the stats card shown when hovering a buy/sell marker.
// Mirrors ChartShell's ReportTooltip (viewport-flipping, var(--z-dropdown)).

interface Props {
  type: 'buy' | 'sell'
  grade: Grade
  signalDate: string
  entryClose: number | null
  rsi: Num
  stochK: Num
  macd: Num
  maPosition: MaPosition
  stochCrossDate: string
  daysBetween: number
  nearest: NearestReport | null
  x: number
  top: number
  cardWidth: number
}

const W = 224

function gradeColor(grade: Grade): { fg: string; bg: string } {
  switch (grade) {
    case 'A+':
    case 'A':
      return { fg: 'var(--color-up)', bg: 'var(--color-up-bg)' }
    case 'B':
      return { fg: 'var(--color-warning)', bg: 'var(--color-warning-bg)' }
    default:
      return { fg: 'var(--color-text-muted)', bg: 'var(--color-play-low-bg)' }
  }
}

function Field({
  label,
  value,
  color
}: {
  label: string
  value: string
  color?: string
}): ReactElement {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '1.5px 0' }}>
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
          color: color ?? 'var(--color-text-primary)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11.5,
          fontVariantNumeric: 'tabular-nums'
        }}
      >
        {value}
      </span>
    </div>
  )
}

function fmt(v: Num, digits = 2): string {
  return v === null ? '—' : v.toFixed(digits)
}

export function SignalTooltip({
  type,
  grade,
  signalDate,
  entryClose,
  rsi,
  stochK,
  macd,
  maPosition,
  stochCrossDate,
  daysBetween,
  nearest,
  x,
  top,
  cardWidth
}: Props): ReactElement {
  let left = x + 12
  if (left + W > cardWidth - 12) left = x - 12 - W
  if (left < 12) left = 12

  const isBuy = type === 'buy'
  const accent = isBuy ? 'var(--color-up)' : 'var(--color-down)'
  const gc = gradeColor(grade)
  const maColor =
    maPosition === 'ABOVE'
      ? 'var(--color-up)'
      : maPosition === 'BELOW'
        ? 'var(--color-down)'
        : undefined

  const nearestStr =
    nearest === null
      ? '—'
      : `${nearest.days > 0 ? '+' : ''}${nearest.days}d · ${formatDate(nearest.report.dateReleased, 'short')}`

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
        padding: '10px 12px 11px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
        pointerEvents: 'none',
        zIndex: 'var(--z-dropdown)',
        fontFamily: 'var(--font-sans)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
        <span style={{ color: accent, fontSize: 11, lineHeight: 1 }}>{isBuy ? '▲' : '▼'}</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11.5,
            fontWeight: 'var(--font-medium)',
            letterSpacing: '0.4px',
            color: 'var(--color-text-primary)'
          }}
        >
          {isBuy ? 'BUY' : 'SELL'}
        </span>
        <span
          style={{
            minWidth: 22,
            textAlign: 'center',
            padding: '1px 6px',
            borderRadius: 3,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: gc.fg,
            background: gc.bg
          }}
        >
          {grade}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          {formatDate(signalDate, 'long')}
        </span>
      </div>

      <Field label="Entry" value={fmt(entryClose)} />
      <Field label="RSI" value={fmt(rsi, 1)} />
      <Field label="Stoch %K" value={fmt(stochK, 1)} />
      <Field label="MACD" value={fmt(macd, 3)} />
      <Field label="MA pos" value={maPosition ?? '—'} color={maColor} />

      <div
        style={{
          marginTop: 6,
          paddingTop: 6,
          borderTop: '1px solid var(--color-border-subtle)'
        }}
      >
        <Field
          label="Stoch cross"
          value={`${formatDate(stochCrossDate, 'short')} · ${daysBetween}d`}
        />
        <Field label="Nearest report" value={nearestStr} />
      </div>
    </div>
  )
}
