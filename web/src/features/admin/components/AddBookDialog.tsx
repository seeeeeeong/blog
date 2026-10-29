'use client'

import { type FormEvent, useState } from 'react'
import { importBook, searchBooks } from '@/features/admin/api/books'
import { messageOf } from '@/features/admin/api/client'
import type { BookEdition, Topic } from '@/features/admin/api/types'
import { EditionList } from '@/features/admin/components/EditionList'
import { Modal } from '@/features/admin/components/Modal'
import { bookHref } from '@/features/admin/utils/books'

type Props = {
  open: boolean
  topics: readonly Topic[]
  onClose: () => void
}

const field = (form: HTMLFormElement, name: string) =>
  String(new FormData(form).get(name) ?? '').trim()

/** Finds a book on YES24, picks an edition, and imports its contents. */
export function AddBookDialog({ open, topics, onClose }: Props) {
  const [editions, setEditions] = useState<BookEdition[] | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (work: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await work()
    } catch (failure) {
      setError(messageOf(failure))
    } finally {
      setBusy(false)
    }
  }

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = field(event.currentTarget, 'q')
    if (!query) return
    setPicked(null)
    setEditions(null)
    void run(async () => setEditions(await searchBooks(query)))
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const topicSlug = field(event.currentTarget, 'topic')
    if (!picked) return
    void run(async () => {
      const book = await importBook({ sourceRef: picked, ...(topicSlug && { topicSlug }) })
      location.assign(bookHref(book.id))
    })
  }

  return (
    <Modal open={open} eyebrow="Add book" title="책 가져오기" wide onClose={onClose}>
      <form className="bsearch" onSubmit={search}>
        <input
          className="ainput"
          type="search"
          name="q"
          aria-label="책 검색"
          required
          maxLength={100}
          spellCheck={false}
          autoComplete="off"
        />
        <button className="pill" type="submit" disabled={busy}>
          Search
        </button>
      </form>
      {editions && <EditionList editions={editions} picked={picked} onPick={setPicked} />}
      <form className="aform" onSubmit={submit}>
        <label className="afield">
          <span className="mono">Topic</span>
          <select className="ainput" name="topic" defaultValue="">
            <option value="">None</option>
            {topics.map((topic) => (
              <option key={topic.slug} value={topic.slug}>
                {topic.title}
              </option>
            ))}
          </select>
        </label>
        {error && (
          <p className="aerror" role="alert">
            {error}
          </p>
        )}
        <div className="modal__foot">
          <button className="pill" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="pill pill--accent" type="submit" disabled={!picked || busy}>
            Import
          </button>
        </div>
      </form>
    </Modal>
  )
}
