'use client'

import './admin.css'
import { useCallback } from 'react'
import { getBook, getSectionNote } from '@/features/admin/api/books'
import { AdminApiError } from '@/features/admin/api/client'
import type { PreviewAction } from '@/features/admin/components/PostEditor'
import { SectionNote } from '@/features/admin/components/SectionNote'
import { useLoad } from '@/features/admin/hooks/useLoad'
import { placeOf } from '@/features/admin/utils/books'

type Props = { bookId: string; sectionId: string; previewAction: PreviewAction }

async function loadNote(bookId: string, sectionId: string) {
  const [book, note] = await Promise.all([getBook(bookId), getSectionNote(sectionId)])
  const place = placeOf([book], sectionId)
  if (!place) throw new AdminApiError(404, 'book.section_not_found', '목차를 찾을 수 없습니다')
  return [place, note] as const
}

export function NoteView({ bookId, sectionId, previewAction }: Props) {
  const load = useCallback(() => loadNote(bookId, sectionId), [bookId, sectionId])
  const loaded = useLoad(load)
  if (loaded.state === 'loading') return <main className="apage apage--editor" />
  if (loaded.state === 'failed') {
    return (
      <main className="apage">
        <p className="empty">{loaded.message}</p>
      </main>
    )
  }
  const [{ book, section }, note] = loaded.data
  return (
    <SectionNote
      key={section.id}
      book={book}
      section={section}
      note={note}
      previewAction={previewAction}
    />
  )
}
