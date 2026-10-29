import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AdminBook } from '@/features/admin/api/types'
import { BookDetail } from '@/features/admin/components/BookDetail'

const network = { slug: 'network', title: '네트워크', position: 2 }
const os = { slug: 'os', title: '운영체제', position: 1 }

const BOOK: AdminBook = {
  id: '0199-book',
  title: '컴퓨터 네트워킹: 하향식 접근',
  authors: 'Kurose, Ross',
  publisher: '퍼스트북',
  isbn13: '9791159773486',
  publishedOn: '2022-03-02',
  sourceRef: '108512345',
  sourceUrl: 'https://www.yes24.com/product/goods/108512345',
  coverUrl: null,
  topic: network,
  createdAt: '2026-10-20T00:00:00Z',
  chapters: [
    {
      id: '1',
      number: '1',
      title: '컴퓨터 네트워크와 인터넷',
      post: null,
      sections: [
        { id: '1.1', number: '1.1', title: '인터넷이란 무엇인가', post: null, sections: [] },
      ],
    },
  ],
}

const render = (book: AdminBook) =>
  renderToStaticMarkup(<BookDetail book={book} topics={[os, network]} />)

describe('BookDetail', () => {
  it('heads the page with the book, back to the list', () => {
    const out = render(BOOK)

    expect(out).toContain('<a class="mono bback" href="/admin/books">← Books</a>')
    expect(out).toContain(
      '<h1>컴퓨터 네트워킹: 하향식 접근</h1><p class="mono ahead__meta">Kurose, Ross / 퍼스트북 / 2022</p>',
    )
  })

  it("selects the book's topic, its progress and its YES24 page", () => {
    const out = render(BOOK)

    expect(out).toContain('<option value="network" selected="">네트워크</option>')
    expect(out).toContain('<span class="meta-item__value mono">0 / 1</span>')
    expect(out).toContain('href="https://www.yes24.com/product/goods/108512345"')
  })

  it('selects None for a book without a topic', () => {
    expect(render({ ...BOOK, topic: null })).toContain('<option value="" selected="">None</option>')
  })

  it('lists the contents with Write post', () => {
    const out = render(BOOK)

    expect(out).toContain('인터넷이란 무엇인가')
    expect(out).toContain('>Write post</button>')
  })
})
