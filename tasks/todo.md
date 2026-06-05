# TODO — TA Charts, Stage 3 (Analysis surface — aggregate backtest scoreboard)

Plan: `~/.claude/plans/we-re-building-the-technical-cheerful-kazoo.md` (approved).
Run the current strategy across the qualifying-play universe, form buy trades, show a scoreboard.
Compute live in TS (reuse `indicators.ts`), nothing persisted, cohort run in a Web Worker.

## Tasks
- [x] 1. Migration 008: `app_ta_settings.buy_entry_window_days` (90); threaded `buyEntryWindowDays`
      through `types.ts`, `useTaSettings.ts`, `UPDATE_TA_SETTINGS_SQL`.
- [x] 2. `fetchPriceSeriesBatch` in `price-archive/adapters/prices.ts` + `priceSeriesBatchSql` builder.
- [x] 3. `COHORT_SQL` (view_play_universe ⋈ LEAD next-same-filing) + `analysis/cohort.ts` adapter.
- [x] 4. `analysis/trades.ts` (`formTrades` + `aggregate`, pure) + `trades.test.ts` — 6 synthetic cases.
- [x] 5. `analysis/runCohort.ts` (shared pure) + `analysis/aggregate.worker.ts` + inline fallback;
      driven by `analysis/useCohortRun.ts`.
- [x] 6. Header Chart/Analysis `SurfaceSwitcher` in `index.tsx` (settings button on both surfaces).
- [x] 7. `AnalysisSurface` + `Scoreboard` (sortable, grade×MA + Overall) + `DistributionMini`
      (12-bin) + `TradeDrillDown` slide-over.
- [x] 8. Settings "Backtest cohort" section (buy entry window + holding fallback).
- [x] 9. Verify: typecheck ✓, lint ✓ 0 warnings, vitest ✓ 13/13, `npm run build` ✓ (worker chunked).

**Left to James:** GUI smoke-test (`npm run dev` → TA charts → Analysis): scoreboard populates over
the play universe; editing an indicator/signal/entry-window value in Settings moves the stats live;
hand-check one ticker's trade (first buy ≤90d, window-end exit at next same-filing report).

## Decisions (from planning interview, 2026-06-05)
- Buy-only trades. Cohort = view_play_universe.
- Entry = first buy signal within `buy_entry_window_days` (90d) of a qualifying report; a signal is
  never consumed by two reports (per-ticker consumed Set, reports processed in date order).
- Holding window: date_released → next report of same `filing_identifier`; else +chart_window_days_after
  fallback; clamp to last bar. Exit = window-end (sells ignored for the backtest).
- Returns: raw close. Group by grade × MA position + Overall row.
- chart_window_days_after reused as the holding fallback (relabel in UI). No new wireframes.
