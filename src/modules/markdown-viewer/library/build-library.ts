// Pure Library builders: wiki signal/play pages → browsable cards. No fs, no IPC, no
// gray-matter — runs in Vitest on in-memory entries and in the renderer on the brain index.
//
// Decoupling locks honoured here:
// - A flag's `live` field records engine PRESENCE only (the ticker currently qualifies in
//   the play universe). It decorates chip styling; nothing numeric and qualitative is merged.
// - `play_tags` are opaque strings compared with `===` — never parsed into engine ids.

import { effectiveGate, tickerKey } from '../ticker'
import type {
  GateRow,
  PlayCardModel,
  ReviewEntry,
  SignalCardModel,
  SignalFlag,
  SignalLibraryEntry
} from '../types'

/** The filename stem of a brain-relative path (`wiki/signal-yield-trap.md` → `signal-yield-trap`). */
function fileStem(relPath: string): string {
  const posix = relPath.replace(/\\/g, '/')
  return posix.slice(posix.lastIndexOf('/') + 1).replace(/\.md$/i, '')
}

function strOrNull(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null
}

function numOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/**
 * Derive the tickers a signal flags: the union of the signal page's own `tickers:`
 * frontmatter and every ticker page whose `related` list contains the signal's slug —
 * deduped on the full ticker key (suffix preserved, per the gate-matching lesson). Each
 * flag is decorated from the brain ticker page (company/gate/play_tags) and from the gate
 * rows (`live` = currently in the play universe; company fallback).
 */
function deriveFlags(
  signal: ReviewEntry,
  tickerPagesByKey: Map<string, ReviewEntry>,
  gateRowsByKey: Map<string, GateRow>
): SignalFlag[] {
  const slug = fileStem(signal.relPath)
  const keys = new Map<string, string>() // tickerKey → display ticker as first seen

  for (const t of signal.frontmatter.tickers ?? []) {
    const key = tickerKey(t)
    if (key !== '' && !keys.has(key)) keys.set(key, t.trim().toUpperCase())
  }
  for (const [key, page] of tickerPagesByKey) {
    if (keys.has(key)) continue
    if ((page.frontmatter.related ?? []).includes(slug)) {
      keys.set(key, page.frontmatter.ticker ?? page.ticker?.canonical ?? key)
    }
  }

  const flags: SignalFlag[] = []
  for (const [key, display] of keys) {
    const page = tickerPagesByKey.get(key)
    const row = gateRowsByKey.get(key)
    flags.push({
      ticker: row?.ticker ?? page?.frontmatter.ticker ?? display,
      company: row?.company ?? page?.frontmatter.company ?? null,
      gate: row?.brain?.gate ?? (page ? effectiveGate(page.frontmatter) : 'unset'),
      live: row?.numeric?.qualifies === true,
      playTags: page?.frontmatter.play_tags ?? []
    })
  }

  // Live flags first, then alphabetical — the tripwire reads left-to-right by urgency.
  return flags.sort((a, b) => {
    if (a.live !== b.live) return a.live ? -1 : 1
    return a.ticker.localeCompare(b.ticker)
  })
}

/**
 * Build the Library's signal cards: every wiki signal page, joined to its canonical
 * `signal_library` JSON entry via `library_ref` (pages without a match render from
 * frontmatter alone), with flags derived from the brain and decorated by the engine.
 * Sorted by outcome severity (`outcome_pct` ascending — worst first), nulls last.
 */
