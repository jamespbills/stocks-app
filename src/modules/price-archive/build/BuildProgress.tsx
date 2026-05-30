import { useEffect, useRef, type CSSProperties, type ReactElement } from 'react'
import type { BuildLogLine, BuildState } from '../adapters/build'

const GLYPH: Record<BuildLogLine['kind'], { glyph: string; color: string }> = {
  ok: { glyph: '✓', color: 'var(--color-terminal-exit-ok)' },
  skip: { glyph: '•', color: 'var(--color-text-muted)' },
  fail: { glyph: '✗', color: 'var(--color-terminal-exit-err)' },
  log: { glyph: ' ', color: 'var(--color-terminal-text)' },
  stderr: { glyph: '!', color: 'var(--color-terminal-stderr)' }
}

const dangerButtonStyle: CSSProperties = {
  padding: '5px 14px',
  height: 30,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-danger)',
  background: 'var(--color-danger-bg)',
  color: 'var(--color-danger)',
  fontSize: 12,
  fontWeight: 'var(--font-medium)',
  cursor: 'pointer'
}

const closeButtonStyle: CSSProperties = {
  padding: '5px 14px',
  height: 30,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-strong)',
  background: 'transparent',
  color: 'var(--color-text-primary)',
  fontSize: 12,
  cursor: 'pointer'
}

interface Props {
  state: BuildState
  onStop: () => void
  onClose: () => void
}

export function BuildProgress({ state, onStop, onClose }: Props): ReactElement {
  const logRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [state.log])

  const running = state.phase === 'running'
  const { progress, summary } = state
  const pct =
    progress && progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div
      style={{
        width: 420,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg-elevated)',
        borderLeft: '1px solid var(--color-border-default)'
      }}
    >
      <style>{`@keyframes paCursorBlink{0%,50%{opacity:1}50.01%,100%{opacity:0}}`}</style>

      {/* Header */}
      <div
        style={{
          height: 'var(--topbar-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--space-4)',
          borderBottom: '1px solid var(--color-border-default)',
          flexShrink: 0
        }}
      >
        <span style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-primary)' }}>
          {running
            ? 'Building archive…'
            : state.phase === 'failed'
              ? 'Build failed'
              : 'Build complete'}
        </span>
        {progress && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11.5,
              color: 'var(--color-text-muted)'
            }}
          >
            {progress.current} / {progress.total}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ padding: 'var(--space-3) var(--space-4) 0' }}>
        <div
          style={{
            height: 4,
            borderRadius: 2,
            background: 'var(--color-interactive-active)',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: state.phase === 'failed' ? 'var(--color-danger)' : 'var(--color-up)',
              transition: 'width var(--transition-default)'
            }}
          />
        </div>
        {progress?.ticker && running && (
          <div
            style={{
              marginTop: 6,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text-muted)'
            }}
          >
            fetching {progress.ticker}…
          </div>
        )}
      </div>

      {/* Terminal log */}
      <div
        ref={logRef}
        style={{
          flex: 1,
          minHeight: 0,
          margin: 'var(--space-3) var(--space-4)',
          overflowY: 'auto',
          background: 'var(--color-terminal-bg)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: 10,
          fontFamily: 'var(--font-mono)',
          fontSize: 11.5,
          lineHeight: 1.6
        }}
      >
        {state.log.length === 0 ? (
          <span style={{ color: 'var(--color-text-muted)' }}>Starting…</span>
        ) : (
          state.log.map((line, i) => {
            const meta = GLYPH[line.kind]
            return (
              <div
                key={i}
                style={{ color: meta.color, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                <span style={{ display: 'inline-block', width: 14 }}>{meta.glyph}</span>
                {line.text}
              </div>
            )
          })
        )}
        {running && (
          <span
            style={{
              color: 'var(--color-terminal-text)',
              animation: 'paCursorBlink 1s step-end infinite'
            }}
          >
            ▋
          </span>
        )}
      </div>

      {/* Summary + footer */}
      {summary && (
        <div
          style={{
            padding: '0 var(--space-4) var(--space-2)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11.5,
            color: 'var(--color-text-secondary)'
          }}
        >
          {summary.tickers} tickers · {summary.ok} ok · {summary.no_data} skipped ·{' '}
          <span style={{ color: summary.failed > 0 ? 'var(--color-danger)' : 'inherit' }}>
            {summary.failed} failed
          </span>
          {summary.failed_tickers.length > 0 && (
            <div style={{ marginTop: 4, color: 'var(--color-text-muted)' }}>
              failed: {summary.failed_tickers.join(', ')}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 'var(--space-2)',
          padding: 'var(--space-3) var(--space-4)',
          borderTop: '1px solid var(--color-border-subtle)',
          flexShrink: 0
        }}
      >
        {running ? (
          <button onClick={onStop} style={dangerButtonStyle}>
            Stop
          </button>
        ) : (
          <button onClick={onClose} style={closeButtonStyle}>
            Close
          </button>
        )}
      </div>
    </div>
  )
}
