import { ipcMain } from 'electron'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, resolve } from 'path'
import { loadConfig } from '../config'

interface FileEntry {
  name: string
  path: string
  size: number
  modified: string
}

function assertSafePath(targetPath: string): void {
  const config = loadConfig()
  const resolved = resolve(targetPath)
  const allowed = resolve(config.paths.databaseProject)
  if (!resolved.startsWith(allowed)) {
    throw new Error(`Access denied: path is outside the configured databaseProject folder`)
  }
}

export function registerFSHandlers(): void {
  ipcMain.handle('fs:readFile', (_, filePath: string): string => {
    assertSafePath(filePath)
    return readFileSync(filePath, 'utf-8')
  })

  ipcMain.handle('fs:listDirectory', (_, dirPath: string): FileEntry[] => {
    assertSafePath(dirPath)
    return readdirSync(dirPath).map((name) => {
      const full = join(dirPath, name)
      const stat = statSync(full)
      return {
        name,
        path: full,
        size: stat.size,
        modified: stat.mtime.toISOString()
      }
    })
  })
}
