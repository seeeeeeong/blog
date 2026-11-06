import { describe, expect, it } from 'vitest'
import type { PostSummary, Topic } from '@/features/posts/api/types'
import { byYear, newestOf, postHref } from '@/features/posts/utils/archive'

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

describe('byYear', () => {
  it('groups posts by year, newest year and newest post first', () => {
    const groups = byYear([...POSTS].reverse())

    expect(groups.map((g) => [g.year, g.posts.map((p) => p.slug)])).toEqual([
      ['2026', ['tcp-handshake', 'virtual-memory', 'process-thread']],
      ['2025', ['cpu-scheduling']],
    ])
  })

  it('puts a post in the year it was published in Seoul', () => {
    const newYear = post('new-year', os, 4, '2025-12-31T15:30:00Z')

    expect(byYear([newYear]).map((g) => g.year)).toEqual(['2026'])
  })

  it('has no groups without posts', () => {
    expect(byYear([])).toEqual([])
  })
})

describe('newestOf', () => {
  it('finds the newest post, or none', () => {
    expect(newestOf([...POSTS].reverse())?.slug).toBe('tcp-handshake')
    expect(newestOf([])).toBeUndefined()
  })
})

describe('postHref', () => {
  it('links to the post page', () => {
    expect(postHref('tcp-handshake')).toBe('/posts/tcp-handshake')
  })
})
