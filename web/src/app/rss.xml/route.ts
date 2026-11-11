import { loadPosts } from '@/features/posts/api/posts'
import { rssFeed } from '@/features/posts/utils/rss'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-static'

/** The posts as an RSS 2.0 feed. */
export async function GET(): Promise<Response> {
  return new Response(rssFeed(await loadPosts(), SITE_URL), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
