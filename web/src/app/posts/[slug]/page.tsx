import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadPost } from '@/features/posts/api/post'
import { PROSE_COMPONENTS } from '@/features/posts/components/registry'
import { compileMdx } from '@/features/posts/utils/mdx'
import { PostArticle } from '@/features/posts/views/PostArticle'
import { WIDGETS } from '@/features/widgets/components/registry'

// Everything a post's MDX may name; any other element in a body is dropped before it compiles.
const REGISTRY = { ...PROSE_COMPONENTS, ...WIDGETS }

export async function generateMetadata({ params }: PageProps<'/posts/[slug]'>): Promise<Metadata> {
  const post = await loadPost((await params).slug)
  if (!post) notFound()
  return { title: post.title, description: post.summary }
}

export default async function PostPage({ params }: PageProps<'/posts/[slug]'>) {
  const post = await loadPost((await params).slug)
  if (!post) notFound()
  const Content = await compileMdx(post.bodyMdx, Object.keys(REGISTRY))
  return <PostArticle post={post} Content={Content} components={REGISTRY} />
}
