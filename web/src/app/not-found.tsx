import type { Metadata } from 'next'
import { Container } from '@/app/_components/Container'
import { BackToPrev } from '@/features/posts/components/BackToPrev'

export const metadata: Metadata = { title: 'Not found' }

export default function NotFound() {
  return (
    <Container>
      <div className="animate">
        <BackToPrev href="/">Back to home</BackToPrev>
      </div>
      <div className="space-y-1 my-10">
        <h1 className="animate text-2xl font-semibold text-black dark:text-white">404</h1>
      </div>
      <article className="animate">
        <p>찾는 글이 없습니다. 주소가 바뀌었거나 아직 공개하지 않은 글입니다.</p>
      </article>
    </Container>
  )
}
