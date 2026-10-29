'use client'

import { useEffect, useState } from 'react'
import { placeBookInTopic, writeSectionPost } from '@/features/admin/api/books'
import { messageOf } from '@/features/admin/api/client'
import type { AdminBook, Topic } from '@/features/admin/api/types'
import { BookContents } from '@/features/admin/components/BookContents'
import { BookMeta } from '@/features/admin/components/BookMeta'
import { PageHead } from '@/features/admin/components/PageHead'
import { Toast } from '@/features/admin/components/Toast'
import { useNotice } from '@/features/admin/hooks/useNotice'
import { BOOKS_HREF } from '@/features/admin/utils/books'
import { postEditHref } from '@/features/admin/utils/list'
import { bookByline } from '@/utils/book'

type Props = { book: AdminBook; topics: readonly Topic[] }

/** A book's contents, where each section's post is started or opened, and the topic they go to. */
export function BookDetail({ book: loaded, topics }: Props) {
  const [book, setBook] = useState(loaded)
  const [placing, setPlacing] = useState(false)
  const [writing, setWriting] = useState<string | null>(null)
  const { notice, show, clear } = useNotice()

  // The rows arrive after the browser looked for the fragment, so the editor's link lands here.
  useEffect(() => {
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'center' })
  }, [])

  const place = async (topicSlug: string | null) => {
    clear()
    setPlacing(true)
    try {
      setBook(await placeBookInTopic(book.id, topicSlug))
    } catch (error) {
      show(messageOf(error), true)
    } finally {
      setPlacing(false)
    }
  }

  const write = async (sectionId: string) => {
    clear()
    setWriting(sectionId)
    try {
      const post = await writeSectionPost(sectionId)
      location.assign(postEditHref(post.id))
    } catch (error) {
      show(messageOf(error), true)
      setWriting(null)
    }
  }

  return (
    <main className="apage">
      <a className="mono bback" href={BOOKS_HREF}>
        ← Books
      </a>
      <PageHead title={book.title} meta={bookByline(book)} />
      <BookMeta
        book={book}
        topics={topics}
        busy={placing}
        onTopic={(topicSlug) => void place(topicSlug)}
      />
      <BookContents
        bookId={book.id}
        chapters={book.chapters}
        writing={writing}
        onWrite={(sectionId) => void write(sectionId)}
      />
      <Toast notice={notice} />
    </main>
  )
}
