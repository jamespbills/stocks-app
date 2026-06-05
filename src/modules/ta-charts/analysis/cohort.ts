import { formatDate } from '../../../lib/format'
import { COHORT_SQL } from '../queries'
import type { CohortReport } from '../types'

// DATE columns arrive as JS Date from mysql2 (lessons.md) — normalised to ISO at
// this boundary. financial_year may arrive as a DECIMAL string.
interface RawCohortRow {
  ticker: string
  date_released: Date | string | null
  filing_identifier: string | null
  financial_year: number | string | null
  next_same_type_release: Date | string | null
}

function intOrNull(v: number | string | null): number | null {
  if (v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n) : null
}

// Every qualifying-play report with its holding-window upper bound. Rows with no
// release date can't anchor a trade, so they're dropped.
export async function fetchCohort(): Promise<CohortReport[]> {
  const rows = (await window.electronAPI.db.query(COHORT_SQL)) as RawCohortRow[]
  return rows
    .map((r) => ({
      ticker: r.ticker,
      dateReleased: formatDate(r.date_released, 'iso', ''),
      filingIdentifier: r.filing_identifier ?? null,
      financialYear: intOrNull(r.financial_year),
      nextSameTypeRelease: formatDate(r.next_same_type_release, 'iso', '') || null
    }))
    .filter((c) => c.dateReleased !== '')
}
