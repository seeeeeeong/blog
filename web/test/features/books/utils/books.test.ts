import { describe, expect, it } from 'vitest'
import type { BookSection } from '@/features/books/api/types'
import {
  bookHref,
  bookProgress,
  booksMeta,
  chapterProgress,
  postHref,
  progressLabel,
} from '@/features/books/utils/books'

const SUMMARY = {
  id: '0199-book',
  title: '컴퓨터 네트워킹',
  authors: null,
  publisher: null,
  sourceUrl: 'https://www.yes24.com/product/goods/108512345',
  coverUrl: null,
  topic: null,
  writtenSections: 3,
  totalSections: 41,
}

const POST = {
  slug: 'tcp',
  title: 'TCP',
  summary: 's',
  topic: { slug: 'network', title: '네트워크', position: 2 },
  number: '2.1',
  publishedAt: '2026-10-21T00:00:00Z',
}

const node = (id: string, written = false, sections: BookSection[] = []): BookSection => ({
  id,
  number: id,
  title: id,
  post: written ? POST : null,
  sections,
})

describe('book links', () => {
  it('opens a book and a post', () => {
    expect(bookHref('0199-book')).toBe('/books/0199-book')
    expect(postHref('tcp handshake')).toBe('/posts/tcp%20handshake')
  })
})

describe('bookProgress', () => {
  it("takes the api's count of sections with a published post", () => {
    expect(progressLabel(bookProgress(SUMMARY))).toBe('3 / 41')
    expect(booksMeta([SUMMARY])).toBe('1 books')
  })
})

describe('chapterProgress', () => {
  it("counts a chapter's sections with a published post, or the chapter itself without any", () => {
    expect(chapterProgress(node('1', false, [node('1.1', true), node('1.2')]))).toEqual({
      written: 1,
      total: 2,
    })
    expect(chapterProgress(node('A', true))).toEqual({ written: 1, total: 1 })
  })
})
