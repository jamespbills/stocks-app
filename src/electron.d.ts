import type {
  ColumnMap,
  CsvImportResult,
  CsvPreview,
  ParsedBar
} from './modules/price-archive/types'
import type { BrainIndex, ReviewDoc } from './modules/markdown-viewer/types'

export interface DBStatus {
  connected: boolean
  error?: string
}

export interface FileEntry {
  name: string
  path: string
  size: number
  modified: string
}

declare global {
  interface Window {
    electronAPI: {
      db: {
        query: (sql: string, params?: unknown[]) => Promise<unknown[]>
        callProc: (name: string) => Promise<{ ok: true }>
        onStatus: (cb: (status: DBStatus) => void) => () => void
      }
      fs: {
        readFile: (path: string) => Promise<string>
        listDirectory: (path: string) => Promise<FileEntry[]>
      }
      archive: {
        previewPriceCsv: (args: {
          ticker: string
          csv: string
          columnMap?: ColumnMap
        }) => Promise<CsvPreview>
        importPriceCsv: (args: { ticker: string; rows: ParsedBar[] }) => Promise<CsvImportResult>
      }
      reviews: {
        rescan: () => Promise<BrainIndex>
        get: (relPath: string) => Promise<ReviewDoc>
      }
      scripts: {
        launch: (scriptPath: string, args: string[]) => Promise<number>
        launchBuiltin: (name: string, args?: string[]) => Promise<number>
        stop: (pid: number) => Promise<void>
        onOutput: (
          cb: (pid: number, line: string, stream: 'stdout' | 'stderr') => void
        ) => () => void
        onExit: (cb: (pid: number, code: number) => void) => () => void
      }
      win: {
        minimize: () => Promise<void>
        maximize: () => Promise<void>
        close: () => Promise<void>
      }
      zoom: {
        getZoomFactor: () => number
        setZoomFactor: (factor: number) => void
      }
    }
  }
}
