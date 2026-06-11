import type { ReactElement } from 'react'
import { CircleCheck, CircleDashed, CircleX, TriangleAlert } from 'lucide-react'
import type { GateIconName } from './gate-style'

// Gate icons come from lucide-react like every other icon in the app
// (sidebar, title bar, palette). Colour inherits via `currentColor`.
const ICONS: Record<GateIconName, typeof TriangleAlert> = {
  'alert-triangle': TriangleAlert,
  'circle-check': CircleCheck,
  'circle-x': CircleX,
  'circle-dashed': CircleDashed
}

export function GateIcon({ name, size = 14 }: { name: GateIconName; size?: number }): ReactElement {
  const Icon = ICONS[name]
  return (
    <Icon size={size} strokeWidth={2} aria-hidden style={{ flexShrink: 0, display: 'block' }} />
  )
}
