import { useEffect, useState } from 'react'
import type { ReviewDoc } from '../types'

interface ReviewDocState {
  doc: ReviewDoc | null
  error: string | null
}

/**
 * Fetches one rendered review by relPath via `reviews:get`. The Reader is mounted with a
 * `key={relPath}` by its parent, so navigating to a new page remounts this hook with a fresh
 * (null) doc — no synchronous reset needed, keeping clear of `set-state-in-effect`.
 */
export function useReviewDoc(relPath: string): ReviewDocState {
  const [doc, setDoc] = useState<ReviewDoc | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    window.electronAPI.reviews
      .get(relPath)
      .then((d) => {
        if (!cancelled) setDoc(d)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [relPath])

  return { doc, error }
}
