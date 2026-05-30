import { useCallback, useEffect, useRef, useState } from 'react'
import type { ArchiveBuildSummary, ArchiveEvent } from '../types'

export type BuildPhase = 'idle' | 'running' | 'completed' | 'failed'

export interface BuildLogLine {
  kind: 'ok' | 'skip' | 'fail' | 'log' | 'stderr'
  text: string
}

export interface BuildProgress {
  current: number
  total: number
  ticker?: string
}

export interface BuildState {
  phase: BuildPhase
  log: BuildLogLine[]
  progress: BuildProgress | null
  summary: ArchiveBuildSummary | null
}

const INITIAL: BuildState = { phase: 'idle', log: [], progress: null, summary: null }

function parseEvent(line: string): ArchiveEvent | null {
  try {
    const obj = JSON.parse(line) as ArchiveEvent
    return obj && typeof obj === 'object' && 'type' in obj ? obj : null
  } catch {
    return null
  }
}

/**
 * Drives archive_prices.py via scripts:launchBuiltin, parsing its line-delimited
 * JSON into progress + a terminal-style log. `onComplete` fires on a clean exit so
 * the coverage table can refetch behind the docked panel.
 */
export function useArchiveBuild(onComplete: () => void): {
  state: BuildState
  start: (args: string[]) => Promise<void>
  stop: () => void
  reset: () => void
} {
  const [state, setState] = useState<BuildState>(INITIAL)
  const pidRef = useRef<number | null>(null)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const unsubOut = window.electronAPI.scripts.onOutput((pid, line, stream) => {
      if (pidRef.current !== pid) return
      if (stream === 'stderr') {
        setState((s) => ({ ...s, log: [...s.log, { kind: 'stderr', text: line }] }))
        return
      }
      const event = parseEvent(line)
      if (!event) {
        setState((s) => ({ ...s, log: [...s.log, { kind: 'log', text: line }] }))
        return
      }
      setState((s) => reduceEvent(s, event))
    })

    const unsubExit = window.electronAPI.scripts.onExit((pid, code) => {
      if (pidRef.current !== pid) return
      pidRef.current = null
      setState((s) => ({
        ...s,
        phase: code === 0 && s.phase !== 'failed' ? 'completed' : 'failed'
      }))
      if (code === 0) onCompleteRef.current()
    })

    return () => {
      unsubOut()
      unsubExit()
    }
  }, [])

  const start = useCallback(async (args: string[]) => {
    setState({ ...INITIAL, phase: 'running' })
    try {
      const pid = await window.electronAPI.scripts.launchBuiltin('archive_prices', args)
      pidRef.current = pid
    } catch (err) {
      pidRef.current = null
      setState({
        phase: 'failed',
        log: [{ kind: 'stderr', text: err instanceof Error ? err.message : String(err) }],
        progress: null,
        summary: null
      })
    }
  }, [])

  const stop = useCallback(() => {
    if (pidRef.current !== null) void window.electronAPI.scripts.stop(pidRef.current)
  }, [])

  const reset = useCallback(() => setState(INITIAL), [])

  return { state, start, stop, reset }
}

function reduceEvent(s: BuildState, event: ArchiveEvent): BuildState {
  switch (event.type) {
    case 'progress':
      return {
        ...s,
        progress: { current: event.current, total: event.total, ticker: event.ticker }
      }
    case 'ticker_done': {
      const kind = event.status === 'ok' ? 'ok' : event.status === 'failed' ? 'fail' : 'skip'
      const detail =
        event.status === 'ok'
          ? `${event.bars} bars`
          : event.status === 'no_data'
            ? 'already covered'
            : 'failed'
      return { ...s, log: [...s.log, { kind, text: `${event.ticker} · ${detail}` }] }
    }
    case 'log':
      return { ...s, log: [...s.log, { kind: 'log', text: event.message }] }
    case 'stderr':
      return { ...s, log: [...s.log, { kind: 'stderr', text: event.message }] }
    case 'final':
      return { ...s, summary: event.payload.summary }
    default:
      return s
  }
}
