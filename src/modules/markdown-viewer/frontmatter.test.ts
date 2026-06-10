import { describe, it, expect } from 'vitest'
import { parseFrontmatter } from './frontmatter'
import { buildEntry } from './entry'
import type { KnownTickers, Sign } from './types'
import knownTickersJson from './__fixtures__/known-tickers.json'
import {
  FULL_VALID_TICKER,
  NO_FRONTMATTER,
  MALFORMED_YAML,
  PLAY_TAGS_PAGE
} from './__fixtures__/samples'

const known: KnownTickers = new Map(Object.entries(knownTickersJson))

describe('parseFrontmatter / buildEntry', () => {
  it('U1 — parses a full valid frontmatter block with all fields populated', () => {
    const parsed = parseFrontmatter(FULL_VALID_TICKER)

    expect(parsed.hasFrontmatter).toBe(true)
    expect(parsed.malformed).toBe(false)

    const fm = parsed.data
    expect(fm.ticker).toBe('FDM.L')
    expect(fm.company).toBe('FDM Group (Holdings) plc')
    expect(fm.page_type).toBe('ticker')
    expect(fm.review_type).toBe('post_mortem')
    expect(fm.sector).toBe('IT Staffing')
    expect(fm.conviction).toBe(1)
    expect(fm.risk_rating).toBe('high')
    expect(fm.gate).toBe('fail')
    expect(fm.gate_summary).toContain('freefall')

    expect(fm.signs).toHaveLength(3)
    const signs = fm.signs as Sign[]
    expect(signs[0]).toEqual({
      polarity: 'warning',
      label: 'Year-end consultants -21% while revenue flat'
    })
    expect(signs[2].polarity).toBe('encouraging')

    expect(fm.related).toEqual([
      'sector-it-staffing',
      'signal-headcount-divergence',
      'signal-yield-trap'
    ])
    expect(fm.sources).toEqual(['archive/2026-04-02-FDM_Group_Post_Mortem_Analysis.md'])
    expect(fm.last_updated).toBe('2026-06-07')

    // Body is preserved after the frontmatter block.
    expect(parsed.content).toContain('# FDM Group (Holdings) plc')
  })

  it('U2 — absent frontmatter infers page type from folder and flags needsFrontmatter', () => {
    const sectorEntry = buildEntry('wiki/sector-energy-shipping.md', NO_FRONTMATTER, known)
    expect(sectorEntry.needsFrontmatter).toBe(true)
    expect(sectorEntry.malformed).toBe(false)
    expect(sectorEntry.pageType).toBe('sector')

    const rawEntry = buildEntry('raw/2026-06-07-some-note.md', NO_FRONTMATTER, known)
    expect(rawEntry.needsFrontmatter).toBe(true)
    expect(rawEntry.pageType).toBe('review')
  })

  it('U3 — malformed YAML never throws and the file is still indexed', () => {
    expect(() => parseFrontmatter(MALFORMED_YAML)).not.toThrow()

    const parsed = parseFrontmatter(MALFORMED_YAML)
    expect(parsed.malformed).toBe(true)
    expect(parsed.hasFrontmatter).toBe(true)
    expect(parsed.data).toEqual({})

    const entry = buildEntry('wiki/spsy.md', MALFORMED_YAML, known)
    expect(entry.malformed).toBe(true)
    expect(entry.relPath).toBe('wiki/spsy.md')
    // page_type couldn't be read from the broken frontmatter, so it falls back to the folder.
    expect(entry.pageType).toBe('ticker')
  })

  it('U7 — play_tags pass through verbatim as opaque strings (never coerced to engine ids)', () => {
    const entry = buildEntry('wiki/spsy.md', PLAY_TAGS_PAGE, known)
    const tags = entry.frontmatter.play_tags
    expect(tags).toEqual(['play', 'sector_play'])
    expect(Array.isArray(tags)).toBe(true)
    for (const tag of tags ?? []) {
      expect(typeof tag).toBe('string')
    }
  })
})
