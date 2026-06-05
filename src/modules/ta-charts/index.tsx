import { useState, type ReactElement, type ReactNode } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import { useRouter } from '../../hooks/use-router'
import { toPeriods, type TaSettings } from './types'
import { useTickerList } from './adapters/tickers'
import { useChartData } from './adapters/series'
import { useTaSettings, DEFAULT_TA_SETTINGS } from './settings/useTaSettings'
import { SettingsPanel } from './settings/SettingsPanel'
import { TickerPicker } from './chart/TickerPicker'
import { ChartShell } from './chart/ChartShell'
import { ChartEmpty } from './chart/ChartEmpty'

function Centered({ children }: { children: ReactNode }): ReactElement {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-muted)',
        fontSize: 'var(--text-sm)'
      }}
    >
      {children}
    </div>
  )
}

export default function TACharts(): ReactElement {
  const { navigate } = useRouter()
  const tickerList = useTickerList()
  const settingsQuery = useTaSettings()

  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)
  const [liveSettings, setLiveSettings] = useState<TaSettings | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Default to the first archived ticker without an effect (avoids the
  // set-state-in-effect rule); user selection overrides.
  const effectiveTicker = selectedTicker ?? tickerList.data?.[0] ?? null
  // Live settings (saved this session) win; else the persisted row; else defaults.
  const settings = liveSettings ?? settingsQuery.data ?? DEFAULT_TA_SETTINGS
  const periods = toPeriods(settings)

  const chart = useChartData(effectiveTicker)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--color-bg-base)'
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 48,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          borderBottom: '1px solid var(--color-border-subtle)'
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 'var(--font-medium)',
            color: 'var(--color-text-primary)'
          }}
        >
          TA chart
        </span>
        <span style={{ width: 1, height: 18, background: 'var(--color-border-subtle)' }} />
        <TickerPicker
          tickers={tickerList.data ?? []}
          value={effectiveTicker}
          onChange={setSelectedTicker}
        />

        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 16 }}>
          <Legend swatch="var(--color-chart-date-line)" label="play universe" />
          <Legend swatch="rgba(255,255,255,0.35)" label="report" />
          <button
            type="button"
            aria-label="Indicator settings"
            onClick={() => setSettingsOpen((v) => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 28,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-strong)',
              background: settingsOpen ? 'var(--color-interactive-active)' : 'transparent',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer'
            }}
          >
            <SettingsIcon size={15} />
          </button>
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {tickerList.loading ? (
            <Centered>Loading tickers…</Centered>
          ) : !effectiveTicker ? (
            <ChartEmpty ticker="—" onOpenArchive={() => navigate('price-archive')} />
          ) : chart.error ? (
            <Centered>
              Failed to load {effectiveTicker}: {chart.error}
            </Centered>
          ) : chart.loading || !chart.data ? (
            <Centered>Loading {effectiveTicker}…</Centered>
          ) : chart.data.bars.length === 0 ? (
            <ChartEmpty ticker={effectiveTicker} onOpenArchive={() => navigate('price-archive')} />
          ) : (
            <ChartShell bars={chart.data.bars} reports={chart.data.reports} periods={periods} />
          )}
        </div>

        {settingsOpen && settingsQuery.data && (
          <SettingsPanel
            initial={settings}
            onSaved={(next) => setLiveSettings(next)}
            onClose={() => setSettingsOpen(false)}
          />
        )}
      </div>
    </div>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }): ReactElement {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--color-text-muted)'
      }}
    >
      <span style={{ width: 8, height: 2, borderRadius: 1, background: swatch }} />
      {label}
    </span>
  )
}
