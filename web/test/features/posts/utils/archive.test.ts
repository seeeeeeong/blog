import { describe, expect, it } from 'vitest'
import type { PostSummary } from '@/features/posts/api/types'
import { byYear, postHref, readingTime } from '@/features/posts/utils/archive'

function post(slug: string, date: string): PostSummary {
  return { slug, title: slug, description: '', date }
}

describe('postHref', () => {
  it('puts a post under /blog', () => {
    expect(postHref('tcp-handshake')).toBe('/blog/tcp-handshake')
  })
})

describe('byYear', () => {
  it('groups posts by their year in Seoul, keeping their order', () => {
    const posts = [
      post('new', '2026-03-01T00:00:00Z'),
      post('new-year', '2025-12-31T15:00:00Z'),
      post('old', '2025-12-31T14:00:00Z'),
    ]

    expect(byYear(posts)).toEqual([
      { year: '2026', posts: [posts[0], posts[1]] },
      { year: '2025', posts: [posts[2]] },
    ])
  })

  it('is empty without posts', () => {
    expect(byYear([])).toEqual([])
  })
})

describe('readingTime', () => {
  it('counts two hundred words a minute, rounding up', () => {
    expect(readingTime('word '.repeat(201))).toBe('2 min read')
  })

  it('is never less than a minute', () => {
    expect(readingTime('')).toBe('1 min read')
  })
})
