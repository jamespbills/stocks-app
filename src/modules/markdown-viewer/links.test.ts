import { describe, it, expect } from 'vitest'
import { resolveBrainLink } from './links'

describe('resolveBrainLink', () => {
  it('resolves same-folder links relative to the current page', () => {
    expect(resolveBrainLink('wiki/fdm.md', 'signal-yield-trap.md')).toBe(
      'wiki/signal-yield-trap.md'
    )
    expect(resolveBrainLink('wiki/fdm.md', './sector-it-staffing.md')).toBe(
      'wiki/sector-it-staffing.md'
    )
  })

  it('resolves parent-folder links', () => {
    expect(resolveBrainLink('wiki/fdm.md', '../archive/2026-04-02-x.md')).toBe(
      'archive/2026-04-02-x.md'
    )
  })

  it('strips #anchors and ?queries', () => {
    expect(resolveBrainLink('wiki/fdm.md', 'signal-yield-trap.md#the-lesson')).toBe(
      'wiki/signal-yield-trap.md'
    )
  })

  it('returns null for external, protocol, non-markdown and escaping links', () => {
    expect(resolveBrainLink('wiki/fdm.md', 'https://example.com')).toBeNull()
    expect(resolveBrainLink('wiki/fdm.md', 'mailto:a@b.com')).toBeNull()
    expect(resolveBrainLink('wiki/fdm.md', '../signal_library/signal_library.json')).toBeNull()
    expect(resolveBrainLink('wiki/fdm.md', '#section-only')).toBeNull()
    expect(resolveBrainLink('wiki/fdm.md', '../../outside.md')).toBeNull()
  })
})
