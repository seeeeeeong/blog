import type { PostSummary } from '@/features/posts/api/types'
import { newestFirst, postHref } from '@/features/posts/utils/archive'
import { FEED_PATH, SITE_DESCRIPTION, SITE_TITLE } from '@/lib/site'
import { rfc822Date } from '@/utils/date'

const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

// XML 1.0 has no way to write these, escaped or not; one left in breaks the whole feed.
// biome-ignore lint/suspicious/noControlCharactersInRegex: matching them is the point
const FORBIDDEN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g

export function escapeXml(text: string): string {
  return text.replace(FORBIDDEN, '').replace(/[&<>"']/g, (char) => ENTITIES[char] ?? char)
}

function item(post: PostSummary, siteUrl: string): string {
  const link = escapeXml(new URL(postHref(post.slug), siteUrl).href)
  return [
    '    <item>',
    `      <title>${escapeXml(post.title)}</title>`,
    `      <link>${link}</link>`,
    `      <guid isPermaLink="true">${link}</guid>`,
    `      <pubDate>${rfc822Date(post.publishedAt)}</pubDate>`,
    `      <description>${escapeXml(post.summary)}</description>`,
    '    </item>',
  ].join('\n')
}

/** An RSS 2.0 feed of [posts], newest first, each linked under [siteUrl]. */
export function rssFeed(posts: readonly PostSummary[], siteUrl: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(SITE_TITLE)}</title>`,
    `    <link>${escapeXml(new URL('/', siteUrl).href)}</link>`,
    `    <description>${escapeXml(SITE_DESCRIPTION)}</description>`,
    '    <language>ko</language>',
    `    <atom:link href="${escapeXml(new URL(FEED_PATH, siteUrl).href)}" rel="self" type="application/rss+xml"/>`,
    ...newestFirst(posts).map((post) => item(post, siteUrl)),
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
}
