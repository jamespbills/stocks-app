import { useState, useEffect, useCallback, useRef, useMemo, type ReactElement } from 'react'
import { useIpcQuery } from '../../hooks/useIpcQuery'
import { useRouter } from '../../hooks/use-router'
import { StatusBanner } from '../../components/StatusBanner'
import { WatchingTable } from './WatchingTable'
import { TickerDetailPanel } from './TickerDetailPanel'
import type { WatchingRow, SortState } from './types'

const WATCHING_SQL = `
  SELECT vw.*, dc.name AS company, dc.sector
  FROM view_watching vw
  JOIN dim_companies dc USING (ticker)
`

const PORTFOLIO_SQL = `SELECT ticker FROM app_portfolio`

function isStale(rows: WatchingRow[]): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (const row of rows) {
    if (row.price_updated_at) {
      const updated = new Date(row.price_updated_at)
      updated.setHours(0, 0, 0, 0)
      if (updated < today) return true
    }
  }
  return false
}

function latestUpdateTime(rows: WatchingRow[]): string | null {
  let latest: Date | null = null
  for (const row of rows) {
    if (row.price_updated_at) {
      const d = new Date(row.price_updated_at)
      if (!latest || d > latest) latest = d
    }
  }
  if (!latest) return null
  return latest.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

type PortfolioRow = { ticker: string }

export default function WatchingDashboard(): ReactElement {
  const { navigate } = useRouter()

  const {
    data: rows,
    loading,
    error,
    refetch: refetchWatching
  } = useIpcQuery<WatchingRow[]>(WATCHING_SQL)

  const { data: portfolioRows, refetch: refetchPortfolio } =
    useIpcQuery<PortfolioRow[]>(PORTFOLIO_SQL)

  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState<SortState>({ key: 'date_released', dir: 'asc' })
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  const portfolioTickers = useMemo(
    () => new Set((portfolioRows ?? []).map((r) => r.ticker)),
    [portfolioRows]
  )

  // ResizeObserver for responsive column drops
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver((entries) => {
      setContainerWidth(entries[0]?.contentRect.width ?? 0)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Escape to close slide-over
  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        setSelectedTicker(null)
        setSelectedRowKey(null)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const handleRowClick = useCallback(
    (rk: string, ticker: string) => {
      if (rk === selectedRowKey) {
        setSelectedRowKey(null)
        setSelectedTicker(null)
      } else {
        setSelectedRowKey(rk)
        setSelectedTicker(ticker)
        void window.electronAPI.db.query(
          `INSERT INTO app_settings (setting_key, setting_value) VALUES ('watching.lastOpenedTicker', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
          [ticker]
        )
      }
    },
    [selectedRowKey]
  )

  const handleSortClick = useCallback((key: string) => {
    setSort((prev) => {
      if (prev.key !== key) return { key: key as keyof WatchingRow, dir: 'asc' }
      if (prev.dir === 'asc') return { key: prev.key, dir: 'desc' }
      return { key: null, dir: null }
    })
  }, [])

  const handlePortfolioToggle = useCallback(
    async (ticker: string) => {
      if (portfolioTickers.has(ticker)) {
        await window.electronAPI.db.query(`DELETE FROM app_portfolio WHERE ticker = ?`, [ticker])
      } else {
        await window.electronAPI.db.query(`INSERT IGNORE INTO app_portfolio (ticker) VALUES (?)`, [
          ticker
        ])
      }
      refetchPortfolio()
    },
    [portfolioTickers, refetchPortfolio]
  )

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const pid = await window.electronAPI.scripts.launchBuiltin('refresh_prices')
      const unsub = window.electronAPI.scripts.onExit((exitPid) => {
        if (exitPid === pid) {
          unsub()
          setRefreshing(false)
          setBannerDismissed(false)
          refetchWatching()
        }
      })
    } catch {
      setRefreshing(false)
    }
  }, [refetchWatching])

  const showBanner =
    !bannerDismissed &&
    !loading &&
    rows !== null &&
    rows.some((r) => r.live_price !== null) &&
    isStale(rows)

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--color-bg-base)' }}
    >
      {/* Page header */}
      <div
        style={{
          height: 48,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          borderBottom: '1px solid var(--color-border-subtle)'
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
          Watching
        </span>
        <span
          style={{
            marginLeft: 12,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-text-muted)'
          }}
        >
          {rows ? `${rows.length} tickers` : ''}
          {rows && latestUpdateTime(rows) ? ` · updated ${latestUpdateTime(rows)}` : ''}
        </span>
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '5px 11px 5px 9px',
              borderRadius: 5,
              border: `1px solid ${showBanner ? 'var(--color-warning)' : 'var(--color-border-strong)'}`,
              background: showBanner ? 'var(--color-warning-bg)' : 'transparent',
              color: showBanner ? 'var(--color-warning)' : 'var(--color-text-primary)',
              fontSize: 12.5,
              fontFamily: 'inherit',
              cursor: refreshing ? 'default' : 'pointer',
              opacity: refreshing ? 0.6 : 1
            }}
          >
            <svg
              width={13}
              height={13}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            <span>{refreshing ? 'Refreshing…' : 'Refresh prices'}</span>
          </button>
        </div>
      </div>

      {/* Stale prices banner */}
      {showBanner && (
        <StatusBanner
          message="Prices are from yesterday's close."
          detail={`Last refresh: ${latestUpdateTime(rows ?? []) ?? ''}`}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

      {/* Filter bar */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 20px',
          borderBottom: '1px solid var(--color-border-subtle)'
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 30,
            padding: '0 10px',
            background: 'var(--color-bg-input)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 5,
            maxWidth: 360
          }}
        >
          <svg
            width={13}
            height={13}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by ticker or name…"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--color-text-primary)',
              fontSize: 12.5,
              fontFamily: 'inherit'
            }}
          />
          {filter && (
            <button
              onClick={() => setFilter('')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                display: 'flex'
              }}
            >
              <svg
                width={12}
                height={12}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Body: table + optional slide-over */}
      <div
        className="flex flex-1 min-h-0 overflow-hidden"
        onClick={() => {
          setSelectedTicker(null)
          setSelectedRowKey(null)
        }}
      >
        <div
          ref={containerRef}
          className="flex-1 min-w-0 overflow-auto"
          style={{ padding: '0 20px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {loading && (
            <div
              style={{
                padding: 32,
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: 13
              }}
            >
              Loading…
            </div>
          )}
          {error && (
            <div
              style={{
                padding: 32,
                textAlign: 'center',
                color: 'var(--color-danger)',
                fontSize: 13
              }}
            >
              Error: {error}
            </div>
          )}
          {!loading && !error && rows && (
            <WatchingTable
              rows={rows}
              portfolioTickers={portfolioTickers}
              selectedRowKey={selectedRowKey}
              sort={sort}
              filter={filter}
              containerWidth={containerWidth}
              slideOverOpen={selectedTicker !== null}
              onRowClick={handleRowClick}
              onSortClick={handleSortClick}
              onPortfolioToggle={(t) => void handlePortfolioToggle(t)}
            />
          )}
        </div>

        {selectedTicker && rows && (
          <TickerDetailPanel
            row={rows.find((r) => r.ticker === selectedTicker)!}
            onClose={() => {
              setSelectedTicker(null)
              setSelectedRowKey(null)
            }}
            onNavigate={navigate}
          />
        )}
      </div>
    </div>
  )
}
