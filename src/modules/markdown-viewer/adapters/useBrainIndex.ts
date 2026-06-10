import { useCallback, useEffect, useState } from 'react'
import type { BrainIndex, ReviewEntry } from '../types'

interface BrainIndexState {
  entries: ReviewEntry[]
  /** False when the brain path is unset/missing (renderer shows a configure prompt). */
  brainConfigured: boolean
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Loads the brain index via `reviews:rescan`. State is only ever set inside the async `.then`
 * / `.catch` callbacks (never synchronously in the effect body) to satisfy the
 * `react-hooks/set-state-in-effect` rule.
 */
export function useBrainIndex(): BrainIndexState {
  const [index, setIndex] = useState<BrainIndex | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    window.electronAPI.reviews
      .rescan()
      .then((res) => {
        if (cancelled) return
        setIndex(res)
        setError(null)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const refetch = useCallback(() => setReloadKey((k) => k + 1), [])

  return {
    entries: index?.entries ?? [],
    brainConfigured: index?.brainConfigured ?? true,
    loading: index === null && error === null,
    error,
    refetch
  }
}
