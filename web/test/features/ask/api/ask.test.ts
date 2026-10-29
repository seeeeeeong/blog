import { afterEach, describe, expect, it, vi } from 'vitest'
import { AskError, askQuestion, messageOf } from '@/features/ask/api/ask'
import type { AskEvent } from '@/features/ask/api/types'

type Call = [string, RequestInit]

function streamOf(...chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
}

function stubApi(answer: () => Response) {
  const fetch = vi.fn(async (path: string, _init: RequestInit) =>
    path === '/api/auth/csrf'
      ? Response.json({ headerName: 'X-XSRF-TOKEN', token: 'csrf-1' })
      : answer(),
  )
  vi.stubGlobal('fetch', fetch)
  return fetch
}

const sse = (...chunks: string[]) =>
  new Response(streamOf(...chunks), { headers: { 'Content-Type': 'text/event-stream' } })

async function collect(signal = new AbortController().signal) {
  const events: AskEvent[] = []
  await askQuestion({ question: 'TCP?', history: [] }, signal, (event) => events.push(event))
  return events
}

afterEach(() => vi.unstubAllGlobals())

describe('askQuestion', () => {
  it('fetches the CSRF token first and sends it back with the question', async () => {
    const fetch = stubApi(() =>
      sse('event: done\ndata: {"grounded":true,"conversationId":"c-1"}\n\n'),
    )

    await collect()

    const [csrf, ask] = fetch.mock.calls as Call[]
    expect(csrf?.[0]).toBe('/api/auth/csrf')
    expect(ask?.[0]).toBe('/api/ask')
    expect(ask?.[1]).toMatchObject({
      method: 'POST',
      credentials: 'same-origin',
      body: '{"question":"TCP?","history":[]}',
      headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': 'csrf-1' },
    })
  })

  it('hands on each event as it arrives, across chunks', async () => {
    stubApi(() =>
      sse(
        ': open\n\nevent: sources\ndata: {"posts":[{"slug":"tcp","title":"TCP"}]}\n\nevent: te',
        'xt\ndata: {"text":"세 번"}\n\n: ping\n\nevent: text\ndata: {"text":"의 교환"}\n\n',
        'event: done\ndata: {"grounded":true,"conversationId":"c-1"}\n\n',
      ),
    )

    expect(await collect()).toEqual([
      { type: 'sources', posts: [{ slug: 'tcp', title: 'TCP' }] },
      { type: 'text', text: '세 번' },
      { type: 'text', text: '의 교환' },
      { type: 'done', grounded: true, conversationId: 'c-1' },
    ])
  })

  it('rejects with the api message for a refusal before the stream', async () => {
    stubApi(() =>
      Response.json(
        { code: 'ask.daily_limit_reached', message: '오늘 질문을 모두 썼습니다' },
        { status: 429 },
      ),
    )

    const error = await collect().catch((thrown: unknown) => thrown)

    expect(error).toBeInstanceOf(AskError)
    expect(error).toMatchObject({ code: 'ask.daily_limit_reached' })
    expect(messageOf(error)).toBe('오늘 질문을 모두 썼습니다')
  })

  it('rejects with the message of an error event, after the text before it', async () => {
    stubApi(() =>
      sse(
        'event: text\ndata: {"text":"반"}\n\n',
        'event: error\ndata: {"code":"llm.incomplete","message":"답변이 끊겼습니다"}\n\n',
      ),
    )
    const events: AskEvent[] = []

    const error = await askQuestion(
      { question: 'TCP?', history: [] },
      new AbortController().signal,
      (event) => events.push(event),
    ).catch((thrown: unknown) => thrown)

    expect(events).toEqual([{ type: 'text', text: '반' }])
    expect(messageOf(error)).toBe('답변이 끊겼습니다')
  })

  it('rejects when the stream ends without done', async () => {
    stubApi(() => sse('event: text\ndata: {"text":"반"}\n\n'))

    await expect(collect()).rejects.toMatchObject({ code: 'ask.incomplete' })
  })

  it('falls back to its own message for an answer that is not the api error', async () => {
    stubApi(() => new Response('Bad Gateway', { status: 502 }))

    const error = await collect().catch((thrown: unknown) => thrown)

    expect(messageOf(error)).toBe('답변을 받지 못했습니다. 잠시 후 다시 시도해 주세요')
    expect(messageOf(new TypeError('fetch failed'))).toBe(
      '답변을 받지 못했습니다. 잠시 후 다시 시도해 주세요',
    )
  })
})
