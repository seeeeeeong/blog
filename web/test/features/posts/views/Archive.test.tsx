import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { PostSummary, Topic } from '@/features/posts/api/types'
import { Archive } from '@/features/posts/views/Archive'

const os: Topic = { slug: 'os', title: '운영체제', position: 1 }

function post(slug: string, publishedAt: string): PostSummary {
  return { slug, title: `${slug} title`, summary: 's', topic: os, number: '1.1', publishedAt }
}

const POSTS: PostSummary[] = [
  post('cpu-scheduling', '2025-07-18T01:00:00Z'),
  post('tcp-handshake', '2026-10-21T01:00:00Z'),
  post('virtual-memory', '2026-06-03T01:00:00Z'),
]

describe('Archive', () => {
  it('lists every post under its year, newest year and newest post first', () => {
    const out = renderToStaticMarkup(<Archive archive={{ posts: POSTS, topics: [os] }} />)

    expect(out).toContain('<h1 class="archive__title">Archives</h1>')
    expect(out.indexOf('>2026<')).toBeLessThan(out.indexOf('>2025<'))
    expect(out.indexOf('tcp-handshake title')).toBeLessThan(out.indexOf('virtual-memory title'))
    expect(out.indexOf('virtual-memory title')).toBeLessThan(out.indexOf('>2025<'))
  })

  it('dates each entry by month and day, and links its title', () => {
    const out = renderToStaticMarkup(<Archive archive={{ posts: POSTS, topics: [os] }} />)

    expect(out).toContain(
      '<li class="archive__entry"><time class="archive__date" dateTime="2026-10-21">Oct 21</time><a class="archive__link" href="/posts/tcp-handshake">tcp-handshake title</a></li>',
    )
  })

  it('keeps the heading alone before the first post', () => {
    const out = renderToStaticMarkup(<Archive archive={{ posts: [], topics: [os] }} />)

    expect(out).toBe('<main class="archive"><h1 class="archive__title">Archives</h1></main>')
  })

  it('says when the posts could not be read', () => {
    const out = renderToStaticMarkup(<Archive archive={null} />)

    expect(out).toContain('글 목록을 불러오지 못했습니다.')
  })
})
