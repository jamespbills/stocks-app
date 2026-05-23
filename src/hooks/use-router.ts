import { useContext } from 'react'
import { RouterContext, type RouterContextValue } from '../router-context'

export function useRouter(): RouterContextValue {
  return useContext(RouterContext)
}
