# Lessons

- **mysql2 DATE columns return JS `Date` objects at runtime**, not strings — even though TypeScript types them as `string | null`. Any sort, comparison, or string operation on a date field must handle `instanceof Date` (e.g. coerce via `.getTime()`). Do not rely on `String(value).localeCompare()` for date sorting.

- **`ticker` is not a unique row identifier.** `view_watching` can return multiple rows for the same ticker (one ticker, multiple active reports). Never use `ticker` alone as a React `key`, selection state, or `findIndex` target. Always derive a composite `rowKey` — e.g. `` `${ticker}|${filing_identifier ?? date_released ?? ...}` ``.

