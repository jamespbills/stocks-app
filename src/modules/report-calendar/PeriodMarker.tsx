import type { ReactElement } from 'react'

interface PeriodMarkerProps {
  label: string
  colIdx: number
}

export function PeriodMarker({ label, colIdx }: PeriodMarkerProps): ReactElement {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${((colIdx + 1) * 100) / 7}%`,
        top: 0,
        bottom: 0,
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 4,
          bottom: 4,
          width: 1,
          background: 'var(--color-chart-date-line)',
          transform: 'translateX(-50%)',
          opacity: 0.6
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 8,
          background: 'var(--color-bg-base)',
          border: '1px solid var(--color-chart-date-line)',
          color: 'var(--color-chart-date-line)',
          padding: '1px 6px',
          borderRadius: 3,
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
          whiteSpace: 'nowrap',
          letterSpacing: 0.3
        }}
      >
        {label}
      </div>
    </div>
  )
}
