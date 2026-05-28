export type Strategy = 'play' | 'play_2'

export type SignalStrength = 'STRONG' | 'PROMISING' | 'NEUTRAL' | 'WEAK'

export interface ComboRow {
  sector: string
  criterionCode: number
  criterionName: string
  nTickers: number
  avgRoi: number | null
  winRate: number | null
  signalStrength: SignalStrength
  isActive: boolean
  pendingActive: boolean | null
}

export interface SectorGroup {
  sector: string
  combos: ComboRow[]
  isExpanded: boolean
}

export interface ComboTicker {
  ticker: string
  roi: number | null
  roi6m: number | null
  reportDate: string | null
  financialYear: number | null
  filingIdentifier: string | null
  note: string
}

export interface ComboDetail {
  sector: string
  criterionCode: number
  criterionName: string
  nTickers: number
  avgRoi: number | null
  winRate: number | null
  signalStrength: SignalStrength
  isActive: boolean
  comboNote: string
  tickers: ComboTicker[]
}

export interface PendingChange {
  strategy: Strategy
  sector: string
  criterionCode: number
  targetActive: boolean
}

export interface ComboLeaderboardRow {
  sector: string
  criterionCode: number
  criterionName: string
  nPlays: number
  nUniqueTickers: number
  wins: number
  losses: number
  winPct: number | null
  avgRoi: number | null
  medianRoi: number | null
  cumulativeRoi: number | null
  signalStrength: SignalStrength
  isActive: boolean
}

export const CRITERION_NAMES: Record<number, string> = {
  1: 'ROIC',
  2: 'GD/PE',
  3: 'Opportunity',
  4: 'Capital Turn',
  5: 'EV/Sales',
  6: 'Current Ratio',
  7: 'Momentum',
  8: 'FCF Margin',
  9: 'ROA',
  10: 'Est Growth Rate',
  11: 'Shares vs LY',
  12: 'Debt Management',
  13: 'EPS Growth',
  14: 'Gross Profitability',
  15: 'ROE',
  16: 'P/E'
}

export function fromViewSignal(viewSignal: string | null): SignalStrength {
  switch (viewSignal) {
    case 'STRONG':
      return 'STRONG'
    case 'PROMISING':
      return 'PROMISING'
    case 'neutral':
      return 'NEUTRAL'
    case 'weak':
      return 'WEAK'
    case 'insufficient data':
      return 'WEAK'
    default:
      return 'WEAK'
  }
}

export function signalStrength(nTickers: number, avgRoi: number | null): SignalStrength {
  if (nTickers < 3 || avgRoi === null) return 'WEAK'
  if (nTickers >= 3 && avgRoi > 0.15) return 'STRONG'
  if (nTickers >= 2 && avgRoi > 0.1) return 'PROMISING'
  if (avgRoi > 0) return 'NEUTRAL'
  return 'WEAK'
}
