import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { PostSummary, Topic } from '@/features/posts/api/types'
import { Archive } from '@/features/posts/views/Archive'

const TOPICS: Topic[] = [
  { slug: 'os', title: '운영체제', position: 1 },
  { slug: 'network', title: '네트워크', position: 2 },
  { slug: 'database', title: '데이터베이스', position: 3 },
]

function post(slug: string, topic: Topic, place: number, publishedAt: string): PostSummary {
  return {
    slug,
    title: `${slug} title`,
    summary: `${slug} summary`,
    topic,
    number: `${topic.position}.${place}`,
    publishedAt,
  }
}

const [os, network] = TOPICS as [Topic, Topic, Topic]

/** Newest first, as the api lists them. */
const POSTS: PostSummary[] = [
  post('tcp-handshake', network, 1, '2026-10-21T01:00:00Z'),
  post('virtual-memory', os, 3, '2026-06-03T01:00:00Z'),
  post('process-thread', os, 1, '2026-02-20T01:00:00Z'),
  post('cpu-scheduling', os, 2, '2025-07-18T01:00:00Z'),
]

describe('Archive', () => {
  it('lists posts by date on the server, which cannot see the fragment', () => {
    const out = renderToStaticMarkup(<Archive archive={{ posts: POSTS, topics: TOPICS }} />)

    expect(out).toContain('<a href="#date" aria-current="page">By date</a>')
    expect(out).toContain('<a href="#topic">By topic</a>')
    expect(out.indexOf('>2026<')).toBeLessThan(out.indexOf('>2025<'))
    expect(out).toContain('href="/posts/tcp-handshake"')
    expect(out).toContain('tcp-handshake title')
    expect(out).toContain('OCT 21')
    expect(out).not.toContain('row--topic')
  })

  it('renders its text hidden until it scrolls into view', () => {
    const out = renderToStaticMarkup(<Archive archive={{ posts: POSTS, topics: TOPICS }} />)

    expect(out).toContain('<span class="scramble-pending">tcp-handshake title</span>')
  })

  it('says when there are no posts yet', () => {
    const out = renderToStaticMarkup(<Archive archive={{ posts: [], topics: TOPICS }} />)

    expect(out).toContain('아직 올린 글이 없습니다.')
    expect(out).not.toContain('class="tabs"')
  })

  it('says when the posts could not be read', () => {
    const out = renderToStaticMarkup(<Archive archive={null} />)

    expect(out).toContain('글 목록을 불러오지 못했습니다.')
  })
})
