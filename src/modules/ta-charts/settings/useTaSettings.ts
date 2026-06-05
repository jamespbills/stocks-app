import { useMemo } from 'react'
import { useIpcQuery } from '../../../hooks/useIpcQuery'
import { TA_SETTINGS_SQL, UPDATE_TA_SETTINGS_SQL } from '../queries'
import type { TaSettings } from '../types'

// DECIMAL columns (thresholds) arrive as strings from mysql2; SMALLINTs as
// numbers; the ENUM as a string. Normalise at this boundary.
interface RawTaSettingsRow {
  sma_window: number | string
  macd_fast: number | string
  macd_slow: number | string
  macd_signal: number | string
  stoch_k: number | string
  stoch_k_smooth: number | string
  stoch_d_smooth: number | string
  rsi_period: number | string
  buy_stoch_threshold: number | string
  sell_stoch_threshold: number | string
  macd_lookahead_days: number | string
  rsi_a_plus_buy: number | string
  rsi_a_buy: number | string
  rsi_b_buy: number | string
  rsi_a_plus_sell: number | string
  rsi_a_sell: number | string
  rsi_b_sell: number | string
  chart_window_days_before: number | string
  chart_window_days_after: number | string
  exit_mode: string
  buy_entry_window_days: number | string
}

export const DEFAULT_TA_SETTINGS: TaSettings = {
  smaWindow: 200,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  stochK: 14,
  stochKSmooth: 3,
  stochDSmooth: 3,
  rsiPeriod: 14,
  buyStochThreshold: 20,
  sellStochThreshold: 80,
  macdLookaheadDays: 5,
  rsiAPlusBuy: 30,
  rsiABuy: 40,
  rsiBBuy: 50,
  rsiAPlusSell: 70,
  rsiASell: 60,
  rsiBSell: 50,
  chartWindowDaysBefore: 365,
  chartWindowDaysAfter: 365,
  exitMode: 'window_end',
  buyEntryWindowDays: 90
}

function toSettings(r: RawTaSettingsRow): TaSettings {
  return {
    smaWindow: Number(r.sma_window),
    macdFast: Number(r.macd_fast),
    macdSlow: Number(r.macd_slow),
    macdSignal: Number(r.macd_signal),
    stochK: Number(r.stoch_k),
    stochKSmooth: Number(r.stoch_k_smooth),
    stochDSmooth: Number(r.stoch_d_smooth),
    rsiPeriod: Number(r.rsi_period),
    buyStochThreshold: Number(r.buy_stoch_threshold),
    sellStochThreshold: Number(r.sell_stoch_threshold),
    macdLookaheadDays: Number(r.macd_lookahead_days),
    rsiAPlusBuy: Number(r.rsi_a_plus_buy),
    rsiABuy: Number(r.rsi_a_buy),
    rsiBBuy: Number(r.rsi_b_buy),
    rsiAPlusSell: Number(r.rsi_a_plus_sell),
    rsiASell: Number(r.rsi_a_sell),
    rsiBSell: Number(r.rsi_b_sell),
    chartWindowDaysBefore: Number(r.chart_window_days_before),
    chartWindowDaysAfter: Number(r.chart_window_days_after),
    exitMode: r.exit_mode === 'next_sell_signal' ? 'next_sell_signal' : 'window_end',
    buyEntryWindowDays: Number(r.buy_entry_window_days)
  }
}

export interface TaSettingsQuery {
  data: TaSettings | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useTaSettings(): TaSettingsQuery {
  const query = useIpcQuery<RawTaSettingsRow[]>(TA_SETTINGS_SQL)
  const data = useMemo(
    () => (query.data && query.data.length > 0 ? toSettings(query.data[0]) : null),
    [query.data]
  )
  return { data, loading: query.loading, error: query.error, refetch: query.refetch }
}

// Persist the full settings row (Stage 1 edits only the periods, but the whole
// row is written so later-stage fields round-trip unchanged). Param order matches
// UPDATE_TA_SETTINGS_SQL.
export async function saveTaSettings(s: TaSettings): Promise<void> {
  await window.electronAPI.db.query(UPDATE_TA_SETTINGS_SQL, [
    s.smaWindow,
    s.macdFast,
    s.macdSlow,
    s.macdSignal,
    s.stochK,
    s.stochKSmooth,
    s.stochDSmooth,
    s.rsiPeriod,
    s.buyStochThreshold,
    s.sellStochThreshold,
    s.macdLookaheadDays,
    s.rsiAPlusBuy,
    s.rsiABuy,
    s.rsiBBuy,
    s.rsiAPlusSell,
    s.rsiASell,
    s.rsiBSell,
    s.chartWindowDaysBefore,
    s.chartWindowDaysAfter,
    s.exitMode,
    s.buyEntryWindowDays
  ])
}
