# TODO — TA Charts, Stage 1 (Charts) — COMPLETE 2026-05-30

Plan: `~/.claude/plans/…immutable-cat.md`. Scope: Stage 1 — four-panel chart workbench,
full-history per ticker, all-report overlays. Downstream consumer of the Price Archive;
indicators computed live in TypeScript (no Python, no signal tables).

- [x] 1. `migrations/006_ta_settings.sql` — single-row `app_ta_settings`. Applied to live DB twice
      (idempotent ✓), seeded row confirmed (id=1, defaults).
- [x] 2. Vitest added (devDep + `test`/`test:run` + `vitest.config.ts`). `indicators.ts` ported from
      `technical_analysis_batch.py`; `indicators.test.ts` green to 6 dp against a CPG.L golden xlsx
      fixture (504 bars; SMA/MACD/Stoch/RSI + MA-position). 5/5 tests pass.
- [x] 3. `types.ts`, `queries.ts`, `adapters/tickers.ts` + `series.ts` (full-history fetch) +
      `reports.ts` (all reports + qualifies flag). Both new reads validated live (88 tickers; CPG.L).
- [x] 4. `settings/useTaSettings.ts` + `SettingsPanel.tsx` (indicator periods; live re-derive on save).
- [x] 5. Chart UI: `chart/geometry.ts`, `model.ts`, `ChartStack.tsx` (static SVG, memoised),
      `CrosshairOverlay.tsx` + `HoverTooltip.tsx` (lightweight hover layers), `ReportTooltip` +
      report markers (in ChartShell), `TickerPicker.tsx`, `ChartEmpty.tsx`; wired in `index.tsx`.
- [x] 6. New chart tokens → `tokens.css` + `docs/decisions/design-tokens.md`.
- [x] 7. typecheck ✓, lint (module) ✓ 0 warnings, `vitest run` ✓ 5/5, `npm run build` ✓ exit 0.
      lessons.md updated (maths-parity traps + Vitest). MEMORY updated.

**Left to James:** visual GUI smoke-test (`npm run dev` → TA Charts) — pick a play-qualifying ticker,
a non-qualifying one, and a sparse-history one; confirm panels/crosshair/report tooltips, settings
re-derive, and the empty-state deep-link.

Deferred (later stages): signals (S2), calibration dashboard (S3), command-palette action.
