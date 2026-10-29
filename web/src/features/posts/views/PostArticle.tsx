import './post.css'
import type { MDXComponents, MDXContent } from 'mdx/types'
import type { Post } from '@/features/posts/api/types'
import { Pager } from '@/features/posts/components/Pager'
import { PostBody } from '@/features/posts/components/PostBody'
import { isoDay, longDate } from '@/utils/date'

type Props = {
  post: Post
  /** The compiled body; null when it did not compile. */
  Content: MDXContent | null
  /** The components the body was compiled to allow. */
  components: MDXComponents
}

/** One post: its title, when and where it was filed, its body and its neighbours in the topic. */
export function PostArticle({ post, Content, components }: Props) {
  return (
    <article className="post">
      <header className="post__head">
        <h1>{post.title}</h1>
        <div className="post__meta mono">
          <time dateTime={isoDay(post.publishedAt)}>{longDate(post.publishedAt)}</time>
          <span aria-hidden="true">/</span>
          <a href="/#topic">
            {post.number} {post.topic.slug}
          </a>
        </div>
      </header>
      <div className="prose">
        <PostBody Content={Content} components={components} />
        <Pager previous={post.previous} next={post.next} />
      </div>
    </article>
  )
}
