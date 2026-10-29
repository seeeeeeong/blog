'use client'

import './admin.css'
import { listPosts, listTopics } from '@/features/admin/api/posts'
import { PostIndex } from '@/features/admin/components/PostIndex'
import { useLoad } from '@/features/admin/hooks/useLoad'

const loadIndex = () => Promise.all([listPosts(), listTopics()])

export function PostsView() {
  const loaded = useLoad(loadIndex)
  if (loaded.state === 'loading') return <main className="apage" />
  if (loaded.state === 'failed') {
    return (
      <main className="apage">
        <p className="empty">{loaded.message}</p>
      </main>
    )
  }
  const [posts, topics] = loaded.data
  return <PostIndex posts={posts} topics={topics} />
}
