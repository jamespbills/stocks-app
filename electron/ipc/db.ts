import { ipcMain, BrowserWindow } from 'electron'
import mysql, { type ExecuteValues } from 'mysql2/promise'
import { loadConfig } from '../config'

let pool: mysql.Pool | null = null

export interface DBStatus {
  connected: boolean
  error?: string
}

function broadcastStatus(status: DBStatus): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('db:status', status)
  })
}

export async function initDB(): Promise<void> {
  const config = loadConfig()
  try {
    pool = mysql.createPool({
      host: config.mysql.host,
      port: config.mysql.port,
      user: config.mysql.user,
      password: config.mysql.password,
      database: config.mysql.database,
      connectionLimit: 5,
      waitForConnections: true
    })
    // Verify connectivity
    const conn = await pool.getConnection()
    conn.release()
    broadcastStatus({ connected: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    broadcastStatus({ connected: false, error: message })
  }
}

// Exposed so other IPC handlers (e.g. archive CSV import) can run transactions
// against the same pool. Returns null until initDB() has run.
export function getPool(): mysql.Pool | null {
  return pool
}

export function registerDBHandlers(): void {
  ipcMain.handle('db:query', async (_, { sql, params }: { sql: string; params?: unknown[] }) => {
    if (!pool) throw new Error('Database not initialised')
    const [rows] = await pool.execute(sql, (params ?? []) as ExecuteValues)
    return rows
  })

  ipcMain.handle('db:callProc', async (_, { name }: { name: string }) => {
    if (!pool) throw new Error('Database not initialised')
    await pool.query(`CALL ${name}()`)
    return { ok: true }
  })
}
