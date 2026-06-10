import { describe, it, expect } from 'vitest'
import { isSafeRelPath } from './path-safety'

describe('isSafeRelPath', () => {
  it('accepts normal brain-relative paths', () => {
    expect(isSafeRelPath('wiki/fdm.md')).toBe(true)
    expect(isSafeRelPath('archive/2026-04-02-x.md')).toBe(true)
    expect(isSafeRelPath('wiki/sub/dir/page.md')).toBe(true)
    // A `..` that stays at/below root is fine.
    expect(isSafeRelPath('wiki/../raw/note.md')).toBe(true)
  })

  it('I5 — rejects traversal escapes, absolute paths and drive letters', () => {
    expect(isSafeRelPath('../../etc/passwd')).toBe(false)
    expect(isSafeRelPath('wiki/../../secret.md')).toBe(false)
    expect(isSafeRelPath('/etc/passwd')).toBe(false)
    expect(isSafeRelPath('C:\\Windows\\system32')).toBe(false)
    expect(isSafeRelPath('')).toBe(false)
    expect(isSafeRelPath('   ')).toBe(false)
  })
})
