import { useId } from 'react'
import type { AdminBook, Topic } from '@/features/admin/api/types'
import { bookProgress } from '@/features/admin/utils/books'

type Props = {
  book: AdminBook
  topics: readonly Topic[]
  busy: boolean
  /** A topic's slug, or null to leave the book without one. */
  onTopic: (topicSlug: string | null) => void
}

/** The book's topic, which its new posts go to, its progress and its YES24 page. */
export function BookMeta({ book, topics, busy, onTopic }: Props) {
  const id = useId()
  const { written, total } = bookProgress(book)
  return (
    <div className="meta-card bmeta">
      <div className="meta-grid">
        <p className="meta-grid__title">Book</p>
        <div className="meta-item mfield">
          <label className="mfield__label" htmlFor={`${id}topic`}>
            Topic
          </label>
          <select
            id={`${id}topic`}
            className="minput"
            value={book.topic?.slug ?? ''}
            disabled={busy}
            onChange={(event) => onTopic(event.target.value || null)}
          >
            <option value="">None</option>
            {topics.map((topic) => (
              <option key={topic.slug} value={topic.slug}>
                {topic.title}
              </option>
            ))}
          </select>
        </div>
        <div className="meta-item">
          <p>Posts</p>
          <span className="meta-item__value mono">{`${written} / ${total}`}</span>
        </div>
        <div className="meta-item">
          <p>Source</p>
          <a
            className="meta-item__value mono"
            href={book.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            YES24
          </a>
        </div>
      </div>
    </div>
  )
}
