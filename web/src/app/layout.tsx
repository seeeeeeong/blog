import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Sinseong Lee', template: '%s · Sinseong Lee' },
  description: 'CS를 공부하며 정리한 글',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
