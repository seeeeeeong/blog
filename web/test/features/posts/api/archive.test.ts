import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadArchive } from '@/features/posts/api/archive'
import type { PostSummary, Topic } from '@/features/posts/api/types'

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

afterEach(() => vi.unstubAllGlobals())

describe('loadArchive', () => {
  it('reads the posts and the topics', async () => {
    vi.stubGlobal('fetch', async (url: string) =>
      Response.json(url.endsWith('/api/posts') ? POSTS : TOPICS),
    )

    await expect(loadArchive()).resolves.toEqual({ posts: POSTS, topics: TOPICS })
  })

  it('answers nothing when the api is down, so the page still opens', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('fetch failed')
    })

    await expect(loadArchive()).resolves.toBeNull()
  })

  it('answers nothing when the api fails', async () => {
    vi.stubGlobal('fetch', async () => new Response(null, { status: 500 }))

    await expect(loadArchive()).resolves.toBeNull()
  })
})
