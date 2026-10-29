import { describe, expect, it } from 'vitest'
import {
  type Conversation,
  type ConversationAction,
  converse,
  historyOf,
  isAsking,
  postSlugOf,
  requestOf,
  sourceHref,
  startConversation,
} from '@/features/ask/utils/conversation'

const run = (actions: ConversationAction[], start: Conversation = startConversation('/')) =>
  actions.reduce(converse, start)

const answered = (question: string, answer: string, id = 'c-1'): ConversationAction[] => [
  { type: 'ask', question },
  { type: 'sources', posts: [{ slug: 'tcp', title: 'TCP' }] },
  { type: 'text', text: answer },
  { type: 'done', grounded: true, conversationId: id },
]

describe('converse', () => {
  it('streams an answer into the question it belongs to', () => {
    const waiting = run([{ type: 'ask', question: 'TCP?' }])
    expect(isAsking(waiting)).toBe(true)
    expect(waiting.exchanges[0]).toMatchObject({ question: 'TCP?', status: 'waiting' })

    const state = run(
      [
        { type: 'sources', posts: [{ slug: 'tcp', title: 'TCP' }] },
        { type: 'text', text: '세 번' },
        { type: 'text', text: '의 교환' },
        { type: 'done', grounded: true, conversationId: 'c-1' },
      ],
      waiting,
    )

    expect(state.exchanges[0]).toMatchObject({
      answer: '세 번의 교환',
      sources: [{ slug: 'tcp', title: 'TCP' }],
      grounded: true,
      status: 'done',
    })
    expect(state.conversationId).toBe('c-1')
    expect(isAsking(state)).toBe(false)
  })

  it('marks an answer with no sources as not from the posts before it is done', () => {
    const state = run([
      { type: 'ask', question: '날씨?' },
      { type: 'sources', posts: [] },
      { type: 'text', text: '이 내용은 글에 없어요.' },
    ])

    expect(state.exchanges[0]).toMatchObject({ grounded: false, status: 'streaming' })
  })

  it('asks nothing new while an answer is in flight', () => {
    const state = run([
      { type: 'ask', question: 'a' },
      { type: 'ask', question: 'b' },
    ])

    expect(state.exchanges.map((exchange) => exchange.question)).toEqual(['a'])
  })

  it('keeps the partial answer of a stopped or failed question', () => {
    const stopped = run([
      { type: 'ask', question: 'a' },
      { type: 'text', text: '반' },
      { type: 'stop' },
    ])
    expect(stopped.exchanges[0]).toMatchObject({ answer: '반', status: 'stopped' })

    const failed = run([
      { type: 'ask', question: 'a' },
      { type: 'fail', message: '오늘 질문을 모두 썼습니다' },
    ])
    expect(failed.exchanges[0]).toMatchObject({
      status: 'failed',
      error: '오늘 질문을 모두 썼습니다',
    })
  })

  it('ignores events once no answer is in flight', () => {
    const done = run(answered('a', 'b'))

    expect(run([{ type: 'text', text: 'late' }, { type: 'stop' }], done)).toBe(done)
  })

  it('starts over on another page, and keeps the conversation on the same one', () => {
    const state = run(answered('a', 'b'), startConversation('/posts/tcp'))

    expect(converse(state, { type: 'reset', path: '/posts/tcp' })).toBe(state)
    expect(converse(state, { type: 'reset', path: '/' })).toEqual(startConversation('/'))
  })
})

describe('historyOf', () => {
  it('keeps the latest six turns of the finished answers, oldest first', () => {
    const state = run([
      ...answered('q1', 'a1'),
      ...answered('q2', 'a2'),
      ...answered('q3', 'a3'),
      ...answered('q4', 'a4'),
    ])

    expect(historyOf(state)).toEqual([
      { role: 'user', content: 'q2' },
      { role: 'assistant', content: 'a2' },
      { role: 'user', content: 'q3' },
      { role: 'assistant', content: 'a3' },
      { role: 'user', content: 'q4' },
      { role: 'assistant', content: 'a4' },
    ])
  })

  it('leaves out a question whose answer failed or was stopped', () => {
    const state = run([
      ...answered('q1', 'a1'),
      { type: 'ask', question: 'q2' },
      { type: 'fail', message: 'x' },
      { type: 'ask', question: 'q3' },
      { type: 'text', text: 'half' },
      { type: 'stop' },
    ])

    expect(historyOf(state)).toEqual([
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'a1' },
    ])
  })
})

describe('requestOf', () => {
  it('sends the first question with only the post it is on', () => {
    expect(requestOf(startConversation('/posts/tcp'), 'TCP?', 'tcp')).toEqual({
      postSlug: 'tcp',
      question: 'TCP?',
      history: [],
    })
  })

  it('sends the next one with the history and the conversation, and without a post off one', () => {
    const state = run(answered('q1', 'a1', 'c-9'))

    expect(requestOf(state, 'q2', undefined)).toEqual({
      question: 'q2',
      history: [
        { role: 'user', content: 'q1' },
        { role: 'assistant', content: 'a1' },
      ],
      conversationId: 'c-9',
    })
  })
})

describe('postSlugOf', () => {
  it('reads the slug of a post page', () => {
    expect(postSlugOf('/posts/tcp-handshake')).toBe('tcp-handshake')
    expect(postSlugOf('/posts/tcp-handshake/')).toBe('tcp-handshake')
  })

  it('finds none elsewhere', () => {
    expect(postSlugOf('/')).toBeUndefined()
    expect(postSlugOf('/books/1')).toBeUndefined()
    expect(postSlugOf('/posts/')).toBeUndefined()
    expect(postSlugOf('/posts/a/b')).toBeUndefined()
    expect(postSlugOf(null)).toBeUndefined()
  })
})

describe('sourceHref', () => {
  it('links the post a source names', () => {
    expect(sourceHref({ slug: 'tcp-handshake', title: 'TCP' })).toBe('/posts/tcp-handshake')
  })
})
