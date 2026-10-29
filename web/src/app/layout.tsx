import type { Metadata } from 'next'
import { Fira_Code, Inter } from 'next/font/google'
import localFont from 'next/font/local'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import './tokens.css'
import './globals.css'
import '@/app/_components/shell.css'
import { Dock } from '@/app/_components/Dock'
import { SiteFooter } from '@/app/_components/SiteFooter'
import type { CmdPost } from '@/features/cmd/utils/items'
import { CmdPalette } from '@/features/cmd/views/CmdPalette'
import { loadArchive } from '@/features/posts/api/archive'
import type { PostSummary } from '@/features/posts/api/types'
import { newestOf, postHref } from '@/features/posts/utils/archive'
import { FEED_PATH, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '@/lib/site'
import { THEME_SCRIPT } from '@/lib/theme'

const inter = Inter({
  subsets: ['latin'],
  axes: ['opsz'],
  style: ['normal', 'italic'],
  variable: '--font-inter',
})

const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira-code' })

// The pixel font's metrics match no system font, so no adjusted fallback.
const departureMono = localFont({
  src: './fonts/DepartureMono-Regular.woff2',
  variable: '--font-departure-mono',
  display: 'swap',
  adjustFontFallback: false,
})

const FONT_VARIABLES = [inter, firaCode, departureMono].map((font) => font.variable).join(' ')

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s · ${SITE_TITLE}` },
  description: SITE_DESCRIPTION,
  alternates: {
    types: { 'application/rss+xml': [{ url: FEED_PATH, title: SITE_TITLE }] },
  },
}

function cmdPost(post: PostSummary): CmdPost {
  return {
    href: postHref(post.slug),
    title: post.title,
    topic: post.topic.title,
    summary: post.summary,
    publishedAt: post.publishedAt,
  }
}

// The theme script sets data-theme on <html> before React hydrates it. The palette searches the
// posts the layout already reads, so it opens with them and fetches nothing of its own.
export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const posts = (await loadArchive())?.posts ?? []
  const newest = newestOf(posts)
  const latestHref = newest && postHref(newest.slug)
  return (
    <html lang="ko" className={FONT_VARIABLES} suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a constant of our own, not user input */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <noscript>
          <style>{'.scramble-pending{opacity:1}'}</style>
        </noscript>
      </head>
      <body>
        <Dock latestHref={latestHref} />
        <CmdPalette posts={posts.map(cmdPost)} latestHref={latestHref} />
        {children}
        <SiteFooter lastUpdated={newest?.publishedAt} />
      </body>
    </html>
  )
}
