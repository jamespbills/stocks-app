import { describe, it, expect } from 'vitest'
import { buildEntry } from '../entry'
import {
  buildPlayCards,
  buildSignalCards,
  matchesPlayTag,
  matchesSector,
  playTagOptions,
  sectorOptions
} from './build-library'
import type {
  Frontmatter,
  GateRow,
  KnownTickers,
  PageType,
  ReviewEntry,
  SignalLibraryEntry
} from '../types'

function entry(relPath: string, pageType: PageType, fm: Frontmatter): ReviewEntry {
  return {
    relPath,
    pageType,
    frontmatter: fm,
    ticker: null,
    needsFrontmatter: false,
    malformed: false,
    title: fm.signal_name ?? fm.company ?? fm.ticker ?? relPath,
    mtime: '2026-01-01T00:00:00.000Z'
  }
}

function gateRow(
  ticker: string,
  over: {
    qualifies?: boolean
    brainGate?: 'pass' | 'fail' | 'watch' | 'unset'
    company?: string
  } = {}
): GateRow {
  return {
    ticker,
    company: over.company ?? null,
    sector: null,
    numeric:
      over.qualifies === undefined
        ? null
        : {
            qualifies: over.qualifies,
            play: null,
            play2: null,
            playSectorRating: null,
            play2SectorRating: null,
            reportDate: null,
            reportCount: 1
          },
    brain:
      over.brainGate === undefined
        ? null
        : {
            relPath: `wiki/${ticker.toLowerCase()}.md`,
            gate: over.brainGate,
            gateSummary: null,
            signs: [],
            sources: [],
            conviction: null,
            riskRating: null,
            authoredDate: null
          },
    market: null
  }
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SIGNAL_CONCENTRATION = entry('wiki/signal-client-concentration.md', 'signal', {
  page_type: 'signal',
  signal_name: 'Client Concentration Risk',
  polarity: 'warning',
  library_ref: 'FDM_004',
  origin_ticker: 'FDM',
  sector: 'IT Staffing',
  tickers: ['SPSY.L', 'THC'],
  related: ['fdm', 'sector-it-staffing'],
  last_updated: '2026-06-07'
})

// No library_ref — must render from frontmatter alone.
const SIGNAL_UNREFFED = entry('wiki/signal-proposed-new.md', 'signal', {
  page_type: 'signal',
  signal_name: 'Proposed New Signal',
  polarity: 'encouraging',
  sector: 'Shipping'
})

// Same-base UK/US listings: the signal lists the UK one; the US page links back via related.
const SIGNAL_SUFFIX = entry('wiki/signal-suffix-check.md', 'signal', {
  page_type: 'signal',
  signal_name: 'Suffix Check',
  polarity: 'warning',
  library_ref: 'XX_001',
  tickers: ['ABC.L']
})

const TICKER_SPSY = entry('wiki/spsy.md', 'ticker', {
  ticker: 'SPSY.L',
  company: 'Spectra Systems Corporation',
  page_type: 'ticker',
  gate: 'watch',
  play_tags: ['play', 'sector_play'],
  related: ['signal-client-concentration', 'sector-security-technology']
})

// Links the concentration signal via `related` only (not in the signal's own tickers list).
const TICKER_YELP = entry('wiki/yelp.md', 'ticker', {
  ticker: 'YELP',
  company: 'Yelp Inc',
  page_type: 'ticker',
  gate: 'pass',
  play_tags: ['play_2'],
  related: ['signal-client-concentration']
})

const TICKER_ABC_US = entry('wiki/abc.md', 'ticker', {
  ticker: 'ABC',
  company: 'ABC US Inc',
  page_type: 'ticker',
  gate: 'fail',
  related: ['signal-suffix-check']
})

const PLAY_PAGE = entry('wiki/play-2.md', 'play', {
  page_type: 'play',
  last_updated: '2026-06-01',
  related: ['spsy', 'signal-client-concentration']
})

const ENTRIES: ReviewEntry[] = [
  SIGNAL_CONCENTRATION,
  SIGNAL_UNREFFED,
  SIGNAL_SUFFIX,
  TICKER_SPSY,
  TICKER_YELP,
  TICKER_ABC_US,
  PLAY_PAGE,
  entry('wiki/sector-shipping.md', 'sector', { page_type: 'sector', sector: 'Shipping' })
]

const LIBRARY: SignalLibraryEntry[] = [
  {
    signal_id: 'FDM_004',
    signal_name: 'Geographic or Client Concentration Risk',
    source_ticker: 'FDM',
    sector: 'IT Staffing',
    metric_to_check: 'Single client >10% of revenue',
    danger_threshold: 'Any single client >10% of revenue',
    description: 'Concentration risk sits in the notes, not the P&L.',
    lead_time_months: 0,
    outcome_pct: -25,
    applicable_sectors: ['IT Staffing', 'Professional Services']
  },
  { signal_id: 'XX_001', signal_name: 'Suffix Check', outcome_pct: -45 }
]

// SPSY.L currently qualifies; YELP is in the universe but not qualifying; ABC.L absent
// from the gate rows entirely (brain-only flag).
const GATE_ROWS: GateRow[] = [
  gateRow('SPSY.L', { qualifies: true, brainGate: 'watch', company: 'Spectra Systems' }),
  gateRow('YELP', { qualifies: false, brainGate: 'pass' }),
  gateRow('THC', { qualifies: true })
]

const cards = buildSignalCards(ENTRIES, LIBRARY, GATE_ROWS)
const bySlug = (slug: string): (typeof cards)[number] => {
  const c = cards.find((x) => x.slug === slug)
  if (!c) throw new Error(`missing card ${slug}`)
  return c
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('buildSignalCards', () => {
  it('joins a wiki signal page to its library entry via library_ref', () => {
    const c = bySlug('signal-client-concentration')
    expect(c.name).toBe('Client Concentration Risk') // page name wins over JSON
    expect(c.metric).toBe('Single client >10% of revenue')
    expect(c.danger).toBe('Any single client >10% of revenue')
    expect(c.leadTimeMonths).toBe(0)
    expect(c.outcomePct).toBe(-25)
    expect(c.appliesTo).toEqual(['IT Staffing', 'Professional Services'])
    expect(c.originTicker).toBe('FDM')
  })

  it('renders a page without a library match from frontmatter alone (metrics omitted)', () => {
    const c = bySlug('signal-proposed-new')
    expect(c.libraryRef).toBeNull()
    expect(c.metric).toBeNull()
    expect(c.danger).toBeNull()
    expect(c.outcomePct).toBeNull()
    expect(c.polarity).toBe('encouraging')
    // applies-to falls back to the page's own sector.
    expect(c.appliesTo).toEqual(['Shipping'])
  })

  it('derives flags as the union of frontmatter tickers and inverse related links', () => {
    const c = bySlug('signal-client-concentration')
    expect(c.flags.map((f) => f.ticker).sort()).toEqual(['SPSY.L', 'THC', 'YELP'])
  })

  it('decorates flags: live = currently qualifying; gate from the brain; company best-effort', () => {
    const c = bySlug('signal-client-concentration')
    const spsy = c.flags.find((f) => f.ticker === 'SPSY.L')
    const yelp = c.flags.find((f) => f.ticker === 'YELP')
    const thc = c.flags.find((f) => f.ticker === 'THC')
    expect(spsy).toMatchObject({ live: true, gate: 'watch', company: 'Spectra Systems' })
    expect(yelp).toMatchObject({ live: false, gate: 'pass', company: 'Yelp Inc' })
    // THC: qualifies but has no brain ticker page → gate unset, no play tags.
    expect(thc).toMatchObject({ live: true, gate: 'unset', company: null, playTags: [] })
    // Live flags sort first.
    expect(c.flags.findIndex((f) => !f.live)).toBeGreaterThan(
      c.flags.map((f) => f.live).lastIndexOf(true)
    )
  })

  it('never conflates suffixed listings: ABC.L flag does not pick up the ABC US page', () => {
    const c = bySlug('signal-suffix-check')
    const tickers = c.flags.map((f) => f.ticker).sort()
    // ABC.L from the signal's own list; ABC US via its related link — two distinct flags.
    expect(tickers).toEqual(['ABC', 'ABC.L'])
    const ukFlag = c.flags.find((f) => f.ticker === 'ABC.L')
    const usFlag = c.flags.find((f) => f.ticker === 'ABC')
    // The UK listing has no brain page in the fixtures — it must NOT inherit the US gate.
    expect(ukFlag?.gate).toBe('unset')
    expect(ukFlag?.company).toBeNull()
    expect(usFlag?.gate).toBe('fail')
    expect(usFlag?.company).toBe('ABC US Inc')
  })

  it('sorts by outcome severity ascending, nulls last', () => {
    expect(cards.map((c) => c.slug)).toEqual([
      'signal-suffix-check', // -45
      'signal-client-concentration', // -25
      'signal-proposed-new' // null outcome → last
    ])
  })

  it('flags carry engine PRESENCE only — no numeric score fields exist on a flag', () => {
    for (const f of bySlug('signal-client-concentration').flags) {
      expect(Object.keys(f).sort()).toEqual(['company', 'gate', 'live', 'playTags', 'ticker'])
    }
  })
})

describe('filters', () => {
  it('sectorOptions is the sorted union of applies-to and origin sectors', () => {
    expect(sectorOptions(cards)).toEqual(['IT Staffing', 'Professional Services', 'Shipping'])
  })

  it('matchesSector accepts applies-to membership or origin sector', () => {
    const c = bySlug('signal-client-concentration')
    expect(matchesSector(c, 'Professional Services')).toBe(true)
    expect(matchesSector(c, 'IT Staffing')).toBe(true)
    expect(matchesSector(c, 'Shipping')).toBe(false)
  })

  it('playTagOptions is the union of ticker pages’ play_tags (opaque strings)', () => {
    expect(playTagOptions(ENTRIES)).toEqual(['play', 'play_2', 'sector_play'])
  })

  it('matchesPlayTag keeps cards whose flagged tickers carry the tag', () => {
    const c = bySlug('signal-client-concentration')
    expect(matchesPlayTag(c, 'sector_play')).toBe(true) // via SPSY.L
    expect(matchesPlayTag(c, 'play_2')).toBe(true) // via YELP
    expect(matchesPlayTag(bySlug('signal-suffix-check'), 'sector_play')).toBe(false)
  })

  it('treats play tags as opaque — `sector_play` never substring-matches `play`', () => {
    const onlySectorPlay = buildSignalCards(
      [
        SIGNAL_CONCENTRATION,
        entry('wiki/spsy.md', 'ticker', {
          ticker: 'SPSY.L',
          page_type: 'ticker',
          play_tags: ['sector_play'],
          related: []
        })
      ],
      LIBRARY,
      []
    )
    const c = onlySectorPlay.find((x) => x.slug === 'signal-client-concentration')
    if (!c) throw new Error('missing card')
    expect(matchesPlayTag(c, 'sector_play')).toBe(true)
    expect(matchesPlayTag(c, 'play')).toBe(false)
  })
})

describe('buildPlayCards', () => {
  it('maps play pages to light cards and ignores every other page type', () => {
    const plays = buildPlayCards(ENTRIES)
    expect(plays).toHaveLength(1)
    expect(plays[0]).toMatchObject({
      relPath: 'wiki/play-2.md',
      lastUpdated: '2026-06-01',
      related: ['spsy', 'signal-client-concentration']
    })
  })
})

describe("page_type 'play' classification", () => {
  const known: KnownTickers = new Map()

  it('accepts page_type: play from frontmatter', () => {
    const e = buildEntry(
      'wiki/play-2.md',
      '---\npage_type: play\nlast_updated: "2026-06-01"\n---\n\n# Play 2\n',
      known
    )
    expect(e.pageType).toBe('play')
  })

  it('never infers play from the filename — wiki/play.md without frontmatter stays a ticker page', () => {
    // PLAY is a real US ticker; only frontmatter may classify a play page (documented).
    const e = buildEntry('wiki/play.md', '# A page with no frontmatter\n', known)
    expect(e.pageType).toBe('ticker')
  })
})
