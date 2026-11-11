import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import PostPage, { generateMetadata, generateStaticParams } from '@/app/(site)/blog/[slug]/page'
import type { Post } from '@/features/posts/api/types'

const POST: Post = {
  slug: 'tcp-handshake',
  title: 'TCP 3-way handshake',
  description: '세 번의 교환으로 연결을 연다.',
  date: '2026-10-21T00:00:00.000Z',
  body: [
    '## 세 번 주고받기',
    '',
    '<HandshakeWidget />',
    '',
    '<Seek to={0.95}>끝으로</Seek> 그리고 <Tone color="orange">**SYN**</Tone>.',
    '',
    '<Callout label="핵심">',
    '세 번이다.',
    '</Callout>',
    '',
    '<WidgetIdea note="큐" />',
    '',
    '<Unknown />',
  ].join('\n'),
  draft: false,
}

vi.mock('@/features/posts/api/posts', () => ({
  loadPosts: async () => [POST],
  loadPost: async (slug: string) => (slug === POST.slug ? POST : null),
}))

const props = (slug: string): PageProps<'/blog/[slug]'> => ({
  params: Promise.resolve({ slug }),
  searchParams: Promise.resolve({}),
})

describe('PostPage', () => {
  it('renders the post with its registered components', async () => {
    const out = renderToStaticMarkup(await PostPage(props('tcp-handshake')))

    expect(out).toContain('TCP 3-way handshake</h1>')
    expect(out).toContain('<time dateTime="2026-10-21T00:00:00.000Z">Oct 21, 2026, 9:00 AM GMT+9')
    expect(out).toContain('<h2 id="세-번-주고받기">세 번 주고받기</h2>')
    expect(out).toContain('<div class="widget" id="handshake">')
    expect(out).toContain('<a href="#handshake" class="action">끝으로</a>')
    expect(out).toContain('<span class="tone tone--orange"><strong>SYN</strong></span>')
    expect(out).toContain('<aside class="callout">')
    expect(out).toContain('href="/blog"')
    expect(out).not.toContain('Unknown')
    expect(out).not.toContain('큐')
  })

  it('titles the page after the post', async () => {
    await expect(generateMetadata(props('tcp-handshake'))).resolves.toEqual({
      title: 'TCP 3-way handshake',
      description: '세 번의 교환으로 연결을 연다.',
    })
  })

  it('builds a page for each post', async () => {
    await expect(generateStaticParams()).resolves.toEqual([{ slug: 'tcp-handshake' }])
  })

  it('is not found when no post has the slug', async () => {
    await expect(PostPage(props('draft'))).rejects.toMatchObject({
      digest: expect.stringContaining('404'),
    })
  })
})
