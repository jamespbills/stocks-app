// Pure Dashboards builders: the GateRow universe → Coverage rows, the Gate board, and the
// Theme tracker. No fs, no IPC, no SQL — runs in Vitest on fixtures and in the renderer on
// the same data the Reviews and Library tabs already fetch.
//
// Decoupling locks honoured here:
// - Coverage STATUS derives from presence + date comparison ONLY (is there a brain page;
//   did a qualifying report land after the judgement was authored). Play scores and gate
//   verdicts pass through as separately-sourced fields — nothing is combined or weighted.
// - Staleness is report-driven (James, 2026-06-12): `authoredDate < reportDate`. When
//   either date is missing the row is NOT stale — a missed flag is safer than a wrong one,
//   per the module's matching principle.
// - Themes reuse the Library's flag derivation (`buildSignalCards`), so flag membership is
//   brain-sourced and `live` records engine PRESENCE only.

import type {
  CoverageRow,
  CoverageStatus,
  Gate,
  GateBoardColumn,
  GateRow,
  SignalCardModel,
  ThemeRow
} from '../types'

// Attention-first (locked 2026-06-12): the daily answer — what hasn't my judgement caught
// up with? — sorts to the top.
const STATUS_ORDER: Record<CoverageStatus, number> = {
  'needs-review': 0,
  stale: 1,
  'up-to-date': 2,
  unmatched: 3
}

/** Date-part ISO comparison; false unless BOTH dates are present (never stale on a guess). */
function authoredBeforeReport(authored: string | null, report: string | null): boolean {
  if (authored === null || report === null) return false
  return authored.slice(0, 10) < report.slice(0, 10)
}

function deriveStatus(row: GateRow): CoverageStatus {
  if (row.numeric === null) return 'unmatched'
  if (row.brain === null) return 'needs-review'
  return authoredBeforeReport(row.brain.authoredDate, row.numeric.reportDate)
    ? 'stale'
    : 'up-to-date'
}

/** Build the Coverage table rows, sorted attention-first then alphabetical. */
export function buildCoverageRows(rows: GateRow[]): CoverageRow[] {
  return rows
    .map((r) => ({
      ticker: r.ticker,
      company: r.company,
      play: r.numeric?.play ?? null,
      play2: r.numeric?.play2 ?? null,
      hasReview: r.brain !== null,
      gate: r.brain?.gate ?? 'unset',
      lastReview: r.brain?.authoredDate ?? null,
      status: deriveStatus(r)
    }))
    .sort((a, b) => {
      const order = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      if (order !== 0) return order
      return a.ticker.localeCompare(b.ticker)
    })
}

const BOARD_GATES: Gate[] = ['pass', 'watch', 'fail', 'unset']

/**
 * Group the universe by brain verdict. The `unset` column folds gate-unset pages,
 * never-reviewed qualifiers, and orphans into one "needs attention" column.
 */
export function buildGateBoard(rows: GateRow[]): GateBoardColumn[] {
  const byGate: Record<Gate, string[]> = { pass: [], watch: [], fail: [], unset: [] }
  for (const r of rows) byGate[r.brain?.gate ?? 'unset'].push(r.ticker)

  return BOARD_GATES.map((gate) => ({
    gate,
    label: gate === 'unset' ? 'unmatched / new' : gate,
    tickers: byGate[gate].sort((a, b) => a.localeCompare(b))
  }))
}

/**
 * Theme tracker rows from the Library's signal cards: one row per signal page, reach =
 * its current flag count. Sorted by reach descending (zero-flag themes naturally last),
 * alphabetical on ties.
 */
export function buildThemes(cards: SignalCardModel[]): ThemeRow[] {
  return cards
    .map((c) => ({
      slug: c.slug,
      relPath: c.relPath,
      name: c.name,
      polarity: c.polarity,
      flagCount: c.flags.length,
      liveCount: c.flags.filter((f) => f.live).length
    }))
    .sort((a, b) => {
      if (a.flagCount !== b.flagCount) return b.flagCount - a.flagCount
      return a.name.localeCompare(b.name)
    })
}
