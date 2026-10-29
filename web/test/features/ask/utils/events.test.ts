import { describe, expect, it } from 'vitest'
import { askEventOf } from '@/features/ask/utils/events'

describe('askEventOf', () => {
  it('reads the sources, keeping only well-formed posts', () => {
    const data = JSON.stringify({ posts: [{ slug: 'tcp', title: 'TCP' }, { slug: 1 }] })

    expect(askEventOf({ event: 'sources', data })).toEqual({
      type: 'sources',
      posts: [{ slug: 'tcp', title: 'TCP' }],
    })
  })

  it('reads a piece of text and the end of the answer', () => {
    expect(askEventOf({ event: 'text', data: '{"text":"줄\\n바꿈"}' })).toEqual({
      type: 'text',
      text: '줄\n바꿈',
    })
    expect(
      askEventOf({ event: 'done', data: '{"grounded":false,"conversationId":"c-1"}' }),
    ).toEqual({ type: 'done', grounded: false, conversationId: 'c-1' })
  })

  it('reads an error with its code and Korean message', () => {
    expect(
      askEventOf({ event: 'error', data: '{"code":"llm.incomplete","message":"끊겼습니다"}' }),
    ).toEqual({ type: 'error', code: 'llm.incomplete', message: '끊겼습니다' })
  })

  it('ignores an unknown event and data that is not a JSON object', () => {
    expect(askEventOf({ event: 'message', data: '{}' })).toBeUndefined()
    expect(askEventOf({ event: 'text', data: 'not json' })).toBeUndefined()
    expect(askEventOf({ event: 'text', data: '"text"' })).toBeUndefined()
    expect(askEventOf({ event: 'text', data: '{"text":1}' })).toBeUndefined()
  })
})
