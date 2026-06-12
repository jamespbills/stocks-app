import type { ReactElement } from 'react'
import type { ThemeRow } from '../types'

// Sign-polarity colours per the locked map + the Library's warning badge: warning lessons
// read down/red, encouraging read up/green. Our signals are single-polarity, so the
// wireframe's within-theme split adapts to one polarity-coloured reach bar per theme.
const POLARITY_COLOR: Record<ThemeRow['polarity'], string> = {
  warning: 'var(--color-down)',
  encouraging: 'var(--color-up)'
}

/** The Theme tracker: each signal page's current flag reach across the brain. */
export function ThemeTracker({
  themes,
  onOpenReader
}: {
  themes: ThemeRow[]
  onOpenReader: (relPath: string) => void
}): ReactElement {
  const max = Math.max(1, ...themes.map((t) => t.flagCount))

  if (themes.length === 0) {
    return (
      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
        No signal pages in the brain yet.
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {themes.map((t) => {
        const quiet = t.flagCount === 0
        return (
          <button
            key={t.slug}
            onClick={() => onOpenReader(t.relPath)}
            style={{
              display: 'block',
              width: '100%',
              padding: 0,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, marginBottom: 4 }}>
              <span
                style={{
                  color: quiet ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0
                }}
              >
                {t.name}
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  paddingLeft: 10,
                  flexShrink: 0,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {t.flagCount > 0 && t.liveCount > 0 ? (
                  <>
                    <span style={{ color: POLARITY_COLOR[t.polarity] }}>{t.flagCount}</span>
                    {' · '}
                    {t.liveCount} live
                  </>
                ) : (
                  t.flagCount
                )}
              </span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 3,
                overflow: 'hidden',
                background: 'var(--color-bg-base)'
              }}
            >
              <span
                style={{
                  display: 'block',
                  height: '100%',
                  width: `${(t.flagCount / max) * 100}%`,
                  background: POLARITY_COLOR[t.polarity],
                  opacity: 0.7
                }}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}
