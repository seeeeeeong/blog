/** A topic as `GET /api/topics` lists it, and as each post carries it. */
export type Topic = {
  slug: string
  title: string
  /** The first part of each of its posts' numbers. */
  position: number
}

/** A published post as `GET /api/posts` lists it, newest first and without its body. */
export type PostSummary = {
  slug: string
  title: string
  summary: string
  topic: Topic
  /** `2.1`: the topic's position, then the post's within the topic. */
  number: string
  /** An ISO-8601 instant. */
  publishedAt: string
}

/** A published post as `GET /api/posts/{slug}` answers it, with its neighbours in its topic. */
export type Post = PostSummary & {
  bodyMdx: string
  /** The published post before it in its topic, by position; null for the topic's first. */
  previous: PostSummary | null
  /** The published post after it in its topic, by position; null for the topic's last. */
  next: PostSummary | null
}

/** What the archive lists: the published posts and every topic. */
export type ArchiveData = { posts: PostSummary[]; topics: Topic[] }
