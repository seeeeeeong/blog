'use client'

import './admin.css'
import { useCallback } from 'react'
import { getPost, listTopics } from '@/features/admin/api/posts'
import { PostEditor, type PreviewAction } from '@/features/admin/components/PostEditor'
import { useLoad } from '@/features/admin/hooks/useLoad'

type Props = { id: string; previewAction: PreviewAction }

export function EditorView({ id, previewAction }: Props) {
  const load = useCallback(() => Promise.all([getPost(id), listTopics()]), [id])
  const loaded = useLoad(load)
  if (loaded.state === 'loading') return <main className="apage apage--editor" />
  if (loaded.state === 'failed') {
    return (
      <main className="apage">
        <p className="empty">{loaded.message}</p>
      </main>
    )
  }
  const [post, topics] = loaded.data
  return <PostEditor key={post.id} post={post} topics={topics} previewAction={previewAction} />
}
