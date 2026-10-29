import type { PostSummary, Topic } from '@/features/posts/api/types'
import { PostRow } from '@/features/posts/components/PostRow'
import { byTopic } from '@/features/posts/utils/archive'

type Props = { posts: readonly PostSummary[]; topics: readonly Topic[] }

export function TopicGroups({ posts, topics }: Props) {
  return byTopic(posts, topics).map(({ topic, label, posts: inTopic }) => (
    <li key={topic.slug}>
      <p className="group__label group__label--topic">
        <span className="mono group__count">{label}</span>
        {topic.title}
        <span className="mono group__count">({inTopic.length})</span>
      </p>
      <ul className="group">
        {inTopic.map((post) => (
          <PostRow key={post.slug} post={post} numbered />
        ))}
      </ul>
    </li>
  ))
}
