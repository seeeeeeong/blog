import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Book, BookSection } from '@/features/books/api/types'
import { BookPage } from '@/features/books/views/BookPage'

const POST = {
  slug: 'internet',
  title: '인터넷이란 무엇인가',
  summary: 's',
  topic: { slug: 'network', title: '네트워크', position: 2 },
  number: '2.1',
  publishedAt: '2026-10-21T00:00:00Z',
}

const node = (
  id: string,
  title: string,
  written = false,
  sections: BookSection[] = [],
): BookSection => ({ id, number: id, title, post: written ? POST : null, sections })

const BOOK: Book = {
  id: '0199-book',
  title: '컴퓨터 네트워킹: 하향식 접근',
  authors: 'Kurose, Ross',
  publisher: '퍼스트북',
  publishedOn: '2022-03-02',
  sourceUrl: 'https://www.yes24.com/product/goods/108512345',
  coverUrl: null,
  topic: null,
  writtenSections: 1,
  totalSections: 3,
  chapters: [
    node('1', '컴퓨터 네트워크와 인터넷', false, [
      node('1.1', '인터넷이란 무엇인가', true),
      node('1.2', '네트워크 가장자리'),
    ]),
    node('A', '부록'),
  ],
}

describe('BookPage', () => {
  it('heads the page with the book, its progress and its YES24 page', () => {
    const out = renderToStaticMarkup(<BookPage book={BOOK} />)

    expect(out).toContain('href="/books">← Books</a>')
    expect(out).toContain(
      '<h1>컴퓨터 네트워킹: 하향식 접근</h1><p class="mono bhead__meta">Kurose, Ross / 퍼스트북 / 2022</p>',
    )
    expect(out).toContain('1 of 3 sections written')
    expect(out).toContain('aria-label="3개 중 1개 정리"><span style="width:33%">')
    expect(out).toContain('href="https://www.yes24.com/product/goods/108512345"')
  })

  it('heads each chapter with how many of its sections are written', () => {
    const out = renderToStaticMarkup(<BookPage book={BOOK} />)

    expect(out).toContain(
      '<span class="mono group__count">01</span>컴퓨터 네트워크와 인터넷<span class="mono group__count">(1/2)</span>',
    )
    expect(out).toContain('<span class="mono group__count">A</span>부록')
  })

  it('links a section to its published post, and leaves the rest as plain text', () => {
    const out = renderToStaticMarkup(<BookPage book={BOOK} />)

    expect(out).toContain('<a class="row row--topic" href="/posts/internet">')
    expect(out).toContain('<span class="row__meta mono">OCT 21</span>')
    expect(out.match(/<div class="row row--topic row--pending">/g)).toHaveLength(2)
    expect(out.match(/<a /g)).toHaveLength(3)
  })
})
