import type { Metadata } from 'next'
import { Missing } from '@/app/_components/Missing'

export const metadata: Metadata = { title: '찾을 수 없음' }

/** For a post that is missing or not published; the site's layout already wraps it. */
export default function SiteNotFound() {
  return <Missing />
}
