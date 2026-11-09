import { describe, expect, it } from 'vitest'
import {
  bucketOf,
  captionOf,
  chainOf,
  hashCode,
  KEYS,
  partOf,
  readoutOf,
  spread,
  stateOf,
} from '@/features/widgets/utils/hashTable'

describe('the hash', () => {
  it('is Java’s String.hashCode', () => {
    expect(hashCode('')).toBe(0)
    expect(hashCode('a')).toBe(97)
    expect(hashCode('apple')).toBe(93029210)
    expect(hashCode('polygenelubricants')).toBe(-2147483648)
  })

  it('folds the high bits in as HashMap.hash does', () => {
    expect(spread(0x12345678)).toBe(0x12345678 ^ 0x1234)
    expect(spread(-1)).toBe(-1 ^ 0xffff)
  })

  it('masks to a slot', () => {
    expect(KEYS.map((key) => bucketOf(key, 8))).toEqual([1, 5, 2, 4, 2, 2])
    expect(KEYS.map((key) => bucketOf(key, 4))).toEqual([1, 1, 2, 0, 2, 2])
  })
})

describe('chaining', () => {
  it('stacks colliding keys in their slot in the order they came', () => {
    const state = stateOf('chaining', KEYS.length)

    expect(state.placed.filter((one) => one.bucket === 2)).toEqual([
      { key: 'lemon', bucket: 2, level: 0 },
      { key: 'kiwi', bucket: 2, level: 1 },
      { key: 'pear', bucket: 2, level: 2 },
    ])
    expect(chainOf(state, 2)).toBe(3)
    expect(readoutOf(state)).toBe('pear → 2번 칸 · 체인 3')
  })

  it('reads an empty table', () => {
    expect(readoutOf(stateOf('chaining', 0))).toBe('빈 테이블 · 칸 8개')
  })
})

describe('linear probing', () => {
  it('walks right from the home slot to the first free one', () => {
    const state = stateOf('probing', KEYS.length)

    expect(state.last).toEqual({
      key: 'pear',
      home: 2,
      tried: [2, 3, 4, 5, 6],
      bucket: 6,
      level: 0,
    })
    expect(state.placed.map((one) => one.bucket)).toEqual([1, 5, 2, 4, 3, 6])
    expect(readoutOf(state)).toBe('pear → 6번 칸 · 5칸 확인')
  })
})

describe('load factor', () => {
  it('doubles 4 slots to 8 once the fourth key passes 0.75', () => {
    expect(readoutOf(stateOf('load', 3))).toBe('키 3 / 칸 4 · 적재율 0.75')
    const resized = stateOf('load', 4)

    expect(resized.slots).toBe(8)
    expect(resized.resize).toEqual({
      from: 4,
      to: 8,
      moves: [
        { key: 'melon', from: 0, to: 4, level: 0 },
        { key: 'fig', from: 1, to: 5, level: 0 },
      ],
    })
    expect(readoutOf(resized)).toBe('키 4 / 칸 8 · 적재율 0.50')
    expect(stateOf('load', 5).resize).toBeNull()
    expect(readoutOf(stateOf('load', 6))).toBe('키 6 / 칸 8 · 적재율 0.75')
  })
})

describe('parts', () => {
  it('falls back to chaining for anything unknown', () => {
    expect(partOf('probing')).toBe('probing')
    expect(partOf('nope')).toBe('chaining')
    expect(partOf(undefined)).toBe('chaining')
  })

  it('captions each part with the model’s numbers', () => {
    expect(captionOf('chaining')).toContain('apple 1, fig 5, lemon 2, melon 4, kiwi 2, pear 2')
    expect(captionOf('probing')).toContain('2번 칸에서 시작해 5칸을 확인하고 6번 칸')
    expect(captionOf('load')).toContain('melon 0 → 4, fig 1 → 5')
  })
})
