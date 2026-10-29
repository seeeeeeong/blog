import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadPost } from '@/features/posts/api/post'
import type { Post } from '@/features/posts/api/types'

const POST: Post = {
  slug: 'tcp-handshake',
  title: 'TCP 3-way handshake',
  summary: 'summary',
  topic: { slug: 'network', title: '네트워크', position: 2 },
  number: '2.1',
  publishedAt: '2026-10-21T00:00:00Z',
  bodyMdx: '본문',
  previous: null,
  next: null,
}

afterEach(() => vi.unstubAllGlobals())

describe('loadPost', () => {
  it('reads the post by its slug', async () => {
    const fetch = vi.fn(async () => Response.json(POST))
    vi.stubGlobal('fetch', fetch)

    await expect(loadPost('tcp-handshake')).resolves.toEqual(POST)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/posts\/tcp-handshake$/),
      expect.anything(),
    )
  })

  it('escapes the slug into the path', async () => {
    const fetch = vi.fn(async () => Response.json(POST))
    vi.stubGlobal('fetch', fetch)

    await loadPost('a/../b')

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/posts\/a%2F\.\.%2Fb$/),
      expect.anything(),
    )
  })

  it('answers null when there is no such published post', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ code: 'post.not_found' }, { status: 404 }))

    await expect(loadPost('missing')).resolves.toBeNull()
  })

  it('fails when the api does', async () => {
    vi.stubGlobal('fetch', async () => new Response(null, { status: 500 }))

    await expect(loadPost('tcp-handshake')).rejects.toThrow('answered 500')
  })
})
