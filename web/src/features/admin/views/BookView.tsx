'use client'

import './admin.css'
import { useCallback } from 'react'
import { getBook } from '@/features/admin/api/books'
import { listTopics } from '@/features/admin/api/posts'
import { BookDetail } from '@/features/admin/components/BookDetail'
import { useLoad } from '@/features/admin/hooks/useLoad'

export function BookView({ id }: { id: string }) {
  const load = useCallback(() => Promise.all([getBook(id), listTopics()]), [id])
  const loaded = useLoad(load)
  if (loaded.state === 'loading') return <main className="apage" />
  if (loaded.state === 'failed') {
    return (
      <main className="apage">
        <p className="empty">{loaded.message}</p>
      </main>
    )
  }
  const [book, topics] = loaded.data
  return <BookDetail key={book.id} book={book} topics={topics} />
}
