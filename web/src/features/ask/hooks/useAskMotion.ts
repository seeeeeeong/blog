'use client'

import { type RefObject, useLayoutEffect, useRef, useState } from 'react'
import {
  APPEARING,
  type AskMode,
  collapsedFrame,
  durationOf,
  EASE,
  EXPANDED,
  motionOf,
  TAB_IN,
  TAB_OUT,
} from '@/features/ask/utils/motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

type Parts = {
  panel: RefObject<HTMLElement | null>
  tab: RefObject<HTMLElement | null>
  input: RefObject<HTMLTextAreaElement | null>
  /** Whether the tab takes focus once the panel has folded, as after a key press. */
  focusTab: RefObject<boolean>
}

const ignore = () => {}

/**
 * Moves the panel between its modes: it rises in when opened, folds into the tab at the right edge
 * when minimized and unfolds from it. Both stay shown while one turns into the other.
 */
export function useAskMotion(mode: AskMode, { panel, tab, input, focusTab }: Parts) {
  const still = useReducedMotion()
  const [shownMode, setShownMode] = useState(mode)
  const [leaving, setLeaving] = useState<AskMode | null>(null)
  const from = useRef<AskMode>(mode)
  const run = useRef(0)

  // The mode being left stays on screen from the very render that leaves it, until its motion ends.
  if (shownMode !== mode) {
    setShownMode(mode)
    setLeaving(shownMode)
  }

  useLayoutEffect(() => {
    const motion = motionOf(from.current, mode)
    from.current = mode
    const box = panel.current
    const edge = tab.current
    if (!motion || !box || !edge) return
    run.current += 1
    const token = run.current
    const settle = () => {
      if (run.current === token) setLeaving(null)
    }
    const time = (ms: number) => durationOf(ms, still)

    if (motion === 'hide') {
      settle()
    } else if (motion === 'show') {
      box.animate([APPEARING, EXPANDED], { duration: time(300), easing: EASE })
      settle()
      input.current?.focus({ preventScroll: true })
    } else if (motion === 'shrink') {
      edge.animate(TAB_IN, {
        duration: time(320),
        delay: time(140),
        easing: EASE,
        fill: 'backwards',
      })
      const folded = collapsedFrame(box.getBoundingClientRect(), edge.getBoundingClientRect())
      box.animate([EXPANDED, folded], { duration: time(300), easing: EASE }).finished.then(() => {
        if (run.current !== token) return
        settle()
        if (focusTab.current) edge.focus({ preventScroll: true })
      }, ignore)
    } else {
      const folded = collapsedFrame(box.getBoundingClientRect(), edge.getBoundingClientRect())
      box.animate([folded, EXPANDED], { duration: time(380), easing: EASE })
      edge.animate(TAB_OUT, { duration: time(200), easing: EASE }).finished.then(settle, ignore)
      input.current?.focus({ preventScroll: true })
    }
  }, [mode, still, panel, tab, input, focusTab])

  return {
    panelShown: mode === 'open' || leaving === 'open',
    tabShown: mode === 'minimized' || leaving === 'minimized',
  }
}
