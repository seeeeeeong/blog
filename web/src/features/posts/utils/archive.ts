import type { PostSummary, Topic } from '@/features/posts/api/types'
import { yearOf } from '@/utils/date'

export type ArchiveView = 'date' | 'topic'

const VIEWS: readonly ArchiveView[] = ['date', 'topic']

export type YearGroup = { year: string; posts: PostSummary[] }

export type TopicGroup = {
  topic: Topic
  /** `02`, the topic's position. */
  label: string
  posts: PostSummary[]
}

/** The view a `#date` or `#topic` fragment asks for; any other shows posts by date. */
export function viewOf(hash: string): ArchiveView {
  return VIEWS.find((view) => hash === `#${view}`) ?? 'date'
}

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

// `2.10` comes after `2.9`, which comparing the strings gets wrong.
function placeInTopic(post: PostSummary): number {
  return Number(post.number.split('.')[1])
}

/** Topics in their order, each with its posts by number; a topic without posts is left out. */
export function byTopic(posts: readonly PostSummary[], topics: readonly Topic[]): TopicGroup[] {
  return [...topics]
    .sort((a, b) => a.position - b.position)
    .flatMap((topic) => {
      const inTopic = posts
        .filter((post) => post.topic.slug === topic.slug)
        .sort((a, b) => placeInTopic(a) - placeInTopic(b))
      if (inTopic.length === 0) return []
      return [{ topic, label: String(topic.position).padStart(2, '0'), posts: inTopic }]
    })
}
