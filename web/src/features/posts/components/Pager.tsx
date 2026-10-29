import Link from 'next/link'
import type { PostSummary } from '@/features/posts/api/types'
import { postHref } from '@/features/posts/utils/archive'

type Props = { previous: PostSummary | null; next: PostSummary | null }

/** The posts before and after this one in its topic; nothing when it is the topic's only post. */
export function Pager({ previous, next }: Props) {
  if (!previous && !next) return null
  return (
    <nav className="pager" aria-label="이전 글과 다음 글">
      {previous && (
        <Link className="pager__prev" href={postHref(previous.slug)}>
          <span className="mono">Prev / {previous.number}</span>
          {previous.title}
        </Link>
      )}
      {next && (
        <Link className="pager__next" href={postHref(next.slug)}>
          <span className="mono">Next / {next.number}</span>
          {next.title}
        </Link>
      )}
    </nav>
  )
}
