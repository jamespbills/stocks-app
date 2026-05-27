import type { ReactElement } from 'react'
import type { SectorGroup } from './types'
import { MatrixColumnHeaders } from './MatrixColumnHeaders'
import { CriterionRow } from './CriterionRow'

interface SectorRowProps {
  group: SectorGroup
  selectedCombo: string | null
  onToggleExpand: () => void
  onComboClick: (criterionCode: number) => void
  onComboToggle: (criterionCode: number) => void
}

export function SectorRow({
  group,
  selectedCombo,
  onToggleExpand,
  onComboClick,
  onComboToggle
}: SectorRowProps): ReactElement {
  const activeCount = group.combos.filter((c) => c.isActive || c.pendingActive === true).length
  const trackedCount = group.combos.length
  const hasData = trackedCount > 0

  return (
    <div>
      {/* Sector header row */}
      <div
        onClick={onToggleExpand}
        style={{
          height: 38,
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--space-5) 0 var(--space-3)',
          background: 'var(--color-bg-surface)',
          borderBottom: '1px solid var(--color-border-default)',
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg-elevated)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg-surface)'
        }}
      >
        {/* Chevron */}
        <span
          style={{
            display: 'inline-block',
            width: 18,
            fontSize: 10,
            color: 'var(--color-text-muted)',
            transform: group.isExpanded ? 'rotate(90deg)' : 'none',
            transition: 'transform var(--transition-fast)',
            flexShrink: 0
          }}
        >
          ▶
        </span>

        {/* Sector name */}
        <span
          style={{
            flex: 1,
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--color-text-primary)'
          }}
        >
          {group.sector}
        </span>

        {/* Right: counts + bar indicator OR no-data chip */}
        {!hasData ? (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10.5,
              color: 'var(--color-text-muted)',
              background: 'var(--color-interactive-hover)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-xs)'
            }}
          >
            no data yet
          </span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11.5,
                color: activeCount > 0 ? 'var(--color-up)' : 'var(--color-text-muted)'
              }}
            >
              {activeCount} active
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11.5,
                color: 'var(--color-text-muted)'
              }}
            >
              · {trackedCount} tracked
            </span>

            {/* Small bar indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {group.combos.map((combo) => {
                const isOn = combo.isActive || combo.pendingActive === true
                return (
                  <span
                    key={combo.criterionCode}
                    style={{
                      display: 'inline-block',
                      width: 6,
                      height: 6,
                      borderRadius: 1,
                      background: isOn ? 'var(--color-up)' : 'transparent',
                      border: isOn ? 'none' : '1px solid var(--color-border-strong)'
                    }}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Expanded content */}
      {group.isExpanded && (
        <div>
          {trackedCount === 0 ? (
            <div
              style={{
                padding: 'var(--space-4) var(--space-5) var(--space-4) 48px',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-muted)',
                borderBottom: '1px solid var(--color-border-subtle)'
              }}
            >
              No data yet for this sector.
            </div>
          ) : (
            <>
              <MatrixColumnHeaders />
              {group.combos.map((combo) => {
                const key = `${combo.sector}:${combo.criterionCode}`
                return (
                  <CriterionRow
                    key={key}
                    row={combo}
                    selected={selectedCombo === key}
                    onClick={() => onComboClick(combo.criterionCode)}
                    onToggle={() => onComboToggle(combo.criterionCode)}
                  />
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