export function buildSignalCards(
  entries: ReviewEntry[],
  library: SignalLibraryEntry[],
  gateRows: GateRow[]
): SignalCardModel[] {
  const libraryById = new Map<string, SignalLibraryEntry>()
  for (const s of library) {
    if (typeof s.signal_id === 'string' && !libraryById.has(s.signal_id)) {
      libraryById.set(s.signal_id, s)
    }
  }

  const tickerPagesByKey = new Map<string, ReviewEntry>()
  for (const e of entries) {
    if (e.pageType !== 'ticker') continue
    const key = tickerKey(e.frontmatter.ticker ?? e.ticker?.canonical ?? '')
    if (key !== '' && !tickerPagesByKey.has(key)) tickerPagesByKey.set(key, e)
  }

  const gateRowsByKey = new Map<string, GateRow>()
  for (const r of gateRows) {
    const key = tickerKey(r.ticker)
    if (key !== '' && !gateRowsByKey.has(key)) gateRowsByKey.set(key, r)
  }

  const cards: SignalCardModel[] = []
  for (const e of entries) {
    if (e.pageType !== 'signal') continue
    const fm = e.frontmatter
    const ref = strOrNull(fm.library_ref)
    const lib = ref ? libraryById.get(ref) : undefined

    const appliesTo = (lib?.applicable_sectors ?? []).filter((s) => typeof s === 'string')
    const pageSector = strOrNull(fm.sector)
    if (appliesTo.length === 0 && pageSector) appliesTo.push(pageSector)

    cards.push({
      relPath: e.relPath,
      slug: fileStem(e.relPath),
      name: strOrNull(fm.signal_name) ?? strOrNull(lib?.signal_name) ?? e.title,
      polarity: fm.polarity === 'encouraging' ? 'encouraging' : 'warning',
      originTicker: strOrNull(fm.origin_ticker) ?? strOrNull(lib?.source_ticker),
      originSector: strOrNull(lib?.sector) ?? pageSector,
      outcomePct: numOrNull(lib?.outcome_pct),
      description: strOrNull(lib?.description),
      metric: strOrNull(lib?.metric_to_check),
      danger: strOrNull(lib?.danger_threshold),
      leadTimeMonths: numOrNull(lib?.lead_time_months),
      appliesTo,
      flags: deriveFlags(e, tickerPagesByKey, gateRowsByKey),
      lastUpdated: strOrNull(fm.last_updated),
      libraryRef: ref
    })
  }

  return cards.sort((a, b) => {
    if (a.outcomePct === null && b.outcomePct === null) return a.name.localeCompare(b.name)
    if (a.outcomePct === null) return 1
    if (b.outcomePct === null) return -1
    if (a.outcomePct !== b.outcomePct) return a.outcomePct - b.outcomePct
    return a.name.localeCompare(b.name)
  })
}

/** Build the Plays segment's cards — light by design; sorted by title. */
export function buildPlayCards(entries: ReviewEntry[]): PlayCardModel[] {
  return entries
    .filter((e) => e.pageType === 'play')
    .map((e) => ({
      relPath: e.relPath,
      title: e.title,
      lastUpdated: strOrNull(e.frontmatter.last_updated),
      related: (e.frontmatter.related ?? []).filter((r) => typeof r === 'string')
    }))
    .sort((a, b) => a.title.localeCompare(b.title))
}

/** Sector filter options: union of every card's applies-to sectors + origin sector, sorted. */
export function sectorOptions(cards: SignalCardModel[]): string[] {
  const set = new Set<string>()
  for (const c of cards) {
    for (const s of c.appliesTo) set.add(s)
    if (c.originSector) set.add(c.originSector)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

/** Play-tag filter options: union of `play_tags` across the brain's ticker pages (opaque). */
export function playTagOptions(entries: ReviewEntry[]): string[] {
  const set = new Set<string>()
  for (const e of entries) {
    if (e.pageType !== 'ticker') continue
    for (const t of e.frontmatter.play_tags ?? []) {
      if (typeof t === 'string' && t.trim() !== '') set.add(t)
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

/** A card matches a sector when the lesson applies to it or originated in it. */
export function matchesSector(card: SignalCardModel, sector: string): boolean {
  return card.appliesTo.includes(sector) || card.originSector === sector
}

/**
 * A card matches a play tag when any flagged ticker's page carries that tag — "the lessons
 * currently touching my <tag> names". Opaque string equality only.
 */
export function matchesPlayTag(card: SignalCardModel, tag: string): boolean {
  return card.flags.some((f) => f.playTags.includes(tag))
}
