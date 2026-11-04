import { describe, expect, it } from 'vitest'
import { applyChanges, changeIds, compareBodies } from '@/features/admin/utils/compare'

describe('compareBodies', () => {
  it('finds nothing to change between equal bodies', () => {
    expect(compareBodies('a\nb', 'a\nb')).toEqual([{ kind: 'same', lines: ['a', 'b'] }])
  })

  it('gathers neighbouring lines into one change, between what stays', () => {
    expect(compareBodies('a\nb\nc\nd', 'a\nB\nC\nd')).toEqual([
      { kind: 'same', lines: ['a'] },
      { kind: 'change', id: 0, before: ['b', 'c'], after: ['B', 'C'] },
      { kind: 'same', lines: ['d'] },
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
      { kind: 'same', lines: ['b'] },
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
