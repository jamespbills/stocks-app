# TODO — TA Charts, Stage 2 (Signals) — COMPLETE 2026-06-05

Plan: `~/.claude/plans/…immutable-cat.md`. Configurable buy/sell signals on the chart, computed live in
TS. James's reframe: NO tables — markers on the price line + a hover modal; aggregate analysis is Stage 3.

- [x] 1. `indicators.ts` — `detectSignals()` + `SignalSettings`/`Signal`/`Grade`/`DEFAULT_SIGNAL_SETTINGS`,
      ported verbatim from legacy `detect_signals()`. Dedup per MACD-cross bar (last-writer-wins) — see
      lessons.md.
- [x] 2. Golden fixture regenerated (now incl. Buy/Sell signal + grade columns; legacy `analyses` folder
      moved `13_all_plays`→`plays`). `indicators.test.ts` extended: 7/7 pass — buy/sell indices + grades
      match the legacy CPG.L exactly (6 buys, 13 sells).
- [x] 3. `types.ts` — `toSignalSettings(TaSettings)` mapper.
- [x] 4. `chart/model.ts` — `MarkerAnchor` + `MARKER` consts + `nearestReport()`.
- [x] 5. `chart/ChartStack.tsx` — buy ▲ / sell ▼ markers on the price panel (static layer).
- [x] 6. `chart/SignalTooltip.tsx` (new) — hover modal: grade, entry RSI/Stoch/MACD, MA pos, stoch-cross +
      days-between, days-to-nearest-report.
- [x] 7. `chart/ChartShell.tsx` — signals memo, marker hit-areas, hover wiring, crosshair suppressed while a
      marker is hovered. `index.tsx` passes `signalSettings`.
- [x] 8. `settings/SettingsPanel.tsx` — two new sections (Signal rules + Grade thresholds); min 0 for
      thresholds. Editing re-derives markers live. No migration (006 already seeded the columns).
- [x] 9. typecheck ✓, lint ✓ 0 warnings, `vitest run` ✓ 7/7, `npm run build` ✓ exit 0.

**Left to James:** visual GUI smoke-test (`npm run dev` → TA Charts → CPG.L) — markers appear; hovering one
shows the modal with correct stats + days-to-nearest-report; editing a stoch/grade threshold moves/re-grades
markers live; spot-check one signal vs the legacy `_analysis.xlsx`.

Deferred: Stage 3 (analysis surface — cohort builder / scoreboard / aggregate tables), command-palette action.
