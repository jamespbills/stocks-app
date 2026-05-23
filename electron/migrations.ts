import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import mysql from 'mysql2/promise'
import { loadConfig } from './config'

export async function runMigrations(): Promise<void> {
  const config = loadConfig()
  const conn = await mysql.createConnection({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    multipleStatements: true
  })

  try {
    const migrationsDir = join(process.cwd(), 'migrations')
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()
    for (const file of files) {
      const sql = readFileSync(join(migrationsDir, file), 'utf-8')
      await conn.query(sql)
    }
  } finally {
    await conn.end()
  }
}
