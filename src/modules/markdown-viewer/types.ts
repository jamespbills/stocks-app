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

/**
 * What kind of wiki/brain page this is. `review` covers raw/ + archive/ source files.
 * `play` pages (the "theorise about plays" strategy pages) classify by frontmatter only —
 * never by filename, because `PLAY` is a real US ticker and `wiki/play.md` would be ambiguous.
 */
export type PageType = 'ticker' | 'sector' | 'signal' | 'play' | 'review'

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

/**
 * Module-local navigation: the qualifiers gate list, the expanded two-material ticker route
 * (Approach C), or the full-route Reader. The Reader carries its origin so its breadcrumb
 * returns to wherever it was opened from (gate list vs a ticker route).
 */
export type View =
  | { kind: 'gate' }
  | { kind: 'ticker'; ticker: string }
  | { kind: 'reader'; relPath: string; from: 'gate' | { ticker: string } }

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
  /** Agent's qualitative conviction ranking (1–5) — advisory only, never a score input. */
  conviction: number | null
  /** Agent's qualitative risk read (low | moderate | high) — advisory only. */
  riskRating: string | null
  /** When the judgement was authored (`last_updated`, else `review_date`). */
  authoredDate: string | null
}

/** Market context for a ticker, where available (live price + 52-week high). */
export interface MarketStats {
  lastPrice: number | null
  high52: number | null
  /** (lastPrice − high52) / high52 — negative when below the 52-wk high; null if either missing. */
  fromHighPct: number | null
}

// ── Library (Stage 5) ────────────────────────────────────────────────────────
// The Library browses the brain's signal/play pages as cards. A signal card joins the wiki
// signal page (frontmatter, already indexed) with the canonical entry in
// `signal_library/signal_library.json` via `library_ref`. Flags are brain-sourced tickers
// decorated with engine PRESENCE only (`live` = currently in the play universe) — shown as
// chip styling, never folded into any combined figure.

/**
 * One record from `signal_library/signal_library.json` (canonical, authored outside the
 * app). Optional-tolerant: the JSON is external, so any field may be missing.
 */
export interface SignalLibraryEntry {
  signal_id?: string
  signal_name?: string
  source_ticker?: string
  sector?: string
  subsector?: string
  metric_to_check?: string
  danger_threshold?: string
  where_to_find?: string
  description?: string
  why_fundamentals_miss?: string
  lead_time_months?: number
  outcome_pct?: number
  outcome_period_months?: number
  applicable_sectors?: string[]
  [key: string]: unknown
}

/** The result of `reviews:signalLibrary` — the parsed canonical JSON, or empty when absent. */
export interface SignalLibraryResult {
  /** False when the JSON file is missing or unparseable (cards degrade to wiki-only). */
  available: boolean
  signals: SignalLibraryEntry[]
}

/** One ticker a signal currently flags, derived from the brain and decorated by the engine. */
export interface SignalFlag {
  /** Full display ticker, exchange suffix preserved. */
  ticker: string
  company: string | null
  /** The ticker page's gate verdict (brain-sourced; `unset` when unknown). */
  gate: Gate
  /** True when the ticker is currently in the play universe (engine presence only). */
  live: boolean
  /** The ticker page's `play_tags` — opaque qualitative labels, used only for filtering. */
  playTags: string[]
}

/** One Library signal card: wiki signal page ⋈ signal-library JSON ⋈ derived flags. */
export interface SignalCardModel {
  /** Brain-relative path of the wiki signal page (Reader target). */
  relPath: string
  /** File stem (e.g. `signal-client-concentration`) — the slug ticker pages link to. */
  slug: string
  name: string
  polarity: Polarity
  originTicker: string | null
  originSector: string | null
  /** Origin outcome over the post-mortem window (e.g. -45), from the library JSON. */
  outcomePct: number | null
  description: string | null
  metric: string | null
  danger: string | null
  leadTimeMonths: number | null
  /** Sectors the lesson applies to (library JSON, falling back to the page's sector). */
  appliesTo: string[]
  flags: SignalFlag[]
  lastUpdated: string | null
  libraryRef: string | null
}

/** One Library play card — light by design (no play pages exist in the brain yet). */
export interface PlayCardModel {
  relPath: string
  title: string
  lastUpdated: string | null
  /** Related page slugs from frontmatter (display chips; opaque). */
  related: string[]
}

// ── Dashboards (Stage 6) ─────────────────────────────────────────────────────
// The Dashboards tab reads across the same GateRow universe as the Reviews tab (overview vs
// working surface — kept deliberately distinct). Coverage STATUS derives from PRESENCE and
// date comparison only — play scores and gate verdicts pass through as separately-sourced
// fields, never combined into any figure.

/**
 * Coverage status for a row. Staleness is report-driven (locked 2026-06-12): a reviewed
 * qualifier is `stale` when a qualifying report landed after the judgement was authored.
 */
export type CoverageStatus = 'needs-review' | 'stale' | 'up-to-date' | 'unmatched'

/** One row in the Coverage dashboard table. */
export interface CoverageRow {
  ticker: string
  company: string | null
  play: number | null
  play2: number | null
  hasReview: boolean
  gate: Gate
  /** When the judgement was authored (brain `last_updated ?? review_date`). */
  lastReview: string | null
  status: CoverageStatus
}

/** One Gate board column: qualifiers + brain pages grouped by verdict. */
export interface GateBoardColumn {
  gate: Gate
  /** Column heading — the gate word, except `unset` which folds orphans + never-reviewed
   *  qualifiers and reads `unmatched / new` (wireframe). */
  label: string
  tickers: string[]
}

/** One Theme tracker row: a signal page with its current flag reach across the brain. */
export interface ThemeRow {
  slug: string
  relPath: string
  name: string
  polarity: Polarity
  /** Tickers this signal currently flags (the Library's brain-derived flag union). */
  flagCount: number
  /** Of those, how many are currently in the play universe (engine presence only). */
  liveCount: number
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
