import './books.css'
import Link from 'next/link'
import { Scramble } from '@/components/ui/Scramble'
import type { BookSummary } from '@/features/books/api/types'
import { bookHref, bookProgress, booksMeta, progressLabel } from '@/features/books/utils/books'
import { bookByline } from '@/utils/book'

function BookRow({ book }: { book: BookSummary }) {
  return (
    <li>
      <Link className="row brow" href={bookHref(book.id)}>
        <span className="brow__title">
          <Scramble text={book.title} />
          <Scramble className="mono brow__by" text={bookByline(book)} />
        </span>
        <Scramble className="row__meta mono" text={progressLabel(bookProgress(book))} />
      </Link>
    </li>
  )
}

/** Every book studied here, with how many of its sections have a published post. */
export function BookList({ books }: { books: readonly BookSummary[] | null }) {
  if (!books) {
    return (
      <>
        <div className="bglow" aria-hidden="true" />
        <main className="bpage">
          <p className="empty">책 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        </main>
      </>
    )
  }
  return (
    <>
      <div className="bglow" aria-hidden="true" />
      <main className="bpage">
        <header className="bhead">
          <h1>Books</h1>
          <p className="mono bhead__meta">{booksMeta(books)}</p>
        </header>
        {books.length > 0 && (
          <ul className="group">
            {books.map((book) => (
              <BookRow key={book.id} book={book} />
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
