'use client'

import { useMemo, useState } from 'react'
import { applyChanges, changeIds, compareBodies } from '@/features/admin/utils/compare'

/** The changes between [base] and a draft, all taken until the admin leaves one out. */
export function useChangeChoice(base: string, draftBody: string | null) {
  const blocks = useMemo(
    () => (draftBody === null ? [] : compareBodies(base, draftBody)),
    [base, draftBody],
  )
  const [left, setLeft] = useState<ReadonlySet<number>>(new Set())
  const taken = useMemo(
    () => new Set(changeIds(blocks).filter((id) => !left.has(id))),
    [blocks, left],
  )

  const toggle = (id: number) => {
    const next = new Set(left)
    if (!next.delete(id)) next.add(id)
    setLeft(next)
  }

  const clear = () => setLeft(new Set())

  return { blocks, taken, toggle, clear, applied: () => applyChanges(blocks, taken) }
}
