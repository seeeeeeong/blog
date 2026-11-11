import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container } from '@/app/_components/Container'
import { POST_COMPONENTS } from '@/app/_components/registry'
import { loadPost, loadPosts } from '@/features/posts/api/posts'
import { compileMdx } from '@/features/posts/utils/mdx'
import { PostArticle } from '@/features/posts/views/PostArticle'

// Every post is built with the site, so an address no file names is a 404.
export const dynamicParams = false

export async function generateStaticParams() {
  return (await loadPosts()).map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const post = await loadPost((await params).slug)
  if (!post) notFound()
  return { title: post.title, description: post.description }
}

export default async function PostPage({ params }: PageProps<'/blog/[slug]'>) {
  const post = await loadPost((await params).slug)
  if (!post) notFound()
  const Content = await compileMdx(post.body, Object.keys(POST_COMPONENTS))
  return (
    <Container>
      <PostArticle post={post} Content={Content} components={POST_COMPONENTS} />
    </Container>
  )
}
