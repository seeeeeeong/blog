import { POST_COMPONENTS } from '@/app/_components/registry'
import { loadArchive } from '@/features/posts/api/archive'
import { loadPost } from '@/features/posts/api/post'
import { newestOf } from '@/features/posts/utils/archive'
import { compileMdx } from '@/features/posts/utils/mdx'
import { PostArticle } from '@/features/posts/views/PostArticle'

/** The newest post in full, as the blog opens on it; the archive lists the rest. */
export default async function Home() {
  const archive = await loadArchive()
  if (!archive) {
    return (
      <main className="post">
        <p className="empty">글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      </main>
    )
  }
  const newest = newestOf(archive.posts)
  const post = newest && (await loadPost(newest.slug))
  if (!post) return <main className="post" />
  const Content = await compileMdx(post.bodyMdx, Object.keys(POST_COMPONENTS))
  return (
    <main>
      <PostArticle post={post} Content={Content} components={POST_COMPONENTS} linked />
    </main>
  )
}
