import { AdminApiError, adminGet, adminWrite } from '@/features/admin/api/client'
import { adminStream, type StreamEvent } from '@/features/admin/api/stream'
import type {
  AdminBook,
  AdminPost,
  BookEdition,
  BookImportRequest,
  StudyNote,
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

const sectionPath = (id: string) => `/api/admin/sections/${encodeURIComponent(id)}`

/** The section's post: a new draft in the book's topic, or the one it already has. */
export function writeSectionPost(sectionId: string): Promise<AdminPost> {
  return adminWrite('POST', `${sectionPath(sectionId)}/post`)
}

/** The section's latest study note, or null before one is written. */
export async function getSectionNote(sectionId: string): Promise<StudyNote | null> {
  try {
    return await adminGet<StudyNote>(`${sectionPath(sectionId)}/note`)
  } catch (error) {
    if (error instanceof AdminApiError && error.code === 'book.note_not_found') return null
    throw error
  }
}

/** A new note from the model, streamed as it writes; once `done`, it is the section's note. */
export function writeSectionNote(
  sectionId: string,
  signal?: AbortSignal,
): AsyncGenerator<StreamEvent<StudyNote>> {
  return adminStream(`${sectionPath(sectionId)}/note`, undefined, signal)
}
