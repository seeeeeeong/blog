import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Post, PostSummary } from '@/features/posts/api/types'
import { PostArticle } from '@/features/posts/views/PostArticle'

const network = { slug: 'network', title: '네트워크', position: 2 }

function summary(slug: string, place: number): PostSummary {
  return {
    slug,
    title: `${slug} title`,
    summary: `${slug} summary`,
    topic: network,
    number: `2.${place}`,
    publishedAt: '2026-09-01T00:00:00Z',
  }
}

function post(previous: PostSummary | null, next: PostSummary | null): Post {
  return {
    ...summary('tcp-handshake', 2),
    title: 'TCP 3-way handshake',
    publishedAt: '2026-10-21T00:00:00Z',
    bodyMdx: '',
    previous,
    next,
  }
}

const Body = () => <p>본문이다.</p>

describe('PostArticle', () => {
  it('puts the day in Seoul above the title, then the body', () => {
    const out = renderToStaticMarkup(
      <PostArticle post={post(null, null)} Content={Body} components={{}} />,
    )

    expect(out).toContain(
      '<header><time class="post__date" dateTime="2026-10-21">October 21, 2026</time><h1 class="post__title">TCP 3-way handshake</h1></header>',
    )
    expect(out).toContain('<div class="prose"><p>본문이다.</p></div>')
  })

  it('links the title to the post when shown elsewhere', () => {
    const out = renderToStaticMarkup(
      <PostArticle post={post(null, null)} Content={Body} components={{}} linked />,
    )

    expect(out).toContain(
      '<h1 class="post__title"><a href="/posts/tcp-handshake">TCP 3-way handshake</a></h1>',
    )
  })

  it('pages to the posts before and after it in the topic', () => {
    const out = renderToStaticMarkup(
      <PostArticle
        post={post(summary('osi', 1), summary('http', 3))}
        Content={Body}
        components={{}}
      />,
    )

    expect(out).toContain('<nav class="pager" aria-label="이전 글과 다음 글">')
    expect(out).toContain('<a class="pager__prev" href="/posts/osi">← osi title</a>')
    expect(out).toContain('<a class="pager__next" href="/posts/http">http title →</a>')
  })

  it('has no pager for a post alone in its topic', () => {
    const out = renderToStaticMarkup(
      <PostArticle post={post(null, null)} Content={Body} components={{}} />,
    )

    expect(out).not.toContain('pager')
  })

  it('says so when the body could not be shown', () => {
    const out = renderToStaticMarkup(
      <PostArticle post={post(null, null)} Content={null} components={{}} />,
    )

    expect(out).toContain('본문을 표시하지 못했습니다.')
  })
})
