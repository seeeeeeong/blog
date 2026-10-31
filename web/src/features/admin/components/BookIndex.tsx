'use client'

import { useState } from 'react'
import { Scramble } from '@/components/ui/Scramble'
import type { AdminBook, Topic } from '@/features/admin/api/types'
import { AddBookDialog } from '@/features/admin/components/AddBookDialog'
import { Icon } from '@/features/admin/components/Icon'
import { PageHead } from '@/features/admin/components/PageHead'
import { bookHref, bookProgress, booksMeta, progressMeta } from '@/features/admin/utils/books'
import { bookByline } from '@/utils/book'

type Props = { books: readonly AdminBook[]; topics: readonly Topic[] }

function BookRow({ book }: { book: AdminBook }) {
  return (
    <li>
      <a className="row brow" href={bookHref(book.id)}>
        <span className="brow__title">
          <Scramble text={book.title} />
          <span className="mono brow__by">{bookByline(book)}</span>
        </span>
        <Scramble className="row__meta mono" text={progressMeta(bookProgress(book))} />
      </a>
    </li>
  )
}

/** Every imported book, newest first, with how far its posts have come. */
export function BookIndex({ books, topics }: Props) {
  const [adding, setAdding] = useState(false)
  return (
    <main className="apage">
      <PageHead title="Books" meta={booksMeta(books)} />
      <div className="atoolbar atoolbar--end">
        <button className="pill pill--accent" type="button" onClick={() => setAdding(true)}>
          <Icon name="plus" />
          Add book
        </button>
      </div>
      {books.length > 0 && (
        <ul className="group blist">
          {books.map((book) => (
            <BookRow key={book.id} book={book} />
          ))}
        </ul>
      )}
      <AddBookDialog open={adding} topics={topics} onClose={() => setAdding(false)} />
    </main>
  )
}
