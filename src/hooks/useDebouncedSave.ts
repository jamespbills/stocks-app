import { useState, useEffect, useRef, useCallback } from 'react'

interface DebouncedSaveOptions<T> {
  initialValue: T
  delayMs?: number
  onSave: (value: T) => Promise<unknown> | unknown
}

interface DebouncedSaveResult<T> {
  /** Current local value. Drives the controlled input. */
  value: T
  /** Update the value; the save fires after `delayMs` of inactivity. */
  setValue: (value: T) => void
  /** Cancel any pending debounced save and persist immediately (e.g. on blur). */
  flush: () => void
  /** Seconds since the most recent successful save; null until the first save. */
  savedSecondsAgo: number | null
}

/**
 * Debounced autosave with a live "saved Ns ago" tick.
 * Captures onSave in a ref so callers can pass a fresh closure each render
 * without re-creating timers.
 */
export function useDebouncedSave<T>(options: DebouncedSaveOptions<T>): DebouncedSaveResult<T> {
  const { initialValue, delayMs = 400 } = options
  const [value, setValueState] = useState<T>(initialValue)
  const [savedSecondsAgo, setSavedSecondsAgo] = useState<number | null>(null)

  const onSaveRef = useRef(options.onSave)
  useEffect(() => {
    onSaveRef.current = options.onSave
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedAtRef = useRef<number | null>(null)
  const pendingValueRef = useRef<T>(initialValue)

  const runSave = useCallback((toSave: T) => {
    Promise.resolve(onSaveRef.current(toSave))
      .then(() => {
        savedAtRef.current = Date.now()
        setSavedSecondsAgo(0)
      })
      .catch(() => {
        // silent — autosave; caller can retry on blur or surface their own error
      })
  }, [])

  const setValue = useCallback(
    (next: T) => {
      setValueState(next)
      pendingValueRef.current = next
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        runSave(next)
      }, delayMs)
    },
    [delayMs, runSave]
  )

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    runSave(pendingValueRef.current)
  }, [runSave])

  // Tick the "saved N seconds ago" label once a save lands
  useEffect(() => {
    const interval = setInterval(() => {
      if (savedAtRef.current === null) return
      setSavedSecondsAgo(Math.round((Date.now() - savedAtRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Clear any pending timer on unmount (no implicit final flush — callers use flush() on blur)
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { value, setValue, flush, savedSecondsAgo }
}
