import { describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/rss.xml/route'
import type { Post } from '@/features/posts/api/types'

const POSTS: Post[] = [
  {
    slug: 'tcp-handshake',
    title: 'TCP 3-way handshake',
    description: '세 번의 교환으로 연결을 연다.',
    date: '2026-10-21T01:00:00.000Z',
    body: '',
    draft: false,
  },
]

vi.mock('@/features/posts/api/posts', () => ({ loadPosts: async () => POSTS }))

describe('GET /rss.xml', () => {
  it('answers the posts as RSS', async () => {
    const response = await GET()
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/rss+xml; charset=utf-8')
    expect(body).toContain('<rss version="2.0"')
    expect(body).toContain('<title>TCP 3-way handshake</title>')
    expect(body).toContain('<link>http://localhost:3150/blog/tcp-handshake</link>')
    expect(body).toContain('<pubDate>Wed, 21 Oct 2026 01:00:00 GMT</pubDate>')
  })
})
