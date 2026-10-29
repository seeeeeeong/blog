'use client'

import { type RefObject, useEffect, useState } from 'react'
import { fontScale } from '@/features/widgets/utils/handshake'

/** The text scale for the drawing at its shown width; 1 on the server. */
export function useFontScale(ref: RefObject<Element | null>): number {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale(fontScale(entry.contentRect.width))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return scale
}
