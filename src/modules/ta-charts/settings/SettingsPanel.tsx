import { useState, type CSSProperties, type ReactElement } from 'react'
import type { TaSettings } from '../types'
import { saveTaSettings } from './useTaSettings'

// The panel edits the indicator periods (Stage 1) plus the signal rules + grade
// thresholds (Stage 2). Editing any field re-derives the chart/markers instantly
// (pure-TS recompute) once saved — the calibration loop in miniature.
type NumericKey =
  | 'smaWindow'
  | 'macdFast'
  | 'macdSlow'
  | 'macdSignal'
  | 'stochK'
  | 'stochKSmooth'
  | 'stochDSmooth'
  | 'rsiPeriod'
  | 'buyStochThreshold'
  | 'sellStochThreshold'
  | 'macdLookaheadDays'
  | 'rsiAPlusBuy'
  | 'rsiABuy'
  | 'rsiBBuy'
  | 'rsiAPlusSell'
  | 'rsiASell'
  | 'rsiBSell'
  | 'buyEntryWindowDays'
  | 'chartWindowDaysAfter'

interface FieldDef {
  key: NumericKey
  label: string
  helper: string
  min?: number // default 1 (periods); thresholds allow 0
}

const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  {
    title: 'Price moving average',
    fields: [
      {
        key: 'smaWindow',
        label: 'SMA window',
        helper: 'Bars in the dashed price MA (200 = legacy default).'
      }
    ]
  },
  {
    title: 'MACD',
    fields: [
      { key: 'macdFast', label: 'Fast EMA', helper: 'Short EMA span (12).' },
      { key: 'macdSlow', label: 'Slow EMA', helper: 'Long EMA span (26).' },
      { key: 'macdSignal', label: 'Signal EMA', helper: 'EMA of the MACD line (9).' }
    ]
  },
  {
    title: 'Stochastic',
    fields: [
      { key: 'stochK', label: '%K period', helper: 'High/low channel length (14).' },
      { key: 'stochKSmooth', label: '%K smoothing', helper: 'SMA applied to fast %K (3).' },
      { key: 'stochDSmooth', label: '%D smoothing', helper: 'SMA of %K to form %D (3).' }
    ]
  },
  {
    title: 'RSI',
    fields: [{ key: 'rsiPeriod', label: 'RSI period', helper: 'Wilder smoothing length (14).' }]
  },
  {
    title: 'Signal rules',
    fields: [
      {
        key: 'buyStochThreshold',
        label: 'Buy %K below',
        helper: '%K must be under this the day before the stoch cross (20).',
        min: 0
      },
      {
        key: 'sellStochThreshold',
        label: 'Sell %K above',
        helper: '%K must be over this the day before the stoch cross (80).',
        min: 0
      },
      {
        key: 'macdLookaheadDays',
        label: 'MACD lookahead',
        helper: 'Days after the stoch cross to find the MACD cross (5).',
        min: 0
      }
    ]
  },
  {
    title: 'Grade thresholds (RSI on the cross day)',
    fields: [
      {
        key: 'rsiAPlusBuy',
        label: 'Buy A+ ≤',
        helper: 'Buy graded A+ when RSI ≤ this (30).',
        min: 0
      },
      { key: 'rsiABuy', label: 'Buy A ≤', helper: 'Else A when RSI ≤ this (40).', min: 0 },
      {
        key: 'rsiBBuy',
        label: 'Buy B ≤',
        helper: 'Else B when RSI ≤ this (50); otherwise C.',
        min: 0
      },
      {
        key: 'rsiAPlusSell',
        label: 'Sell A+ ≥',
        helper: 'Sell graded A+ when RSI ≥ this (70).',
        min: 0
      },
      { key: 'rsiASell', label: 'Sell A ≥', helper: 'Else A when RSI ≥ this (60).', min: 0 },
      {
        key: 'rsiBSell',
        label: 'Sell B ≥',
        helper: 'Else B when RSI ≥ this (50); otherwise C.',
        min: 0
      }
    ]
  },
  {
    title: 'Backtest cohort (Analysis)',
    fields: [
      {
        key: 'buyEntryWindowDays',
        label: 'Buy entry window',
        helper: 'Days after a qualifying report a buy signal can open a trade (90).'
      },
      {
        key: 'chartWindowDaysAfter',
        label: 'Holding fallback',
        helper: 'Days held when a report has no next same-type successor (365).'
      }
    ]
  }
]

