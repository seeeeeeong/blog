import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PostPage, { generateMetadata } from '@/app/(site)/posts/[slug]/page'
import type { Post } from '@/features/posts/api/types'

const POST: Post = {
  slug: 'tcp-handshake',
  title: 'TCP 3-way handshake',
  summary: '세 번의 교환으로 연결을 연다.',
  topic: { slug: 'network', title: '네트워크', position: 2 },
  number: '2.1',
  publishedAt: '2026-10-21T00:00:00Z',
  bodyMdx: [
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
  previous: null,
  next: {
    slug: 'http-versions',
    title: 'HTTP/1.1에서 HTTP/3까지',
    summary: 's',
    topic: { slug: 'network', title: '네트워크', position: 2 },
    number: '2.2',
    publishedAt: '2026-04-15T00:00:00Z',
  },
}

const props = (slug: string): PageProps<'/posts/[slug]'> => ({
  params: Promise.resolve({ slug }),
  searchParams: Promise.resolve({}),
})

afterEach(() => vi.unstubAllGlobals())

describe('PostPage', () => {
  it('renders the post with its registered components and its pager', async () => {
    vi.stubGlobal('fetch', async () => Response.json(POST))

    const out = renderToStaticMarkup(await PostPage(props('tcp-handshake')))

    expect(out).toContain('<h1>TCP 3-way handshake</h1>')
    expect(out).toContain('<div class="widget" id="handshake">')
    expect(out).toContain('<a href="#handshake" class="action">끝으로</a>')
    expect(out).toContain('<span class="tone tone--orange"><strong>SYN</strong></span>')
    expect(out).toContain('<aside class="callout">')
    expect(out).not.toContain('Unknown')
    expect(out).not.toContain('큐')
    expect(out).toContain('href="/posts/http-versions"')
  })

  it('titles the page after the post', async () => {
    vi.stubGlobal('fetch', async () => Response.json(POST))

    await expect(generateMetadata(props('tcp-handshake'))).resolves.toEqual({
      title: 'TCP 3-way handshake',
      description: '세 번의 교환으로 연결을 연다.',
    })
  })

  it('is not found when the api has no such published post', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ code: 'post.not_found' }, { status: 404 }))

    await expect(PostPage(props('draft'))).rejects.toMatchObject({
      digest: expect.stringContaining('404'),
    })
  })
})
