import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Sans_KR, Inter } from 'next/font/google'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import './tokens.css'
import './globals.css'
import '@/app/_components/shell.css'
import { FEED_PATH, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '@/lib/site'

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-plex-sans',
})

// Hangul comes in a hundred slices the browser picks by character, so none is worth preloading.
const plexSansKr = IBM_Plex_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-sans-kr',
  preload: false,
})

const inter = Inter({ subsets: ['latin'], axes: ['opsz'], variable: '--font-inter' })

const FONT_VARIABLES = [plexSans, plexSansKr, inter].map((font) => font.variable).join(' ')

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s · ${SITE_TITLE}` },
  description: SITE_DESCRIPTION,
  alternates: {
    types: { 'application/rss+xml': [{ url: FEED_PATH, title: SITE_TITLE }] },
  },
}

// The reader's pages and the admin's bring their own banner.
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className={FONT_VARIABLES}>
      <body>{children}</body>
    </html>
  )
}
