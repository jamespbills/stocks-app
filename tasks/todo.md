# Sector Signals — Phase 2B Implementation

Reference: `docs/decisions/sector-signals-implementation.md`

---

## Infrastructure

- [x] **1. Migration 004** — `migrations/004_sector_combo_notes.sql` created with `app_sector_combo_notes` and `app_sector_ticker_notes`.

- [x] **2. IPC: db:callProc** — added to `electron/ipc/db.ts` (uses `pool.query`), `electron/preload.ts`, and `src/electron.d.ts`.

---

## Module files

- [x] **3. types.ts** — full contents per §5 of impl doc.

- [x] **4. queries.ts** — all SQL string constants (10 queries).

---

## Components

- [x] **5. SignalBadge.tsx**
- [x] **6. SwitchToggle.tsx**
- [x] **7. MatrixHeader.tsx**
- [x] **8. MatrixColumnHeaders.tsx**
- [x] **9. CriterionRow.tsx**
- [x] **10. SectorRow.tsx**
- [x] **11. SectorMatrix.tsx**
- [x] **12. ComboDetailPanel.tsx**
- [x] **13. PendingFooter.tsx + AppliedToast.tsx**
- [x] **14. index.tsx** — replaces placeholder.

---

## Verification

- [x] **15. Typecheck + lint** — clean pass, zero errors/warnings.

---

## Watching Dashboard update (§9)

- [x] **16. SQL** — `view_watching` already includes all four fields. No SQL change needed.
- [x] **17. Types** — `WatchingRow` already has all four fields. No change needed.
- [x] **18. PlayPill** — updated with `sectorPlay`, `sectorName`, `missedCriterion` props. Shows green "SP" label + tooltip for play=12 rows where `play_sector_rating === 1`. Imports `CRITERION_NAMES` from sector-signals types.
- [x] **19. Final typecheck + lint** — clean pass.

---

## Runtime validation + bug fixes

- [x] Start app in dev mode — migration 004 ran, both `app_*` tables created.
- [x] Matrix stats queries return rows from both views.
- [x] **PR1** — criterion rows now sorted by `avgRoi DESC` (nulls last) in `buildGroups()`.
- [x] **PR2** — matrix column header "N" → "TICKERS"; detail panel section "Tickers (N)" → "Reports (N)".
- [x] **PR3** — `COMBO_TICKERS_PLAY2_SQL` fixed: was joining `name = 'play'`, now correctly joins `name = 'play_2'`.
- [x] **PR4** — note persistence fixed: removed placeholder `setComboDetail` call in `handleComboClick`; panel now only mounts after DB fetch completes with real `comboNote` + ticker notes.
- [x] **PR5** — report table redesigned: wider grid (`68px 72px 96px 1fr`), `columnGap: 8`, paddingRight on RETURN, row padding `6px`, note cell is full-width `<div>` with hover highlight.
