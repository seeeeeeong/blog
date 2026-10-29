import type { ReactNode } from 'react'
import { Dock } from '@/app/_components/Dock'
import { SiteFooter } from '@/app/_components/SiteFooter'
import { Ask } from '@/features/ask/views/Ask'
import type { CmdPost } from '@/features/cmd/utils/items'
import { CmdPalette } from '@/features/cmd/views/CmdPalette'
import { loadArchive } from '@/features/posts/api/archive'
import type { PostSummary } from '@/features/posts/api/types'
import { newestOf, postHref } from '@/features/posts/utils/archive'

function cmdPost(post: PostSummary): CmdPost {
  return {
    href: postHref(post.slug),
    title: post.title,
    topic: post.topic.title,
    summary: post.summary,
    publishedAt: post.publishedAt,
  }
}

/**
 * The reader's dock, palette, Ask panel and footer around a page. The palette searches the posts
 * this already reads, so it opens with them and fetches nothing of its own.
 */
export async function SiteChrome({ children }: { children: ReactNode }) {
  const posts = (await loadArchive())?.posts ?? []
  const newest = newestOf(posts)
  const latestHref = newest && postHref(newest.slug)
  return (
    <>
      <Dock latestHref={latestHref} />
      <CmdPalette posts={posts.map(cmdPost)} latestHref={latestHref} />
      <Ask />
      {children}
      <SiteFooter lastUpdated={newest?.publishedAt} />
    </>
  )
}
