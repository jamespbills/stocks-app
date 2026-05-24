import { useEffect, useState, useCallback, type ReactElement } from 'react'
import { RouterProvider, ActiveModule } from './router'
import { TitleBar } from './shell/title-bar'
import { Sidebar } from './shell/sidebar'
import { CommandPalette } from './shell/command-palette'
import { useZoom } from './hooks/useZoom'

export default function App(): ReactElement {
  useZoom()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteKey, setPaletteKey] = useState(0)

  const closePalette = useCallback(() => setPaletteOpen(false), [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen((prev) => {
          if (!prev) setPaletteKey((k) => k + 1)
          return !prev
        })
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <RouterProvider>
      {(activeId) => (
        <div
          className="flex flex-col h-screen overflow-hidden"
          style={{ background: 'var(--color-bg-base)' }}
        >
          <TitleBar />
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto min-w-0">
              <ActiveModule moduleId={activeId} />
            </main>
          </div>
          <CommandPalette key={paletteKey} isOpen={paletteOpen} onClose={closePalette} />
        </div>
      )}
    </RouterProvider>
  )
}
