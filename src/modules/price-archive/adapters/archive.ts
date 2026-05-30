// Thin wrappers over the archive CSV-import IPC. The parse/transaction logic
// lives in electron/ipc/archive.ts; the renderer only relays the file text.

import type { ColumnMap, CsvImportResult, CsvPreview, ParsedBar } from '../types'

export function previewCsv(
  ticker: string,
  csv: string,
  columnMap?: ColumnMap
): Promise<CsvPreview> {
  return window.electronAPI.archive.previewPriceCsv({ ticker, csv, columnMap })
}

export function importCsv(ticker: string, rows: ParsedBar[]): Promise<CsvImportResult> {
  return window.electronAPI.archive.importPriceCsv({ ticker, rows })
}
