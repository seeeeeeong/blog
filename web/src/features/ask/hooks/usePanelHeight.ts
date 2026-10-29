'use client'

import { type PointerEvent, type RefObject, useRef, useState } from 'react'
import { clampHeight } from '@/features/ask/utils/position'

type Drag = { startY: number; startHeight: number }

/** The panel's height, set by dragging the grip on its top edge; none keeps the stylesheet's. */
export function usePanelHeight(panel: RefObject<HTMLElement | null>) {
  const [height, setHeight] = useState<number | null>(null)
  const drag = useRef<Drag | null>(null)

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const box = panel.current?.getBoundingClientRect()
    if (!box) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { startY: event.clientY, startHeight: box.height }
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current
    if (!start) return
    setHeight(clampHeight(start.startHeight + start.startY - event.clientY, innerHeight))
  }

  const onPointerUp = () => {
    drag.current = null
  }

  return { height, handlers: { onPointerDown, onPointerMove, onPointerUp } }
}
