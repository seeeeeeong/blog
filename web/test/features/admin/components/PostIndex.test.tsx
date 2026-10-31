import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AdminPostSummary } from '@/features/admin/api/types'
import { PostIndex } from '@/features/admin/components/PostIndex'

const network = { slug: 'network', title: '네트워크', position: 2 }

const POSTS: AdminPostSummary[] = [
  {
    id: '0199-b',
    slug: 'quic',
    title: 'QUIC',
    status: 'DRAFT',
    topic: network,
    sectionId: null,
    number: '2.2',
    updatedAt: '2026-10-25T00:00:00Z',
    publishedAt: null,
  },
  {
    id: '0199-a',
    slug: 'tcp-handshake',
    title: 'TCP 3-way handshake',
    status: 'PUBLISHED',
    topic: network,
    sectionId: null,
    number: '2.1',
    updatedAt: '2026-10-21T00:00:00Z',
    publishedAt: '2026-10-21T00:00:00Z',
  },
]

describe('PostIndex', () => {
  it('heads the list with its counts, the filter and New post', () => {
    const out = renderToStaticMarkup(<PostIndex posts={POSTS} topics={[network]} />)

    expect(out).toContain('<h1>Posts</h1><p class="mono ahead__meta">2 posts / 1 drafts</p>')
    expect(out).toContain('<button type="button" aria-pressed="true">All</button>')
    expect(out).toContain('New post</button>')
  })

  it('lists drafts, with when they were edited, above the published posts by year', () => {
    const out = renderToStaticMarkup(<PostIndex posts={POSTS} topics={[network]} />)

    expect(out).toContain('<span class="mono group__count">(1)</span>')
    expect(out).toContain('href="/admin/posts/0199-b"')
    expect(out).toContain('Edited OCT 25')
    expect(out).toContain('href="/admin/posts/0199-a"')
    expect(out.indexOf('QUIC')).toBeLessThan(out.indexOf('2026'))
    expect(out.indexOf('2026')).toBeLessThan(out.indexOf('TCP 3-way handshake'))
  })

  it('offers each topic for a new post', () => {
    const out = renderToStaticMarkup(<PostIndex posts={POSTS} topics={[network]} />)

    expect(out).toContain('<option value="network">네트워크</option>')
  })

  it('keeps the toolbar and lists nothing when there is no post yet', () => {
    const out = renderToStaticMarkup(<PostIndex posts={[]} topics={[network]} />)

    expect(out).toContain('New post')
    expect(out).not.toContain('class="empty"')
  })
})
