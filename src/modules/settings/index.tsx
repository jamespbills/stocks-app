import { useState, useEffect, type ReactElement } from 'react'

const ZOOM_STEP = 0.1
const ZOOM_MIN = 0.5
const ZOOM_MAX = 2.5
const SETTING_KEY = 'display.zoom.default'

type ZoomRow = { setting_value: string | null }

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function formatPercent(factor: number): string {
  return `${Math.round(factor * 100)}%`
}

export default function Settings(): ReactElement {
  const [zoom, setZoom] = useState<number>(() => window.electronAPI.zoom.getZoomFactor())
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void window.electronAPI.db
      .query(`SELECT setting_value FROM app_settings WHERE setting_key = ?`, [SETTING_KEY])
      .then((rows) => {
        const row = (rows as ZoomRow[])[0]
        if (row?.setting_value != null) {
          const factor = parseFloat(row.setting_value)
          if (!isNaN(factor) && factor >= ZOOM_MIN && factor <= ZOOM_MAX) {
            setZoom(factor)
            window.electronAPI.zoom.setZoomFactor(factor)
          }
        } else {
          setZoom(window.electronAPI.zoom.getZoomFactor())
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function step(delta: number): void {
    const next = clamp(parseFloat((zoom + delta).toFixed(1)), ZOOM_MIN, ZOOM_MAX)
    setZoom(next)
    window.electronAPI.zoom.setZoomFactor(next)
    setSaved(false)
  }

  function saveDefault(): void {
    void window.electronAPI.db
      .query(
        `INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [SETTING_KEY, zoom.toString()]
      )
      .then(() => {
        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
      })
  }

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ padding: 'var(--space-6)', color: 'var(--color-text-primary)' }}
    >
      <h1
        style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 600,
          marginBottom: 'var(--space-6)',
          color: 'var(--color-text-primary)'
        }}
      >
        Settings
      </h1>

      <section>
        <div
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--space-4)'
          }}
        >
          Display
        </div>

        <div
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)'
          }}
        >
          <div
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-3)'
            }}
          >
            Default Zoom
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => step(-ZOOM_STEP)}
              disabled={loading || zoom <= ZOOM_MIN}
              style={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-default)',
                background: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 16,
                cursor: zoom <= ZOOM_MIN || loading ? 'not-allowed' : 'pointer',
                opacity: zoom <= ZOOM_MIN || loading ? 0.4 : 1,
                flexShrink: 0
              }}
            >
              −
            </button>

            <span
              style={{
                width: 52,
                textAlign: 'center',
                fontSize: 'var(--text-lg)',
                fontWeight: 500,
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--color-text-primary)'
              }}
            >
              {loading ? '—' : formatPercent(zoom)}
            </span>

            <button
              onClick={() => step(ZOOM_STEP)}
              disabled={loading || zoom >= ZOOM_MAX}
              style={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-default)',
                background: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 16,
                cursor: zoom >= ZOOM_MAX || loading ? 'not-allowed' : 'pointer',
                opacity: zoom >= ZOOM_MAX || loading ? 0.4 : 1,
                flexShrink: 0
              }}
            >
              +
            </button>

            <button
              onClick={saveDefault}
              disabled={loading || saved}
              style={{
                marginLeft: 'var(--space-2)',
                padding: '4px var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-default)',
                background: saved ? 'var(--color-interactive-active)' : 'var(--color-bg-surface)',
                color: saved
                  ? 'var(--color-interactive-text-active)'
                  : 'var(--color-text-secondary)',
                fontSize: 'var(--text-sm)',
                cursor: loading || saved ? 'default' : 'pointer',
                transition: 'background 150ms, color 150ms'
              }}
            >
              {saved ? 'Saved ✓' : 'Save as default'}
            </button>
          </div>

          <div
            style={{
              marginTop: 'var(--space-3)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)'
            }}
          >
            Applied on next launch. Use Ctrl+= / Ctrl+− to adjust live, Ctrl+0 to reset to 100%.
          </div>
        </div>
      </section>
    </div>
  )
}
