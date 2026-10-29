import type { AdminBook, AdminBookSection, AdminPostSummary } from '@/features/admin/api/types'
import { leavesOf, type Progress, progressOf } from '@/utils/book'
import { shortDate } from '@/utils/date'

export const BOOKS_HREF = '/admin/books'

export function bookHref(id: string): string {
  return `${BOOKS_HREF}/${encodeURIComponent(id)}`
}

export function sectionAnchor(id: string): string {
  return `section-${id}`
}

/** The book's page, scrolled to the section. */
export function sectionHref(bookId: string, sectionId: string): string {
  return `${bookHref(bookId)}#${sectionAnchor(sectionId)}`
}

/** Leaves with a post, drafts included, of all the book has. */
export function bookProgress(book: Pick<AdminBook, 'chapters'>): Progress {
  return progressOf(book.chapters, (leaf) => leaf.post !== null)
}

/** `3 posts / 41`. */
export function progressMeta({ written, total }: Progress): string {
  return `${written} posts / ${total}`
}

export function booksMeta(books: readonly AdminBook[]): string {
  return `${books.length} books`
}

/** The row's word on its post: the day it came out, `Draft`, or a dash for none yet. */
export function postStatus(post: AdminPostSummary | null): { label: string; draft: boolean } {
  if (!post) return { label: '—', draft: false }
  if (post.status === 'DRAFT' || !post.publishedAt) return { label: 'Draft', draft: true }
  return { label: shortDate(post.publishedAt), draft: false }
}

/** What an edition's row says beside it when it cannot be picked. */
export function editionNote(edition: { hasContents: boolean; imported: boolean }): string {
  if (edition.imported) return 'Imported'
  return edition.hasContents ? '' : 'No contents'
}

export type SectionPlace = { book: AdminBook; section: AdminBookSection }

/** The book and leaf a post was written for, if it is still among [books]. */
export function placeOf(books: readonly AdminBook[], sectionId: string): SectionPlace | null {
  for (const book of books) {
    const section = leavesOf(book.chapters).find((leaf) => leaf.id === sectionId)
    if (section) return { book, section }
  }
  return null
}
