import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type ReactElement
} from 'react'
import { createPortal } from 'react-dom'

interface PopoverProps {
  children: ReactNode
  onDismiss: () => void
  anchorEl: HTMLElement | null
  width?: number
}

const MARGIN = 8
const GAP = 6

export function Popover({
  children,
  onDismiss,
  anchorEl,
  width = 240
}: PopoverProps): ReactElement | null {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number; ready: boolean }>({
    top: 0,
    left: 0,
    ready: false
  })

  // Dismiss on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onDismiss])

  // Dismiss on outside click. The window listener registers in useEffect — i.e.
  // after the click that opened this popover has finished bubbling — so the
  // initial open click won't immediately re-close it.
  useEffect(() => {
    function handleClick(e: MouseEvent): void {
      const popoverEl = popoverRef.current
      if (popoverEl && e.target instanceof Node && popoverEl.contains(e.target)) return
      onDismiss()
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [onDismiss])

  // Position relative to anchor in viewport coords; reposition on scroll/resize.
  useLayoutEffect(() => {
    if (!anchorEl) return
    function reposition(): void {
      const anchor = anchorEl?.getBoundingClientRect()
      const popover = popoverRef.current?.getBoundingClientRect()
      if (!anchor || !popover) return
      const vw = window.innerWidth
      const vh = window.innerHeight
      const popoverW = popover.width || width
      const popoverH = popover.height || 0

      // Horizontal: prefer right of anchor; flip left if it would overflow.
      let left = anchor.right + GAP
      if (left + popoverW > vw - MARGIN) {
        left = anchor.left - GAP - popoverW
      }
      if (left < MARGIN) left = MARGIN

      // Vertical: align with anchor top; shift up if it would overflow.
      let top = anchor.top
      if (popoverH > 0 && top + popoverH > vh - MARGIN) {
        top = vh - MARGIN - popoverH
      }
      if (top < MARGIN) top = MARGIN

      setPosition({ top, left, ready: true })
    }
    reposition()
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [anchorEl, width])

  if (!anchorEl) return null

  const node = (
    <div
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width,
        background: 'var(--color-bg-overlay)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 8,
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        padding: 12,
        zIndex: 200,
        visibility: position.ready ? 'visible' : 'hidden'
      }}
    >
      {children}
    </div>
  )

  return createPortal(node, document.body) as ReactElement
}
