import { describe, expect, it } from 'vitest'
import { clampHeight, clampTabY, isDrag, nudgeTabY, startTabY } from '@/features/ask/utils/position'

describe('the folded tab', () => {
  it('first appears near the bottom of the viewport', () => {
    expect(startTabY(900)).toBe(764)
  })

  it('stays below the dock and above the bottom edge while dragged', () => {
    expect(clampTabY(400, 900)).toBe(400)
    expect(clampTabY(10, 900)).toBe(72)
    expect(clampTabY(2000, 900)).toBe(844)
  })

  it('moves a step with the arrow keys, within the same bounds', () => {
    expect(nudgeTabY(400, 'ArrowUp', 900)).toBe(384)
    expect(nudgeTabY(400, 'ArrowDown', 900)).toBe(416)
    expect(nudgeTabY(80, 'ArrowUp', 900)).toBe(72)
    expect(nudgeTabY(400, 'Enter', 900)).toBeUndefined()
  })

  it('counts a press as a drag only once it moves past a few pixels', () => {
    expect(isDrag(4)).toBe(false)
    expect(isDrag(-4)).toBe(false)
    expect(isDrag(5)).toBe(true)
    expect(isDrag(-5)).toBe(true)
  })
})

describe('clampHeight', () => {
  it('keeps the panel between its least height and the viewport less a margin', () => {
    expect(clampHeight(500, 900)).toBe(500)
    expect(clampHeight(100, 900)).toBe(320)
    expect(clampHeight(2000, 900)).toBe(804)
  })
})
