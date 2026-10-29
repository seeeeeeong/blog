import './books.css'
import Link from 'next/link'
import type { Book } from '@/features/books/api/types'
import { ChapterGroups } from '@/features/books/components/ChapterGroups'
import { ProgressBar } from '@/features/books/components/ProgressBar'
import { BOOKS_PATH, bookProgress } from '@/features/books/utils/books'
import { bookByline } from '@/utils/book'

/** A book's contents; a section with a published post links to it. */
export function BookPage({ book }: { book: Book }) {
  const progress = bookProgress(book)
  return (
    <>
      <div className="bglow" aria-hidden="true" />
      <main className="bpage">
        <Link className="mono bback" href={BOOKS_PATH}>
          ← Books
        </Link>
        <header className="bhead">
          <h1>{book.title}</h1>
          <p className="mono bhead__meta">{bookByline(book)}</p>
        </header>
        <div className="bstat">
          <p className="bstat__line">
            <span className="mono">{`${progress.written} of ${progress.total} sections written`}</span>
            <a
              className="mono bstat__source"
              href={book.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              YES24
            </a>
          </p>
          <ProgressBar progress={progress} />
        </div>
        <ul className="group">
          <ChapterGroups chapters={book.chapters} />
        </ul>
      </main>
    </>
  )
}
