// Shared formatters for dates and percentages.
// mysql2 returns DATE columns as JS Date objects at runtime (see tasks/lessons.md);
// every helper here normalises Date | string | null | undefined through toDate().

type DateInput = Date | string | null | undefined

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined) return null
  const d = value instanceof Date ? value : new Date(value)
  return isNaN(d.getTime()) ? null : d
}

export type DateStyle = 'long' | 'short' | 'iso'

export function formatDate(value: DateInput, style: DateStyle = 'long', fallback = '—'): string {
  const d = toDate(value)
  if (!d) return fallback
  switch (style) {
    case 'iso':
      return d.toISOString().slice(0, 10)
    case 'short':
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    case 'long':
    default:
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }
}

export interface PercentOptions {
  digits?: number
  signed?: boolean
  fallback?: string
}

export function formatPercent(
  value: number | null | undefined,
  options: PercentOptions = {}
): string {
  const { digits = 1, signed = false, fallback = '—' } = options
  if (value === null || value === undefined) return fallback
  const pct = value * 100
  const sign = signed && pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(digits)}%`
}
