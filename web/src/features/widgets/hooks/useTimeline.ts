'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  advance,
  playFrom,
  SEEK_MS,
  STEPS,
  seekAt,
  toStep,
} from '@/features/widgets/utils/handshake'

/**
 * A widget's time, in slider steps: looping playback, an eased seek and plain scrubbing. With
 * [still] (reduced motion) nothing animates: play shows the end, a seek jumps.
 */
export function useTimeline(still: boolean) {
  const [step, setStepState] = useState(0)
  const [playing, setPlaying] = useState(false)
  const current = useRef(0)
  const seeking = useRef(0)

  const setStep = useCallback((next: number) => {
    current.current = next
    setStepState(next)
  }, [])

  const stopSeek = useCallback(() => cancelAnimationFrame(seeking.current), [])

  useEffect(() => {
    if (!playing) return
    let head = playFrom(current.current / STEPS)
    let last = performance.now()
    let frame = 0
    const tick = (now: number) => {
      // Someone else moved the time (a scenario switch); play on from there.
      if (toStep(head.t) !== current.current) head = { t: current.current / STEPS, holdUntil: 0 }
      head = advance(head, now - last, now)
      last = now
      setStep(toStep(head.t))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, setStep])

  useEffect(() => {
    if (still) setPlaying(false)
  }, [still])

  useEffect(() => stopSeek, [stopSeek])

  const toggle = useCallback(() => {
    stopSeek()
    if (playing) setPlaying(false)
    else if (still) setStep(STEPS)
    else setPlaying(true)
  }, [playing, still, setStep, stopSeek])

  const pause = useCallback(() => setPlaying(false), [])

  const scrub = useCallback(
    (next: number) => {
      stopSeek()
      setStep(next)
    },
    [setStep, stopSeek],
  )

  const seek = useCallback(
    (to: number) => {
      setPlaying(false)
      stopSeek()
      if (still) {
        setStep(toStep(to))
        return
      }
      const from = current.current / STEPS
      const started = performance.now()
      const frame = (now: number) => {
        const elapsed = now - started
        setStep(toStep(seekAt(from, to, elapsed)))
        if (elapsed < SEEK_MS) seeking.current = requestAnimationFrame(frame)
      }
      seeking.current = requestAnimationFrame(frame)
    },
    [still, setStep, stopSeek],
  )

  return { step, playing, toggle, pause, scrub, seek, setStep }
}
