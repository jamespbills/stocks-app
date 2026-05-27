import type { ReactElement, ReactNode } from 'react'

interface QueryLike<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface QueryStateProps<T> {
  query: QueryLike<T>
  loadingLabel?: string
  children: (data: T) => ReactNode
}

const FALLBACK_STYLE = {
  padding: 32,
  textAlign: 'center' as const,
  fontSize: 13
}

export function QueryState<T>({
  query,
  loadingLabel = 'Loading…',
  children
}: QueryStateProps<T>): ReactElement {
  if (query.error !== null) {
    return (
      <div style={{ ...FALLBACK_STYLE, color: 'var(--color-danger)' }}>Error: {query.error}</div>
    )
  }
  if (query.loading || query.data === null) {
    return <div style={{ ...FALLBACK_STYLE, color: 'var(--color-text-muted)' }}>{loadingLabel}</div>
  }
  return <>{children(query.data)}</>
}
