import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { PostSummary, Topic } from '@/features/posts/api/types'
import { TopicGroups } from '@/features/posts/components/TopicGroups'

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

describe('TopicGroups', () => {
  it('labels each topic with its number and how many posts it has', () => {
    const out = renderToStaticMarkup(<TopicGroups posts={POSTS} topics={TOPICS} />)

    expect(out).toContain(
      '<p class="group__label group__label--topic"><span class="mono group__count">01</span>운영체제<span class="mono group__count">(3)</span></p>',
    )
    expect(out).not.toContain('데이터베이스')
  })

  it('numbers each row', () => {
    const out = renderToStaticMarkup(<TopicGroups posts={POSTS} topics={TOPICS} />)

    expect(out).toContain('class="row row--topic" href="/posts/tcp-handshake"')
    expect(out).toContain('<span class="row__meta mono scramble-pending">2.1</span>')
  })
})
