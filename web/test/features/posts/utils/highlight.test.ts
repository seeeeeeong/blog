import { describe, expect, it } from 'vitest'
import { tokenize } from '@/features/posts/utils/highlight'

describe('tokenize', () => {
  it("colors Kotlin with the theme's categories, a line at a time", async () => {
    const lines = await tokenize('val port = 8080\nhandle(port)', 'kotlin')

    expect(lines).toHaveLength(2)
    expect(lines[0]?.[0]).toEqual({ content: 'val', color: 'var(--shiki-token-keyword)' })
    expect(lines[0]).toContainEqual({ content: '8080', color: 'var(--shiki-token-constant)' })
    expect(lines[1]?.[0]).toEqual({ content: 'handle', color: 'var(--shiki-token-function)' })
  })

  it('takes a language by its alias', async () => {
    const lines = await tokenize('const a = 1', 'ts')

    expect(lines[0]?.[0]?.color).toBe('var(--shiki-token-keyword)')
  })

  it('leaves a language it does not know, or none, as plain lines', async () => {
    await expect(tokenize('a\nb', 'cobol')).resolves.toEqual([
      [{ content: 'a' }],
      [{ content: 'b' }],
    ])
    await expect(tokenize('a', undefined)).resolves.toEqual([[{ content: 'a' }]])
  })
})
