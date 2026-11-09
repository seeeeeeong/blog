'use client'

import { useEffect, useState } from 'react'
import { listGenerations } from '@/features/admin/api/posts'
import type { PostGeneration } from '@/features/admin/api/types'

/** The drafts kept for the post, fetched each time the dialog opens; none when they cannot be had. */
export function useGenerations(open: boolean, postId: string): PostGeneration[] {
  const [generations, setGenerations] = useState<PostGeneration[]>([])
  useEffect(() => {
    if (!open) return
    let current = true
    listGenerations(postId).then(
      (kept) => current && setGenerations(kept),
      () => current && setGenerations([]),
    )
    return () => {
      current = false
    }
  }, [open, postId])
  return generations
}
