// Pure join for the Ticker Gate: numeric qualifiers ⋈ brain ticker pages ⋈ market stats.
//
// Matched on the EXACT full ticker (`tickerKey` — uppercased, suffix preserved), never on a
// suffix-stripped base. The engine (`dim_companies.ticker`) and the brain (`ticker`
// frontmatter) both carry the exchange suffix (`SPSY.L`, `YELP`), so a UK listing (`ABC.L`)
// and a US one (`ABC`) stay distinct and can never be conflated. A convention mismatch would
// surface as a missed match (safe, visible) — never as a wrong match.
//
// The decoupling lock lives here: each GateRow carries `numeric` and `brain` as SEPARATE
// objects. There is deliberately no combined/weighted field — the engine says it qualifies;
// the brain says yes/no/watch; the two are never merged.

import { formatDate } from '../../../lib/format'
import type { PlayThresholds } from '../../../lib/playThresholds'
import { effectiveGate, tickerKey } from '../ticker'
import type { GateRow, MarketStats, ReviewEntry, Sign } from '../types'
import type { QualifierRow } from './queries'

function intOrNull(v: number | string | null): number | null {
  if (v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n) : null
}

// Mirrors view_play_universe's qualification rule (kept identical to ta-charts).
function qualifies(
  play: number | null,
  play2: number | null,
  playRating: number | null,
  play2Rating: number | null,
  t: PlayThresholds
): boolean {
  return (
    play === t.play.maxScore ||
    play2 === t.play_2.maxScore ||
    (play === t.play.nearMiss && playRating === 1) ||
    (play2 === t.play_2.nearMiss && play2Rating === 1)
  )
}

interface CoercedReport {
  iso: string
  play: number | null
  play2: number | null
  playSectorRating: number | null
  play2SectorRating: number | null
  company: string | null
  sector: string | null
  ticker: string
}

/**
 * Build the gate rows. Qualifier reports are grouped by full ticker key (headline =
 * most-recent); the union with brain ticker pages includes orphans (a brain page that isn't
 * currently qualifying, e.g. NXT) and coverage gaps (a qualifier with no brain page yet).
 */
export function buildGateRows(
  qualifiers: QualifierRow[],
  brainTickers: ReviewEntry[],
  marketByKey: Map<string, MarketStats>,
  thresholds: PlayThresholds
): GateRow[] {
  // Group qualifier reports by full ticker key.
  const numericByKey = new Map<string, CoercedReport[]>()
  for (const r of qualifiers) {
    const key = tickerKey(r.ticker)
    if (key === '') continue
    const coerced: CoercedReport = {
      iso: formatDate(r.date_released, 'iso', ''),
      play: intOrNull(r.play),
      play2: intOrNull(r.play_2),
      playSectorRating: intOrNull(r.play_sector_rating),
      play2SectorRating: intOrNull(r.play_2_sector_rating),
      company: r.company,
      sector: r.sector,
      ticker: r.ticker
    }
    const list = numericByKey.get(key)
    if (list) list.push(coerced)
    else numericByKey.set(key, [coerced])
  }

  // Index brain ticker pages by full ticker key (from the page's `ticker` frontmatter).
  const brainByKey = new Map<string, ReviewEntry>()
  for (const e of brainTickers) {
    if (e.pageType !== 'ticker') continue
    const token = e.frontmatter.ticker ?? e.ticker?.canonical ?? ''
    const key = tickerKey(token)
    if (key !== '' && !brainByKey.has(key)) brainByKey.set(key, e)
  }

  const rows: GateRow[] = []
  for (const key of new Set([...numericByKey.keys(), ...brainByKey.keys()])) {
    const reports = numericByKey.get(key)
    const entry = brainByKey.get(key)

    const sortedReports = reports?.slice().sort((a, b) => b.iso.localeCompare(a.iso))
    const head = sortedReports?.[0]

    let numeric: GateRow['numeric'] = null
    if (head && reports) {
      numeric = {
        qualifies: qualifies(
          head.play,
          head.play2,
          head.playSectorRating,
          head.play2SectorRating,
          thresholds
        ),
        play: head.play,
        play2: head.play2,
        playSectorRating: head.playSectorRating,
        play2SectorRating: head.play2SectorRating,
        reportDate: head.iso !== '' ? head.iso : null,
        reportCount: reports.length
      }
    }

    let brain: GateRow['brain'] = null
    if (entry) {
      brain = {
        relPath: entry.relPath,
        gate: effectiveGate(entry.frontmatter),
        gateSummary: entry.frontmatter.gate_summary ?? null,
        signs: (entry.frontmatter.signs as Sign[] | undefined) ?? [],
        sources: entry.frontmatter.sources ?? [],
        conviction: intOrNull(entry.frontmatter.conviction ?? null),
        riskRating: entry.frontmatter.risk_rating ?? null,
        authoredDate: entry.frontmatter.last_updated ?? entry.frontmatter.review_date ?? null
      }
    }

    const ticker = head?.ticker ?? entry?.frontmatter.ticker ?? entry?.ticker?.canonical ?? key
    const company = head?.company ?? entry?.frontmatter.company ?? null
    const sector = head?.sector ?? entry?.frontmatter.sector ?? null

    rows.push({
      ticker,
      company,
      sector,
      numeric,
      brain,
      market: marketByKey.get(key) ?? null
    })
  }

  // Qualifiers first, then orphans; alphabetical within each group.
  return rows.sort((a, b) => {
    const aq = a.numeric ? 0 : 1
    const bq = b.numeric ? 0 : 1
    if (aq !== bq) return aq - bq
    return a.ticker.localeCompare(b.ticker)
  })
}
