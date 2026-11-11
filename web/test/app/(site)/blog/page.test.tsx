import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import BlogPage from '@/app/(site)/blog/page'
import type { Post } from '@/features/posts/api/types'

function post(slug: string, date: string): Post {
  return { slug, title: `${slug} title`, description: '', date, body: '', draft: false }
}

vi.mock('@/features/posts/api/posts', () => ({
  loadPosts: async () => [
    post('new', '2026-03-01T00:00:00.000Z'),
    post('old', '2025-06-01T00:00:00.000Z'),
  ],
}))

describe('BlogPage', () => {
  it('lists every post under its year, newest year first', async () => {
    const out = renderToStaticMarkup(await BlogPage())

    expect(out.indexOf('2026')).toBeLessThan(out.indexOf('new title'))
    expect(out.indexOf('new title')).toBeLessThan(out.indexOf('2025'))
    expect(out.indexOf('2025')).toBeLessThan(out.indexOf('old title'))
  })
})
