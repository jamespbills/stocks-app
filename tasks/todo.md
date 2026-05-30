# TODO — Price Archive (Slice 1: Foundation + Coverage + Build) — COMPLETE 2026-05-29

Plan: approved 2026-05-29. Foundational upstream module; single writer of historical OHLCV.

- [x] 1. `migrations/005_price_archive.sql` — applied + idempotent (re-run clean). Coverage view
      returns 92 play-universe tickers.
- [x] 2. `scripts/archive_prices.py` — verified on URBN (626 bars, ok). Resumable re-run → no_data
      bars:0, existing rows untouched. dim_price_runs rows close correctly.
- [x] 3. `types.ts` + `queries.ts` — SQL validated against live DB.
- [x] 4. Adapters: coverage (status derivation), runs, prices (shared seam), build, settings.
- [x] 5. UI: index, ModuleHeader (Coverage/Runs live; Watchlist/Settings disabled), coverage/,
      runs/RunsTable, build/ (BuildPanel modal + BuildProgress docked).
- [x] 6. Registered in module-registry.ts (Data group, Database icon); CLAUDE.md §6 guardrail
      updated (price-domain carve-out + never-delete rule).
- [x] 7. typecheck clean; module lint clean. NOTE: full-repo lint shows 2264 PRE-EXISTING
      prettier CRLF warnings (untouched files, e.g. MutedLabel.tsx) — not introduced here.

Deferred: Manual CSV import, Watchlist CRUD UI, row Upload-CSV/Note.

---

# Round 2 — Clean-ups + Settings editor (approved 2026-05-29) — COMPLETE

- [x] A. Fix partial status (coverage.ts deriveStatus) — future target end now treated as ongoing,
      expected coverage capped at today. The 10 future-window tickers → fresh.
- [x] B. Trail → 456 days: migration default changed + live row UPDATEd (verified 456; targets
      reshaped, e.g. NXT.L target_to 2027-06-25).
- [x] C. Settings editor — UPDATE_SETTINGS_SQL, saveSettings(), SettingsPanel.tsx (single column,
      steppers, dirty marking, date field for ISA start), Settings tab enabled, wired into index.
- [x] typecheck clean; module lint clean.
- [x] Visual GUI confirm — James ran it; rebuild marked all fresh, Settings save persisted.

---

# Round 3 — Watchlist manager (approved 2026-05-29) — COMPLETE

- [x] 1. queries.ts — TRACKED_LIST_SQL, UPSERT_TRACKED_SQL, SET_TRACKED_ACTIVE_SQL.
- [x] 2. adapters/tracked.ts — useTrackedTickers, saveTracked, setTrackedActive.
- [x] 3. SourceTag.tsx primitive — extracted, reused in CoverageTable + watchlist.
- [x] 4. watchlist/ — WatchlistView, AddTrackedRow (add+edit), TrackedTickerRow, Toggle (PA-4,
      date-based, ISA read-only, soft-delete via active toggle).
- [x] 5. index.tsx watchlist surface + onMutate refetch coverage; all four tabs enabled.
- [x] 6. typecheck + module lint clean. Added missing TrackedTicker type.
- [x] DB round-trip verified (insert→coverage target w/ lookback start→disable drops→cleanup).
- [ ] Visual GUI confirm — left to James.

Deferred: ISA-holding importer (Portfolio module).

---

# Round 4 — Manual-watch lead fix + Manual CSV import (approved 2026-05-30) — COMPLETE

- [x] 1. Lead fix: migration 005 view padded manual_watch cover_from by play_lead_days; re-applied;
      HFD.L target_from now 2022-03-18 (his 2022-06-16 − 90d). James to rebuild to fill the head.
- [x] 2. electron/ipc/db.ts → getPool() exported.
- [x] 3. electron/ipc/archive.ts → previewPriceCsv + importPriceCsv (inline quoted-CSV parser,
      investing.com auto-detect + column-map fallback, transactional manual-wins upsert).
- [x] 4. main.ts registers; preload.ts + electron.d.ts expose/type archive.*.
- [x] 5. types.ts CSV types (ParsedBar/CsvPreview/CsvImportResult/ColumnMap); adapters/archive.ts.
- [x] 6. manual/ManualImportPanel.tsx — drop → preview → committed + mapping (drag/drop + browse).
- [x] 7. CoverageRowActions Upload CSV (promoted on missing rows); threaded onUploadCsv → index.
- [x] 8. typecheck + lint clean (module + touched electron files). Import SQL smoke-tested + cleaned.
- [ ] Visual GUI confirm — left to James (drop a real investing.com CSV for a missing .L ticker).

Price Archive module COMPLETE. Deferred: ISA-holding importer (belongs to Portfolio module).
