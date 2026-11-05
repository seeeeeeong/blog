import { describe, expect, it } from 'vitest'
import {
  applyChanges,
  changedWords,
  changeIds,
  compareBodies,
} from '@/features/admin/utils/compare'

describe('compareBodies', () => {
  it('finds nothing to change between equal bodies', () => {
    expect(compareBodies('a\nb', 'a\nb')).toEqual([{ kind: 'same', id: 0, lines: ['a', 'b'] }])
  })

  it('gathers neighbouring lines into one change, between what stays', () => {
    expect(compareBodies('a\nb\nc\nd', 'a\nB\nC\nd')).toEqual([
      { kind: 'same', id: 0, lines: ['a'] },
      { kind: 'change', id: 0, before: ['b', 'c'], after: ['B', 'C'] },
      { kind: 'same', id: 1, lines: ['d'] },
    ])
  })

  it('numbers separate changes in order', () => {
    const blocks = compareBodies('a\nb\nc', 'A\nb\nC')

    expect(changeIds(blocks)).toEqual([0, 1])
  })

  it('treats an empty body as nothing, so a draft is one addition', () => {
    expect(compareBodies('', 'a\nb')).toEqual([
      { kind: 'change', id: 0, before: [], after: ['a', 'b'] },
    ])
  })

  it('keeps a shared line in place when lines are added around it', () => {
    expect(compareBodies('b', 'a\nb\nc')).toEqual([
      { kind: 'change', id: 0, before: [], after: ['a'] },
      { kind: 'same', id: 0, lines: ['b'] },
      { kind: 'change', id: 1, before: [], after: ['c'] },
    ])
  })
})

describe('applyChanges', () => {
  const before = '## 제목\n\n첫 문단\n\n둘째 문단\n'
  const after = '## 다른 제목\n\n첫 문단\n\n고친 둘째 문단\n'
  const blocks = compareBodies(before, after)

  it('gives the draft when every change is taken', () => {
    expect(applyChanges(blocks, new Set(changeIds(blocks)))).toBe(after)
  })

  it('gives the body as it was when none is', () => {
    expect(applyChanges(blocks, new Set())).toBe(before)
  })

  it('takes only the chosen change', () => {
    expect(applyChanges(blocks, new Set([1]))).toBe('## 제목\n\n첫 문단\n\n고친 둘째 문단\n')
  })
})

describe('changedWords', () => {
  it('marks only the words that differ on each side, each part with its offset', () => {
    expect(changedWords('심어지는 게 아닙니다', '심어지는 코드가 아닙니다')).toEqual({
      before: [
        { start: 0, text: '심어지는 ', changed: false },
        { start: 5, text: '게', changed: true },
        { start: 6, text: ' 아닙니다', changed: false },
      ],
      after: [
        { start: 0, text: '심어지는 ', changed: false },
        { start: 5, text: '코드가', changed: true },
        { start: 8, text: ' 아닙니다', changed: false },
      ],
    })
  })

  it('shows a run of changed words as one highlight, spaces included', () => {
    const { after } = changedWords('가 나 다 라', '가 마 바 라')

    expect(after).toEqual([
      { start: 0, text: '가 ', changed: false },
      { start: 2, text: '마 바', changed: true },
      { start: 5, text: ' 라', changed: false },
    ])
  })

  it('marks nothing when one side is empty, as the whole of it is the change', () => {
    expect(changedWords('', '새 문단').after).toEqual([
      { start: 0, text: '새 문단', changed: false },
    ])
  })

  it('leaves very long sides unmarked, rather than comparing every pair of words', () => {
    const long = Array.from({ length: 1_500 }, (_, index) => `w${index}`).join(' ')

    expect(changedWords(long, `${long} 끝`).after).toEqual([
      { start: 0, text: `${long} 끝`, changed: false },
    ])
  })

  it('puts the text back together on each side', () => {
    const before = '첫 줄\n둘째 줄  끝'
    const after = '첫째 줄\n둘째 줄 끝'
    const parts = changedWords(before, after)

    expect(parts.before.map((part) => part.text).join('')).toBe(before)
    expect(parts.after.map((part) => part.text).join('')).toBe(after)
  })
})
