import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AdminPost } from '@/features/admin/api/types'
import { PostEditor } from '@/features/admin/components/PostEditor'

const network = { slug: 'network', title: '네트워크', position: 2 }
const os = { slug: 'os', title: '운영체제', position: 1 }

const DRAFT: AdminPost = {
  id: '0199-a',
  version: 3,
  slug: 'tcp-handshake',
  title: 'TCP 3-way handshake',
  status: 'DRAFT',
  topic: network,
  sectionId: null,
  position: 1,
  number: '2.1',
  summary: '세 번의 교환',
  bodyMdx: '## 왜 세 번인가',
  createdAt: '2026-10-20T00:00:00Z',
  updatedAt: '2026-10-21T00:00:00Z',
  publishedAt: null,
}

const preview = async () => null

const render = (post: AdminPost) =>
  renderToStaticMarkup(<PostEditor post={post} topics={[os, network]} previewAction={preview} />)

describe('PostEditor', () => {
  it('fills the title, metadata and body from the post', () => {
    const out = render(DRAFT)

    expect(out).toContain(
      'aria-label="제목" maxLength="200" spellCheck="false" value="TCP 3-way handshake"',
    )
    expect(out).toContain('Draft / 2.1 network')
    expect(out).toContain('value="tcp-handshake"')
    expect(out).toContain('<option value="network" selected="">네트워크</option>')
    expect(out).toContain('value="1"')
    expect(out).toContain('>세 번의 교환</textarea>')
    expect(out).toContain('aria-label="본문 MDX" spellCheck="false">## 왜 세 번인가</textarea>')
  })

  it('opens in Write, with Save draft and Publish for a draft', () => {
    const out = render(DRAFT)

    expect(out).toContain('aria-pressed="true">Write</button>')
    expect(out).toContain('aria-pressed="false">Preview</button>')
    expect(out).toContain('<span class="mono ebar__save" aria-live="polite">Saved</span>')
    expect(out).toContain('disabled="">Save draft</button>')
    expect(out).toMatch(
      /<button class="dock__item dock__item--accent" type="button">Publish<\/button>/,
    )
  })

  it('has no Save for a published post, which changes only by publishing again', () => {
    const out = render({ ...DRAFT, status: 'PUBLISHED', publishedAt: '2026-10-21T00:00:00Z' })

    expect(out).toContain('Published OCT 21 / 2.1 network')
    expect(out).not.toContain('Save draft')
    expect(out).toContain('disabled="">Republish</button>')
  })

  it('links back to the book section the post was written for', () => {
    const section = {
      id: '0199-s',
      number: '3.5',
      title: 'TCP',
      post: null,
      noteCreatedAt: null,
      sections: [],
    }
    const book = {
      id: '0199-book',
      title: '컴퓨터 네트워킹',
      authors: null,
      publisher: null,
      isbn13: '9791159773486',
      publishedOn: null,
      sourceRef: '108512345',
      sourceUrl: 'https://www.yes24.com/product/goods/108512345',
      coverUrl: null,
      topic: network,
      createdAt: '2026-10-20T00:00:00Z',
      chapters: [section],
    }
    const out = renderToStaticMarkup(
      <PostEditor
        post={{ ...DRAFT, sectionId: '0199-s' }}
        topics={[network]}
        section={{ book, section }}
        previewAction={preview}
      />,
    )

    expect(out).toContain(
      '<a class="mono mlink" href="/admin/books/0199-book#section-0199-s">컴퓨터 네트워킹 / 3.5</a>',
    )
    expect(out).toContain(
      '<a class="mono mlink" href="/admin/books/0199-book/sections/0199-s">View note</a>',
    )
  })

  it('has no book or note link for a post written for no section', () => {
    expect(render(DRAFT)).not.toContain('/admin/books')
    expect(render(DRAFT)).not.toContain('View note')
  })

  it('drafts a draft from a memo, behind a dialog that stays closed until asked', () => {
    const out = render(DRAFT)

    expect(out).toMatch(/<button class="dock__item" type="button">.*From memo<\/button>/)
    expect(out).toContain('<dialog class="modal modal--wide">')
    expect(out).not.toContain('<dialog class="modal modal--wide" open')
  })

  it('has no From memo for a published post', () => {
    const out = render({ ...DRAFT, status: 'PUBLISHED', publishedAt: '2026-10-21T00:00:00Z' })

    expect(out).not.toContain('From memo')
    expect(out).not.toContain('메모')
  })
})
