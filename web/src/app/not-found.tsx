import '@/app/_components/not-found.css'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '찾을 수 없음' }

/** For an address with nothing behind it, and for a post that is missing or not published. */
export default function NotFound() {
  return (
    <main className="missing">
      <p className="missing__code mono">404 / Not found</p>
      <h1>찾는 글이 없습니다</h1>
      <p className="missing__text">주소가 바뀌었거나 아직 공개하지 않은 글입니다.</p>
      <a className="missing__home" href="/">
        목록으로
      </a>
    </main>
  )
}
