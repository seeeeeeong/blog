import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { BookSummary } from '@/features/books/api/types'
import { BookList } from '@/features/books/views/BookList'

const BOOK: BookSummary = {
  id: '0199-book',
  title: '컴퓨터 네트워킹: 하향식 접근',
  authors: 'Kurose, Ross',
  publisher: '퍼스트북',
  sourceUrl: 'https://www.yes24.com/product/goods/108512345',
  coverUrl: null,
  topic: null,
  writtenSections: 3,
  totalSections: 41,
}

describe('BookList', () => {
  it('heads the list with its count', () => {
    const out = renderToStaticMarkup(<BookList books={[BOOK]} />)

    expect(out).toContain('<h1>Books</h1><p class="mono bhead__meta">1 books</p>')
  })

  it('links each book with its byline and how many of its sections are written', () => {
    const out = renderToStaticMarkup(<BookList books={[BOOK]} />)

    expect(out).toContain('<a class="row brow" href="/books/0199-book">')
    expect(out).toContain('컴퓨터 네트워킹: 하향식 접근')
    expect(out).toContain('Kurose, Ross / 퍼스트북')
    expect(out).toContain('3 / 41')
  })

  it('shows only the heading when there is no book yet', () => {
    const out = renderToStaticMarkup(<BookList books={[]} />)

    expect(out).toContain('<h1>Books</h1>')
    expect(out).not.toContain('class="group"')
    expect(out).not.toContain('class="empty"')
  })

  it('says so when the api is down', () => {
    expect(renderToStaticMarkup(<BookList books={null} />)).toContain(
      '책 목록을 불러오지 못했습니다.',
    )
  })
})
