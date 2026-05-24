import { useEffect } from 'react'

const ZOOM_STEP = 0.1
const ZOOM_MIN = 0.5
const ZOOM_MAX = 2.5
const ZOOM_DEFAULT = 1.0

export function useZoom(): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (!e.ctrlKey) return
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        window.electronAPI.zoom.setZoomFactor(
          Math.min(ZOOM_MAX, window.electronAPI.zoom.getZoomFactor() + ZOOM_STEP)
        )
      } else if (e.key === '-') {
        e.preventDefault()
        window.electronAPI.zoom.setZoomFactor(
          Math.max(ZOOM_MIN, window.electronAPI.zoom.getZoomFactor() - ZOOM_STEP)
        )
      } else if (e.key === '0') {
        e.preventDefault()
        window.electronAPI.zoom.setZoomFactor(ZOOM_DEFAULT)
      }
    }

    const handleWheel = (e: WheelEvent): void => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP
      window.electronAPI.zoom.setZoomFactor(
        Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, window.electronAPI.zoom.getZoomFactor() + delta))
      )
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [])
}
