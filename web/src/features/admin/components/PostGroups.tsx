import type { AdminPostSummary } from '@/features/admin/api/types'
import { isDraft, type PostGroup, postEditHref } from '@/features/admin/utils/list'
import { monthDay } from '@/utils/date'

function when(post: AdminPostSummary): string {
  if (isDraft(post) || !post.publishedAt) return `Edited ${monthDay(post.updatedAt)}`
  return monthDay(post.publishedAt)
}

// A plain link, so leaving an editor with unsaved changes always asks first.
function PostRow({ post }: { post: AdminPostSummary }) {
  return (
    <li className="alist__entry">
      <a className="alist__link" href={postEditHref(post.id)}>
        {post.title}
      </a>
      <span className={isDraft(post) ? 'alist__meta is-draft' : 'alist__meta'}>
        {post.number} · {when(post)}
      </span>
    </li>
  )
}

/** The posts in their groups, as the reader's archive lists them. */
export function PostGroups({ groups }: { groups: readonly PostGroup[] }) {
  return (
    <div className="alist">
      {groups.map((group) => (
        <section key={group.label}>
          <h2 className="alist__group">
            {group.label}
            {group.count !== undefined && (
              <>
                {' '}
                <span className="alist__count">({group.count})</span>
              </>
            )}
          </h2>
          <ul className="alist__list">
            {group.posts.map((post) => (
              <PostRow key={post.id} post={post} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
