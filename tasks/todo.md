# Stage 6 — Dashboards (Coverage · Gate board · Theme tracker) — markdown-viewer

Plan approved 2026-06-12 (plan mode). Interview: staleness = report-driven (authored < report);
Theme tracker pulled forward into v1 (full version, themes = signal pages via Library flag
derivation); coverage order = attention-first; slim bar with counts + Re-scan. Tracker:

- [x] 1. `types.ts` — CoverageRow/CoverageStatus, GateBoardColumn, ThemeRow
- [x] 2. `dashboards/build-dashboards.ts` — pure builders (coverage, gate board, themes)
- [x] 3. `dashboards/build-dashboards.test.ts` — 14 cases: status derivation, sort, unset fold, themes, decoupling shape
- [x] 4. UI: `DashCard.tsx`, `CoverageTable.tsx`, `GateBoard.tsx`, `ThemeTracker.tsx`, `DashboardsSurface.tsx`
- [x] 5. `index.tsx` — dashboards placeholder replaced (inbox stays the only placeholder)
- [x] 6. Gate: typecheck ✓ lint ✓ test:run ✓ (84/84) build ✓ — renderer grep-verified gray-matter-free
- [x] 7. Headless smoke (built app): 95 qualifiers · 6 reviewed · 2 unmatched · 97 coverage rows;
      gate-board chip → `Dashboards / SPSY.L` ticker route → Esc back; theme row → Reader →
      breadcrumb back; Re-scan stable. (Apparent STATUS clipping in screenshots was a
      screenshot-crop artifact — measured `wrapScroll == wrapClient == 1364`, no overflow;
      added an overflow-x wrapper + company ellipsis span as narrow-window protection anyway.)
- [x] 8. Docs: implementation §7 Stage 6 entry, wireframe-decisions Dashboards amendment,
      Stocks App CLAUDE.md item 13, memory file

**Left to James:** GUI eyeball (`npm run dev` → Reviews → Dashboards) — table feel at full
display width, theme-bar colours, anything off vs the wireframe.
