import type { Gate } from './types'

// Locked gate colour map (wireframe-decisions → Markdown Reviews):
// pass → up/green · fail → down/red · watch → warning/amber · unset → muted.
// Shared by the GateChip and the Approach-C ticker route (card edge + verdict word).
// Lives outside the component files so fast-refresh stays component-only.
export const GATE_STYLE: Record<Gate, { color: string; background: string }> = {
  pass: { color: 'var(--color-up)', background: 'var(--color-up-bg)' },
  fail: { color: 'var(--color-down)', background: 'var(--color-down-bg)' },
  watch: { color: 'var(--color-warning)', background: 'var(--color-warning-bg)' },
  unset: { color: 'var(--color-text-muted)', background: 'transparent' }
}

export type GateIconName = 'alert-triangle' | 'circle-check' | 'circle-x' | 'circle-dashed'

// Per-gate icon + tagline for the verdict hero and the gate chips (wireframe:
// the watch tagline "Hold — conditions to clear" is verbatim).
export const GATE_META: Record<Gate, { icon: GateIconName; tagline: string }> = {
  pass: { icon: 'circle-check', tagline: 'Cleared — thesis intact' },
  fail: { icon: 'circle-x', tagline: 'Rejected — thesis broken' },
  watch: { icon: 'alert-triangle', tagline: 'Hold — conditions to clear' },
  unset: { icon: 'circle-dashed', tagline: 'No judgement on file' }
}
