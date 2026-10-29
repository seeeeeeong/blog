import { loadArchive } from '@/features/posts/api/archive'
import { rssFeed } from '@/features/posts/utils/rss'
import { SITE_URL } from '@/lib/site'

/** The published posts as an RSS 2.0 feed. */
export async function GET(): Promise<Response> {
  const archive = await loadArchive()
  // An empty feed would read as every post withdrawn; a reader retries a 503 instead.
  if (!archive) return new Response('The feed is unavailable.', { status: 503 })
  return new Response(rssFeed(archive.posts, SITE_URL), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
