'use client'

import { type ArchiveView, viewOf } from '@/features/posts/utils/archive'
import { useHash } from '@/hooks/useHash'

/** The archive's view, from the location's fragment. */
export function useArchiveView(): ArchiveView {
  return viewOf(useHash())
}
