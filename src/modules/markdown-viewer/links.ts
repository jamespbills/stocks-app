// Pure resolver for the brain's internal cross-links. The brain links pages with relative
// markdown links (`[text](signal-x.md)`, `[text](../archive/y.md)`); this turns such an href
// into a POSIX brain-relative path the Reader can navigate to. Implemented with plain string
// ops (no node `path`) because this module is imported by the renderer-side Reader.

/**
 * Resolve a markdown link `href` (as authored on the page at `fromRelPath`) to a brain-root
 * relative path, or `null` when the link is not an in-brain markdown page (external/protocol
 * link, anchor-only, non-`.md`, or one that escapes above the brain root).
 */
export function resolveBrainLink(fromRelPath: string, href: string): string | null {
  if (typeof href !== 'string') return null
  const trimmed = href.trim()
  if (trimmed === '') return null

  // Drop any #anchor / ?query suffix.
  const base = trimmed.split('#')[0].split('?')[0]
  if (base === '') return null // anchor-only link → not a page navigation

  // Reject external/protocol links (http:, https:, mailto:, file:, …) and protocol-relative.
  if (/^[a-z][a-z0-9+.-]*:/i.test(base)) return null
  if (base.startsWith('//')) return null

  // Markdown pages only.
  if (!/\.md$/i.test(base)) return null

  const parts = base.replace(/\\/g, '/').split('/')

  // Brain-root-absolute (`/wiki/x.md`) starts from root; otherwise from the linking page's dir.
  let segments: string[]
  if (base.startsWith('/')) {
    segments = []
  } else {
    const from = fromRelPath.replace(/\\/g, '/')
    const slash = from.lastIndexOf('/')
    segments = slash >= 0 ? from.slice(0, slash).split('/').filter(Boolean) : []
  }

  for (const part of parts) {
    if (part === '' || part === '.') continue
    if (part === '..') {
      if (segments.length === 0) return null // escapes above the brain root
      segments.pop()
      continue
    }
    segments.push(part)
  }

  return segments.length > 0 ? segments.join('/') : null
}
