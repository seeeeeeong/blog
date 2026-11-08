import { describe, expect, it } from 'vitest'
import { answerList, judge, normalizeAnswer } from '@/features/posts/utils/answer'

describe('answerList', () => {
  it('splits the accepted answers on bars, keeping their order', () => {
    expect(answerList(' 10 | 열 ||')).toEqual(['10', '열'])
  })

  it('has none without the attribute', () => {
    expect(answerList(undefined)).toEqual([])
  })
})

describe('normalizeAnswer', () => {
  it('ignores width, case, spacing and closing punctuation', () => {
    expect(normalizeAnswer(' 이진 탐색. ')).toBe('이진탐색')
    expect(normalizeAnswer('ＴＣＰ')).toBe('tcp')
    expect(normalizeAnswer('１０​')).toBe('10')
    expect(normalizeAnswer('−3')).toBe('-3')
  })
})

describe('judge', () => {
  it.each([
    ['１０', ['10']],
    ['10개', ['10']],
    ['정답은 10', ['10']],
    ['1,000', ['1000']],
    ['1000', ['1,000']],
    ['스택이요', ['스택']],
    ['tcp', ['TCP']],
    ['이진 탐색입니다', ['이진탐색']],
    ['열', ['10', '열']],
  ])('takes %s for %j', (input, answers) => {
    expect(judge(input, answers)).toBe('right')
  })

  it('tells a wrong answer, even one that starts like the right one', () => {
    expect(judge('1010', ['10'])).toBe('wrong')
    expect(judge('큐', ['스택'])).toBe('wrong')
  })

  it('asks for a number rather than counting an answer without one as wrong', () => {
    expect(judge('모르겠다', ['10'])).toBe('needs-number')
  })

  it('counts a word as wrong when a word is accepted too', () => {
    expect(judge('스물', ['10', '열'])).toBe('wrong')
  })

  it('ignores an answer of spaces', () => {
    expect(judge('   ', ['10'])).toBe('empty')
  })
})
