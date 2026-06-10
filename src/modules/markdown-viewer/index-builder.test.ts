import { describe, it, expect } from 'vitest'
import { indexBrainFiles } from './index-builder'
import { effectiveGate } from './ticker'
import type { BrainFile, ReviewEntry } from './types'

const FILES: BrainFile[] = [
  {
    relPath: 'wiki/fdm.md',
    mtime: '2026-06-07T10:00:00.000Z',
    content: `---
ticker: FDM.L
company: FDM Group (Holdings) plc
page_type: ticker
sector: IT Staffing
gate: fail
last_updated: 2026-06-07
---
# FDM Group
Body.`
  },
  {
    relPath: 'wiki/sector-it-staffing.md',
    mtime: '2026-06-06T10:00:00.000Z',
    content: `---
page_type: sector
sector: IT Staffing
---
# IT Staffing`
  },
  {
    relPath: 'wiki/signal-yield-trap.md',
    mtime: '2026-06-05T10:00:00.000Z',
    content: `---
page_type: signal
signal_name: Yield Trap
polarity: warning
---
# Yield Trap`
  },
  {
    relPath: 'raw/2026-06-08-loose-note.md',
    mtime: '2026-06-08T10:00:00.000Z',
    content: `# A loose note

No frontmatter here.`
  },
  {
    relPath: 'archive/2026-01-01-broken.md',
    mtime: '2026-01-01T10:00:00.000Z',
    content: `---
ticker: SPSY.L
signs: [{polarity: warning, label: oops]
---
# Broken`
  },
  {
    // page_type review with a suffix-less ticker — must canonicalise via the wiki-derived map.
    relPath: 'archive/2026-04-02-fdm-followup.md',
    mtime: '2026-04-02T10:00:00.000Z',
    content: `---
ticker: FDM
company: FDM Group
page_type: review
---
# FDM follow-up`
  }
]

function byPath(entries: ReviewEntry[], relPath: string): ReviewEntry {
  const e = entries.find((x) => x.relPath === relPath)
  if (!e) throw new Error(`missing ${relPath}`)
  return e
}

describe('indexBrainFiles', () => {
  const entries = indexBrainFiles(FILES)

  it('I1 — indexes every file with correct page-type counts', () => {
    expect(entries).toHaveLength(6)
    const counts = entries.reduce<Record<string, number>>((acc, e) => {
      acc[e.pageType] = (acc[e.pageType] ?? 0) + 1
      return acc
    }, {})
    expect(counts).toEqual({ ticker: 1, sector: 1, signal: 1, review: 3 })
  })

  it('derives titles per page type', () => {
    expect(byPath(entries, 'wiki/fdm.md').title).toBe('FDM Group (Holdings) plc')
    expect(byPath(entries, 'wiki/sector-it-staffing.md').title).toBe('IT Staffing')
    expect(byPath(entries, 'wiki/signal-yield-trap.md').title).toBe('Yield Trap')
    expect(byPath(entries, 'raw/2026-06-08-loose-note.md').title).toBe('2026 06 08 Loose Note')
  })

  it('resolves tickers against the brain’s own wiki ticker pages (two-pass)', () => {
    expect(byPath(entries, 'wiki/fdm.md').ticker?.canonical).toBe('FDM.L')
    // The suffix-less `FDM` in the archive review canonicalises via the wiki page's FDM.L.
    expect(byPath(entries, 'archive/2026-04-02-fdm-followup.md').ticker?.canonical).toBe('FDM.L')
  })

  it('flags malformed frontmatter and missing frontmatter without dropping the file', () => {
    expect(byPath(entries, 'archive/2026-01-01-broken.md').malformed).toBe(true)
    expect(byPath(entries, 'raw/2026-06-08-loose-note.md').needsFrontmatter).toBe(true)
  })

  it('carries the gate and mtime through to the entry', () => {
    const fdm = byPath(entries, 'wiki/fdm.md')
    expect(effectiveGate(fdm.frontmatter)).toBe('fail')
    expect(fdm.mtime).toBe('2026-06-07T10:00:00.000Z')
  })
})
