import { describe, it, expect } from 'vitest'
import { buildMarketMap, deriveMarketStats } from './market'

describe('deriveMarketStats', () => {
  it('computes % from 52-week high', () => {
    expect(deriveMarketStats(100, 200)).toEqual({ lastPrice: 100, high52: 200, fromHighPct: -0.5 })
  })

  it('is null-safe when either input is missing or the high is zero', () => {
    expect(deriveMarketStats(null, 200).fromHighPct).toBeNull()
    expect(deriveMarketStats(100, null).fromHighPct).toBeNull()
    expect(deriveMarketStats(100, 0).fromHighPct).toBeNull()
    expect(deriveMarketStats(null, null)).toEqual({
      lastPrice: null,
      high52: null,
      fromHighPct: null
    })
  })
})

describe('buildMarketMap', () => {
  it('merges live price and 52-wk high on the full ticker key', () => {
    const map = buildMarketMap(
      [{ ticker: 'FDM.L', live_price: '100', updated_at: null }],
      [{ ticker: 'fdm.l', high_52w: '200' }] // case-insensitive key
    )
    expect(map.get('FDM.L')).toEqual({ lastPrice: 100, high52: 200, fromHighPct: -0.5 })
  })

  it('keeps a UK listing (ABC.L) and a US listing (ABC) as distinct keys', () => {
    const map = buildMarketMap(
      [
        { ticker: 'ABC.L', live_price: '10', updated_at: null },
        { ticker: 'ABC', live_price: '90', updated_at: null }
      ],
      [
        { ticker: 'ABC.L', high_52w: '20' },
        { ticker: 'ABC', high_52w: '100' }
      ]
    )
    expect(map.get('ABC.L')?.lastPrice).toBe(10)
    expect(map.get('ABC')?.lastPrice).toBe(90)
  })

  it('keeps a ticker present in only one source (graceful absence)', () => {
    const map = buildMarketMap(
      [{ ticker: 'HY', live_price: '50', updated_at: null }],
      [{ ticker: 'TNK', high_52w: '80' }]
    )
    expect(map.get('HY')).toEqual({ lastPrice: 50, high52: null, fromHighPct: null })
    expect(map.get('TNK')).toEqual({ lastPrice: null, high52: 80, fromHighPct: null })
  })
})
