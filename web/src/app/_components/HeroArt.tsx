'use client'

import { useEffect, useRef } from 'react'
import {
  createParticles,
  PALETTE,
  PARTICLE_COUNT,
  type Particle,
  pointOf,
  waveIn,
} from '@/app/_components/wave'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useTheme } from '@/hooks/useTheme'

// A radian every 5.2 s: one full sway takes about half a minute, slow enough to read as drift.
const PHASE_MS = 5200

/** The particle wave; drawn once and left still when the reader asks for less motion. */
export function HeroArt() {
  const ref = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[] | null>(null)
  const still = useReducedMotion()
  const { theme } = useTheme()

  useEffect(() => {
    const canvas = ref.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    particles.current ??= createParticles(PARTICLE_COUNT)
    const all = particles.current
    const palette = PALETTE[theme]
    let width = 0
    let height = 0

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = (time: number) => {
      const phase = time / PHASE_MS
      const wave = waveIn(width, height)
      context.clearRect(0, 0, width, height)
      for (const particle of all) {
        const { x, y } = pointOf(particle, phase, wave)
        context.fillStyle = `rgb(${palette[particle.tone]} / ${particle.alpha})`
        context.fillRect(x, y, particle.size, particle.size)
      }
    }

    let frame = 0
    const loop = (time: number) => {
      draw(time)
      frame = requestAnimationFrame(loop)
    }

    resize()
    const observer = new ResizeObserver(() => {
      resize()
      if (still) draw(0)
    })
    observer.observe(canvas)
    if (still) draw(0)
    else frame = requestAnimationFrame(loop)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [still, theme])

  return <canvas ref={ref} className="hero__art" />
}
