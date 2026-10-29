import { Scramble } from '@/components/ui/Scramble'
import type { PostSummary } from '@/features/posts/api/types'
import { PostRow } from '@/features/posts/components/PostRow'
import { byYear } from '@/features/posts/utils/archive'

export function DateGroups({ posts }: { posts: readonly PostSummary[] }) {
  return byYear(posts).map(({ year, posts: inYear }) => (
    <li key={year}>
      <p className="group__label">
        <Scramble className="mono" text={year} />
      </p>
      <ul className="group">
        {inYear.map((post) => (
          <PostRow key={post.slug} post={post} />
        ))}
      </ul>
    </li>
  ))
}
