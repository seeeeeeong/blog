import '@/features/posts/views/archive.css'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadBook } from '@/features/books/api/books'
import { BookPage } from '@/features/books/views/BookPage'
import { bookByline } from '@/utils/book'

export async function generateMetadata({ params }: PageProps<'/books/[id]'>): Promise<Metadata> {
  const book = await loadBook((await params).id)
  if (!book) notFound()
  return { title: book.title, description: bookByline(book) }
}

export default async function BookRoute({ params }: PageProps<'/books/[id]'>) {
  const book = await loadBook((await params).id)
  if (!book) notFound()
  return <BookPage book={book} />
}
