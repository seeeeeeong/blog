import { unstable_rethrow } from 'next/navigation'
import { cache } from 'react'
import type { Book, BookSummary } from '@/features/books/api/types'
import { ApiError, apiGet } from '@/lib/api'

/** Null when the api cannot answer, so the page still opens. */
export const loadBooks = cache(async (): Promise<BookSummary[] | null> => {
  try {
    return await apiGet<BookSummary[]>('/api/books')
  } catch (error) {
    unstable_rethrow(error)
    return null
  }
})

// The api answers 400 for an id that is no UUID, which is as missing as an unknown one.
const isMissing = (error: unknown) =>
  error instanceof ApiError && (error.status === 404 || error.status === 400)

/** Once a request, as the metadata and the page read the same book. Null when there is no such book. */
export const loadBook = cache(async (id: string): Promise<Book | null> => {
  try {
    return await apiGet<Book>(`/api/books/${encodeURIComponent(id)}`)
  } catch (error) {
    if (isMissing(error)) return null
    throw error
  }
})
