import { formatDate } from '../../../lib/format'
import { DEFAULT_THRESHOLDS, type PlayThresholds } from '../../../lib/playThresholds'
import { REPORTS_FOR_TICKER_SQL } from '../queries'
import type { ReportMarker } from '../types'

// Play codes / sector ratings arrive as DECIMAL strings from mysql2 (lessons.md).
interface RawReportRow {
  report_date: Date | string | null
  date_released: Date | string | null
  financial_year: number | string | null
  filing_identifier: string | null
  play: number | string | null
  play_2: number | string | null
  play_sector_rating: number | string | null
  play_2_sector_rating: number | string | null
}

function intOrNull(v: number | string | null): number | null {
  if (v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n) : null
}

// Mirrors view_play_universe's qualification: which reports put a ticker in the
// play universe. Drives the solid-vs-dimmed marker treatment.
function qualifies(
  play: number | null,
  play2: number | null,
  playRating: number | null,
  play2Rating: number | null,
  thresholds: PlayThresholds
): boolean {
  return (
    play === thresholds.play.maxScore ||
    play2 === thresholds.play_2.maxScore ||
    (play === thresholds.play.nearMiss && playRating === 1) ||
    (play2 === thresholds.play_2.nearMiss && play2Rating === 1)
  )
}

// Every report for a ticker (qualifying or not), normalised for the overlay.
// Rows with no release date are dropped — they have no x-anchor on the chart.
export async function fetchReports(
  ticker: string,
  thresholds: PlayThresholds = DEFAULT_THRESHOLDS
): Promise<ReportMarker[]> {
  const rows = (await window.electronAPI.db.query(REPORTS_FOR_TICKER_SQL, [
    ticker
  ])) as RawReportRow[]
  return rows
    .map((r) => {
      const play = intOrNull(r.play)
      const play2 = intOrNull(r.play_2)
      const playSectorRating = intOrNull(r.play_sector_rating)
      const play2SectorRating = intOrNull(r.play_2_sector_rating)
      return {
        dateReleased: formatDate(r.date_released, 'iso', ''),
        reportDate: formatDate(r.report_date, 'iso', '') || null,
        financialYear: intOrNull(r.financial_year),
        filingIdentifier: r.filing_identifier ?? null,
        play,
        play2,
        playSectorRating,
        play2SectorRating,
        qualifies: qualifies(play, play2, playSectorRating, play2SectorRating, thresholds)
      }
    })
    .filter((m) => m.dateReleased !== '')
}
