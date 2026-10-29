import { describe, expect, it } from 'vitest'
import { commitOf, SOURCE_URL } from '@/utils/commit'

describe('commitOf', () => {
  it('shortens the build commit and links to it', () => {
    expect(commitOf('208882d4c1f0e9a7b3c2d1e0f9a8b7c6d5e4f3a2')).toEqual({
      label: '208882d',
      href: `${SOURCE_URL}/commit/208882d`,
    })
  })

  it('calls a build without one local, linking to the source', () => {
    expect(commitOf(undefined)).toEqual({ label: 'local', href: SOURCE_URL })
    expect(commitOf('  ')).toEqual({ label: 'local', href: SOURCE_URL })
  })
})
