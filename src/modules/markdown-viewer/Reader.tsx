import { useMemo, type CSSProperties, type ReactElement } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MutedLabel } from '../../components/MutedLabel'
import { formatDate } from '../../lib/format'
import { GateChip } from './GateChip'
import { useReviewDoc } from './adapters/useReviewDoc'
import { deriveTitle } from './title'
import { resolveBrainLink } from './links'
import { effectiveGate } from './ticker'

interface Props {
  relPath: string
  /** Navigate to another brain page (in-brain link click). */
  onNavigate: (relPath: string) => void
  /** Return to the browse list. */
  onBack: () => void
}

const linkStyle: CSSProperties = {
  display: 'inline',
  padding: 0,
  font: 'inherit',
  color: 'var(--color-up)',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--color-border-default)',
  cursor: 'pointer'
}
const extLinkStyle: CSSProperties = { color: 'var(--color-text-secondary)' }

export function Reader({ relPath, onNavigate, onBack }: Props): ReactElement {
  const { doc, error } = useReviewDoc(relPath)

  const components = useMemo<Components>(
    () => ({
      a({ href, children }) {
        const target = typeof href === 'string' ? resolveBrainLink(relPath, href) : null
        if (target) {
          return (
            <button type="button" onClick={() => onNavigate(target)} style={linkStyle}>
              {children}
            </button>
          )
        }
        // External / non-brain links are inert in v1 (no shell.openExternal yet).
        return <span style={extLinkStyle}>{children}</span>
      },
      h1: ({ children }) => (
        <h1
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--color-text-primary)',
            margin: 'var(--space-5) 0 var(--space-3)'
          }}
        >
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2
          style={{
            fontSize: 'var(--text-md)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--color-text-primary)',
            margin: 'var(--space-5) 0 var(--space-2)'
          }}
        >
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            margin: 'var(--space-4) 0 var(--space-2)'
          }}
        >
          {children}
        </h3>
      ),
      p: ({ children }) => (
        <p
          style={{
            margin: '0 0 var(--space-3)',
            lineHeight: 'var(--leading-relaxed)',
            color: 'var(--color-text-secondary)'
          }}
        >
          {children}
        </p>
      ),
      ul: ({ children }) => (
        <ul
          style={{ margin: '0 0 var(--space-3)', paddingLeft: 'var(--space-5)', listStyle: 'disc' }}
        >
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol
          style={{
            margin: '0 0 var(--space-3)',
            paddingLeft: 'var(--space-5)',
            listStyle: 'decimal'
          }}
        >
          {children}
        </ol>
      ),
      li: ({ children }) => (
        <li
          style={{
            margin: '0 0 var(--space-2)',
            lineHeight: 'var(--leading-relaxed)',
            color: 'var(--color-text-secondary)'
          }}
        >
          {children}
        </li>
      ),
      strong: ({ children }) => (
        <strong style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-medium)' }}>
          {children}
        </strong>
      ),
      em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
      code: ({ children }) => (
        <code
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9em',
            background: 'var(--color-bg-elevated)',
            padding: '1px 5px',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          {children}
        </code>
      ),
      blockquote: ({ children }) => (
        <blockquote
          style={{
            margin: '0 0 var(--space-3)',
            padding: '0 var(--space-4)',
            borderLeft: '2px solid var(--color-border-default)',
            color: 'var(--color-text-muted)'
          }}
        >
          {children}
        </blockquote>
      ),
      hr: () => (
        <hr
          style={{
            border: 'none',
            borderTop: '1px solid var(--color-border-subtle)',
            margin: 'var(--space-5) 0'
          }}
        />
      )
    }),
    [relPath, onNavigate]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Breadcrumb */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-3) var(--space-5)',
          borderBottom: '1px solid var(--color-border-subtle)',
          flexShrink: 0
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            padding: 0
          }}
        >
          Reviews
        </button>
        <span style={{ color: 'var(--color-text-disabled)' }}>/</span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
          {doc ? deriveTitle(doc) : '…'}
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-6) var(--space-5)' }}>
          {error !== null && <span style={{ color: 'var(--color-down)' }}>{error}</span>}
          {error === null && doc === null && (
            <span style={{ color: 'var(--color-text-muted)' }}>Loading…</span>
          )}
          {doc && (
            <>
              {/* Frontmatter header — visually distinct from the prose */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 'var(--space-3)',
                  paddingBottom: 'var(--space-4)',
                  marginBottom: 'var(--space-5)',
                  borderBottom: '1px solid var(--color-border-subtle)'
                }}
              >
                <MutedLabel size={11} mono>
                  {doc.pageType}
                </MutedLabel>
                {doc.frontmatter.sector && (
                  <MutedLabel size={11}>{doc.frontmatter.sector}</MutedLabel>
                )}
                {doc.pageType === 'ticker' && <GateChip gate={effectiveGate(doc.frontmatter)} />}
                {doc.frontmatter.last_updated && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10.5,
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    {formatDate(doc.frontmatter.last_updated, 'long')}
                  </span>
                )}
              </div>

              <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {doc.body}
              </ReactMarkdown>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
