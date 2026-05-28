import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement
} from 'react'
import { createPortal } from 'react-dom'

export interface ScriptsModalInitial {
  section: 'disregard'
  ticker: string
  year: string
  filing: 'A' | 'H'
  date: string
}

interface ScriptsModalProps {
  onClose: () => void
  onMutate: () => void
  initial?: ScriptsModalInitial
}

type RunSection = 'scan' | 'disregard' | 'delist'
type LookupState = 'idle' | 'loading' | 'not-found' | 'found'
type RunState = 'running' | 'done' | 'failed'

interface RunStatus {
  section: RunSection
  pid: number
  state: RunState
  exitCode: number | null
}

interface LogLine {
  stream: 'stdout' | 'stderr'
  text: string
}

const inputStyle: CSSProperties = {
  background: 'var(--color-bg-input)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 5,
  color: 'var(--color-text-primary)',
  fontSize: 12.5,
  fontFamily: 'inherit',
  padding: '4px 7px',
  outline: 'none',
  height: 28,
  boxSizing: 'border-box'
}

const ghostButtonStyle: CSSProperties = {
  padding: '4px 10px',
  height: 28,
  borderRadius: 5,
  border: '1px solid var(--color-border-strong)',
  background: 'transparent',
  color: 'var(--color-text-primary)',
  fontSize: 12,
  cursor: 'pointer',
  fontFamily: 'inherit',
  boxSizing: 'border-box'
}

const primaryButtonStyle: CSSProperties = {
  ...ghostButtonStyle,
  color: 'var(--color-text-primary)',
  background: 'var(--color-interactive-active)',
  borderColor: 'var(--color-border-focus)'
}

const iconButtonStyle: CSSProperties = {
  width: 28,
  height: 28,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 4,
  border: 'none',
  background: 'transparent',
  color: 'var(--color-text-muted)',
  fontSize: 18,
  cursor: 'pointer',
  flexShrink: 0,
  lineHeight: 1
}

const labelStyle: CSSProperties = {
  fontSize: 10.5,
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  color: 'var(--color-text-muted)',
  display: 'block',
  marginBottom: 4,
  fontFamily: 'inherit'
}

const sectionTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--color-text-primary)',
  marginBottom: 4
}

const sectionDescStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--color-text-secondary)',
  marginBottom: 10,
  lineHeight: 1.5
}

const sectionStyle: CSSProperties = {
  padding: '14px 16px',
  borderBottom: '1px solid var(--color-border-subtle)'
}

const hintStyle: CSSProperties = {
  fontSize: 11.5,
  color: 'var(--color-text-muted)',
  marginTop: 6,
  fontFamily: 'var(--font-mono)'
}

const errorTextStyle: CSSProperties = {
  fontSize: 11.5,
  color: 'var(--color-danger)',
  marginTop: 6
}

const VALID_DATE = /^\d{4}-\d{2}-\d{2}$/

function isValidDate(value: string): boolean {
  if (!VALID_DATE.test(value)) return false
  return !isNaN(new Date(value).getTime())
}

function isValidYear(value: string): boolean {
  const n = Number(value)
  return Number.isInteger(n) && n >= 1900 && n <= 2100
}

interface LookupRow {
  next_expected_filing: string | null
  relevant_date: string | Date | null
}

function toDateString(val: string | Date | null): string {
  if (!val) return ''
  if (val instanceof Date) {
    return `${val.getFullYear()}-${String(val.getMonth() + 1).padStart(2, '0')}-${String(val.getDate()).padStart(2, '0')}`
  }
  // mysql DATE often returns "YYYY-MM-DD" string already
  return String(val).slice(0, 10)
}

