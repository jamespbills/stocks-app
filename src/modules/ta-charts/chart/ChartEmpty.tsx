import type { ReactElement } from 'react'

// Shown when the archive holds no bars for the selected ticker. TA never fetches
// — the only remedy is to build coverage in the Price Archive, so we deep-link
// there rather than offering a fetch button.

interface Props {
  ticker: string
  onOpenArchive: () => void
}

export function ChartEmpty({ ticker, onOpenArchive }: Props): ReactElement {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        color: 'var(--color-text-muted)'
      }}
    >
      <div style={{ fontSize: 13.5, color: 'var(--color-text-secondary)' }}>
        No price coverage for{' '}
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
          {ticker}
        </span>
      </div>
      <button
        type="button"
        onClick={onOpenArchive}
        style={{
          padding: '7px 16px',
          height: 32,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-strong)',
          background: 'var(--color-interactive-active)',
          color: 'var(--color-text-primary)',
          fontSize: 12.5,
          fontWeight: 'var(--font-medium)',
          cursor: 'pointer'
        }}
      >
        Open Price Archive
      </button>
    </div>
  )
}
