import { describe, expect, it } from 'vitest'
import { type CmdPost, groupsOf, matchesPost, visibleItems } from '@/features/cmd/utils/items'

/** Newest first, as the layout passes them. */
const POSTS: CmdPost[] = [
  {
    href: '/posts/tcp-handshake',
    title: 'TCP 3-way handshake',
    topic: '네트워크',
    summary: '세 번의 교환으로 연결을 연다.',
    publishedAt: '2026-10-21T01:00:00Z',
  },
  {
    href: '/posts/virtual-memory',
    title: 'Virtual Memory',
    topic: '운영체제',
    summary: '페이지 테이블로 주소를 옮긴다.',
    publishedAt: '2026-06-03T01:00:00Z',
  },
]

const [tcp, memory] = POSTS as [CmdPost, CmdPost]

const labels = (items: { label: string }[]) => items.map((item) => item.label)

describe('matchesPost', () => {
  it('finds the query in the title, the topic or the summary', () => {
    expect(matchesPost(tcp, 'handshake')).toBe(true)
    expect(matchesPost(tcp, '네트워크')).toBe(true)
    expect(matchesPost(tcp, '교환')).toBe(true)
    expect(matchesPost(tcp, '운영체제')).toBe(false)
  })

  it('ignores case and surrounding spaces', () => {
    expect(matchesPost(memory, '  VIRTUAL memory ')).toBe(true)
    expect(matchesPost(tcp, 'Tcp')).toBe(true)
  })

  it('matches every post on an empty query', () => {
    expect(matchesPost(tcp, '')).toBe(true)
  })
})

describe('visibleItems', () => {
  it('lists the commands in their groups, and nothing not built yet', () => {
    const items = visibleItems('root', '', POSTS, '/posts/tcp-handshake')

    expect(items.map((item) => [item.group, item.label])).toEqual([
      ['Tools', 'Search posts...'],
      ['Navigation', 'Index'],
      ['Navigation', 'Topics'],
      ['Navigation', 'Latest'],
      ['Navigation', 'RSS'],
      ['Links', 'GitHub'],
    ])
    expect(items.find((item) => item.label === 'Latest')?.action).toEqual({
      type: 'route',
      href: '/posts/tcp-handshake',
    })
    expect(items.find((item) => item.label === 'RSS')?.action).toEqual({
      type: 'page',
      href: '/rss.xml',
    })
    expect(items.find((item) => item.label === 'GitHub')?.action).toEqual({
      type: 'external',
      href: 'https://github.com/seeeeeeong',
    })
  })

  it('has no Latest command without a post', () => {
    expect(labels(visibleItems('root', '', []))).not.toContain('Latest')
  })

  it('adds the matching posts below the matching commands when the root has a query', () => {
    const items = visibleItems('root', 'I', POSTS)

    expect(items.map((item) => [item.group, item.label])).toEqual([
      ['Navigation', 'Index'],
      ['Navigation', 'Topics'],
      ['Links', 'GitHub'],
      ['Posts', 'Virtual Memory'],
    ])
    expect(items[3]).toMatchObject({
      hint: 'JUN 03',
      action: { type: 'route', href: '/posts/virtual-memory' },
    })
  })

  it('lists every post, newest first, when searching posts with no query', () => {
    expect(labels(visibleItems('posts', '', POSTS))).toEqual([
      'TCP 3-way handshake',
      'Virtual Memory',
    ])
  })

  it('lists only posts when searching posts, never the commands', () => {
    expect(labels(visibleItems('posts', '운영체제', POSTS))).toEqual(['Virtual Memory'])
    expect(visibleItems('posts', 'github', POSTS)).toEqual([])
  })
})

describe('groupsOf', () => {
  it('keeps each item with its place in the whole list', () => {
    const groups = groupsOf(visibleItems('root', 'i', POSTS))

    expect(groups.map((group) => group.name)).toEqual(['Navigation', 'Links', 'Posts'])
    expect(groups[0]?.entries.map((entry) => entry.index)).toEqual([0, 1])
    expect(groups[2]?.entries.map((entry) => entry.index)).toEqual([3])
  })

  it('has no groups for no items', () => {
    expect(groupsOf([])).toEqual([])
  })
})
