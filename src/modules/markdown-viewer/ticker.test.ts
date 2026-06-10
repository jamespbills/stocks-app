import { describe, it, expect } from 'vitest'
import { resolveTicker, inferPageTypeFromPath, effectiveGate } from './ticker'
import type { Frontmatter, KnownTickers } from './types'
import knownTickersJson from './__fixtures__/known-tickers.json'

const known: KnownTickers = new Map(Object.entries(knownTickersJson))

describe('resolveTicker', () => {
  it('U4 — resolves filename stem, bare symbol and suffixed symbol to the canonical ticker', () => {
    expect(resolveTicker('fdm', known)).toEqual({
      input: 'fdm',
      canonical: 'FDM.L',
      resolved: true
    })
    expect(resolveTicker('FDM', known).canonical).toBe('FDM.L')
    expect(resolveTicker('SPSY', known).canonical).toBe('SPSY.L')
    expect(resolveTicker('SPSY.L', known).canonical).toBe('SPSY.L')
    expect(resolveTicker('fdm.md', known).canonical).toBe('FDM.L')
    // A symbol with no exchange suffix resolves to itself.
    expect(resolveTicker('HY', known).canonical).toBe('HY')
  })

  it('U5 — an unknown token resolves to unmatched (null canonical, resolved false)', () => {
    expect(resolveTicker('NXT_Next_plc_equity_analysis', known)).toEqual({
      input: 'NXT_Next_plc_equity_analysis',
      canonical: null,
      resolved: false
    })
    expect(resolveTicker('NXT_4', known).resolved).toBe(false)
    expect(resolveTicker('', known).resolved).toBe(false)
  })
})

describe('inferPageTypeFromPath', () => {
  it('maps brain folders/filenames to page types', () => {
    expect(inferPageTypeFromPath('wiki/fdm.md')).toBe('ticker')
    expect(inferPageTypeFromPath('wiki/sector-it-staffing.md')).toBe('sector')
    expect(inferPageTypeFromPath('wiki/signal-yield-trap.md')).toBe('signal')
    expect(inferPageTypeFromPath('raw/2026-06-07-note.md')).toBe('review')
    expect(inferPageTypeFromPath('archive/2026-04-02-thing.md')).toBe('review')
    // Backslash paths (Windows) are normalised first.
    expect(inferPageTypeFromPath('wiki\\sector-shipping.md')).toBe('sector')
  })
})

describe('effectiveGate', () => {
  it('U6 — an in-app override wins; otherwise the authored gate; otherwise unset', () => {
    expect(effectiveGate({ gate_override: 'watch', gate: 'pass' } as Frontmatter)).toBe('watch')
    expect(effectiveGate({ gate: 'pass' } as Frontmatter)).toBe('pass')
    expect(effectiveGate({} as Frontmatter)).toBe('unset')
  })
})
