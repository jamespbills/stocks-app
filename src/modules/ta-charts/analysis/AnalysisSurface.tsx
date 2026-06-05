import { useState, type ReactElement, type ReactNode } from 'react'
import type { TaSettings, Trade } from '../types'
import { useCohortRun } from './useCohortRun'
import { Scoreboard } from './Scoreboard'
import { TradeDrillDown } from './TradeDrillDown'

// Trades behind a scoreboard bucket: 'overall' → all; else grade × MA match.
function tradesForKey(trades: Trade[], key: string): Trade[] {
  if (key === 'overall') return trades
  const [grade, ma] = key.split('|')
  const maVal = ma === 'NA' ? null : ma
  return trades.filter((t) => t.grade === grade && (t.maPosition ?? 'NA') === (maVal ?? 'NA'))
}

interface Props {
  settings: TaSettings
}

export function AnalysisSurface({ settings }: Props): ReactElement {
  const { result, loading, error, reportCount, tickerCount } = useCohortRun(settings)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const selectedRow = result?.rows.find((r) => r.key === selectedKey) ?? null
  const drillTrades = result && selectedKey ? tradesForKey(result.trades, selectedKey) : []
  const tradeTotal = result?.rows.find((r) => r.key === 'overall')?.count ?? 0

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Run summary strip */}
        <div
          style={{
            flexShrink: 0,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '0 16px',
            borderBottom: '1px solid var(--color-border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11.5,
            color: 'var(--color-text-muted)'
          }}
        >
          <span>
            {reportCount} qualifying report{reportCount !== 1 ? 's' : ''} · {tickerCount} ticker
            {tickerCount !== 1 ? 's' : ''}
          </span>
          {result && (
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {tradeTotal} trade{tradeTotal !== 1 ? 's' : ''}
            </span>
          )}
          {loading && (
            <span style={{ color: 'var(--color-text-secondary)' }}>running backtest…</span>
          )}
          <span style={{ marginLeft: 'auto' }}>buy-only · window-end exit · raw close</span>
        </div>

        {/* Body */}
        {error ? (
          <Centered>Failed to run backtest: {error}</Centered>
        ) : loading || !result ? (
          <Centered>Running the strategy across the play universe…</Centered>
        ) : (
          <Scoreboard result={result} selectedKey={selectedKey} onSelect={setSelectedKey} />
        )}

        {/* Caveat footer */}
        <div
          style={{
            flexShrink: 0,
            padding: '8px 16px',
            borderTop: '1px solid var(--color-border-subtle)',
            fontSize: 11,
            color: 'var(--color-text-muted)',
            lineHeight: 1.5
          }}
        >
          Returns use raw close (dividends excluded) to match the chart and signals. Entry = first
          buy signal within {settings.buyEntryWindowDays}d of a qualifying report; exit at the next
          same-filing report (else {settings.chartWindowDaysAfter}d). Median computed client-side.
        </div>
      </div>

      {selectedRow && selectedKey && (
        <TradeDrillDown
          label={selectedRow.label}
          trades={drillTrades}
          onClose={() => setSelectedKey(null)}
        />
      )}
    </div>
  )
}

function Centered({ children }: { children: ReactNode }): ReactElement {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-muted)',
        fontSize: 'var(--text-sm)',
        padding: 24,
        textAlign: 'center'
      }}
    >
      {children}
    </div>
  )
}
