import { describe, it, expect } from 'vitest'
import { HIGH_52W_SQL, LIVE_PRICES_SQL, QUALIFIERS_SQL } from './queries'

// D1 — the Markdown Reviews module never writes to MySQL. Every gate query must be SELECT-only.
const WRITE_KEYWORDS = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|REPLACE|MERGE)\b/i

describe('gate queries are read-only', () => {
  const queries = { QUALIFIERS_SQL, LIVE_PRICES_SQL, HIGH_52W_SQL }

  for (const [name, sql] of Object.entries(queries)) {
    it(`${name} is a SELECT with no write keywords`, () => {
      expect(sql.trimStart()).toMatch(/^SELECT/i)
      expect(sql).not.toMatch(WRITE_KEYWORDS)
    })
  }
})
