# TODO — 200-week MA overlay (TA Charts) — 2026-06-09

Plan approved by James (plan mode). Display-only weekly MA: raw weekly closes via
yfinance `interval='1wk'` stored in new `fact_weekly_prices`, SMA computed live in
TS, dotted overlay on the price panel + MA-W tooltip rows. No changes to signals /
trades.ts / Stage 3 backtest.

## Tasks
- [x] 0. Backup `app_ta_settings` + `dim_price_runs` → `backups/backup_pre_009_20260609.sql`
- [x] 1. Migration `009_weekly_prices.sql` — `fact_weekly_prices` table; guarded
      `app_ta_settings.ma_weekly_window` (default 200); guarded `dim_price_runs.source`
      enum + `'yfinance_weekly'`. Applied twice via mysql CLI AND via mysql2
      `multipleStatements` (the runMigrations path) — idempotent both ways.
- [x] 2. `scripts/archive_prices.py` — weekly fetch pass per ticker (own run row,
      full-window upsert, Monday-aligned start = target_from − (window+8) weeks)
- [x] 3. Read seam — `WEEKLY_SERIES_SQL`, `WeeklyBar` type, `fetchWeeklySeries()`
- [x] 4. `indicators.ts` — `computeWeeklyOverlay()` (pure; weekly SMA forward-filled
      onto the daily axis, position ABOVE/BELOW vs daily close)
- [x] 5. Settings plumbing — `maWeeklyWindow` through types/queries/useTaSettings/SettingsPanel
- [x] 6. Chart wiring — series.ts fetch, ChartShell memo, priceRange third series,
      ChartStack dotted line + label, HoverTooltip MA-W rows, tokens.css colour
- [x] 7. Tests — `weeklyOverlay.test.ts` (7 cases) — vitest 28/28 green
- [x] 8. Docs — TA v2 §13 addendum, ecosystem database.md, design-tokens.md
- [x] 9. Verify — typecheck ✓ lint ✓ test:run ✓ (28/28) build ✓. AIT single-ticker run:
      287 Monday-labelled weekly rows (2019-05-13 → 2024-11-04 = target_from − 208wk),
      `yfinance_weekly` run row, re-run = 287 updated/0 inserted (no dupes). Headless
      integration check: MA warm (non-null) across all 377 AIT daily bars, last bar
      MA 133.91 vs close 268.23 → ABOVE.

**Left to James:** GUI smoke-test (`npm run dev` → TA Charts → AIT): dotted tan MA-W
line on the price panel, label `SMA(200) dashed · MA-W(200) dotted · close`, MA-W rows
in the hover tooltip; a ticker without weekly rows (any other ticker until the next
`--all` build) renders exactly as before. Run a full archive build (`--all`) when
convenient to backfill weekly closes for every covered ticker.

## Decisions (locked in planning)
- Weekly bar = yfinance `interval='1wk'` close (Monday week-start label) — the same
  weekly closes Yahoo/TradingView average for a 200-week MA.
- Daily mapping: forward-fill from the weekly bar containing day D (running week
  included — matches Yahoo/TradingView rendering).
- Separate `dim_price_runs` rows with source `'yfinance_weekly'` — weekly failures
  never poison the daily run status. BuildPanel counters stay daily-only.
- `IndicatorPeriods` untouched — `maWeeklyWindow` travels as a separate prop.
- No manual weekly CSV import (out of scope).
