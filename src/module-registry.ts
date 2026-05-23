import type { ComponentType, LazyExoticComponent } from 'react'
import { lazy } from 'react'

export interface ModuleDefinition {
  id: string
  label: string
  icon: string
  group: 'data' | 'tools'
  load: LazyExoticComponent<ComponentType>
}

export const modules: ModuleDefinition[] = [
  {
    id: 'watching-dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    group: 'data',
    load: lazy(() => import('./modules/watching-dashboard'))
  },
  {
    id: 'report-calendar',
    label: 'Calendar',
    icon: 'Calendar',
    group: 'data',
    load: lazy(() => import('./modules/report-calendar'))
  },
  {
    id: 'sector-signals',
    label: 'Signals',
    icon: 'TrendingUp',
    group: 'data',
    load: lazy(() => import('./modules/sector-signals'))
  },
  {
    id: 'markdown-viewer',
    label: 'Reviews',
    icon: 'FileText',
    group: 'tools',
    load: lazy(() => import('./modules/markdown-viewer'))
  },
  {
    id: 'script-launcher',
    label: 'Scripts',
    icon: 'Terminal',
    group: 'tools',
    load: lazy(() => import('./modules/script-launcher'))
  },
  {
    id: 'ta-charts',
    label: 'TA Charts',
    icon: 'BarChart2',
    group: 'tools',
    load: lazy(() => import('./modules/ta-charts'))
  }
]

export const moduleMap = new Map(modules.map((m) => [m.id, m]))
