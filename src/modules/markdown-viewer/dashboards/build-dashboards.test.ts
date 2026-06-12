import { describe, expect, it } from 'vitest'
import { buildCoverageRows, buildGateBoard, buildThemes } from './build-dashboards'
import type { BrainVerdict, GateRow, NumericStatus, SignalCardModel, SignalFlag } from '../types'

// ── Fixtures ─────────────────────────────────────────────────────────────────

function numeric(over: Partial<NumericStatus> = {}): NumericStatus {
  return {
    qualifies: true,
    play: 13,
    play2: 14,
    playSectorRating: null,
    play2SectorRating: null,
    reportDate: '2026-05-01',
    reportCount: 1,
    ...over
  }
}

function brain(over: Partial<BrainVerdict> = {}): BrainVerdict {
  return {
    relPath: 'wiki/spsy.md',
    gate: 'watch',
    gateSummary: null,
    signs: [],
    sources: [],
    conviction: null,
    riskRating: null,
    authoredDate: '2026-05-10',
    ...over
  }
}

function gateRow(over: Partial<GateRow> & { ticker: string }): GateRow {
  return {
    company: null,
    sector: null,
    numeric: null,
    brain: null,
    market: null,
    ...over
  }
}

function flag(over: Partial<SignalFlag> = {}): SignalFlag {
  return { ticker: 'SPSY.L', company: null, gate: 'watch', live: true, playTags: [], ...over }
}

function signalCard(over: Partial<SignalCardModel> & { slug: string }): SignalCardModel {
  return {
    relPath: `wiki/${over.slug}.md`,
    name: over.slug,
    polarity: 'warning',
    originTicker: null,
    originSector: null,
    outcomePct: null,
    description: null,
    metric: null,
    danger: null,
    leadTimeMonths: null,
    appliesTo: [],
    flags: [],
    lastUpdated: null,
    libraryRef: null,
    ...over
  }
}

// ── Coverage status derivation ───────────────────────────────────────────────

describe('buildCoverageRows status', () => {
  function statusOf(row: GateRow): string {
    return buildCoverageRows([row])[0].status
  }

  it('review authored after the latest report → up-to-date', () => {
    const row = gateRow({
      ticker: 'SPSY.L',
      numeric: numeric({ reportDate: '2026-05-01' }),
      brain: brain({ authoredDate: '2026-05-10' })
    })
    expect(statusOf(row)).toBe('up-to-date')
  })

  it('report landed after the review was authored → stale', () => {
    const row = gateRow({
      ticker: 'SPSY.L',
      numeric: numeric({ reportDate: '2026-05-01' }),
      brain: brain({ authoredDate: '2026-03-27' })
    })
    expect(statusOf(row)).toBe('stale')
  })

  it('authored the same day as the report → up-to-date (not stale)', () => {
    const row = gateRow({
      ticker: 'SPSY.L',
      numeric: numeric({ reportDate: '2026-05-01' }),
      brain: brain({ authoredDate: '2026-05-01' })
    })
    expect(statusOf(row)).toBe('up-to-date')
  })

  it('compares date parts only (timestamp suffix on authoredDate)', () => {
    const row = gateRow({
      ticker: 'SPSY.L',
      numeric: numeric({ reportDate: '2026-05-01' }),
      brain: brain({ authoredDate: '2026-04-30T23:59:00' })
    })
    expect(statusOf(row)).toBe('stale')
  })

  it('missing authoredDate → NOT stale (never stale on a guess)', () => {
    const row = gateRow({
      ticker: 'SPSY.L',
      numeric: numeric({ reportDate: '2026-05-01' }),
      brain: brain({ authoredDate: null })
    })
    expect(statusOf(row)).toBe('up-to-date')
  })

  it('missing reportDate → NOT stale', () => {
    const row = gateRow({
      ticker: 'SPSY.L',
      numeric: numeric({ reportDate: null }),
      brain: brain({ authoredDate: '2026-03-27' })
    })
    expect(statusOf(row)).toBe('up-to-date')
  })

  it('qualifier with no brain page → needs-review', () => {
    const row = gateRow({ ticker: 'AVON', numeric: numeric() })
    expect(statusOf(row)).toBe('needs-review')
  })

  it('orphan brain page (not in the play universe) → unmatched', () => {
    const row = gateRow({ ticker: 'NXT', brain: brain({ relPath: 'wiki/nxt.md' }) })
    expect(statusOf(row)).toBe('unmatched')
  })
})

