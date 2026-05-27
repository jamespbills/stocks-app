import type { CSSProperties, ElementType, ReactElement, ReactNode } from 'react'

interface MutedLabelProps {
  children: ReactNode
  /** Font size in px or CSS string. Defaults to 10.5 (matches existing section headings). */
  size?: number | string
  /** Use monospace font (e.g. inline tags inside detail panels). Default false. */
  mono?: boolean
  /** Override colour (defaults to var(--color-text-muted)). */
  color?: string
  /** Custom container element. Defaults to `span`. */
  as?: ElementType
  /** Extra style — e.g. margin/padding to fit the host container. */
  style?: CSSProperties
}

export function MutedLabel({
  children,
  size = 10.5,
  mono = false,
  color = 'var(--color-text-muted)',
  as: Tag = 'span',
  style
}: MutedLabelProps): ReactElement {
  return (
    <Tag
      style={{
        fontFamily: mono ? 'var(--font-mono)' : undefined,
        fontSize: size,
        color,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        ...style
      }}
    >
      {children}
    </Tag>
  )
}
