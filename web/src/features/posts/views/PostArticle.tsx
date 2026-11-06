import './post.css'
import type { MDXComponents, MDXContent } from 'mdx/types'
import Link from 'next/link'
import type { Post } from '@/features/posts/api/types'
import { Pager } from '@/features/posts/components/Pager'
import { PostBody } from '@/features/posts/components/PostBody'
import { postHref } from '@/features/posts/utils/archive'
import { fullDate, isoDay } from '@/utils/date'

type Props = {
  post: Post
  /** The compiled body; null when it did not compile. */
  Content: MDXContent | null
  /** The components the body was compiled to allow. */
  components: MDXComponents
  /** Shown away from its own page, so the title leads there. */
  linked?: boolean
}

/** One post: when it came out, its title, its body and its neighbours in the topic. */
export function PostArticle({ post, Content, components, linked = false }: Props) {
  return (
    <article className="post">
      <header>
        <time className="post__date" dateTime={isoDay(post.publishedAt)}>
          {fullDate(post.publishedAt)}
        </time>
        <h1 className="post__title">
          {linked ? <Link href={postHref(post.slug)}>{post.title}</Link> : post.title}
        </h1>
      </header>
      <div className="prose">
        <PostBody Content={Content} components={components} />
      </div>
      <Pager previous={post.previous} next={post.next} />
    </article>
  )
}
