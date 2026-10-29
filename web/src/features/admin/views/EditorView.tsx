'use client'

import './admin.css'
import { useCallback } from 'react'
import { listBooks } from '@/features/admin/api/books'
import { getPost, listTopics } from '@/features/admin/api/posts'
import { PostEditor, type PreviewAction } from '@/features/admin/components/PostEditor'
import { useLoad } from '@/features/admin/hooks/useLoad'
import { placeOf, type SectionPlace } from '@/features/admin/utils/books'

type Props = { id: string; previewAction: PreviewAction }

// The link back to the book is a convenience, so the editor opens without it should the books fail.
async function sectionPlace(sectionId: string | null): Promise<SectionPlace | null> {
  if (!sectionId) return null
  const books = await listBooks().catch(() => [])
  return placeOf(books, sectionId)
}

async function loadEditor(id: string) {
  const [post, topics] = await Promise.all([getPost(id), listTopics()])
  return [post, topics, await sectionPlace(post.sectionId)] as const
}

export function EditorView({ id, previewAction }: Props) {
  const load = useCallback(() => loadEditor(id), [id])
  const loaded = useLoad(load)
  if (loaded.state === 'loading') return <main className="apage apage--editor" />
  if (loaded.state === 'failed') {
    return (
      <main className="apage">
        <p className="empty">{loaded.message}</p>
      </main>
    )
  }
  const [post, topics, section] = loaded.data
  return (
    <PostEditor
      key={post.id}
      post={post}
      topics={topics}
      section={section}
      previewAction={previewAction}
    />
  )
}
