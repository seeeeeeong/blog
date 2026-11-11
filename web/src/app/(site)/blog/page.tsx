import type { Metadata } from 'next'
import { Container } from '@/app/_components/Container'
import { loadPosts } from '@/features/posts/api/posts'
import { BlogIndex } from '@/features/posts/views/BlogIndex'

export const metadata: Metadata = { title: 'Blog' }

export default async function BlogPage() {
  return (
    <Container>
      <BlogIndex posts={await loadPosts()} />
    </Container>
  )
}
