import type { AdminPostSummary } from '@/features/admin/api/types'
import { yearOf } from '@/utils/date'

export type PostFilter = 'all' | 'draft' | 'published'

export type PostGroup = {
  label: string
  /** Shown beside the label for drafts, as a year needs none. */
  count?: number
  posts: AdminPostSummary[]
}

export const isDraft = (post: AdminPostSummary) => post.status === 'DRAFT'

export function postEditHref(id: string): string {
  return `/admin/posts/${encodeURIComponent(id)}`
}

function publishedByYear(posts: readonly AdminPostSummary[]): PostGroup[] {
  const years = new Map<string, AdminPostSummary[]>()
  const published = posts
    .flatMap((post) => (post.publishedAt && !isDraft(post) ? [{ post, at: post.publishedAt }] : []))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
  for (const { post, at } of published) {
    const year = yearOf(at)
    years.set(year, [...(years.get(year) ?? []), post])
  }
  return [...years].map(([label, inYear]) => ({ label, posts: inYear }))
}

/** Drafts first, last edited first, then published posts by the year they came out, newest first. */
export function groupPosts(posts: readonly AdminPostSummary[], filter: PostFilter): PostGroup[] {
  const drafts = posts
    .filter(isDraft)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
  const draftGroup: PostGroup[] =
    filter !== 'published' && drafts.length > 0
      ? [{ label: 'Drafts', count: drafts.length, posts: drafts }]
      : []
  return [...draftGroup, ...(filter === 'draft' ? [] : publishedByYear(posts))]
}

/** `12 posts / 2 drafts`. */
export function listMeta(posts: readonly AdminPostSummary[]): string {
  return `${posts.length} posts / ${posts.filter(isDraft).length} drafts`
}
