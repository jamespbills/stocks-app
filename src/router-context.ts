import { createContext } from 'react'

export interface RouterContextValue {
  activeId: string
  navigate: (id: string) => void
}

export const RouterContext = createContext<RouterContextValue>({
  activeId: 'watching-dashboard',
  navigate: () => {}
})
