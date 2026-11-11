import type { MDXComponents, MDXContent } from 'mdx/types'
import type { Post } from '@/features/posts/api/types'
import { BackToPrev } from '@/features/posts/components/BackToPrev'
import { PostBody } from '@/features/posts/components/PostBody'
import { readingTime } from '@/features/posts/utils/archive'
import { dateTime } from '@/utils/date'

type Props = {
  post: Post
  /** The compiled body; null when it did not compile. */
  Content: MDXContent | null
  /** The components the body was compiled to allow. */
  components: MDXComponents
}

/** One post: the way back, when it came out and how long it takes, its title and its body. */
export function PostArticle({ post, Content, components }: Props) {
  return (
    <>
      <div className="animate">
        <BackToPrev href="/blog">Back to blog</BackToPrev>
      </div>
      <div className="space-y-1 my-10">
        <div className="animate flex items-center gap-1.5">
          <div className="font-base text-sm">
            <time dateTime={post.date}>{dateTime(post.date)}</time>
          </div>
          &bull;
          <div className="font-base text-sm">{readingTime(post.body)}</div>
        </div>
        <h1 className="animate text-2xl font-semibold text-black dark:text-white">{post.title}</h1>
      </div>
      <article className="animate">
        <PostBody Content={Content} components={components} />
      </article>
    </>
  )
}
