import type { Metadata } from 'next'
import { Inter, Lora, Noto_Serif_KR } from 'next/font/google'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import './tokens.css'
import './nano/nano.css'
import './site.css'
import { Footer } from '@/app/_components/Footer'
import { Header } from '@/app/_components/Header'
import { SiteEffects } from '@/app/_components/SiteEffects'
import { THEME_SCRIPT } from '@/app/_components/theme'
import { FEED_PATH, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '@/lib/site'

const inter = Inter({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-inter' })

const lora = Lora({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-lora' })

// Hangul comes in a hundred slices the browser picks by character, so none is worth preloading.
const notoSerifKr = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-noto-serif-kr',
  preload: false,
})

const FONT_VARIABLES = [inter, lora, notoSerifKr].map((font) => font.variable).join(' ')

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s | ${SITE_TITLE}` },
  description: SITE_DESCRIPTION,
  alternates: {
    types: { 'application/rss+xml': [{ url: FEED_PATH, title: SITE_TITLE }] },
  },
}

// The head script adds `dark` and `js` to <html> before React hydrates it.
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className={FONT_VARIABLES} suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a fixed script, no input in it */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <SiteEffects />
      </body>
    </html>
  )
}
