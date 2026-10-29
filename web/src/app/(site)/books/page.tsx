import '@/features/posts/views/archive.css'
import type { Metadata } from 'next'
import { loadBooks } from '@/features/books/api/books'
import { BookList } from '@/features/books/views/BookList'

export const metadata: Metadata = { title: 'Books' }

// The rows wear the archive's groups.
export default async function BooksPage() {
  return <BookList books={await loadBooks()} />
}
