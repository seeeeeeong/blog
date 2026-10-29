import Link from 'next/link'
import { Scramble } from '@/components/ui/Scramble'
import type { PostSummary } from '@/features/posts/api/types'
import { postHref } from '@/features/posts/utils/archive'
import { shortDate } from '@/utils/date'

type Props = { post: PostSummary; numbered?: boolean }

/** A post in the archive: its title and date, and its number when listed by topic. */
export function PostRow({ post, numbered = false }: Props) {
  return (
    <li>
      <Link className={numbered ? 'row row--topic' : 'row'} href={postHref(post.slug)}>
        {numbered && <Scramble className="row__meta mono" text={post.number} />}
        <Scramble text={post.title} />
        <Scramble className="row__meta mono" text={shortDate(post.publishedAt)} />
      </Link>
    </li>
  )
}
