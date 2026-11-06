import { describe, expect, it } from 'vitest'
import {
  canDraft,
  checkLabel,
  MEMO_MAX,
  memoProblem,
  memoStep,
  memoView,
  stageLabel,
  stageStep,
} from '@/features/admin/utils/memo'

const DRAFT = {
  bodyMdx: '## TCP',
  review: null,
  revised: false,
  checks: [],
  model: 'm',
  inputTokens: 1,
  outputTokens: 1,
}

describe('canDraft', () => {
  it('takes a memo with text, up to the length the api accepts', () => {
    expect(canDraft('TCP 3-way')).toBe(true)
    expect(canDraft('a'.repeat(MEMO_MAX))).toBe(true)
  })

  it('refuses a blank memo or a longer one', () => {
    expect(canDraft('')).toBe(false)
    expect(canDraft(' \n\t')).toBe(false)
    expect(canDraft('a'.repeat(MEMO_MAX + 1))).toBe(false)
  })
})

describe('stageLabel', () => {
  it('names the step for a screen reader, without a promise of how long it takes', () => {
    expect(stageLabel('writing')).toBe('글을 쓰는 중')
    expect(stageLabel('reviewing')).toBe('메모와 대조해 검토하는 중')
    expect(stageLabel('revising')).toBe('검토에서 나온 문제를 고치는 중')
    expect(stageLabel(undefined)).toBe('글을 쓰는 중')
  })
})

describe('stageStep', () => {
  it('places each step on the progress, a step it does not know at the start', () => {
    expect(stageStep('writing')).toBe(0)
    expect(stageStep('reviewing')).toBe(1)
    expect(stageStep('revising')).toBe(2)
    expect(stageStep('other')).toBe(0)
    expect(stageStep(undefined)).toBe(0)
  })
})

describe('checkLabel', () => {
  it('says what a machine check found', () => {
    expect(checkLabel('MEMO_NUMBER_MISSING')).toContain('숫자')
  })
})

describe('memoView', () => {
  it('shows only where the run is while it lasts, never the text coming in', () => {
    const view = memoView({ state: 'streaming', text: '## T', stage: 'reviewing' })

    expect(view).toEqual({
      generating: { step: 1, label: '메모와 대조해 검토하는 중' },
      draft: null,
      failure: null,
    })
    expect(JSON.stringify(view)).not.toContain('## T')
  })

  it('is not generating once the run ends', () => {
    expect(memoView({ state: 'idle' }).generating).toBeNull()
  })

  it('gives the finished draft, or what went wrong', () => {
    expect(memoView({ state: 'done', text: '## T', result: DRAFT }).draft).toBe(DRAFT)
    expect(memoView({ state: 'failed', message: '실패' }).failure).toBe('실패')
  })
})

describe('memoProblem', () => {
  it('has nothing to say about a memo that fits', () => {
    expect(memoProblem('메모', null, false)).toBeNull()
  })

  it('says why a body too long for a memo cannot be polished', () => {
    expect(memoProblem('a'.repeat(MEMO_MAX + 1), null, false)).toContain('20,000자까지')
  })

  it('passes on a failure, and puts a changed body first', () => {
    expect(memoProblem('메모', '실패', false)).toBe('실패')
    expect(memoProblem('메모', '실패', true)).toContain('본문이 바뀌었습니다')
  })
})

describe('memoStep', () => {
  it('shows the memo before a draft and after one fails', () => {
    expect(memoStep({ state: 'idle' })).toBe('memo')
    expect(memoStep({ state: 'failed', message: '실패' })).toBe('memo')
  })

  it('shows the draft as it comes, then lets the admin choose what to apply', () => {
    expect(memoStep({ state: 'streaming', text: '## T' })).toBe('streaming')
    expect(memoStep({ state: 'done', text: '## TCP', result: DRAFT })).toBe('confirm')
  })
})
