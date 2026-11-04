import { describe, expect, it } from 'vitest'
import { partsOf, replaced, selectionIn } from '@/features/admin/utils/selection'

const BODY = '가나 다라 가나'

describe('partsOf', () => {
  it('splits the body around the selection', () => {
    expect(partsOf(BODY, { start: 3, end: 5 })).toEqual({
      before: '가나 ',
      selected: '다라',
      after: ' 가나',
    })
  })

  it('has nothing without a selection', () => {
    expect(partsOf(BODY, null)).toEqual({ before: '', selected: '', after: '' })
  })
})

describe('replaced', () => {
  it('replaces by offset, so the same words elsewhere stay', () => {
    expect(replaced(BODY, { start: 6, end: 8 }, '마바')).toBe('가나 다라 마바')
  })

  it('takes a replacement with $ as it is', () => {
    expect(replaced(BODY, { start: 3, end: 5 }, "$&$'")).toBe("가나 $&$' 가나")
  })
})

describe('selectionIn', () => {
  it('gives the range of a selection with text', () => {
    expect(selectionIn(BODY, 3, 5)).toEqual({ start: 3, end: 5 })
  })

  it('gives nothing for no selection or only white space', () => {
    expect(selectionIn(BODY, 3, 3)).toBeNull()
    expect(selectionIn(BODY, 2, 3)).toBeNull()
  })
})
