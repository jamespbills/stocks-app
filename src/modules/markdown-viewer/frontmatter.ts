// Pure frontmatter parsing for the Stocks Brain.
//
// Wraps gray-matter so a malformed YAML block never throws — the file is still indexed,
// just flagged `malformed`. No fs, no Electron, no IPC: this runs identically in Vitest
// (now) and inside the future `reviews:rescan` main-process handler.

import matter from 'gray-matter'
import yaml from 'js-yaml'
import type { Frontmatter, ParsedFrontmatter } from './types'

const FRONTMATTER_DELIMITER = /^---\r?\n/

// Parse the brain's YAML through JSON_SCHEMA, not the default schema. This is deliberate:
//  - the default schema coerces `last_updated: 2026-06-07` into a JS Date object (the same
//    type-lie that bites mysql2 DATE columns), whereas the brain authors plain ISO strings;
//  - JSON_SCHEMA also disables YAML's "Norway problem" (`NO`/`yes`/`on` → boolean), which
//    would otherwise corrupt tickers or play_tags. Strings stay strings; ints stay ints.
const yamlEngine = (input: string): object =>
  (yaml.load(input, { schema: yaml.JSON_SCHEMA }) ?? {}) as object

/**
 * Parse a raw markdown file into its frontmatter object and body.
 *
 * - Absent frontmatter → `hasFrontmatter: false`, `data: {}`, body is the whole input.
 * - Malformed YAML → `malformed: true`, `data: {}`, body falls back to the whole input.
 *   (gray-matter throws on bad YAML; we catch so the file is still indexable — test U3.)
 * - `play_tags` and every other field pass through verbatim; nothing is coerced here.
 */
export function parseFrontmatter(raw: string): ParsedFrontmatter {
  const hasFrontmatter = FRONTMATTER_DELIMITER.test(raw)

  if (!hasFrontmatter) {
    return { data: {}, content: raw, hasFrontmatter: false, malformed: false }
  }

  try {
    const parsed = matter(raw, { engines: { yaml: yamlEngine } })
    return {
      data: (parsed.data ?? {}) as Frontmatter,
      content: parsed.content,
      hasFrontmatter: true,
      malformed: false
    }
  } catch {
    // Bad YAML: keep the file indexable rather than crashing the whole rescan.
    return { data: {}, content: raw, hasFrontmatter: true, malformed: true }
  }
}
