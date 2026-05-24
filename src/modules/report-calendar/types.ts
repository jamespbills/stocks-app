export type EntryStatus = 'released' | 'overdue' | 'amber' | 'expected'

export interface CalendarRow {
  ticker: string
  company: string
  relevant_date: string | Date | null
  days_to_go: number | null
  is_already_reviewed: number
  is_past_grace_period: number
  meets_play_filter: number
  calendar_status: string
  urgency: string
  r_financial_year: string | null
  r_filing_identifier: string | null
  next_expected_filing: string | null
  estimated_release_date: string | null
  best_api_date: string | null
  r_play: number | null
  r_play_2: number | null
  p_play: number | null
  p_play_2: number | null
  has_override: number
  override_reason: string | null
}

export interface CalendarEntry {
  ticker: string
  company: string
  date: string
  period: string
  status: EntryStatus
  days_to_go: number
  r_play: number | null
  r_play_2: number | null
  hasOverride: boolean
  overrideReason: string | null
}

export interface CalendarCell {
  date: string
  d: number
  inMonth: boolean
  dow: number
  isToday: boolean
}

export type PopoverState =
  | null
  | { kind: 'entry'; date: string; ticker: string }
  | { kind: 'day'; date: string }

function toDateStr(val: string | Date): string {
  if (val instanceof Date) {
    return `${val.getFullYear()}-${String(val.getMonth() + 1).padStart(2, '0')}-${String(val.getDate()).padStart(2, '0')}`
  }
  return val
}

export function rowToEntry(row: CalendarRow): CalendarEntry | null {
  if (!row.relevant_date) return null
  const dateStr = toDateStr(row.relevant_date)
  const dtg = row.days_to_go ?? 0
  let status: EntryStatus
  if (row.is_already_reviewed) {
    status = 'released'
  } else if (dtg < 0) {
    status = 'overdue'
  } else if (dtg <= 13) {
    status = 'amber'
  } else {
    status = 'expected'
  }
  const filing = row.next_expected_filing
  const period = filing === 'A' ? 'FY' : filing === 'H' ? 'H' : '?'
  return {
    ticker: row.ticker,
    company: row.company,
    date: dateStr,
    period,
    status,
    days_to_go: dtg,
    r_play: row.r_play,
    r_play_2: row.r_play_2,
    hasOverride: row.has_override === 1,
    overrideReason: row.override_reason ?? null
  }
}

export function buildMonthGrid(y: number, m: number): CalendarCell[] {
  const today = new Date()
  const first = new Date(y, m, 1)
  const firstDow = (first.getDay() + 6) % 7
  const start = new Date(y, m, 1 - firstDow)
  const cells: CalendarCell[] = []

  for (let i = 0; i < 35; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    cells.push({
      date: dateStr,
      d: d.getDate(),
      inMonth: d.getMonth() === m,
      dow: (d.getDay() + 6) % 7,
      isToday:
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
    })
  }

  // Extend to 6 rows if the month spans them
  const lastOfMonth = new Date(y, m + 1, 0)
  if (cells[34].inMonth && cells[34].d < lastOfMonth.getDate()) {
    for (let i = 0; i < 7; i++) {
      const prev = new Date(cells[34].date)
      prev.setDate(prev.getDate() + 1 + i)
      const dateStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`
      cells.push({
        date: dateStr,
        d: prev.getDate(),
        inMonth: prev.getMonth() === m,
        dow: (prev.getDay() + 6) % 7,
        isToday:
          prev.getFullYear() === today.getFullYear() &&
          prev.getMonth() === today.getMonth() &&
          prev.getDate() === today.getDate()
      })
    }
  }

  return cells
}

// Quarter/half-year end dates: [month (0-indexed), day, label]
export const PERIOD_ENDS: Array<{ month: number; day: number; label: string }> = [
  { month: 2, day: 31, label: 'Q1 end' },
  { month: 5, day: 30, label: 'H1 end' },
  { month: 8, day: 30, label: 'Q3 end' },
  { month: 11, day: 31, label: 'FY end' }
]
