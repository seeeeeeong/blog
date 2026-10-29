import { describe, expect, it } from 'vitest'
import { randomGlyph, scrambleDuration, scrambleFrame } from '@/utils/scramble'

const glyph = () => '#'

describe('scrambleFrame', () => {
  it('starts as noise over the first few characters', () => {
    expect(scrambleFrame('Sinseong Lee', 0, glyph)).toEqual({ settled: '', noise: '######' })
  })

  it('settles the text from the left as it progresses, keeping spaces', () => {
    expect(scrambleFrame('TCP 3-way handshake', 0.25, glyph)).toEqual({
      settled: 'TCP ',
      noise: '##### ',
    })
  })

  it('ends as the text itself', () => {
    expect(scrambleFrame('가상 메모리', 1, glyph)).toEqual({ settled: '가상 메모리', noise: '' })
  })

  it('counts characters, not UTF-16 units', () => {
    expect(scrambleFrame('🙂ab', 1 / 3, glyph)).toEqual({ settled: '🙂', noise: '##' })
  })
})

describe('scrambleDuration', () => {
  it('grows with the text, up to a second', () => {
    expect(scrambleDuration('OCT 21')).toBe(436)
    expect(scrambleDuration('x'.repeat(100))).toBe(1000)
  })
})

describe('randomGlyph', () => {
  it('picks from the glyph set', () => {
    expect(randomGlyph(() => 0)).toBe('A')
    expect(randomGlyph(() => 0.9999)).toBe('/')
  })
})
