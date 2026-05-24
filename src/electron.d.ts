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
        onStatus: (cb: (status: DBStatus) => void) => () => void
      }
      fs: {
        readFile: (path: string) => Promise<string>
        listDirectory: (path: string) => Promise<FileEntry[]>
      }
      scripts: {
        launch: (scriptPath: string, args: string[]) => Promise<number>
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
