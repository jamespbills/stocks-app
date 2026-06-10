// Pure guard for renderer-supplied review paths. The renderer asks for files by a brain-root
// relative path; this rejects anything that could escape the brain root (absolute paths,
// Windows drive letters, or `..` segments that climb above the root) before any fs access.
// No node `path` — plain string analysis so it can be unit-tested anywhere.

/** True when `relPath` is a safe path that stays at or below the brain root. */
export function isSafeRelPath(relPath: string): boolean {
  if (typeof relPath !== 'string' || relPath.trim() === '') return false
  const p = relPath.replace(/\\/g, '/')
  if (p.startsWith('/')) return false // absolute (POSIX)
  if (/^[a-z]:/i.test(p)) return false // Windows drive (C:…)

  let depth = 0
  for (const seg of p.split('/')) {
    if (seg === '' || seg === '.') continue
    if (seg === '..') {
      depth--
      if (depth < 0) return false // climbed above the root
    } else {
      depth++
    }
  }
  return true
}