describe('buildCoverageRows ordering + shape', () => {
  it('sorts attention-first, alphabetical within each status group', () => {
    const rows = buildCoverageRows([
      gateRow({ ticker: 'SFM', numeric: numeric(), brain: brain({ gate: 'pass' }) }),
      gateRow({ ticker: 'NXT', brain: brain() }),
      gateRow({ ticker: 'BVON', numeric: numeric() }),
      gateRow({ ticker: 'AVON', numeric: numeric() }),
      gateRow({
        ticker: 'THC',
        numeric: numeric({ reportDate: '2026-06-01' }),
        brain: brain({ authoredDate: '2026-01-01' })
      })
    ])
    expect(rows.map((r) => r.ticker)).toEqual(['AVON', 'BVON', 'THC', 'SFM', 'NXT'])
    expect(rows.map((r) => r.status)).toEqual([
      'needs-review',
      'needs-review',
      'stale',
      'up-to-date',
      'unmatched'
    ])
  })

  it('decoupling: rows carry exactly the separately-sourced fields — no combined figure', () => {
    const [row] = buildCoverageRows([
      gateRow({
        ticker: 'SPSY.L',
        company: 'Spectra Systems',
        numeric: numeric(),
        brain: brain()
      })
    ])
    expect(Object.keys(row).sort()).toEqual([
      'company',
      'gate',
      'hasReview',
      'lastReview',
      'play',
      'play2',
      'status',
      'ticker'
    ])
  })

  it('decoupling: status ignores scores and verdicts — presence + dates only', () => {
    // A max-score qualifier with a FAIL gate and a fresh review is still just up-to-date:
    // nothing about the score or the verdict feeds the status.
    const [row] = buildCoverageRows([
      gateRow({
        ticker: 'SPSY.L',
        numeric: numeric({ play: 13, play2: 14, reportDate: '2026-05-01' }),
        brain: brain({ gate: 'fail', authoredDate: '2026-05-10' })
      })
    ])
    expect(row.status).toBe('up-to-date')
    expect(row.gate).toBe('fail')
    expect(row.play).toBe(13)
  })
})

// ── Gate board ────────────────────────────────────────────────────────────────

describe('buildGateBoard', () => {
  it('groups by brain verdict; unset folds gate-unset + never-reviewed + orphans', () => {
    const cols = buildGateBoard([
      gateRow({ ticker: 'YELP', numeric: numeric(), brain: brain({ gate: 'pass' }) }),
      gateRow({ ticker: 'SFM', numeric: numeric(), brain: brain({ gate: 'pass' }) }),
      gateRow({ ticker: 'SPSY.L', numeric: numeric(), brain: brain({ gate: 'watch' }) }),
      gateRow({ ticker: 'AVON', numeric: numeric() }), // never reviewed
      gateRow({ ticker: 'NXT', brain: brain({ gate: 'unset' }) }), // orphan
      gateRow({ ticker: 'MTL.L', numeric: numeric(), brain: brain({ gate: 'unset' }) })
    ])

    expect(cols.map((c) => c.gate)).toEqual(['pass', 'watch', 'fail', 'unset'])
    expect(cols[0].tickers).toEqual(['SFM', 'YELP']) // alphabetical
    expect(cols[1].tickers).toEqual(['SPSY.L'])
    expect(cols[2].tickers).toEqual([]) // empty column still present
    expect(cols[3].tickers).toEqual(['AVON', 'MTL.L', 'NXT'])
    expect(cols[3].label).toBe('unmatched / new')
    expect(cols[0].label).toBe('pass')
  })
})

// ── Theme tracker ─────────────────────────────────────────────────────────────

describe('buildThemes', () => {
  it('derives flag + live counts and sorts by reach desc, zero-flag themes last', () => {
    const themes = buildThemes([
      signalCard({ slug: 'signal-quiet', flags: [] }),
      signalCard({
        slug: 'signal-client-concentration',
        name: 'Customer concentration',
        flags: [flag({ ticker: 'SPSY.L', live: true }), flag({ ticker: 'THC', live: false })]
      }),
      signalCard({
        slug: 'signal-yield-trap',
        name: 'Yield trap',
        polarity: 'encouraging',
        flags: [flag({ ticker: 'SFM', live: true })]
      })
    ])

    expect(themes.map((t) => t.slug)).toEqual([
      'signal-client-concentration',
      'signal-yield-trap',
      'signal-quiet'
    ])
    expect(themes[0]).toMatchObject({ flagCount: 2, liveCount: 1, polarity: 'warning' })
    expect(themes[1]).toMatchObject({ flagCount: 1, liveCount: 1, polarity: 'encouraging' })
    expect(themes[2]).toMatchObject({ flagCount: 0, liveCount: 0 })
  })

  it('breaks reach ties alphabetically by name', () => {
    const themes = buildThemes([
      signalCard({ slug: 'b', name: 'Beta', flags: [flag()] }),
      signalCard({ slug: 'a', name: 'Alpha', flags: [flag()] })
    ])
    expect(themes.map((t) => t.name)).toEqual(['Alpha', 'Beta'])
  })
})
