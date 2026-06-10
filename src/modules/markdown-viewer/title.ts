// Pure title derivation. Kept separate from `entry.ts` so the renderer (e.g. the Reader) can
// import it WITHOUT pulling in `frontmatter.ts` → gray-matter, which would otherwise leak the
// YAML engine into the renderer bundle. No frontmatter parsing here — just field picking.

import type { IndexEntry } from './types'

/** Prettify a filename stem (`sector-it-staffing` → `Sector It Staffing`) as a last resort. */
function prettifyStem(relPath: string): string {
  const posix = relPath.replace(/\\/g, '/')
  const stem = posix.slice(posix.lastIndexOf('/') + 1).replace(/\.md$/i, '')
  return stem
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * A human-readable title for an index entry, chosen by page type: company/ticker for ticker
 * pages, sector name for sector pages, signal name for signal pages, ticker/company for
 * reviews, falling back to a prettified filename stem. Accepts the minimal shape so it works
 * for both a full `IndexEntry`/`ReviewEntry` and an on-demand `ReviewDoc`.
 */
export function deriveTitle(
  entry: Pick<IndexEntry, 'frontmatter' | 'pageType' | 'relPath'>
): string {
  const fm = entry.frontmatter
  switch (entry.pageType) {
    case 'ticker':
      return fm.company ?? fm.ticker ?? prettifyStem(entry.relPath)
    case 'sector':
      return fm.sector ?? prettifyStem(entry.relPath)
    case 'signal':
      return fm.signal_name ?? prettifyStem(entry.relPath)
    case 'review':
      return fm.company ?? fm.ticker ?? prettifyStem(entry.relPath)
    default:
      return prettifyStem(entry.relPath)
  }
}
