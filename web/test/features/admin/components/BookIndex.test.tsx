import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AdminBook } from '@/features/admin/api/types'
import { BookIndex } from '@/features/admin/components/BookIndex'

const network = { slug: 'network', title: '네트워크', position: 2 }

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
      noteCreatedAt: null,
      sections: [
        {
          id: '1.1',
          number: '1.1',
          title: '인터넷이란 무엇인가',
          post: null,
          noteCreatedAt: null,
          sections: [],
        },
        {
          id: '1.2',
          number: '1.2',
          title: '네트워크 가장자리',
          post: null,
          noteCreatedAt: null,
          sections: [],
        },
      ],
    },
  ],
}

describe('BookIndex', () => {
  it('heads the list with its count and Add book', () => {
    const out = renderToStaticMarkup(<BookIndex books={[BOOK]} topics={[network]} />)

    expect(out).toContain('<h1>Books</h1><p class="mono ahead__meta">1 books</p>')
    expect(out).toContain('Add book</button>')
  })

  it('links each book with its byline and how many of its sections have a post', () => {
    const out = renderToStaticMarkup(<BookIndex books={[BOOK]} topics={[network]} />)

    expect(out).toContain('<a class="row brow" href="/admin/books/0199-book">')
    expect(out).toContain('컴퓨터 네트워킹: 하향식 접근')
    expect(out).toContain('<span class="mono brow__by">Kurose, Ross / 퍼스트북 / 2022</span>')
    expect(out).toContain('0 posts / 2')
  })

  it('offers no topic or each topic for the book to import', () => {
    const out = renderToStaticMarkup(<BookIndex books={[BOOK]} topics={[network]} />)

    expect(out).toContain('<option value="" selected="">None</option>')
    expect(out).toContain('<option value="network">네트워크</option>')
    expect(out).toContain('aria-label="책 검색"')
  })

  it('keeps the toolbar and lists nothing when no book is imported yet', () => {
    const out = renderToStaticMarkup(<BookIndex books={[]} topics={[network]} />)

    expect(out).toContain('Add book')
    expect(out).not.toContain('class="group blist"')
    expect(out).not.toContain('class="empty"')
  })
})