const labelStyle: CSSProperties = {
  fontSize: 12.5,
  fontWeight: 'var(--font-medium)',
  color: 'var(--color-text-primary)'
}
const helperStyle: CSSProperties = {
  fontSize: 11.5,
  color: 'var(--color-text-muted)',
  lineHeight: 1.5,
  margin: '2px 0 0'
}
const inputBase: CSSProperties = {
  background: 'var(--color-bg-input)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-primary)',
  fontSize: 12.5,
  fontFamily: 'var(--font-mono)',
  padding: '5px 9px',
  height: 30,
  width: 96,
  outline: 'none',
  boxSizing: 'border-box'
}
const dirtyCaptionStyle: CSSProperties = {
  fontSize: 11,
  fontFamily: 'var(--font-mono)',
  color: 'var(--color-warning)',
  marginTop: 4
}
const stepperStyle: CSSProperties = {
  width: 22,
  height: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid var(--color-border-strong)',
  background: 'transparent',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  fontSize: 8,
  lineHeight: 1,
  padding: 0
}

function NumberField({
  value,
  was,
  dirty,
  min = 1,
  onChange
}: {
  value: number
  was: number
  dirty: boolean
  min?: number
  onChange: (n: number) => void
}): ReactElement {
  const bump = (delta: number): void => onChange(Math.max(min, value + delta))
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 6 }}>
        <input
          type="text"
          inputMode="numeric"
          value={String(value)}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/\D/g, ''))
            onChange(Number.isFinite(n) ? Math.max(min, n) : min)
          }}
          style={{
            ...inputBase,
            borderColor: dirty ? 'var(--color-warning)' : 'var(--color-border-strong)'
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <button type="button" aria-label="increment" style={stepperStyle} onClick={() => bump(1)}>
            ▲
          </button>
          <button
            type="button"
            aria-label="decrement"
            style={stepperStyle}
            onClick={() => bump(-1)}
          >
            ▼
          </button>
        </div>
      </div>
      {dirty && <div style={dirtyCaptionStyle}>unsaved · was {was}</div>}
    </div>
  )
}

interface Props {
  initial: TaSettings
  onSaved: (next: TaSettings) => void
  onClose: () => void
}

export function SettingsPanel({ initial, onSaved, onClose }: Props): ReactElement {
  // `saved` is the dirty baseline; updated on a successful save so we never
  // depend on the prop refreshing after mount (see tasks/lessons.md).
  const [saved, setSaved] = useState<TaSettings>(initial)
  const [edited, setEdited] = useState<TaSettings>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setField = (key: NumericKey, value: number): void => {
    setEdited((prev) => ({ ...prev, [key]: value }))
    setError(null)
  }

  const editableKeys = SECTIONS.flatMap((s) => s.fields.map((f) => f.key))
  const dirtyCount = editableKeys.filter((k) => edited[k] !== saved[k]).length

  const handleSave = async (): Promise<void> => {
    if (dirtyCount === 0 || saving) return
    setSaving(true)
    try {
      await saveTaSettings(edited)
      setSaved(edited)
      onSaved(edited)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        width: 340,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg-elevated)',
        borderLeft: '1px solid var(--color-border-default)'
      }}
    >
      <div
        style={{
          height: 44,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid var(--color-border-subtle)'
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 'var(--font-medium)',
            color: 'var(--color-text-primary)'
          }}
        >
          Indicator settings
        </span>
        <button
          type="button"
          aria-label="Close settings"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
            padding: 4
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <div
                style={{
                  fontSize: 10.5,
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: 'var(--color-text-muted)',
                  marginBottom: 10
                }}
              >
                {section.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {section.fields.map((f) => (
                  <div key={f.key}>
                    <span style={labelStyle}>{f.label}</span>
                    <p style={helperStyle}>{f.helper}</p>
                    <div style={{ marginTop: 8 }}>
                      <NumberField
                        value={edited[f.key]}
                        was={saved[f.key]}
                        dirty={edited[f.key] !== saved[f.key]}
                        min={f.min ?? 1}
                        onChange={(n) => setField(f.key, n)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: '12px 16px',
          borderTop: '1px solid var(--color-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)'
        }}
      >
        <button
          onClick={() => void handleSave()}
          disabled={dirtyCount === 0 || saving}
          style={{
            padding: '6px 16px',
            height: 32,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-focus)',
            background: 'var(--color-interactive-active)',
            color: 'var(--color-text-primary)',
            fontSize: 12.5,
            fontWeight: 'var(--font-medium)',
            cursor: dirtyCount === 0 || saving ? 'not-allowed' : 'pointer',
            opacity: dirtyCount === 0 || saving ? 0.5 : 1
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <span
          style={{
            fontSize: 11.5,
            color: error
              ? 'var(--color-down)'
              : dirtyCount > 0
                ? 'var(--color-warning)'
                : 'var(--color-text-muted)'
          }}
        >
          {error ? error : dirtyCount > 0 ? `${dirtyCount} unsaved` : 'Re-derives the chart live'}
        </span>
      </div>
    </div>
  )
}
