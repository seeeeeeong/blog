import '@/features/posts/views/archive.css'
import '@/features/books/views/books.css'
import { BookView } from '@/features/admin/views/BookView'

// The rows wear the archive's groups and the reader's book rows.
export default async function AdminBookPage({ params }: PageProps<'/admin/books/[id]'>) {
  const { id } = await params
  return <BookView id={id} />
}
