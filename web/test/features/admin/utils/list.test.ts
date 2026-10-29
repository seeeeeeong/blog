import { describe, expect, it } from 'vitest'
import type { AdminPostSummary } from '@/features/admin/api/types'
import { groupPosts, listMeta, postEditHref } from '@/features/admin/utils/list'

const network = { slug: 'network', title: '네트워크', position: 2 }

function draft(id: string, updatedAt: string): AdminPostSummary {
  return {
    id,
    slug: id,
    title: `${id} title`,
    status: 'DRAFT',
    topic: network,
    sectionId: null,
    number: '2.9',
    updatedAt,
    publishedAt: null,
  }
}

function published(id: string, publishedAt: string): AdminPostSummary {
  return { ...draft(id, publishedAt), status: 'PUBLISHED', publishedAt }
}

const POSTS = [
  published('udp', '2025-12-31T16:00:00Z'),
  draft('quic', '2026-10-01T00:00:00Z'),
  published('tcp', '2026-10-21T00:00:00Z'),
  draft('dns', '2026-10-25T00:00:00Z'),
]

const ids = (groups: ReturnType<typeof groupPosts>) =>
  groups.map((group) => [group.label, group.count, group.posts.map((post) => post.id)])

describe('groupPosts', () => {
  it('puts drafts first, last edited first, then the published by their year in Seoul', () => {
    expect(ids(groupPosts(POSTS, 'all'))).toEqual([
      ['Drafts', 2, ['dns', 'quic']],
      ['2026', undefined, ['tcp', 'udp']],
    ])
  })

  it('shows only the drafts, or only the published', () => {
    expect(ids(groupPosts(POSTS, 'draft'))).toEqual([['Drafts', 2, ['dns', 'quic']]])
    expect(ids(groupPosts(POSTS, 'published'))).toEqual([['2026', undefined, ['tcp', 'udp']]])
  })

  it('has no drafts group without a draft', () => {
    expect(ids(groupPosts([POSTS[0] as AdminPostSummary], 'all'))).toEqual([
      ['2026', undefined, ['udp']],
    ])
  })
})

describe('listMeta', () => {
  it('counts the posts and the drafts among them', () => {
    expect(listMeta(POSTS)).toBe('4 posts / 2 drafts')
  })
})

describe('postEditHref', () => {
  it('leads to the editor', () => {
    expect(postEditHref('0199-a')).toBe('/admin/posts/0199-a')
  })
})
