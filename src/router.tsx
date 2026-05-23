import { Component, Suspense, useState, type ReactNode, type ReactElement } from 'react'
import { RouterContext } from './router-context'
import { moduleMap } from './module-registry'

function LoadingFallback(): ReactElement {
  return (
    <div
      className="flex h-full items-center justify-center"
      style={{ color: 'var(--color-text-muted)' }}
    >
      Loading…
    </div>
  )
}

interface ErrorBoundaryState {
  error: Error | null
}

class ModuleErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 32,
            fontFamily: 'var(--font-mono)',
            fontSize: 12.5,
            color: 'var(--color-danger)',
            background: 'var(--color-bg-base)',
            height: '100%',
            overflow: 'auto'
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Module error</div>
          <div style={{ color: 'var(--color-text-primary)', marginBottom: 12 }}>
            {this.state.error.message}
          </div>
          <pre
            style={{
              fontSize: 11,
              color: 'var(--color-text-muted)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}
          >
            {this.state.error.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

interface RouterProviderProps {
  children: (activeId: string) => ReactNode
}

export function RouterProvider({ children }: RouterProviderProps): ReactElement {
  const [activeId, setActiveId] = useState('watching-dashboard')
  return (
    <RouterContext.Provider value={{ activeId, navigate: setActiveId }}>
      {children(activeId)}
    </RouterContext.Provider>
  )
}

interface ActiveModuleProps {
  moduleId: string
}

export function ActiveModule({ moduleId }: ActiveModuleProps): ReactElement {
  const def = moduleMap.get(moduleId)
  if (!def) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Module not found: {moduleId}
      </div>
    )
  }
  const Component = def.load
  return (
    <ModuleErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Component />
      </Suspense>
    </ModuleErrorBoundary>
  )
}
