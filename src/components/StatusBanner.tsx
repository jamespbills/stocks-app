import type { ReactElement } from 'react'

interface StatusBannerProps {
  message: string
  detail?: string
  cta?: { label: string; onClick: () => void }
  onDismiss: () => void
}

export function StatusBanner({ message, detail, cta, onDismiss }: StatusBannerProps): ReactElement {
  return (
    <div
      style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 20px',
        background: 'var(--color-warning-bg)',
        borderBottom: '1px solid var(--color-border-subtle)',
        color: 'var(--color-warning)',
        fontSize: 12.5
      }}
    >
      <svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span style={{ color: 'var(--color-text-primary)' }}>{message}</span>
      {detail && <span style={{ color: 'var(--color-text-muted)' }}>{detail}</span>}
      {cta && (
        <button
          onClick={cta.onClick}
          style={{
            marginLeft: 8,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'var(--color-warning)',
            fontWeight: 500,
            fontSize: 12.5,
            textDecoration: 'underline',
            textUnderlineOffset: 3,
            fontFamily: 'inherit'
          }}
        >
          {cta.label}
        </button>
      )}
      <button
        onClick={onDismiss}
        style={{
          marginLeft: 'auto',
          background: 'none',
          border: 'none',
          padding: 4,
          cursor: 'pointer',
          color: 'var(--color-text-muted)',
          display: 'flex',
          alignItems: 'center'
        }}
        aria-label="Dismiss"
      >
        <svg
          width={13}
          height={13}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
