import { useCallback, useState, type ReactElement } from 'react'
import { QueryState } from '../../components/QueryState'
import { ModuleHeader, type Surface } from './ModuleHeader'
import { CoverageView } from './coverage/CoverageView'
import { RunsTable } from './runs/RunsTable'
import { BuildPanel } from './build/BuildPanel'
import { BuildProgress } from './build/BuildProgress'
import { SettingsPanel } from './settings/SettingsPanel'
import { WatchlistView } from './watchlist/WatchlistView'
import { ManualImportPanel } from './manual/ManualImportPanel'
import { useCoverage } from './adapters/coverage'
import { useRuns } from './adapters/runs'
import { useArchiveSettings, DEFAULT_SETTINGS } from './adapters/settings'
import { useTrackedTickers } from './adapters/tracked'
import { useArchiveBuild } from './adapters/build'

type BuildView = 'configure' | 'docked' | null

export default function PriceArchive(): ReactElement {
  const [surface, setSurface] = useState<Surface>('coverage')
  const [buildView, setBuildView] = useState<BuildView>(null)
  const [buildingTicker, setBuildingTicker] = useState<string | null>(null)
  const [importTicker, setImportTicker] = useState<string | null>(null)

  const settingsQuery = useArchiveSettings()
  const staleAfterDays = settingsQuery.data?.staleAfterDays ?? DEFAULT_SETTINGS.staleAfterDays

  const coverageQuery = useCoverage(staleAfterDays)
  const runsQuery = useRuns()
  const trackedQuery = useTrackedTickers()

  // Refetch the live data behind the docked panel as the build progresses/finishes.
  const handleBuildComplete = useCallback(() => {
    coverageQuery.refetch()
    runsQuery.refetch()
  }, [coverageQuery, runsQuery])

  const build = useArchiveBuild(handleBuildComplete)

  const handleStart = useCallback(
    (args: string[]) => {
      void build.start(args)
      setBuildView('docked')
    },
    [build]
  )

  const handleBuildTicker = useCallback(
    (ticker: string) => {
      if (build.state.phase === 'running') return
      setBuildingTicker(ticker)
      void build.start(['--ticker', ticker, '--triggered-by', 'single_ticker'])
      setBuildView('docked')
    },
    [build]
  )

  const handleCloseDocked = useCallback(() => {
    setBuildView(null)
    setBuildingTicker(null)
    build.reset()
  }, [build])

  const handleRefresh = useCallback(() => {
    coverageQuery.refetch()
    runsQuery.refetch()
    settingsQuery.refetch()
  }, [coverageQuery, runsQuery, settingsQuery])

  // Saved lead/trail reshape vw_archive_coverage_target, so re-pull both.
  const handleSettingsSaved = useCallback(() => {
    settingsQuery.refetch()
    coverageQuery.refetch()
  }, [settingsQuery, coverageQuery])

  // Adding/editing/toggling a tracked ticker changes the coverage target too.
  const handleTrackedMutate = useCallback(() => {
    trackedQuery.refetch()
    coverageQuery.refetch()
  }, [trackedQuery, coverageQuery])

  const tickerCount = coverageQuery.data?.length ?? null
  const buildRunning = build.state.phase === 'running'

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
      <ModuleHeader
        activeSurface={surface}
        onSurfaceChange={setSurface}
        tickerCount={tickerCount}
        buildDisabled={buildRunning}
        onBuild={() => setBuildView('configure')}
        onRefresh={handleRefresh}
      />

      <div
        style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden', position: 'relative' }}
      >
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {surface === 'coverage' && (
            <QueryState query={coverageQuery} loadingLabel="Loading coverage…">
              {(rows) => (
                <CoverageView
                  rows={rows}
                  buildingTicker={buildingTicker}
                  onBuildTicker={handleBuildTicker}
                  onUploadCsv={setImportTicker}
                />
              )}
            </QueryState>
          )}
          {surface === 'runs' && (
            <QueryState query={runsQuery} loadingLabel="Loading runs…">
              {(runs) => <RunsTable runs={runs} />}
            </QueryState>
          )}
          {surface === 'settings' && (
            <QueryState query={settingsQuery} loadingLabel="Loading settings…">
              {(s) => <SettingsPanel initial={s} onSaved={handleSettingsSaved} />}
            </QueryState>
          )}
          {surface === 'watchlist' && (
            <QueryState query={trackedQuery} loadingLabel="Loading watchlist…">
              {(tracked) => <WatchlistView rows={tracked} onMutate={handleTrackedMutate} />}
            </QueryState>
          )}
        </div>

        {buildView === 'docked' && (
          <BuildProgress state={build.state} onStop={build.stop} onClose={handleCloseDocked} />
        )}
      </div>

      {buildView === 'configure' && (
        <BuildPanel onStart={handleStart} onClose={() => setBuildView(null)} />
      )}

      {importTicker !== null && (
        <ManualImportPanel
          initialTicker={importTicker}
          onClose={() => setImportTicker(null)}
          onImported={() => {
            coverageQuery.refetch()
            runsQuery.refetch()
          }}
        />
      )}
    </div>
  )
}
