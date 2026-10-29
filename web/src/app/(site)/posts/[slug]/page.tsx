import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { POST_COMPONENTS } from '@/app/_components/registry'
import { loadPost } from '@/features/posts/api/post'
import { compileMdx } from '@/features/posts/utils/mdx'
import { PostArticle } from '@/features/posts/views/PostArticle'

export async function generateMetadata({ params }: PageProps<'/posts/[slug]'>): Promise<Metadata> {
  const post = await loadPost((await params).slug)
  if (!post) notFound()
  return { title: post.title, description: post.summary }
}

export default async function PostPage({ params }: PageProps<'/posts/[slug]'>) {
  const post = await loadPost((await params).slug)
  if (!post) notFound()
  const Content = await compileMdx(post.bodyMdx, Object.keys(POST_COMPONENTS))
  return <PostArticle post={post} Content={Content} components={POST_COMPONENTS} />
}
