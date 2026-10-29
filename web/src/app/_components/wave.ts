export type Particle = {
  /** Where along the wave, 0 to 1. */
  t: number
  spread: number
  drift: number
  size: number
  tone: number
  alpha: number
}

export type Wave = { left: number; span: number; mid: number; amp: number; turns: number }

export const PARTICLE_COUNT = 2400

/** RGB triples for each theme; a particle's tone picks one. */
export const PALETTE = {
  dark: ['255 255 255', '255 214 236', '196 214 255', '150 186 255'],
  light: ['32 52 140', '150 60 120', '56 96 210', '20 30 70'],
} as const

function gaussian(random: () => number): number {
  const u = 1 - random()
  const v = random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export function createParticles(count: number, random: () => number = Math.random): Particle[] {
  return Array.from({ length: count }, () => ({
    t: random(),
    spread: gaussian(random),
    drift: random() * Math.PI * 2,
    size: random() < 0.85 ? 1.2 : 2,
    tone: Math.floor(random() * 4),
    alpha: 0.25 + random() * 0.7,
  }))
}

/** The wave across a canvas: three turns wide, one and a half on a narrow screen. */
export function waveIn(width: number, height: number): Wave {
  return {
    left: width * 0.12,
    span: width * 0.76,
    mid: height * 0.48,
    amp: Math.min(height * 0.26, 90),
    turns: width < 640 ? 1.5 : 3,
  }
}

/** Where a particle is at [phase], thickest where the wave crosses its middle. */
export function pointOf(particle: Particle, phase: number, wave: Wave): { x: number; y: number } {
  const angle = particle.t * Math.PI * wave.turns + phase
  const envelope = 0.35 + 0.65 * Math.abs(Math.cos(angle))
  const x = wave.left + particle.t * wave.span + Math.sin(phase * 2 + particle.drift) * 3
  const y =
    wave.mid +
    Math.sin(angle) * wave.amp +
    particle.spread * 16 * envelope +
    Math.cos(phase * 3 + particle.drift) * 2
  return { x, y }
}
