import { ipcMain } from 'electron'
import { existsSync, readdirSync, readFileSync, statSync, type Dirent } from 'fs'
import { join, relative, resolve, sep } from 'path'
import { loadConfig } from '../config'
import { indexBrainFiles } from '../../src/modules/markdown-viewer/index-builder'
import { isSafeRelPath } from '../../src/modules/markdown-viewer/path-safety'
import { parseFrontmatter } from '../../src/modules/markdown-viewer/frontmatter'
import { inferPageTypeFromPath } from '../../src/modules/markdown-viewer/ticker'
import type {
  BrainFile,
  BrainIndex,
  PageType,
  ReviewDoc,
  SignalLibraryEntry,
  SignalLibraryResult
} from '../../src/modules/markdown-viewer/types'

// The brain's top-level folders the module reads. Markdown only — by design.
const BRAIN_FOLDERS = ['wiki', 'raw', 'archive']
const PAGE_TYPES: readonly PageType[] = ['ticker', 'sector', 'signal', 'play', 'review']

/** The configured brain root if it is set and exists on disk, else null. */
function brainRoot(): string | null {
  const path = loadConfig().paths.stocksBrain
  return path !== '' && existsSync(path) ? path : null
}

/** Recursively collect `*.md` files under `dir`, recording brain-relative POSIX paths. */
function collectFiles(dir: string, root: string, out: BrainFile[]): void {
  let entries: Dirent[]
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return // folder missing → nothing to collect
  }
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      collectFiles(full, root, out)
    } else if (entry.isFile() && /\.md$/i.test(entry.name)) {
      out.push({
        relPath: relative(root, full).split(sep).join('/'),
        content: readFileSync(full, 'utf-8'),
        mtime: statSync(full).mtime.toISOString()
      })
    }
  }
}

export function registerReviewsHandlers(): void {
  // Walk the brain and return the parsed in-memory index. Filesystem-only — no MySQL.
  ipcMain.handle('reviews:rescan', (): BrainIndex => {
    const scannedAt = new Date().toISOString()
    const root = brainRoot()
    if (!root) return { entries: [], brainConfigured: false, scannedAt }

    const files: BrainFile[] = []
    for (const folder of BRAIN_FOLDERS) collectFiles(join(root, folder), root, files)
    return { entries: indexBrainFiles(files), brainConfigured: true, scannedAt }
  })

  // Read one markdown page on demand. Confined to the brain root; markdown only.
  ipcMain.handle('reviews:get', (_, relPath: string): ReviewDoc => {
    const root = brainRoot()
    if (!root) throw new Error('Stocks brain path is not configured.')
    if (!isSafeRelPath(relPath) || !/\.md$/i.test(relPath)) {
      throw new Error(`Invalid review path: ${relPath}`)
    }

    const full = resolve(join(root, relPath))
    const allowed = resolve(root)
    if (full !== allowed && !full.startsWith(allowed + sep)) {
      throw new Error('Access denied: path is outside the stocks brain folder.')
    }

    const parsed = parseFrontmatter(readFileSync(full, 'utf-8'))
    const declared = parsed.data.page_type
    const pageType: PageType = PAGE_TYPES.includes(declared as PageType)
      ? (declared as PageType)
      : inferPageTypeFromPath(relPath)

    return {
      relPath: relPath.replace(/\\/g, '/'),
      frontmatter: parsed.data,
      body: parsed.content,
      pageType
    }
  })

  // The canonical signal library JSON, kept alongside the wiki. Optional — a missing or
  // unparseable file degrades to `available: false` (Library cards render wiki-only).
  // Filesystem-only, confined to the brain root; no MySQL.
  ipcMain.handle('reviews:signalLibrary', (): SignalLibraryResult => {
    const root = brainRoot()
    if (!root) return { available: false, signals: [] }

    try {
      const raw = readFileSync(join(root, 'signal_library', 'signal_library.json'), 'utf-8')
      const parsed: unknown = JSON.parse(raw)
      const signals = (parsed as { signals?: unknown }).signals
      if (!Array.isArray(signals)) return { available: false, signals: [] }
      return { available: true, signals: signals as SignalLibraryEntry[] }
    } catch {
      return { available: false, signals: [] }
    }
  })
}
