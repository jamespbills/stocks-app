// Pure chart geometry — shared by ChartStack (SVG render) and ChartShell (report
// hit-area overlays + crosshair hit-testing). The panel stack adopts the legacy
// tool's price-dominant 35/10/18/18/18 proportions (see implementation v2 §12).

export type PanelKey = 'price' | 'vol' | 'stoch' | 'macd' | 'rsi'

export interface ChartGeometry {
  width: number
  height: number
  n: number
  plotL: number
  plotR: number
  plotW: number
  panelY: Record<PanelKey | 'axis', number>
  panelH: Record<PanelKey, number>
}

const PAD_L = 52
const PAD_R = 14
const PAD_T = 14
const PAD_B = 4
const AXIS_H = 28
const GAP = 6
const PROPORTIONS: Record<PanelKey, number> = {
  price: 0.35,
  vol: 0.1,
  stoch: 0.18,
  macd: 0.18,
  rsi: 0.18
}

export function buildGeometry(width: number, height: number, n: number): ChartGeometry {
  const stackH = height - PAD_T - PAD_B - AXIS_H - 4 * GAP
  const panelH: Record<PanelKey, number> = {
    price: Math.round(stackH * PROPORTIONS.price),
    vol: Math.round(stackH * PROPORTIONS.vol),
    stoch: Math.round(stackH * PROPORTIONS.stoch),
    macd: Math.round(stackH * PROPORTIONS.macd),
    rsi: Math.round(stackH * PROPORTIONS.rsi)
  }
  let y = PAD_T
  const panelY = {} as Record<PanelKey | 'axis', number>
  for (const key of ['price', 'vol', 'stoch', 'macd', 'rsi'] as PanelKey[]) {
    panelY[key] = y
    y += panelH[key] + GAP
  }
  panelY.axis = y
  return {
    width,
    height,
    n,
    plotL: PAD_L,
    plotR: width - PAD_R,
    plotW: width - PAD_R - PAD_L,
    panelY,
    panelH
  }
}

export function xForIndex(geom: ChartGeometry, i: number): number {
  if (geom.n <= 1) return geom.plotL
  return geom.plotL + (i / (geom.n - 1)) * geom.plotW
}

// Map a series value to a y-coordinate inside a panel given its value range.
export function yForValue(
  value: number,
  panelTop: number,
  panelHeight: number,
  lo: number,
  hi: number,
  padTop = 8,
  padBot = 8
): number {
  const usable = panelHeight - padTop - padBot
  const span = hi - lo || 1
  const t = (value - lo) / span
  return panelTop + padTop + (1 - t) * usable
}

// Nearest bar index for a mouse x (clamped into the plot).
export function indexForX(geom: ChartGeometry, mouseX: number): number {
  if (geom.n <= 1) return 0
  const clamped = Math.max(geom.plotL, Math.min(geom.plotR, mouseX))
  const t = (clamped - geom.plotL) / (geom.plotW || 1)
  return Math.max(0, Math.min(geom.n - 1, Math.round(t * (geom.n - 1))))
}
