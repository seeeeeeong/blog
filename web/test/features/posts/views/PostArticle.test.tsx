import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Post } from '@/features/posts/api/types'
import { PostArticle } from '@/features/posts/views/PostArticle'

const POST: Post = {
  slug: 'tcp-handshake',
  title: 'TCP 3-way handshake',
  description: '',
  date: '2026-10-21T00:00:00.000Z',
  body: 'word '.repeat(450),
  draft: false,
}

const Body = () => <p>본문이다.</p>

describe('PostArticle', () => {
  it('leads back to the blog, then dates the post, times its reading and titles it', () => {
    const out = renderToStaticMarkup(<PostArticle post={POST} Content={Body} components={{}} />)

    expect(out).toContain('href="/blog"')
    expect(out).toContain('Back to blog')
    expect(out).toContain('Oct 21, 2026, 9:00 AM GMT+9</time>')
    expect(out).toContain('3 min read')
    expect(out).toContain(
      '<h1 class="animate text-2xl font-semibold text-black dark:text-white">TCP 3-way handshake</h1>',
    )
    expect(out).toContain('<article class="animate"><p>본문이다.</p></article>')
  })

  it('says so when the body could not be shown', () => {
    const out = renderToStaticMarkup(<PostArticle post={POST} Content={null} components={{}} />)

    expect(out).toContain('본문을 표시하지 못했습니다.')
  })
})
