import { describe, expect, it } from 'vitest'
import {
  IDLE,
  type StreamAction,
  type StreamState,
  streamReducer,
} from '@/features/admin/utils/stream'

type Result = { bodyMdx: string }

const run = (actions: StreamAction<Result>[], from: StreamState<Result> = IDLE) =>
  actions.reduce(streamReducer<Result>, from)

describe('streamReducer', () => {
  it('gathers the text as it comes, then keeps it beside the result', () => {
    const state = run([
      { type: 'start' },
      { type: 'text', text: '세 번' },
      { type: 'text', text: ' 악수' },
      { type: 'done', result: { bodyMdx: '세 번 악수' } },
    ])

    expect(state).toEqual({ state: 'done', text: '세 번 악수', result: { bodyMdx: '세 번 악수' } })
  })

  it('drops the text so far when the stream fails', () => {
    const state = run([
      { type: 'start' },
      { type: 'text', text: '반쯤' },
      { type: 'fail', message: '실패' },
    ])

    expect(state).toEqual({ state: 'failed', message: '실패' })
  })

  it('starts over from any state', () => {
    expect(run([{ type: 'start' }], { state: 'failed', message: '실패' })).toEqual({
      state: 'streaming',
      text: '',
    })
    expect(run([{ type: 'start' }, { type: 'text', text: 'a' }, { type: 'reset' }])).toBe(IDLE)
  })

  it('ignores what arrives late from a stream no longer in flight', () => {
    const cancelled = run([{ type: 'start' }, { type: 'text', text: 'a' }, { type: 'reset' }])

    expect(run([{ type: 'text', text: 'b' }], cancelled)).toBe(IDLE)
    expect(run([{ type: 'done', result: { bodyMdx: 'b' } }], cancelled)).toBe(IDLE)
    expect(run([{ type: 'fail', message: '실패' }], cancelled)).toBe(IDLE)
  })
})
