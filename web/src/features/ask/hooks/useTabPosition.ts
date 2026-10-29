'use client'

import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from 'react'
import { clampTabY, isDrag, nudgeTabY, startTabY } from '@/features/ask/utils/position'

type Drag = { startY: number; origin: number }

/**
 * Where the folded panel's tab sits on the right edge, dragged up and down or moved by the arrow
 * keys. A press that drags is not a click, so it does not reopen the panel.
 */
export function useTabPosition(onOpen: () => void) {
  const [top, setTop] = useState<number | null>(null)
  const drag = useRef<Drag | null>(null)
  const dragged = useRef(false)

  const placed = top !== null

  useEffect(() => {
    if (!placed) return
    const onResize = () => setTop((y) => (y === null ? y : clampTabY(y, innerHeight)))
    addEventListener('resize', onResize)
    return () => removeEventListener('resize', onResize)
  }, [placed])

  /** Puts the tab at its first place, before the panel folds onto it. */
  const place = () => setTop((y) => y ?? startTabY(innerHeight))

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { startY: event.clientY, origin: top ?? startTabY(innerHeight) }
    dragged.current = false
  }

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const start = drag.current
    if (!start) return
    const distance = event.clientY - start.startY
    if (isDrag(distance)) dragged.current = true
    if (dragged.current) setTop(clampTabY(start.origin + distance, innerHeight))
  }

  const onPointerUp = () => {
    drag.current = null
  }

  const onClick = () => {
    if (dragged.current) dragged.current = false
    else onOpen()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const next = nudgeTabY(top ?? startTabY(innerHeight), event.key, innerHeight)
    if (next === undefined) return
    event.preventDefault()
    setTop(next)
  }

  return {
    top,
    place,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onClick, onKeyDown },
  }
}
