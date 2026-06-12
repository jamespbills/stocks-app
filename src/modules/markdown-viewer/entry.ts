// Pure index-entry builder: composes frontmatter parsing, page-type inference and ticker
// resolution into one IndexEntry per brain file. Used by Vitest now and by the future
// `reviews:rescan` handler (which supplies relPath + raw contents + the known-ticker map).

import { parseFrontmatter } from './frontmatter'
import { inferPageTypeFromPath, resolveTicker } from './ticker'
import type { IndexEntry, KnownTickers, PageType } from './types'

// `play` is accepted from frontmatter only — `inferPageTypeFromPath` never yields it,
// because `PLAY` is a real US ticker (Dave & Buster's) and `wiki/play.md` would be ambiguous.
// The brain schema requires `page_type` on every wiki page, so this is the safe default.
const PAGE_TYPES: readonly PageType[] = ['ticker', 'sector', 'signal', 'play', 'review']

function isPageType(value: unknown): value is PageType {
  return typeof value === 'string' && (PAGE_TYPES as readonly string[]).includes(value)
}

/** The filename stem (no folder, no `.md`) — the fallback ticker token for ticker pages. */
function fileStem(relPath: string): string {
  const posix = relPath.replace(/\\/g, '/')
  const name = posix.slice(posix.lastIndexOf('/') + 1)
  return name.replace(/\.md$/i, '')
}

/**
 * Build one index entry from a brain-relative path and the file's raw contents.
 * - Page type comes from frontmatter when it declares a valid one, else from the folder.
 * - Ticker pages resolve their ticker from the `ticker` field, falling back to the stem.
 * - Files with no frontmatter are flagged `needsFrontmatter` (test U2); malformed YAML is
 *   flagged `malformed` but still produces an entry (test U3).
 */
export function buildEntry(relPath: string, raw: string, known: KnownTickers): IndexEntry {
  const parsed = parseFrontmatter(raw)
  const fm = parsed.data

  const pageType: PageType = isPageType(fm.page_type)
    ? fm.page_type
    : inferPageTypeFromPath(relPath)

  const ticker =
    pageType === 'ticker'
      ? resolveTicker(fm.ticker ?? fileStem(relPath), known)
      : fm.ticker
        ? resolveTicker(fm.ticker, known)
        : null

  return {
    relPath: relPath.replace(/\\/g, '/'),
    pageType,
    frontmatter: fm,
    ticker,
    needsFrontmatter: !parsed.hasFrontmatter,
    malformed: parsed.malformed
  }
}
