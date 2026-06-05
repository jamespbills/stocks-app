// Web Worker: runs the cohort backtest off the main thread so the UI stays
// responsive while ~92 tickers' indicators + signals + trades are computed. The
// maths lives in runCohort.ts (pure, also unit-tested via trades.test.ts); this
// file is just the message boundary. No IPC here — prices are fetched on the
// renderer thread and passed in (structured-cloned).
//
// `self` is cast to a minimal worker shape so we don't depend on the WebWorker
// lib being in tsconfig.web (it isn't — the renderer is a DOM target).

import { runCohort, type CohortRunInput } from './runCohort'
import type { ScoreboardResult } from '../types'

interface WorkerScope {
  onmessage: ((e: MessageEvent<CohortRunInput>) => void) | null
  postMessage: (message: unknown) => void
}

const ctx = self as unknown as WorkerScope

ctx.onmessage = (e: MessageEvent<CohortRunInput>): void => {
  try {
    const result: ScoreboardResult = runCohort(e.data)
    ctx.postMessage({ ok: true, result })
  } catch (err) {
    ctx.postMessage({ ok: false, error: err instanceof Error ? err.message : String(err) })
  }
}
