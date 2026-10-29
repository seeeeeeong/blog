import type { BookSection, BookSummary } from '@/features/books/api/types'
import { type Progress, progressOf } from '@/utils/book'

export const BOOKS_PATH = '/books'

export function bookHref(id: string): string {
  return `${BOOKS_PATH}/${encodeURIComponent(id)}`
}

export function postHref(slug: string): string {
  return `/posts/${encodeURIComponent(slug)}`
}

export function bookProgress(book: BookSummary): Progress {
  return { written: book.writtenSections, total: book.totalSections }
}

/** A chapter's leaves with a published post, of all it has. */
export function chapterProgress(chapter: BookSection): Progress {
  return progressOf([chapter], (leaf) => leaf.post !== null)
}

/** `3 / 41`. */
export function progressLabel({ written, total }: Progress): string {
  return `${written} / ${total}`
}

export function booksMeta(books: readonly BookSummary[]): string {
  return `${books.length} books`
}
