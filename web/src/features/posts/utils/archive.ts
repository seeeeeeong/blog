import type { PostSummary } from '@/features/posts/api/types'
import { yearOf } from '@/utils/date'

export type YearGroup<T extends PostSummary> = { year: string; posts: T[] }

export function postHref(slug: string): string {
  return `/blog/${slug}`
}

/** Posts, already newest first, in groups by the year they came out in Seoul. */
export function byYear<T extends PostSummary>(posts: readonly T[]): YearGroup<T>[] {
  const years = new Map<string, T[]>()
  for (const post of posts) {
    const year = yearOf(post.date)
    years.set(year, [...(years.get(year) ?? []), post])
  }
  return [...years].map(([year, inYear]) => ({ year, posts: inYear }))
}

/** `8 min read`, at two hundred words a minute and never less than one. */
export function readingTime(body: string): string {
  const words = body.split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.ceil(words / 200))} min read`
}