export function ScriptsModal({ onClose, onMutate, initial }: ScriptsModalProps): ReactElement {
  // Run state (shared across the three sections — only one runs at a time)
  const [run, setRun] = useState<RunStatus | null>(null)
  const [logLines, setLogLines] = useState<LogLine[]>([])
  const runRef = useRef<RunStatus | null>(null)
  useEffect(() => {
    runRef.current = run
  }, [run])

  // Section B — Disregard
  const [dTicker, setDTicker] = useState(initial?.ticker ?? '')
  const [dYear, setDYear] = useState(initial?.year ?? '')
  const [dFiling, setDFiling] = useState<'A' | 'H'>(initial?.filing ?? 'A')
  const [dDate, setDDate] = useState(initial?.date ?? '')
  const [dLookup, setDLookup] = useState<LookupState>(initial ? 'found' : 'idle')

  // Section C — Delist
  const [xTicker, setXTicker] = useState('')
  const [xDate, setXDate] = useState('')
  const [xPrice, setXPrice] = useState('')
  const [xCompany, setXCompany] = useState<string | null>(null)
  const [xLastPrice, setXLastPrice] = useState<string | null>(null)
  const [xLookup, setXLookup] = useState<LookupState>('idle')

  const logBodyRef = useRef<HTMLDivElement>(null)
  const disregardRunRef = useRef<HTMLButtonElement>(null)

  // Focus the Disregard Run button when opened with pre-filled context
  useEffect(() => {
    if (initial) {
      // small delay so the portal mounts first
      const t = setTimeout(() => disregardRunRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
    return undefined
  }, [initial])

  // Escape to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Subscribe to script output / exit once on mount
  useEffect(() => {
    const unsubOut = window.electronAPI.scripts.onOutput((pid, line, stream) => {
      if (runRef.current?.pid !== pid) return
      setLogLines((prev) => [...prev, { stream, text: line }])
    })
    const unsubExit = window.electronAPI.scripts.onExit((pid, code) => {
      if (runRef.current?.pid !== pid) return
      const finished: RunStatus = {
        ...runRef.current,
        state: code === 0 ? 'done' : 'failed',
        exitCode: code
      }
      setRun(finished)
      if (code === 0) onMutate()
    })
    return () => {
      unsubOut()
      unsubExit()
    }
  }, [onMutate])

  // Auto-scroll the log panel
  useEffect(() => {
    const el = logBodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [logLines])

  const isRunning = run?.state === 'running'

  const launch = useCallback(
    async (section: RunSection, scriptName: string, args: string[]) => {
      if (isRunning) return
      setLogLines([])
      try {
        const pid = await window.electronAPI.scripts.launchBuiltin(scriptName, args)
        setRun({ section, pid, state: 'running', exitCode: null })
      } catch (err) {
        setRun({ section, pid: -1, state: 'failed', exitCode: -1 })
        setLogLines([{ stream: 'stderr', text: err instanceof Error ? err.message : String(err) }])
      }
    },
    [isRunning]
  )

  // ---- Section B: Disregard lookup ----
  const lookupDisregard = useCallback(async (rawTicker: string) => {
    const t = rawTicker.trim().toUpperCase()
    if (!t) {
      setDLookup('idle')
      return
    }
    setDLookup('loading')
    try {
      const rows = (await window.electronAPI.db.query(
        `SELECT vec.next_expected_filing,
                COALESCE(ado.actual_date, vec.relevant_date) AS relevant_date
         FROM view_earnings_calendar vec
         LEFT JOIN app_date_overrides ado USING (ticker)
         WHERE vec.ticker = ?
           AND vec.is_past_grace_period = 0
           AND vec.is_already_reviewed = 0
         ORDER BY COALESCE(ado.actual_date, vec.relevant_date) ASC
         LIMIT 1`,
        [t]
      )) as LookupRow[]
      if (rows.length === 0) {
        setDLookup('not-found')
        return
      }
      const r = rows[0]
      const date = toDateString(r.relevant_date)
      if (date) {
        setDDate(date)
        setDYear(date.slice(0, 4))
      }
      if (r.next_expected_filing === 'A' || r.next_expected_filing === 'H') {
        setDFiling(r.next_expected_filing)
      }
      setDLookup('found')
    } catch {
      setDLookup('idle')
    }
  }, [])

  const handleDisregardRun = useCallback(() => {
    const t = dTicker.trim().toUpperCase()
    if (!t || !isValidYear(dYear) || !isValidDate(dDate)) return
    void launch('disregard', 'disregard_report', [t, dYear, dFiling, dDate])
  }, [dTicker, dYear, dFiling, dDate, launch])

  const disregardCanRun = useMemo(
    () => Boolean(dTicker.trim()) && isValidYear(dYear) && isValidDate(dDate) && !isRunning,
    [dTicker, dYear, dDate, isRunning]
  )

  // ---- Section C: Delist lookup ----
  const lookupDelist = useCallback(async (rawTicker: string) => {
    const t = rawTicker.trim().toUpperCase()
    if (!t) {
      setXLookup('idle')
      setXCompany(null)
      setXLastPrice(null)
      return
    }
    setXLookup('loading')
    try {
      const companyRows = (await window.electronAPI.db.query(
        `SELECT name FROM dim_companies WHERE UPPER(ticker) = ? LIMIT 1`,
        [t]
      )) as { name: string }[]
      if (companyRows.length === 0) {
        setXLookup('not-found')
        setXCompany(null)
        setXLastPrice(null)
        return
      }
      setXCompany(companyRows[0].name)
      const priceRows = (await window.electronAPI.db.query(
        `SELECT live_price, DATE_FORMAT(updated_at, '%Y-%m-%d') AS as_of
         FROM dim_live_prices WHERE ticker = ? LIMIT 1`,
        [t]
      )) as { live_price: string | number | null; as_of: string | null }[]
      if (priceRows.length > 0 && priceRows[0].live_price != null) {
        const p = Number(priceRows[0].live_price)
        const asOf = priceRows[0].as_of ?? ''
        setXLastPrice(`${p.toFixed(4)}${asOf ? ` (as of ${asOf})` : ''}`)
      } else {
        setXLastPrice(null)
      }
      setXLookup('found')
    } catch {
      setXLookup('idle')
    }
  }, [])

  const handleDelistRun = useCallback(() => {
    const t = xTicker.trim().toUpperCase()
    const priceNum = Number(xPrice)
    if (!t || !isValidDate(xDate) || !Number.isFinite(priceNum) || priceNum <= 0) return
    void launch('delist', 'update_delisted', [t, xDate, priceNum.toString()])
  }, [xTicker, xDate, xPrice, launch])

  const delistCanRun = useMemo(() => {
    const priceNum = Number(xPrice)
    return (
      Boolean(xTicker.trim()) &&
      isValidDate(xDate) &&
      Number.isFinite(priceNum) &&
      priceNum > 0 &&
      !isRunning
    )
  }, [xTicker, xDate, xPrice, isRunning])

  // ---- Run status header for log panel ----
  const statusText = useMemo(() => {
    if (!run) return 'No script run yet'
    if (run.state === 'running') return `Running · ${labelFor(run.section)} · pid ${run.pid}`
    if (run.state === 'done') return `Done · ${labelFor(run.section)} · exit 0`
    return `Failed · ${labelFor(run.section)} · exit ${run.exitCode ?? '?'}`
  }, [run])

  const statusColor =
    run?.state === 'done'
      ? 'var(--color-success, var(--color-text-primary))'
      : run?.state === 'failed'
        ? 'var(--color-danger)'
        : 'var(--color-text-muted)'

  const modal = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 'var(--z-modal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 680,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-bg-overlay)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 10,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px 16px',
            borderBottom: '1px solid var(--color-border-subtle)',
            flexShrink: 0
          }}
        >
          <span
            style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', flex: 1 }}
          >
            Calendar scripts
          </span>
          <button onClick={onClose} style={iconButtonStyle} aria-label="Close">
            ×
          </button>
        </div>

        {/* Sections */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Section A — Earnings scanner */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Refresh earnings dates</div>
            <div style={sectionDescStyle}>
              Pulls latest earnings dates from Finnhub + FMP into{' '}
              <code style={{ fontFamily: 'var(--font-mono)' }}>earnings_calendar_tracking</code>.
              Takes ~1–2 minutes.
            </div>
            <button
              onClick={() => void launch('scan', 'earnings_scanner', [])}
              disabled={isRunning}
              style={{
                ...primaryButtonStyle,
                opacity: isRunning ? 0.5 : 1,
                cursor: isRunning ? 'not-allowed' : 'pointer'
              }}
            >
              {isRunning && run?.section === 'scan' ? 'Running…' : 'Run scanner'}
            </button>
          </div>

          {/* Section B — Disregard report */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Disregard a report</div>
            <div style={sectionDescStyle}>
              Removes a pending report from the countdown. Type a ticker — year, filing, and date
              auto-fill from the calendar where available.
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 90px 90px 150px',
                gap: 10,
                alignItems: 'end'
              }}
            >
              <div>
                <span style={labelStyle}>Ticker</span>
                <input
                  type="text"
                  value={dTicker}
                  placeholder="TICKER"
                  onChange={(e) => {
                    setDTicker(e.target.value.toUpperCase())
                    setDLookup('idle')
                  }}
                  onBlur={(e) => void lookupDisregard(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  }}
                  style={{ ...inputStyle, width: '100%', fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div>
                <span style={labelStyle}>Year</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={dYear}
                  placeholder="2025"
                  onChange={(e) => setDYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  style={{ ...inputStyle, width: '100%', fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div>
                <span style={labelStyle}>Filing</span>
                <select
                  value={dFiling}
                  onChange={(e) => setDFiling(e.target.value as 'A' | 'H')}
                  style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}
                >
                  <option value="A">A — Annual</option>
                  <option value="H">H — Semi</option>
                </select>
              </div>
              <div>
                <span style={labelStyle}>Release date</span>
                <input
                  type="date"
                  value={dDate}
                  onChange={(e) => setDDate(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
              <button
                ref={disregardRunRef}
                onClick={handleDisregardRun}
                disabled={!disregardCanRun}
                style={{
                  ...primaryButtonStyle,
                  opacity: disregardCanRun ? 1 : 0.5,
                  cursor: disregardCanRun ? 'pointer' : 'not-allowed'
                }}
              >
                {isRunning && run?.section === 'disregard' ? 'Running…' : 'Disregard'}
              </button>
              {dLookup === 'loading' && <span style={hintStyle}>Looking up pending report…</span>}
              {dLookup === 'found' && (
                <span style={hintStyle}>Pre-filled from view_earnings_calendar</span>
              )}
              {dLookup === 'not-found' && (
                <span style={hintStyle}>
                  No pending report for this ticker — enter year / filing / date manually.
                </span>
              )}
            </div>
          </div>

          {/* Section C — Mark delisted */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Mark a company delisted</div>
            <div style={sectionDescStyle}>
              Sets <code style={{ fontFamily: 'var(--font-mono)' }}>is_active = 0</code> on the
              company and recalculates return metrics from the delisting price.
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 150px 110px',
                gap: 10,
                alignItems: 'end'
              }}
            >
              <div>
                <span style={labelStyle}>Ticker</span>
                <input
                  type="text"
                  value={xTicker}
                  placeholder="TICKER"
                  onChange={(e) => {
                    setXTicker(e.target.value.toUpperCase())
                    setXLookup('idle')
                    setXCompany(null)
                    setXLastPrice(null)
                  }}
                  onBlur={(e) => void lookupDelist(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  }}
                  style={{ ...inputStyle, width: '100%', fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div>
                <span style={labelStyle}>Delisting date</span>
                <input
                  type="date"
                  value={xDate}
                  onChange={(e) => setXDate(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>
              <div>
                <span style={labelStyle}>Delisting price</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={xPrice}
                  placeholder="0.00"
                  onChange={(e) => setXPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                  style={{ ...inputStyle, width: '100%', fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
              <button
                onClick={handleDelistRun}
                disabled={!delistCanRun}
                style={{
                  ...primaryButtonStyle,
                  opacity: delistCanRun ? 1 : 0.5,
                  cursor: delistCanRun ? 'pointer' : 'not-allowed'
                }}
              >
                {isRunning && run?.section === 'delist' ? 'Running…' : 'Mark delisted'}
              </button>
              {xLookup === 'loading' && <span style={hintStyle}>Validating ticker…</span>}
              {xLookup === 'found' && xCompany && (
                <span style={hintStyle}>
                  {xCompany}
                  {xLastPrice && ` · last live price ${xLastPrice}`}
                </span>
              )}
              {xLookup === 'not-found' && (
                <span style={errorTextStyle}>Ticker not found in dim_companies</span>
              )}
            </div>
          </div>

          {/* Log panel */}
          <div style={{ padding: '12px 16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 6
              }}
            >
              <span
                style={{
                  fontSize: 10.5,
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                  color: statusColor,
                  fontFamily: 'var(--font-mono)',
                  flex: 1
                }}
              >
                {statusText}
              </span>
              {logLines.length > 0 && (
                <button
                  onClick={() => setLogLines([])}
                  disabled={isRunning}
                  style={{
                    ...ghostButtonStyle,
                    height: 22,
                    fontSize: 11,
                    padding: '2px 8px',
                    opacity: isRunning ? 0.5 : 1
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            <div
              ref={logBodyRef}
              style={{
                height: 180,
                overflowY: 'auto',
                background: 'var(--color-bg-input)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 5,
                padding: 8,
                fontFamily: 'var(--font-mono)',
                fontSize: 11.5,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {logLines.length === 0 ? (
                <span style={{ color: 'var(--color-text-muted)' }}>
                  Output from the running script will appear here.
                </span>
              ) : (
                logLines.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      color:
                        line.stream === 'stderr'
                          ? 'var(--color-danger)'
                          : 'var(--color-text-secondary)'
                    }}
                  >
                    {line.text}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body) as ReactElement
}

function labelFor(section: RunSection): string {
  if (section === 'scan') return 'Earnings scanner'
  if (section === 'disregard') return 'Disregard'
  return 'Delist'
}
