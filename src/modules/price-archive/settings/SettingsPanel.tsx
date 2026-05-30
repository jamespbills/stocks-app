import { useState, type CSSProperties, type ReactElement } from 'react'
import type { ArchiveSettings } from '../types'
import { saveSettings } from '../adapters/settings'

// Integer knobs (mono input + steppers). isa_history_start is handled separately (date).
const NUMBER_FIELDS: {
  key: keyof Omit<ArchiveSettings, 'isaHistoryStart'>
  label: string
  helper: string
}[] = [
  {
    key: 'playLeadDays',
    label: 'Play lead days',
    helper: 'Days of history fetched before a ticker’s first qualifying release.'
  },
  {
    key: 'playTrailDays',
    label: 'Play trail days',
    helper: 'Days kept after the last qualifying release (456 ≈ 15 months).'
  },
  {
    key: 'staleAfterDays',
    label: 'Stale after (days)',
    helper: 'An ongoing ticker unrefreshed for longer than this is flagged stale.'
  },
  {
    key: 'manualWatchLookbackDays',
    label: 'Manual-watch lookback (days)',
    helper: 'Fallback start window for a manually-watched ticker that was never a play.'
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
  onChange
}: {
  value: number
  was: number
  dirty: boolean
  onChange: (n: number) => void
}): ReactElement {
  const bump = (delta: number): void => onChange(Math.max(0, value + delta))
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 6 }}>
        <input
          type="text"
          inputMode="numeric"
          value={String(value)}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/\D/g, ''))
            onChange(Number.isFinite(n) ? n : 0)
          }}
          style={{
            ...inputBase,
            width: 120,
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
  initial: ArchiveSettings
  onSaved: () => void
}

export function SettingsPanel({ initial, onSaved }: Props): ReactElement {
  // `saved` is the baseline for dirty comparison; updated on a successful save so we
  // never depend on the prop refreshing after mount (see tasks/lessons.md).
  const [saved, setSaved] = useState<ArchiveSettings>(initial)
  const [edited, setEdited] = useState<ArchiveSettings>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setField = <K extends keyof ArchiveSettings>(key: K, value: ArchiveSettings[K]): void => {
    setEdited((prev) => ({ ...prev, [key]: value }))
    setError(null)
  }

  const dirtyKeys = (Object.keys(edited) as (keyof ArchiveSettings)[]).filter(
    (k) => edited[k] !== saved[k]
  )
  const dirtyCount = dirtyKeys.length

  const handleSave = async (): Promise<void> => {
    if (dirtyCount === 0 || saving) return
    setSaving(true)
    try {
      await saveSettings(edited)
      setSaved(edited)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const isaDirty = edited.isaHistoryStart !== saved.isaHistoryStart

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <div style={{ maxWidth: 540, padding: 'var(--space-6) var(--space-5)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {NUMBER_FIELDS.map((f) => (
            <div key={f.key}>
              <span style={labelStyle}>{f.label}</span>
              <p style={helperStyle}>{f.helper}</p>
              <div style={{ marginTop: 8 }}>
                <NumberField
                  value={edited[f.key]}
                  was={saved[f.key]}
                  dirty={edited[f.key] !== saved[f.key]}
                  onChange={(n) => setField(f.key, n)}
                />
              </div>
            </div>
          ))}

          {/* ISA history start — date, no stepper */}
          <div>
            <span style={labelStyle}>ISA history start</span>
            <p style={helperStyle}>
              Earliest date archived for ISA-held tickers (the ISA opened July 2016).
            </p>
            <div style={{ marginTop: 8 }}>
              <input
                type="date"
                value={edited.isaHistoryStart}
                onChange={(e) => setField('isaHistoryStart', e.target.value)}
                style={{
                  ...inputBase,
                  width: 170,
                  borderColor: isaDirty ? 'var(--color-warning)' : 'var(--color-border-strong)'
                }}
              />
              {isaDirty && (
                <div style={dirtyCaptionStyle}>unsaved · was {saved.isaHistoryStart}</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 'var(--space-6)',
            paddingTop: 'var(--space-4)',
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
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <span
            style={{
              fontSize: 11.5,
              color: dirtyCount > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)'
            }}
          >
            {error
              ? error
              : dirtyCount > 0
                ? `${dirtyCount} unsaved field${dirtyCount === 1 ? '' : 's'} · applies to the next archive build.`
                : 'Changes apply to the next archive build.'}
          </span>
        </div>
      </div>
    </div>
  )
}
