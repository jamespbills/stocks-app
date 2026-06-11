import { describe, it, expect } from 'vitest'
import { DEFAULT_THRESHOLDS } from '../../../lib/playThresholds'
import { buildGateRows } from './build-gate-rows'
import type { Frontmatter, MarketStats, ReviewEntry } from '../types'
import type { QualifierRow } from './queries'

function tickerEntry(relPath: string, fm: Frontmatter): ReviewEntry {
  return {
    relPath,
    pageType: 'ticker',
    frontmatter: fm,
    ticker: null,
    needsFrontmatter: false,
    malformed: false,
    title: fm.company ?? fm.ticker ?? relPath,
    mtime: '2026-01-01T00:00:00.000Z'
  }
}

function qualifier(ticker: string, date: Date, over: Partial<QualifierRow> = {}): QualifierRow {
  return {
    ticker,
    date_released: date,
    play: '15',
    play_2: '10',
    play_sector_rating: '0',
    play_2_sector_rating: '0',
    company: null,
    sector: null,
    ...over
  }
}

// DECIMALs arrive as strings; date_released as Date objects (mysql2). Local-midnight Dates
// keep formatDate('iso') timezone-stable in the test.
const QUALIFIERS: QualifierRow[] = [
  qualifier('FDM.L', new Date(2026, 2, 1), { company: 'FDM Group plc', sector: 'IT Staffing' }),
  qualifier('FDM.L', new Date(2026, 0, 1), { company: 'FDM Group plc', sector: 'IT Staffing' }),
  // Qualifier with no brain page → coverage gap.
  qualifier('SPSY.L', new Date(2026, 1, 1), {
    play: '9',
    play_2: '16',
    company: 'Spectra Systems',
    sector: 'Security Technology'
  }),
  // Two DIFFERENT listings sharing a base: a UK and a US company. Must NOT be conflated.
  qualifier('ABC.L', new Date(2026, 1, 1), { play: '15', company: 'ABC UK Ltd', sector: 'UK Co' }),
  qualifier('ABC', new Date(2026, 1, 1), {
    play: '9',
    play_2: '16',
    company: 'ABC US Inc',
    sector: 'US Co'
  })
]

const BRAIN: ReviewEntry[] = [
  tickerEntry('wiki/fdm.md', {
    ticker: 'FDM.L',
    company: 'FDM Group (Holdings) plc',
    page_type: 'ticker',
    gate: 'fail',
    gate_summary: 'KPIs in freefall',
    signs: [{ polarity: 'warning', label: 'Headcount -21%' }],
    sources: ['archive/2026-04-02-FDM_Group_Post_Mortem.md'],
    conviction: 2,
    risk_rating: 'high',
    last_updated: '2026-04-02',
    review_date: '2026-03-27'
  }),
  // Brain page that is NOT currently qualifying → orphan.
  tickerEntry('wiki/nxt.md', {
    ticker: 'NXT.L',
    company: 'Next plc',
    page_type: 'ticker',
    gate: 'watch'
  }),
  // The two same-base listings each have their own page with a DIFFERENT gate.
  tickerEntry('wiki/abc-l.md', {
    ticker: 'ABC.L',
    company: 'ABC UK Ltd',
    page_type: 'ticker',
    gate: 'pass'
  }),
  tickerEntry('wiki/abc.md', {
    ticker: 'ABC',
    company: 'ABC US Inc',
    page_type: 'ticker',
    gate: 'fail'
  })
]

const MARKET = new Map<string, MarketStats>([
  ['FDM.L', { lastPrice: 100, high52: 200, fromHighPct: -0.5 }],
  ['ABC.L', { lastPrice: 10, high52: 20, fromHighPct: -0.5 }],
  ['ABC', { lastPrice: 90, high52: 100, fromHighPct: -0.1 }]
])

const rows = buildGateRows(QUALIFIERS, BRAIN, MARKET, DEFAULT_THRESHOLDS)
const byTicker = (t: string): (typeof rows)[number] => {
  const r = rows.find((x) => x.ticker === t)
  if (!r) throw new Error(`missing row ${t}`)
  return r
}

describe('buildGateRows', () => {
  it('produces one row per full ticker (union of qualifiers and brain pages)', () => {
    expect(rows).toHaveLength(5) // FDM.L, SPSY.L, ABC.L, ABC, NXT.L
  })

  it('matches a qualifier to its brain page on the exact full ticker', () => {
    const fdm = byTicker('FDM.L')
    expect(fdm.numeric?.qualifies).toBe(true)
    expect(fdm.numeric?.play).toBe(15)
    expect(fdm.numeric?.reportCount).toBe(2)
    expect(fdm.numeric?.reportDate).toBe('2026-03-01') // most-recent headline
    expect(fdm.brain?.gate).toBe('fail')
    expect(fdm.brain?.sources).toHaveLength(1)
    expect(fdm.market?.fromHighPct).toBe(-0.5)
  })

  it('NEVER conflates a UK listing (ABC.L) with a US one (ABC)', () => {
    const uk = byTicker('ABC.L')
    const us = byTicker('ABC')
    expect(uk).not.toBe(us)
    expect(uk.company).toBe('ABC UK Ltd')
    expect(us.company).toBe('ABC US Inc')
    // Each carries its OWN brain gate — no cross-contamination.
    expect(uk.brain?.gate).toBe('pass')
    expect(us.brain?.gate).toBe('fail')
    // And its own market stats.
    expect(uk.market?.lastPrice).toBe(10)
    expect(us.market?.lastPrice).toBe(90)
  })

  it('keeps a qualifier with no brain page (brain null, coverage gap)', () => {
    const spsy = byTicker('SPSY.L')
    expect(spsy.numeric?.qualifies).toBe(true)
    expect(spsy.numeric?.play2).toBe(16)
    expect(spsy.brain).toBeNull()
  })

  it('keeps an orphan brain page that is not currently qualifying (numeric null)', () => {
    const nxt = byTicker('NXT.L')
    expect(nxt.numeric).toBeNull()
    expect(nxt.brain?.gate).toBe('watch')
  })

  it('carries advisory fields through (last_updated wins over review_date); null when absent', () => {
    const fdm = byTicker('FDM.L')
    expect(fdm.brain?.conviction).toBe(2)
    expect(fdm.brain?.riskRating).toBe('high')
    expect(fdm.brain?.authoredDate).toBe('2026-04-02')
    const nxt = byTicker('NXT.L')
    expect(nxt.brain?.conviction).toBeNull()
    expect(nxt.brain?.riskRating).toBeNull()
    expect(nxt.brain?.authoredDate).toBeNull()
  })

  it('D4 — numeric and brain stay separate objects; no blended/combined field exists', () => {
    for (const row of rows) {
      expect(Object.keys(row).sort()).toEqual([
        'brain',
        'company',
        'market',
        'numeric',
        'sector',
        'ticker'
      ])
    }
  })

  it('orders qualifiers before orphans', () => {
    const orphanIdx = rows.findIndex((r) => r.numeric === null)
    const lastQualifierIdx = rows.map((r) => r.numeric !== null).lastIndexOf(true)
    expect(orphanIdx).toBeGreaterThan(lastQualifierIdx)
  })
})
