export interface WatchingRow {
  ticker: string
  company: string
  report_date: string | null
  financial_year: string | null
  filing_identifier: string | null
  date_released: string | null
  play: number | null
  play_2: number | null
  play_sector_rating: number | null
  play_2_sector_rating: number | null
  share_price: number | null
  live_price: number | null
  pct_change: number | null
  price_updated_at: string | null
  return_6m: number | null
  missed_upon: number | null
  missed_upon_2: number | null
}

export type SortDir = 'asc' | 'desc' | null
export type SortKey = keyof WatchingRow | null

export interface SortState {
  key: SortKey
  dir: SortDir
}
