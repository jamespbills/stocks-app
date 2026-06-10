// Pure ticker + page-type + gate helpers for the Stocks Brain.
//
// No fs, no MySQL: `resolveTicker` takes an explicit known-ticker map so it stays pure and
// testable. The map is built from `dim_companies` at runtime in a later stage; tests pass a
// fixture map. `play_tags` and other qualitative labels are never touched here.

import type { Frontmatter, Gate, KnownTickers, PageType, TickerResolution } from './types'

/**
 * Normalise a raw token (filename stem, frontmatter ticker, or wikilink target) to the
 * base symbol used as the key of the known-ticker map: strip a trailing `.md`, take the
 * part before the first exchange-suffix dot, and uppercase. Returns '' for empty input.
 */
export function normaliseTickerToken(token: string): string {
  const trimmed = token.trim()
  if (trimmed === '') return ''
  const withoutMd = trimmed.replace(/\.md$/i, '')
  const base = withoutMd.split('.')[0]
  return base.toUpperCase()
}

/**
 * The exact match key for cross-system ticker joins (engine ⋈ brain): trimmed + uppercased,
 * with the **exchange suffix preserved**. Unlike `normaliseTickerToken` — which strips the
 * suffix for brain-internal filename/wikilink resolution — this keeps `ABC.L` (a UK listing)
 * and `ABC` (a US listing) as distinct keys, so they can never be conflated. The engine
 * (`dim_companies.ticker`) and the brain (`ticker` frontmatter) share this full-ticker form.
 */
export function tickerKey(ticker: string): string {
  return ticker.trim().toUpperCase()
}

/**
 * Resolve a ticker token to its canonical symbol (e.g. `fdm` / `SPSY.L` → `FDM.L` /
 * `SPSY.L`) via the known-ticker map. Unknown tokens resolve to `null` (they flow into the
 * unmatched tray) — tests U4 (resolve) and U5 (unknown → unresolved).
 */
export function resolveTicker(token: string, known: KnownTickers): TickerResolution {
  const base = normaliseTickerToken(token)
  const canonical = base === '' ? null : (known.get(base) ?? null)
  return { input: token, canonical, resolved: canonical !== null }
}

/**
 * Infer the page type from the brain-relative path when frontmatter doesn't declare one
 * (test U2). `raw/` and `archive/` hold source reviews; `wiki/` holds the synthesised
 * pages, named `sector-*` / `signal-*` / `<ticker>`.
 */
export function inferPageTypeFromPath(relPath: string): PageType {
  const posix = relPath.replace(/\\/g, '/').replace(/^\/+/, '')
  if (posix.startsWith('raw/') || posix.startsWith('archive/')) return 'review'
  if (posix.startsWith('wiki/')) {
    const name = posix.slice('wiki/'.length)
    if (name.startsWith('sector-')) return 'sector'
    if (name.startsWith('signal-')) return 'signal'
    return 'ticker'
  }
  return 'review'
}

/**
 * The effective gate for a ticker page: an in-app override wins, else the authored gate,
 * else `unset` (test U6). No override is authored in Stage 1, but the precedence is fixed
 * now so later stages can layer one in without changing call sites.
 */
export function effectiveGate(fm: Frontmatter): Gate {
  return fm.gate_override ?? fm.gate ?? 'unset'
}
