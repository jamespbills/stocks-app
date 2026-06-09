// Price Archive — shared types.
// Note the mysql2 runtime quirks (tasks/lessons.md): DATE columns arrive as JS
// Date objects, DECIMAL columns as strings. Adapters normalise at the row boundary.

export type PriceSource = 'yfinance' | 'manual_investingcom' | 'manual_csv' | 'yfinance_weekly'
export type CoverageStatus = 'fresh' | 'stale' | 'partial' | 'missing'
export type TrackedSource = 'manual_watch' | 'isa_holding'
export type ClaimSource = 'play_universe' | TrackedSource
export type RunStatus = 'running' | 'ok' | 'partial' | 'failed' | 'no_data'
export type TriggeredBy =
  | 'coverage_build'
  | 'single_ticker'
  | 'manual_upload'
  | 'watchlist_refresh'
  | 'scheduled'

// One row in the coverage log: a ticker the archive should cover, with its target
// window, what's actually held, and a derived status.
export interface CoverageRow {
  ticker: string
  sources: ClaimSource[] // which claim(s) put this ticker in scope
  targetFrom: string | null // ISO date
  targetTo: string | null // null = ongoing (resolved to today)
  firstHeld: string | null // MIN(trade_date) actually in archive
  lastHeld: string | null // MAX(trade_date) actually in archive
  barCount: number
  manualBarCount: number
  lastRunAt: string | null // latest dim_price_runs.finished_at
  status: CoverageStatus
  note: string | null
}

export interface PriceRun {
  runId: number
  ticker: string
  source: PriceSource
  requestedFrom: string | null
  requestedTo: string | null
  rowsInserted: number
  rowsUpdated: number
  status: RunStatus
  errorMessage: string | null
  triggeredBy: TriggeredBy
  startedAt: string | null
  finishedAt: string | null
}

export interface ArchiveSettings {
  playLeadDays: number
  playTrailDays: number
  staleAfterDays: number
  isaHistoryStart: string
  manualWatchLookbackDays: number
}

// ── Manual CSV import ──

// A normalised OHLCV bar parsed from a CSV (matches the main-process parser).
export interface ParsedBar {
  tradeDate: string // YYYY-MM-DD
  open: number | null
  high: number | null
  low: number | null
  close: number
  volume: number | null
}

export type ColumnTarget = 'date' | 'open' | 'high' | 'low' | 'close' | 'volume'
export type ColumnMap = Partial<Record<ColumnTarget, string>>

export interface CsvPreview {
  recognised: boolean
  variant: 'investing_com' | 'mapped' | null
  dateFormat: string | null
  count: number
  from: string | null
  to: string | null
  sample: ParsedBar[]
  rows: ParsedBar[]
  rawHeaders: string[]
  overwrites: number
}

export interface CsvImportResult {
  rowsInserted: number
  rowsUpdated: number
  runId: number
}

// A row in app_tracked_tickers — a ticker tracked beyond the play universe.
export interface TrackedTicker {
  id: number
  ticker: string
  source: TrackedSource
  coverFrom: string | null // null = inherited/fallback start
  coverTo: string | null // null = ongoing
  reason: string | null
  isActive: boolean
}

// One OHLCV bar — the shape returned by the shared price-series read (adapters/prices.ts).
export interface PriceBar {
  tradeDate: string
  open: number | null
  high: number | null
  low: number | null
  close: number
  adjClose: number | null
  volume: number | null
}

// One weekly close bar (fact_weekly_prices) — feeds the TA weekly-MA overlay.
// weekDate is the yfinance week-start label (Monday).
export interface WeeklyBar {
  weekDate: string
  close: number
}

// Streaming events emitted by archive_prices.py (line-delimited JSON on stdout).
export type ArchiveEvent =
  | { type: 'progress'; current: number; total: number; ticker?: string }
  | { type: 'ticker_done'; ticker: string; status: 'ok' | 'no_data' | 'failed'; bars: number }
  | { type: 'log'; message: string }
  | { type: 'stderr'; message: string }
  | { type: 'final'; payload: { summary: ArchiveBuildSummary } }

export interface ArchiveBuildSummary {
  tickers: number
  ok: number
  no_data: number
  failed: number
  failed_tickers: string[]
}
