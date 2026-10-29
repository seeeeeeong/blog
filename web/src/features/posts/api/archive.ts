import { unstable_rethrow } from 'next/navigation'
import { cache } from 'react'
import type { ArchiveData, PostSummary, Topic } from '@/features/posts/api/types'
import { apiGet } from '@/lib/api'

/**
 * Once a request, as the layout and the home read the same posts. Null when the api cannot answer,
 * so the page still opens.
 */
export const loadArchive = cache(async (): Promise<ArchiveData | null> => {
  try {
    const [posts, topics] = await Promise.all([
      apiGet<PostSummary[]>('/api/posts'),
      apiGet<Topic[]>('/api/topics'),
    ])
    return { posts, topics }
  } catch (error) {
    unstable_rethrow(error)
    return null
  }
})
