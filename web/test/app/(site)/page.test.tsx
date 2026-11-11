import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Home from '@/app/(site)/page'
import type { Post } from '@/features/posts/api/types'

const posts = vi.hoisted(() => ({ list: [] as Post[] }))

vi.mock('@/features/posts/api/posts', () => ({ loadPosts: async () => posts.list }))

function post(slug: string): Post {
  return {
    slug,
    title: `${slug} title`,
    description: `${slug} description`,
    date: '2026-11-11T12:00:00.000Z',
    body: '',
    draft: false,
  }
}

beforeEach(() => {
  posts.list = []
})

describe('Home', () => {
  it('lists the three newest posts, linking each to its page', async () => {
    posts.list = ['d', 'c', 'b', 'a'].map(post)

    const out = renderToStaticMarkup(await Home())

    expect(out).toContain('Latest posts')
    expect(out).toContain('href="/blog/d"')
    expect(out).toContain('c description')
    expect(out).toContain('href="/blog/b"')
    expect(out).not.toContain('href="/blog/a"')
  })

  it('leaves out the latest posts before the first one', async () => {
    const out = renderToStaticMarkup(await Home())

    expect(out).not.toContain('Latest posts')
    expect(out).toContain('Let&#x27;s Connect')
  })
})
