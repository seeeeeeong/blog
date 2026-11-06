import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Home from '@/app/(site)/page'
import type { Post, PostSummary, Topic } from '@/features/posts/api/types'

const network: Topic = { slug: 'network', title: '네트워크', position: 2 }
const os: Topic = { slug: 'os', title: '운영체제', position: 1 }

function summary(slug: string, topic: Topic, publishedAt: string): PostSummary {
  return { slug, title: `${slug} title`, summary: 's', topic, number: '1.1', publishedAt }
}

/** Not newest first, so the page has to find the newest itself. */
const POSTS: PostSummary[] = [
  summary('virtual-memory', os, '2026-06-03T01:00:00Z'),
  summary('tcp-handshake', network, '2026-10-21T01:00:00Z'),
]

const NEWEST: Post = {
  ...summary('tcp-handshake', network, '2026-10-21T01:00:00Z'),
  title: 'TCP 3-way handshake',
  bodyMdx: '세 번 주고받습니다.',
  previous: null,
  next: null,
}

function answering(posts: PostSummary[]) {
  return async (url: string) => {
    if (url.endsWith('/api/posts/tcp-handshake')) return Response.json(NEWEST)
    if (url.endsWith('/api/posts')) return Response.json(posts)
    return Response.json([network, os])
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('Home', () => {
  it('shows the newest post in full, its title linking to its own page', async () => {
    vi.stubGlobal('fetch', answering(POSTS))

    const out = renderToStaticMarkup(await Home())

    expect(out).toContain(
      '<h1 class="post__title"><a href="/posts/tcp-handshake">TCP 3-way handshake</a></h1>',
    )
    expect(out).toContain('October 21, 2026')
    expect(out).toContain('세 번 주고받습니다.')
    expect(out).not.toContain('virtual-memory')
  })

  it('is an empty page before the first post', async () => {
    vi.stubGlobal('fetch', answering([]))

    const out = renderToStaticMarkup(await Home())

    expect(out).toBe('<main class="post"></main>')
  })

  it('still opens when the api is down', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('fetch failed')
    })

    const out = renderToStaticMarkup(await Home())

    expect(out).toContain('글을 불러오지 못했습니다.')
  })
})
