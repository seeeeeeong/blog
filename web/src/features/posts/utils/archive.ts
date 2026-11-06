import type { PostSummary } from '@/features/posts/api/types'
import { yearOf } from '@/utils/date'

export type YearGroup = { year: string; posts: PostSummary[] }

export function postHref(slug: string): string {
  return `/posts/${slug}`
}

export function newestFirst(posts: readonly PostSummary[]): PostSummary[] {
  return [...posts].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
}

export function newestOf(posts: readonly PostSummary[]): PostSummary | undefined {
  return newestFirst(posts)[0]
}

/** Posts newest first, in groups by the year they were published in Seoul. */
export function byYear(posts: readonly PostSummary[]): YearGroup[] {
  const years = new Map<string, PostSummary[]>()
  for (const post of newestFirst(posts)) {
    const year = yearOf(post.publishedAt)
    years.set(year, [...(years.get(year) ?? []), post])
  }
  return [...years].map(([year, inYear]) => ({ year, posts: inYear }))
}
