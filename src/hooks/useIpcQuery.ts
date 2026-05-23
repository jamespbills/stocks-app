import { useState, useEffect, useCallback } from 'react'

interface IpcQueryResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useIpcQuery<T>(sql: string, params?: unknown[]): IpcQueryResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    window.electronAPI.db
      .query(sql, params)
      .then((rows) => {
        if (!cancelled) {
          setData(rows as T)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
        }
      })
    return () => {
      cancelled = true
    }
    // params intentionally excluded — callers pass stable literals
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sql, tick])

  return { data, loading: data === null && error === null, error, refetch }
}
