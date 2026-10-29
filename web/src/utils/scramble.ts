const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=<>/'
const NOISE = 6

export type ScrambleFrame = { settled: string; noise: string }

/** Longer text takes longer to settle, up to a second. */
export function scrambleDuration(text: string): number {
  return Math.min(280 + [...text].length * 26, 1000)
}

export function randomGlyph(random: () => number = Math.random): string {
  return GLYPHS.charAt(Math.floor(random() * GLYPHS.length))
}

/** The text settled up to [progress], then a few glyphs of noise; spaces stay spaces. */
export function scrambleFrame(
  text: string,
  progress: number,
  glyph: () => string = randomGlyph,
): ScrambleFrame {
  const chars = [...text]
  const settled = Math.floor(Math.min(Math.max(progress, 0), 1) * chars.length)
  const noise = chars
    .slice(settled, settled + NOISE)
    .map((char) => (char.trim() ? glyph() : char))
    .join('')
  return { settled: chars.slice(0, settled).join(''), noise }
}
