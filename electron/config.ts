import { readFileSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

export interface ScriptDefinition {
  id: string
  label: string
  script: string
  category: string
  args: Array<{ name: string; type: string; required: boolean }>
}

export interface AppConfig {
  mysql: {
    host: string
    port: number
    user: string
    password: string
    database: string
  }
  paths: {
    aiReviews: string
    databaseProject: string
    stocksBrain: string
  }
  apiKeys: {
    finnhub: string
    fmp: string
  }
  scripts: ScriptDefinition[]
}

let _config: AppConfig | null = null

export function loadConfig(): AppConfig {
  if (_config) return _config

  const configPath = join(app.getAppPath(), 'config.local.json')
  let raw: string
  try {
    raw = readFileSync(configPath, 'utf-8')
  } catch {
    throw new Error(
      `config.local.json not found at ${configPath}. Copy config.example.json and fill in your credentials.`
    )
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('config.local.json is not valid JSON.')
  }

  const cfg = parsed as Record<string, unknown>

  if (!cfg.mysql || typeof cfg.mysql !== 'object')
    throw new Error('config.local.json: missing mysql block')
  const mysql = cfg.mysql as Record<string, unknown>
  if (!mysql.host || !mysql.user || !mysql.password || !mysql.database) {
    throw new Error('config.local.json: mysql block must have host, user, password, database')
  }
  if (!cfg.paths || typeof cfg.paths !== 'object')
    throw new Error('config.local.json: missing paths block')
  const paths = cfg.paths as Record<string, unknown>
  if (!paths.databaseProject)
    throw new Error('config.local.json: paths.databaseProject is required')

  const apiKeysRaw = (cfg.apiKeys as Record<string, unknown> | undefined) ?? {}

  _config = {
    mysql: {
      host: String(mysql.host),
      port: Number(mysql.port ?? 3306),
      user: String(mysql.user),
      password: String(mysql.password),
      database: String(mysql.database)
    },
    paths: {
      aiReviews: String(paths.aiReviews ?? ''),
      databaseProject: String(paths.databaseProject),
      stocksBrain: String(paths.stocksBrain ?? '')
    },
    apiKeys: {
      finnhub: String(apiKeysRaw.finnhub ?? ''),
      fmp: String(apiKeysRaw.fmp ?? '')
    },
    scripts: Array.isArray(cfg.scripts) ? (cfg.scripts as ScriptDefinition[]) : []
  }

  return _config
}
