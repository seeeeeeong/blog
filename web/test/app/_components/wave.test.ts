import { describe, expect, it } from 'vitest'
import { createParticles, pointOf, waveIn } from '@/app/_components/wave'

const sequence = (values: number[]) => {
  let i = 0
  return () => values[i++ % values.length] ?? 0
}

describe('createParticles', () => {
  it('makes mostly small particles, each with a tone from the palette', () => {
    const particles = createParticles(200, Math.random)

    expect(particles).toHaveLength(200)
    for (const p of particles) {
      expect([1.2, 2]).toContain(p.size)
      expect(p.tone).toBeGreaterThanOrEqual(0)
      expect(p.tone).toBeLessThan(4)
    }
  })
})

describe('pointOf', () => {
  it('keeps the wave within the middle of the canvas', () => {
    const wave = waveIn(1000, 360)
    for (const particle of createParticles(500, sequence([0.1, 0.5, 0.9, 0.3, 0.7]))) {
      for (const phase of [0, 1, 2.5]) {
        const { x } = pointOf(particle, phase, wave)
        expect(x).toBeGreaterThan(1000 * 0.12 - 4)
        expect(x).toBeLessThan(1000 * 0.88 + 4)
      }
    }
  })

  it('winds fewer turns on a narrow screen', () => {
    expect(waveIn(390, 320).turns).toBe(1.5)
    expect(waveIn(1280, 360).turns).toBe(3)
  })
})
