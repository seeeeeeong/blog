/** A post as the lists show it, without its body. */
export type PostSummary = {
  /** The file's name without `.mdx`, and the post's address under `/blog`. */
  slug: string
  title: string
  description: string
  /** An ISO-8601 instant. */
  date: string
}

export type Post = PostSummary & {
  /** The MDX after the frontmatter. */
  body: string
  /** Kept out of every list, page and feed. */
  draft: boolean
}
