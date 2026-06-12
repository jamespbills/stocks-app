import { useEffect, useState } from 'react'
import type { SignalLibraryResult } from '../types'

interface SignalLibraryState {
  /** Parsed canonical signal-library entries (empty when the JSON is absent). */
  signals: SignalLibraryResult['signals']
  /** False when the JSON file is missing/unparseable — cards degrade to wiki-only. */
  available: boolean
  loading: boolean
}

/**
 * Loads `signal_library/signal_library.json` via `reviews:signalLibrary`. The library is
 * optional, so failures degrade silently to an empty list. State is only ever set inside
 * the async `.then`/`.catch` callbacks (react-hooks/set-state-in-effect).
 */
export function useSignalLibrary(): SignalLibraryState {
  const [result, setResult] = useState<SignalLibraryResult | null>(null)

  useEffect(() => {
    let cancelled = false
    window.electronAPI.reviews
      .signalLibrary()
      .then((res) => {
        if (!cancelled) setResult(res)
      })
      .catch(() => {
        if (!cancelled) setResult({ available: false, signals: [] })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return {
    signals: result?.signals ?? [],
    available: result?.available ?? false,
    loading: result === null
  }
}
