import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/rss.xml/route'
import type { PostSummary, Topic } from '@/features/posts/api/types'

const TOPICS: Topic[] = [{ slug: 'network', title: '네트워크', position: 2 }]

const POSTS: PostSummary[] = [
  {
    slug: 'tcp-handshake',
    title: 'TCP 3-way handshake',
    summary: '세 번의 교환으로 연결을 연다.',
    topic: { slug: 'network', title: '네트워크', position: 2 },
    number: '2.1',
    publishedAt: '2026-10-21T01:00:00Z',
  },
]

afterEach(() => vi.unstubAllGlobals())

describe('GET /rss.xml', () => {
  it('answers the published posts as RSS', async () => {
    vi.stubGlobal('fetch', async (url: string) =>
      Response.json(url.endsWith('/api/posts') ? POSTS : TOPICS),
    )

    const response = await GET()
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/rss+xml; charset=utf-8')
    expect(body).toContain('<rss version="2.0"')
    expect(body).toContain('<title>TCP 3-way handshake</title>')
    expect(body).toContain('<link>http://localhost:3150/posts/tcp-handshake</link>')
    expect(body).toContain('<pubDate>Wed, 21 Oct 2026 01:00:00 GMT</pubDate>')
  })

  it('is unavailable rather than empty when the api is down', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('fetch failed')
    })

    const response = await GET()

    expect(response.status).toBe(503)
  })
})
