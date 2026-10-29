'use client'

import './admin.css'
import { listBooks } from '@/features/admin/api/books'
import { listTopics } from '@/features/admin/api/posts'
import { BookIndex } from '@/features/admin/components/BookIndex'
import { useLoad } from '@/features/admin/hooks/useLoad'

const loadIndex = () => Promise.all([listBooks(), listTopics()])

export function BooksView() {
  const loaded = useLoad(loadIndex)
  if (loaded.state === 'loading') return <main className="apage" />
  if (loaded.state === 'failed') {
    return (
      <main className="apage">
        <p className="empty">{loaded.message}</p>
      </main>
    )
  }
  const [books, topics] = loaded.data
  return <BookIndex books={books} topics={topics} />
}
