import '@/features/posts/views/archive.css'
import '@/features/books/views/books.css'
import { BooksView } from '@/features/admin/views/BooksView'

// The rows wear the archive's groups and the reader's book rows.
export default function AdminBooksPage() {
  return <BooksView />
}
