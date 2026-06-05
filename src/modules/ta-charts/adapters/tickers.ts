import { useMemo } from 'react'
import { useIpcQuery } from '../../../hooks/useIpcQuery'
import { TICKERS_SQL } from '../queries'

interface TickerRow {
  ticker: string
}

export interface TickerListQuery {
  data: string[] | null
  loading: boolean
  error: string | null
  refetch: () => void
}

// The chartable-ticker list — only tickers actually held in the archive.
export function useTickerList(): TickerListQuery {
  const query = useIpcQuery<TickerRow[]>(TICKERS_SQL)
  const data = useMemo(() => (query.data ? query.data.map((r) => r.ticker) : null), [query.data])
  return { data, loading: query.loading, error: query.error, refetch: query.refetch }
}
