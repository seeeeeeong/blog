import type { Metadata } from 'next'
import { Missing } from '@/app/_components/Missing'
import { SiteChrome } from '@/app/_components/SiteChrome'

export const metadata: Metadata = { title: '찾을 수 없음' }

/** For an address no route matches, which no layout wraps, so it brings the reader's dock and footer itself. */
export default function NotFound() {
  return (
    <SiteChrome>
      <Missing />
    </SiteChrome>
  )
}
