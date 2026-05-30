import { ipcMain } from 'electron'
import type { ResultSetHeader } from 'mysql2/promise'
import { getPool } from './db'

// A normalised OHLCV bar parsed from a CSV.
interface ParsedBar {
  tradeDate: string // YYYY-MM-DD
  open: number | null
  high: number | null
  low: number | null
  close: number
  volume: number | null
}

// Maps a target field → the raw CSV header to read it from (used when the
// investing.com header isn't recognised and the user maps columns by hand).
type ColumnMap = Partial<Record<'date' | 'open' | 'high' | 'low' | 'close' | 'volume', string>>

interface PreviewArgs {
  ticker: string
  csv: string
  columnMap?: ColumnMap
}

interface PreviewResult {
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

// ── CSV parsing ─────────────────────────────────────────────────────────────

// Minimal quoted-CSV line splitter (handles "1,234.5" fields). No dependency.
function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

function parseNumber(raw: string): number | null {
  if (raw == null) return null
  const s = raw.replace(/["',\s]/g, '').replace(/%$/, '')
  if (s === '' || s === '-' || s.toUpperCase() === 'N/A') return null
  const m = /^(-?[\d.]+)([KMB])?$/i.exec(s)
  if (!m) {
    const n = Number(s)
    return Number.isFinite(n) ? n : null
  }
  let n = Number(m[1])
  const suffix = m[2]?.toUpperCase()
  if (suffix === 'K') n *= 1e3
  else if (suffix === 'M') n *= 1e6
  else if (suffix === 'B') n *= 1e9
  return Number.isFinite(n) ? n : null
}

// Decide MM/DD/YYYY vs DD/MM/YYYY from the data (max(part0)>12 ⇒ day-first).
// ISO YYYY-MM-DD is detected separately. Ambiguous → DD/MM (UK / investing.com EU).
function detectDateFormat(dateCells: string[]): string {
  let sawIso = false
  let firstMax = 0
  let secondMax = 0
  for (const cell of dateCells) {
    const c = cell.trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(c)) {
      sawIso = true
      continue
    }
    const parts = c.split(/[/-]/).map((p) => Number(p))
    if (parts.length >= 2) {
      if (parts[0] > firstMax) firstMax = parts[0]
      if (parts[1] > secondMax) secondMax = parts[1]
    }
  }
  if (sawIso) return 'YYYY-MM-DD'
  if (firstMax > 12) return 'DD/MM/YYYY'
  if (secondMax > 12) return 'MM/DD/YYYY'
  return 'DD/MM/YYYY'
}

function toIsoDate(raw: string, format: string): string | null {
  const c = raw.trim()
  if (format === 'YYYY-MM-DD') return c.slice(0, 10)
  const parts = c.split(/[/-]/).map((p) => p.trim())
  if (parts.length < 3) return null
  let day: string, month: string, year: string
  if (format === 'DD/MM/YYYY') {
    ;[day, month, year] = parts
  } else {
    ;[month, day, year] = parts
  }
  if (year.length === 2) year = `20${year}`
  const d = day.padStart(2, '0')
  const m = month.padStart(2, '0')
  if (d.length !== 2 || m.length !== 2 || year.length !== 4) return null
  return `${year}-${m}-${d}`
}

const INVESTING_HEADER: Record<string, string> = {
  date: 'date',
  price: 'close', // investing.com 'Price' is the close
  open: 'open',
  high: 'high',
  low: 'low',
  'vol.': 'volume',
  volume: 'volume'
}

// Build a target-field → column-index map. Returns null if required fields missing.
function buildColumnIndex(
  headers: string[],
  columnMap?: ColumnMap
): { idx: Record<string, number>; variant: 'investing_com' | 'mapped' } | null {
  const lower = headers.map((h) => h.toLowerCase().trim())
  const idx: Record<string, number> = {}

  if (columnMap) {
    for (const [target, rawHeader] of Object.entries(columnMap)) {
      if (!rawHeader) continue
      const i = headers.findIndex((h) => h === rawHeader)
      if (i >= 0) idx[target] = i
    }
    if (idx.date === undefined || idx.close === undefined) return null
    return { idx, variant: 'mapped' }
  }

  lower.forEach((h, i) => {
    const target = INVESTING_HEADER[h]
    if (target && idx[target] === undefined) idx[target] = i
  })
  // investing.com requires at least Date + Price(close) + OHL
  if (
    idx.date === undefined ||
    idx.close === undefined ||
    idx.open === undefined ||
    idx.high === undefined ||
    idx.low === undefined
  ) {
    return null
  }
  return { idx, variant: 'investing_com' }
}

function parseCsv(csv: string, columnMap?: ColumnMap): Omit<PreviewResult, 'overwrites'> {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) {
    return {
      recognised: false,
      variant: null,
      dateFormat: null,
      count: 0,
      from: null,
      to: null,
      sample: [],
      rows: [],
      rawHeaders: lines.length === 1 ? splitCsvLine(lines[0]) : []
    }
  }
  const rawHeaders = splitCsvLine(lines[0])
  const built = buildColumnIndex(rawHeaders, columnMap)
  if (!built) {
    return {
      recognised: false,
      variant: null,
      dateFormat: null,
      count: 0,
      from: null,
      to: null,
      sample: [],
      rows: [],
      rawHeaders
    }
  }

  const { idx, variant } = built
  const dataLines = lines.slice(1)
  const dateCells = dataLines.map((l) => splitCsvLine(l)[idx.date] ?? '')
  const dateFormat = detectDateFormat(dateCells)

  const rows: ParsedBar[] = []
  for (const line of dataLines) {
    const cols = splitCsvLine(line)
    const tradeDate = toIsoDate(cols[idx.date] ?? '', dateFormat)
    const close = idx.close !== undefined ? parseNumber(cols[idx.close] ?? '') : null
    if (!tradeDate || close === null) continue
    rows.push({
      tradeDate,
      open: idx.open !== undefined ? parseNumber(cols[idx.open] ?? '') : null,
      high: idx.high !== undefined ? parseNumber(cols[idx.high] ?? '') : null,
      low: idx.low !== undefined ? parseNumber(cols[idx.low] ?? '') : null,
      close,
      volume: idx.volume !== undefined ? parseNumber(cols[idx.volume] ?? '') : null
    })
  }
  rows.sort((a, b) => a.tradeDate.localeCompare(b.tradeDate))

  return {
    recognised: rows.length > 0,
    variant,
    dateFormat,
    count: rows.length,
    from: rows.length > 0 ? rows[0].tradeDate : null,
    to: rows.length > 0 ? rows[rows.length - 1].tradeDate : null,
    sample: rows.slice(0, 10),
    rows,
    rawHeaders
  }
}

// ── Handlers ─────────────────────────────────────────────────────────────────

const UPSERT_BAR_SQL = `
  INSERT INTO fact_historical_prices
    (ticker, trade_date, open_price, high_price, low_price, close_price,
     adj_close_price, volume, source, source_run_id)
  VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 'manual_investingcom', ?)
  ON DUPLICATE KEY UPDATE
    open_price = VALUES(open_price), high_price = VALUES(high_price),
    low_price = VALUES(low_price), close_price = VALUES(close_price),
    adj_close_price = VALUES(adj_close_price), volume = VALUES(volume),
    source = VALUES(source), source_run_id = VALUES(source_run_id)
`

export function registerArchiveHandlers(): void {
  ipcMain.handle(
    'archive:previewPriceCsv',
    async (_, { ticker, csv, columnMap }: PreviewArgs): Promise<PreviewResult> => {
      const parsed = parseCsv(csv, columnMap)
      let overwrites = 0
      const pool = getPool()
      if (pool && parsed.rows.length > 0 && parsed.from && parsed.to) {
        const [rows] = await pool.execute(
          `SELECT COUNT(*) AS n FROM fact_historical_prices
           WHERE ticker = ? AND trade_date BETWEEN ? AND ?`,
          [ticker, parsed.from, parsed.to]
        )
        overwrites = Number((rows as { n: number }[])[0]?.n ?? 0)
      }
      return { ...parsed, overwrites }
    }
  )

  ipcMain.handle(
    'archive:importPriceCsv',
    async (
      _,
      { ticker, rows }: { ticker: string; rows: ParsedBar[] }
    ): Promise<{ rowsInserted: number; rowsUpdated: number; runId: number }> => {
      const pool = getPool()
      if (!pool) throw new Error('Database not initialised')
      if (rows.length === 0) throw new Error('No rows to import')

      const from = rows[0].tradeDate
      const to = rows[rows.length - 1].tradeDate
      const conn = await pool.getConnection()
      try {
        await conn.beginTransaction()
        const [runRes] = await conn.execute(
          `INSERT INTO dim_price_runs
             (ticker, source, requested_from, requested_to, status, triggered_by)
           VALUES (?, 'manual_investingcom', ?, ?, 'running', 'manual_upload')`,
          [ticker, from, to]
        )
        const runId = (runRes as ResultSetHeader).insertId

        let inserted = 0
        let updated = 0
        for (const r of rows) {
          const [res] = await conn.execute(UPSERT_BAR_SQL, [
            ticker,
            r.tradeDate,
            r.open,
            r.high,
            r.low,
            r.close,
            r.volume,
            runId
          ])
          const affected = (res as ResultSetHeader).affectedRows
          if (affected === 1) inserted++
          else if (affected === 2) updated++
        }

        await conn.execute(
          `UPDATE dim_price_runs SET rows_inserted = ?, rows_updated = ?, status = 'ok',
             finished_at = NOW() WHERE run_id = ?`,
          [inserted, updated, runId]
        )
        await conn.commit()
        return { rowsInserted: inserted, rowsUpdated: updated, runId }
      } catch (err) {
        await conn.rollback()
        throw err
      } finally {
        conn.release()
      }
    }
  )
}
