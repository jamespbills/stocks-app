# Lessons

- **mysql2 DATE columns return JS `Date` objects at runtime**, not strings — even though TypeScript types them as `string | null`. Any sort, comparison, or string operation on a date field must handle `instanceof Date` (e.g. coerce via `.getTime()`). Do not rely on `String(value).localeCompare()` for date sorting.

- **`ticker` is not a unique row identifier.** `view_watching` can return multiple rows for the same ticker (one ticker, multiple active reports). Never use `ticker` alone as a React `key`, selection state, or `findIndex` target. Always derive a composite `rowKey` — e.g. `` `${ticker}|${filing_identifier ?? date_released ?? ...}` ``.

- **`useState(prop)` only initialises on mount — don't mount with a placeholder, then update the prop.** If a component's local state is seeded from a prop (`useState(detail.comboNote)`), and you mount the component with an empty/placeholder version of that prop before async data arrives, the state will be stale for the component's lifetime (even after the prop updates in the parent). Fix: delay mounting the component until real data is available. A loading placeholder (rendered when `selectedCombo && !comboDetail`) is cleaner and safer than an immediately-mounted shell.

- **Never call `.toISOString()` on a mysql2 Date value for display or intermediate storage.** `.toISOString()` converts to UTC, which shifts the date one day back in BST (UTC+1). Use `formatDate(value, 'iso')` from `src/lib/format.ts` instead — it uses local date getters (`getFullYear`, `getMonth`, `getDate`) and is correct in all timezones.

- **react-hooks/set-state-in-effect (ESLint plugin v7.1.1) blocks synchronous `setState` calls in `useEffect` bodies.** Restructure fetches to use `.then()` callbacks, or ensure all state updates are inside the async callback, not synchronously before it. `set-state-in-effect` fires on any setState call that isn't inside an async callback or event handler inside the effect.

