// Shared types for the Markdown Reviews module.
//
// These describe the shape of the Stocks Brain (an external, read-only git markdown
// "second brain"). They are deliberately permissive: the brain is AI-authored, so any
// frontmatter field may be missing on any given page. Nothing here is ever written back
// to MySQL or used to recompute a numeric play score — qualitative labels stay opaque.

/** The yes/no qualifier a ticker page carries (the "gate" on top of the numeric play). */
export type Gate = 'pass' | 'fail' | 'watch' | 'unset'

/** Polarity of a sign or signal — encouraging vs warning. */
export type Polarity = 'warning' | 'encouraging'

/** What kind of wiki/brain page this is. `review` covers raw/ + archive/ source files. */
export type PageType = 'ticker' | 'sector' | 'signal' | 'review'

/** A single warning/encouraging sign extracted from a ticker page's frontmatter. */
export interface Sign {
  polarity: Polarity
  label: string
}

/**
 * Frontmatter as it appears across the brain. Every field is optional because field
 * presence varies by page type and authoring completeness (see the real wiki schema).
 * `play_tags` are QUALITATIVE labels only — never parsed into engine ids.
 */
export interface Frontmatter {
  ticker?: string
  company?: string
  page_type?: PageType
  review_type?: string
  sector?: string
  industry?: string
  conviction?: number
  risk_rating?: string
  gate?: Gate
  /** Forward-compat: an in-app override is not authored in Stage 1, but the precedence is. */
  gate_override?: Gate
  gate_summary?: string
  signs?: Sign[]
  play_tags?: string[]
  signal_name?: string
  polarity?: Polarity
  library_ref?: string
  origin_ticker?: string
  related?: string[]
  tickers?: string[]
  sources?: string[]
  last_updated?: string
  review_date?: string
  /** Any other keys the brain carries that we don't model explicitly. */
  [key: string]: unknown
}

/** Result of parsing a raw markdown file's frontmatter block. */
export interface ParsedFrontmatter {
  /** The parsed YAML object (empty when absent or malformed). */
  data: Frontmatter
  /** The markdown body after the frontmatter block. */
  content: string
  /** Whether a `---` frontmatter block was present at all. */
  hasFrontmatter: boolean
  /** True when a frontmatter block existed but its YAML could not be parsed. */
  malformed: boolean
}

/** Outcome of resolving a ticker token against the known-ticker map. */
export interface TickerResolution {
  /** The original token as supplied (e.g. `fdm`, `SPSY.L`, `NXT_4`). */
  input: string
  /** The canonical ticker (e.g. `FDM.L`) or null when unresolved. */
  canonical: string | null
  resolved: boolean
}

/**
 * Map of normalised base symbol (uppercase, no exchange suffix) → canonical ticker.
 * Sourced from `dim_companies` at runtime in a later stage; a fixture map drives tests now.
 */
export type KnownTickers = Map<string, string>

/** One entry in the in-memory brain index (built per file). */
export interface IndexEntry {
  /** Path relative to the brain root, POSIX-style (e.g. `wiki/fdm.md`). */
  relPath: string
  /** Page type — from frontmatter if present, else inferred from the folder/filename. */
  pageType: PageType
  frontmatter: Frontmatter
  /** Ticker resolution for ticker pages (null for sector/signal pages without a ticker). */
  ticker: TickerResolution | null
  /** True when the file had no frontmatter block (flagged for authoring). */
  needsFrontmatter: boolean
  /** True when a frontmatter block existed but failed to parse. */
  malformed: boolean
}

/**
 * An index entry enriched for display + travel over IPC: a derived `title` and the file's
 * last-modified time. Structured-cloneable (no `Map`), so it crosses the IPC boundary safely.
 */
export interface ReviewEntry extends IndexEntry {
  /** Human title for the browse list (company/sector/signal name, else prettified stem). */
  title: string
  /** File mtime as an ISO string, for sorting + staleness display. */
  mtime: string
}

/** A raw brain file as read from disk — the input to the pure index builder. */
export interface BrainFile {
  /** POSIX path relative to the brain root (e.g. `wiki/fdm.md`). */
  relPath: string
  /** Raw file contents. */
  content: string
  /** File mtime as an ISO string. */
  mtime: string
}

/** The result of `reviews:rescan` — the whole in-memory brain index. */
export interface BrainIndex {
  entries: ReviewEntry[]
  /** False when `paths.stocksBrain` is unset or the folder is missing. */
  brainConfigured: boolean
  /** ISO timestamp of the scan. */
  scannedAt: string
}

/** A single rendered document, fetched on demand by `reviews:get`. */
export interface ReviewDoc {
  relPath: string
  frontmatter: Frontmatter
  /** Raw markdown body (rendered by react-markdown in the renderer). */
  body: string
  pageType: PageType
}

/** Module-local navigation: the qualifiers gate list, or the full-route Reader for one page. */
export type View = { kind: 'gate' } | { kind: 'reader'; relPath: string }

// ── Ticker Gate (Stage 3) ───────────────────────────────────────────────────
// The engine's numeric verdict and the brain's qualitative verdict are kept as SEPARATE
// objects on every GateRow — never blended into a combined score. This is the module's
// core decoupling lock, enforced in code and tests.

/** Numeric play status for a ticker, sourced from `view_play_universe` (the engine). */
export interface NumericStatus {
  /** True when the headline report meets the play/play_2/near-miss+sector qualification. */
  qualifies: boolean
  play: number | null
  play2: number | null
  playSectorRating: number | null
  play2SectorRating: number | null
  /** ISO date of the most-recent qualifying report (the headline). */
  reportDate: string | null
  /** How many qualifying reports this ticker has in the universe. */
  reportCount: number
}

/** Qualitative verdict for a ticker, sourced from its brain wiki page. */
export interface BrainVerdict {
  /** Brain-relative path to the wiki ticker page. */
  relPath: string
  gate: Gate
  gateSummary: string | null
  signs: Sign[]
  /** Underlying source reviews (archive relPaths) listed in the page frontmatter. */
  sources: string[]
}

/** Market context for a ticker, where available (live price + 52-week high). */
export interface MarketStats {
  lastPrice: number | null
  high52: number | null
  /** (lastPrice − high52) / high52 — negative when below the 52-wk high; null if either missing. */
  fromHighPct: number | null
}

/** One row in the Ticker Gate list: engine + brain verdicts side by side, never merged. */
export interface GateRow {
  /** Display ticker (engine ticker when matched, else the brain page's ticker). */
  ticker: string
  company: string | null
  sector: string | null
  numeric: NumericStatus | null
  brain: BrainVerdict | null
  market: MarketStats | null
}
