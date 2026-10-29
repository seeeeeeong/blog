'use client'

import './scramble.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useReveal } from '@/hooks/useReveal'
import { type ScrambleFrame, scrambleDuration, scrambleFrame } from '@/utils/scramble'

type Props = { text: string; className?: string }

/**
 * Text that settles out of random glyphs the first time it scrolls into view. The server renders it
 * hidden until then; with reduced motion, or without scripts, it is plain text.
 */
export function Scramble({ text, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const latest = useRef(text)
  latest.current = text
  const still = useReducedMotion()
  const [revealed, setRevealed] = useState(false)
  const [frame, setFrame] = useState<ScrambleFrame | null>(null)
  const reveal = useCallback(() => setRevealed(true), [])
  useReveal(ref, reveal, !still && !revealed)

  useEffect(() => {
    if (!revealed) return
    const duration = scrambleDuration(latest.current)
    const started = performance.now()
    let id = 0
    const tick = (now: number) => {
      const progress = (now - started) / duration
      if (progress >= 1) {
        setFrame(null)
        return
      }
      setFrame(scrambleFrame(latest.current, progress))
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [revealed])

  const pending = !still && !revealed
  const classes = [className, pending ? 'scramble-pending' : undefined].filter(Boolean).join(' ')
  return (
    <span ref={ref} className={classes || undefined}>
      {frame ? (
        <>
          {frame.settled}
          <span className="scramble__noise" aria-hidden="true">
            {frame.noise}
          </span>
        </>
      ) : (
        text
      )}
    </span>
  )
}
