import { contextBridge, ipcRenderer, webFrame } from 'electron'

export interface DBStatus {
  connected: boolean
  error?: string
}

contextBridge.exposeInMainWorld('electronAPI', {
  db: {
    query: (sql: string, params?: unknown[]) => ipcRenderer.invoke('db:query', { sql, params }),
    callProc: (name: string) => ipcRenderer.invoke('db:callProc', { name }),
    onStatus: (cb: (status: DBStatus) => void) => {
      const handler = (_: Electron.IpcRendererEvent, status: DBStatus): void => cb(status)
      ipcRenderer.on('db:status', handler)
      return () => ipcRenderer.removeListener('db:status', handler)
    }
  },
  fs: {
    readFile: (path: string): Promise<string> => ipcRenderer.invoke('fs:readFile', path),
    listDirectory: (path: string) => ipcRenderer.invoke('fs:listDirectory', path)
  },
  scripts: {
    launch: (scriptPath: string, args: string[]): Promise<number> =>
      ipcRenderer.invoke('scripts:launch', { scriptPath, args }),
    launchBuiltin: (name: string, args: string[] = []): Promise<number> =>
      ipcRenderer.invoke('scripts:launchBuiltin', name, args),
    stop: (pid: number): Promise<void> => ipcRenderer.invoke('scripts:stop', pid),
    onOutput: (cb: (pid: number, line: string, stream: 'stdout' | 'stderr') => void) => {
      const handler = (
        _: Electron.IpcRendererEvent,
        pid: number,
        line: string,
        stream: 'stdout' | 'stderr'
      ): void => cb(pid, line, stream)
      ipcRenderer.on('scripts:output', handler)
      return () => ipcRenderer.removeListener('scripts:output', handler)
    },
    onExit: (cb: (pid: number, code: number) => void) => {
      const handler = (_: Electron.IpcRendererEvent, pid: number, code: number): void =>
        cb(pid, code)
      ipcRenderer.on('scripts:exit', handler)
      return () => ipcRenderer.removeListener('scripts:exit', handler)
    }
  },
  archive: {
    previewPriceCsv: (args: { ticker: string; csv: string; columnMap?: Record<string, string> }) =>
      ipcRenderer.invoke('archive:previewPriceCsv', args),
    importPriceCsv: (args: { ticker: string; rows: unknown[] }) =>
      ipcRenderer.invoke('archive:importPriceCsv', args)
  },
  win: {
    minimize: (): Promise<void> => ipcRenderer.invoke('win:minimize'),
    maximize: (): Promise<void> => ipcRenderer.invoke('win:maximize'),
    close: (): Promise<void> => ipcRenderer.invoke('win:close')
  },
  zoom: {
    getZoomFactor: (): number => webFrame.getZoomFactor(),
    setZoomFactor: (factor: number): void => webFrame.setZoomFactor(factor)
  }
})
