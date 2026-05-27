import type { ReactElement } from 'react'
import type { SectorGroup } from './types'
import { SectorRow } from './SectorRow'

interface SectorMatrixProps {
  groups: SectorGroup[]
  selectedCombo: { sector: string; criterionCode: number } | null
  onToggleExpand: (sector: string) => void
  onComboClick: (sector: string, criterionCode: number) => void
  onComboToggle: (sector: string, criterionCode: number) => void
}

export function SectorMatrix({
  groups,
  selectedCombo,
  onToggleExpand,
  onComboClick,
  onComboToggle
}: SectorMatrixProps): ReactElement {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
      {groups.map((group) => {
        const selectedKey =
          selectedCombo && selectedCombo.sector === group.sector
            ? `${selectedCombo.sector}:${selectedCombo.criterionCode}`
            : null

        return (
          <SectorRow
            key={group.sector}
            group={group}
            selectedCombo={selectedKey}
            onToggleExpand={() => onToggleExpand(group.sector)}
            onComboClick={(criterionCode) => onComboClick(group.sector, criterionCode)}
            onComboToggle={(criterionCode) => onComboToggle(group.sector, criterionCode)}
          />
        )
      })}
    </div>
  )
}
