import { adminGet, adminWrite } from '@/features/admin/api/client'
import type {
  AdminBook,
  AdminPost,
  BookEdition,
  BookImportRequest,
} from '@/features/admin/api/types'

const BOOKS = '/api/admin/books'

const bookPath = (id: string) => `${BOOKS}/${encodeURIComponent(id)}`

/** YES24's editions for [query]; `book.source_unavailable` when no key is set. */
export function searchBooks(query: string): Promise<BookEdition[]> {
  return adminGet(`${BOOKS}/search?q=${encodeURIComponent(query)}`)
}

export function importBook(request: BookImportRequest): Promise<AdminBook> {
  return adminWrite('POST', BOOKS, request)
}

export function listBooks(): Promise<AdminBook[]> {
  return adminGet(BOOKS)
}

export function getBook(id: string): Promise<AdminBook> {
  return adminGet(bookPath(id))
}

export function placeBookInTopic(id: string, topicSlug: string | null): Promise<AdminBook> {
  return adminWrite('PUT', `${bookPath(id)}/topic`, { topicSlug })
}

/** The section's post: a new draft in the book's topic, or the one it already has. */
export function writeSectionPost(sectionId: string): Promise<AdminPost> {
  return adminWrite('POST', `/api/admin/sections/${encodeURIComponent(sectionId)}/post`)
}
