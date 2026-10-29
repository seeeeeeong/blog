import { cache } from 'react'
import type { Post } from '@/features/posts/api/types'
import { ApiError, apiGet } from '@/lib/api'

/** Once a request, as the metadata and the page read the same post. Null when there is no such post. */
export const loadPost = cache(async (slug: string): Promise<Post | null> => {
  try {
    return await apiGet<Post>(`/api/posts/${encodeURIComponent(slug)}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
})
