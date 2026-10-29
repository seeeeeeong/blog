import { describe, expect, it } from 'vitest'
import type { AdminBook, AdminBookSection, AdminPostSummary } from '@/features/admin/api/types'
import {
  bookHref,
  bookProgress,
  booksMeta,
  editionNote,
  noteHref,
  noteMeta,
  placeOf,
  postStatus,
  progressMeta,
  sectionHref,
} from '@/features/admin/utils/books'

const network = { slug: 'network', title: '네트워크', position: 2 }

function post(id: string, status: AdminPostSummary['status']): AdminPostSummary {
  return {
    id,
    slug: id,
    title: `${id} title`,
    status,
    topic: network,
    sectionId: null,
    number: '2.1',
    updatedAt: '2026-10-21T00:00:00Z',
    publishedAt: status === 'PUBLISHED' ? '2026-10-21T00:00:00Z' : null,
  }
}

function section(
  id: string,
  title: string,
  written: AdminPostSummary | null = null,
  sections: AdminBookSection[] = [],
): AdminBookSection {
  return { id, number: id, title, post: written, noteCreatedAt: null, sections }
}

/** Two chapters with sections and one without, as the api answers a book. */
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
    section('1', '컴퓨터 네트워크와 인터넷', null, [
      section('1.1', '인터넷이란 무엇인가', post('0199-a', 'PUBLISHED')),
      section('1.2', '네트워크 가장자리', post('0199-b', 'DRAFT')),
    ]),
    section('2', '애플리케이션 계층', null, [section('2.1', '네트워크 애플리케이션의 원리')]),
    section('A', '부록'),
  ],
}

describe('book links', () => {
  it('opens a book, and its page at a section', () => {
    expect(bookHref('0199-book')).toBe('/admin/books/0199-book')
    expect(sectionHref('0199-book', '0199-s')).toBe('/admin/books/0199-book#section-0199-s')
  })

  it("opens a section's study note", () => {
    expect(noteHref('0199-book', '0199-s')).toBe('/admin/books/0199-book/sections/0199-s')
  })
})

describe('noteMeta', () => {
  it('gives the section and the day its note was written, if it has one', () => {
    const note = {
      id: 'n',
      sectionId: 's',
      bodyMdx: '',
      model: 'm',
      inputTokens: 1,
      outputTokens: 1,
      createdAt: '2026-10-29T00:00:00Z',
    }

    expect(noteMeta({ number: '3.5' }, note)).toBe('3.5 / Study note / OCT 29')
    expect(noteMeta({ number: '3.5' }, null)).toBe('3.5 / Study note')
  })
})

describe('bookProgress', () => {
  it('counts the leaves with a post, drafts too, of all the book has', () => {
    expect(bookProgress(BOOK)).toEqual({ written: 2, total: 4 })
    expect(progressMeta(bookProgress(BOOK))).toBe('2 posts / 4')
    expect(booksMeta([BOOK])).toBe('1 books')
  })
})

describe('postStatus', () => {
  it('gives the day a post came out, Draft for a draft and a dash for none', () => {
    expect(postStatus(post('a', 'PUBLISHED'))).toEqual({ label: 'OCT 21', draft: false })
    expect(postStatus(post('b', 'DRAFT'))).toEqual({ label: 'Draft', draft: true })
    expect(postStatus(null)).toEqual({ label: '—', draft: false })
  })
})

describe('editionNote', () => {
  it('says why an edition cannot be picked', () => {
    expect(editionNote({ hasContents: true, imported: true })).toBe('Imported')
    expect(editionNote({ hasContents: false, imported: false })).toBe('No contents')
    expect(editionNote({ hasContents: true, imported: false })).toBe('')
  })
})

describe('placeOf', () => {
  it('finds the book and the leaf a post was written for', () => {
    expect(placeOf([BOOK], '1.2')).toMatchObject({
      book: { id: '0199-book' },
      section: { number: '1.2', title: '네트워크 가장자리' },
    })
    expect(placeOf([BOOK], 'A')?.section.title).toBe('부록')
  })

  it('finds nothing for a chapter with sections or a section no book has', () => {
    expect(placeOf([BOOK], '1')).toBeNull()
    expect(placeOf([BOOK], 'gone')).toBeNull()
    expect(placeOf([], '1.1')).toBeNull()
  })
})
