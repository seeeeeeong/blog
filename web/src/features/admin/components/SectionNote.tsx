'use client'

import { type ReactNode, useEffect, useState } from 'react'
import { writeSectionNote, writeSectionPost } from '@/features/admin/api/books'
import { messageOf } from '@/features/admin/api/client'
import type { AdminBook, AdminBookSection, StudyNote } from '@/features/admin/api/types'
import { NoteBar } from '@/features/admin/components/NoteBar'
import { NoteBody } from '@/features/admin/components/NoteBody'
import { PageHead } from '@/features/admin/components/PageHead'
import type { PreviewAction } from '@/features/admin/components/PostEditor'
import { Toast } from '@/features/admin/components/Toast'
import { useEventStream } from '@/features/admin/hooks/useEventStream'
import { useNotice } from '@/features/admin/hooks/useNotice'
import { noteMeta, sectionHref } from '@/features/admin/utils/books'
import { postEditHref } from '@/features/admin/utils/list'

type Props = {
  book: AdminBook
  section: AdminBookSection
  note: StudyNote | null
  previewAction: PreviewAction
}

type Rendered = { id: string; node: ReactNode }

/** A section's private study note: written by the model as the page watches, then rendered. */
export function SectionNote({ book, section, note: loaded, previewAction }: Props) {
  const [note, setNote] = useState(loaded)
  const [rendered, setRendered] = useState<Rendered | null>(null)
  const [writingPost, setWritingPost] = useState(false)
  const stream = useEventStream<StudyNote>()
  const { notice, show, clear } = useNotice()

  // A render that fails leaves the source showing.
  useEffect(() => {
    if (!note) return
    let current = true
    previewAction(note.bodyMdx).then(
      (node) => current && setRendered({ id: note.id, node }),
      () => {},
    )
    return () => {
      current = false
    }
  }, [note, previewAction])

  const generate = async () => {
    clear()
    const written = await stream.start((signal) => writeSectionNote(section.id, signal))
    if (!written) return
    setNote(written)
    stream.reset()
  }

  const writePost = async () => {
    clear()
    setWritingPost(true)
    try {
      const post = await writeSectionPost(section.id)
      location.assign(postEditHref(post.id))
    } catch (error) {
      show(messageOf(error), true)
      setWritingPost(false)
    }
  }

  const { state } = stream
  const streaming = state.state === 'streaming' ? state.text : null
  const failure = state.state === 'failed' ? { text: state.message, error: true } : null

  return (
    <>
      <main className="apage apage--editor">
        <a className="mono bback" href={sectionHref(book.id, section.id)}>
          ← {book.title}
        </a>
        <PageHead title={section.title} meta={noteMeta(section, note)} />
        <NoteBody
          note={note}
          streaming={streaming}
          rendered={rendered?.id === note?.id ? rendered?.node : null}
          onGenerate={() => void generate()}
        />
      </main>
      <NoteBar
        hasNote={note !== null}
        streaming={streaming !== null}
        post={section.post}
        writingPost={writingPost}
        onGenerate={() => void generate()}
        onWritePost={() => void writePost()}
      />
      <Toast notice={notice ?? failure} />
    </>
  )
}
