import { describe, expect, it } from 'vitest'
import type { PostSummary, Topic } from '@/features/posts/api/types'
import { escapeXml, rssFeed } from '@/features/posts/utils/rss'

const network: Topic = { slug: 'network', title: '네트워크', position: 2 }

function post(slug: string, title: string, summary: string, publishedAt: string): PostSummary {
  return { slug, title, summary, topic: network, number: '2.1', publishedAt }
}

const POSTS: PostSummary[] = [
  post('http-versions', 'HTTP/1.1에서 HTTP/3까지', '세 버전을 비교한다.', '2026-04-15T00:00:00Z'),
  post('tcp-handshake', 'TCP & <SYN>', '"세 번"의 교환', '2026-10-21T01:00:00Z'),
]

describe('escapeXml', () => {
  it('escapes the five characters XML reserves', () => {
    expect(escapeXml(`a & b < c > d "e" 'f'`)).toBe(
      'a &amp; b &lt; c &gt; d &quot;e&quot; &apos;f&apos;',
    )
  })

  it('escapes an ampersand once, even before an entity', () => {
    expect(escapeXml('&amp;')).toBe('&amp;amp;')
  })

  it('drops the control characters XML cannot hold, and keeps tabs and line breaks', () => {
    expect(escapeXml('a\u0000b\u000Bc\td\ne')).toBe('abc\td\ne')
  })
})

describe('rssFeed', () => {
  const feed = rssFeed(POSTS, 'https://blog.example.com')

  it('describes the site as an RSS 2.0 channel', () => {
    expect(feed.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"')).toBe(true)
    expect(feed).toContain('<title>Sinseong Lee</title>')
    expect(feed).toContain('<link>https://blog.example.com/</link>')
    expect(feed).toContain('<description>CS를 공부하며 정리한 글</description>')
    expect(feed).toContain(
      '<atom:link href="https://blog.example.com/rss.xml" rel="self" type="application/rss+xml"/>',
    )
  })

  it('lists the posts newest first, each linked by its page', () => {
    expect(feed.indexOf('tcp-handshake')).toBeLessThan(feed.indexOf('http-versions'))
    expect(feed).toContain('<link>https://blog.example.com/posts/tcp-handshake</link>')
    expect(feed).toContain(
      '<guid isPermaLink="true">https://blog.example.com/posts/tcp-handshake</guid>',
    )
    expect(feed).toContain('<pubDate>Wed, 21 Oct 2026 01:00:00 GMT</pubDate>')
  })

  it('escapes the title and the summary', () => {
    expect(feed).toContain('<title>TCP &amp; &lt;SYN&gt;</title>')
    expect(feed).toContain('<description>&quot;세 번&quot;의 교환</description>')
  })

  it('joins links to a site URL with or without a trailing slash', () => {
    expect(rssFeed(POSTS, 'https://blog.example.com/')).toContain(
      '<link>https://blog.example.com/posts/tcp-handshake</link>',
    )
  })

  it('is a channel with no items when nothing is published', () => {
    const empty = rssFeed([], 'https://blog.example.com')

    expect(empty).not.toContain('<item>')
    expect(empty).toContain('</channel>')
  })
})
