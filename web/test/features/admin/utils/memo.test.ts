import { describe, expect, it } from 'vitest'
import {
  asksBeforeReplacing,
  canDraft,
  checkLabel,
  MEMO_MAX,
  memoStep,
  stageLabel,
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

describe('asksBeforeReplacing', () => {
  it('asks only when the body has text to lose', () => {
    expect(asksBeforeReplacing('## 왜 세 번인가')).toBe(true)
    expect(asksBeforeReplacing('')).toBe(false)
    expect(asksBeforeReplacing('\n  \n')).toBe(false)
  })
})

describe('stageLabel', () => {
  it('names the steps it knows, and nothing for the rest', () => {
    expect(stageLabel('reviewing')).toContain('검토')
    expect(stageLabel('revising')).toContain('고치는')
    expect(stageLabel('other')).toBeNull()
    expect(stageLabel(undefined)).toBeNull()
  })
})

describe('checkLabel', () => {
  it('says what a machine check found', () => {
    expect(checkLabel('MEMO_NUMBER_MISSING')).toContain('숫자')
  })
})

describe('memoStep', () => {
  it('shows the memo before a draft and after one fails', () => {
    expect(memoStep({ state: 'idle' })).toBe('memo')
    expect(memoStep({ state: 'failed', message: '실패' })).toBe('memo')
  })

  it('shows the draft as it comes, then asks to replace the body with it', () => {
    expect(memoStep({ state: 'streaming', text: '## T' })).toBe('streaming')
    expect(memoStep({ state: 'done', text: '## TCP', result: DRAFT })).toBe('confirm')
  })
})
