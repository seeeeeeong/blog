import { Scramble } from '@/components/ui/Scramble'
import type { AdminPostSummary } from '@/features/admin/api/types'
import { isDraft, type PostGroup, postEditHref } from '@/features/admin/utils/list'
import { shortDate } from '@/utils/date'

function when(post: AdminPostSummary): string {
  if (isDraft(post) || !post.publishedAt) return `Edited ${shortDate(post.updatedAt)}`
  return shortDate(post.publishedAt)
}

// A plain link, so leaving an editor with unsaved changes always asks first.
function PostRow({ post }: { post: AdminPostSummary }) {
  return (
    <li>
      <a className="row row--topic" href={postEditHref(post.id)}>
        <Scramble className="row__meta mono" text={post.number} />
        <Scramble text={post.title} />
        <Scramble
          className={isDraft(post) ? 'row__meta mono is-draft' : 'row__meta mono'}
          text={when(post)}
        />
      </a>
    </li>
  )
}

export function PostGroups({ groups }: { groups: readonly PostGroup[] }) {
  return (
    <ul className="group">
      {groups.map((group) => (
        <li key={group.label}>
          <p className="group__label">
            <Scramble className="mono" text={group.label} />
            {group.count !== undefined && (
              <span className="mono group__count">({group.count})</span>
            )}
          </p>
          <ul className="group">
            {group.posts.map((post) => (
              <PostRow key={post.id} post={post} />
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}
