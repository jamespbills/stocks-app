// Pure two-pass index builder. Takes raw brain files (read by the main-process fs walk) and
// produces the enriched in-memory index. No fs, no Electron — runs in Vitest with in-memory
// file arrays, and inside the `reviews:rescan` handler with real file contents.

import { buildEntry } from './entry'
import { deriveTitle } from './title'
import { parseFrontmatter } from './frontmatter'
import { normaliseTickerToken } from './ticker'
import type { BrainFile, KnownTickers, ReviewEntry } from './types'

/**
 * Build the brain index. Pass 1 derives the canonical ticker map from the brain's *own* wiki
 * ticker pages (so resolution needs no MySQL); pass 2 builds each entry and enriches it with a
 * display title + mtime. Files are processed in the order given.
 */
export function indexBrainFiles(files: BrainFile[]): ReviewEntry[] {
  const known: KnownTickers = new Map()
  for (const f of files) {
    if (!f.relPath.replace(/\\/g, '/').startsWith('wiki/')) continue
    const { data } = parseFrontmatter(f.content)
    if (data.page_type === 'ticker' && typeof data.ticker === 'string') {
      const base = normaliseTickerToken(data.ticker)
      if (base !== '') known.set(base, data.ticker)
    }
  }

  return files.map((f) => {
    const entry = buildEntry(f.relPath, f.content, known)
    return { ...entry, title: deriveTitle(entry), mtime: f.mtime }
  })
}
