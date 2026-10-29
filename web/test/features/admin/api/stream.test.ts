import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminApiError } from '@/features/admin/api/client'
import { adminStream, type StreamEvent } from '@/features/admin/api/stream'

let fetch: ReturnType<typeof vi.fn>

function answer(response: () => Response) {
  fetch = vi.fn(async () => response())
  vi.stubGlobal('fetch', fetch)
}

const events = (body: string) =>
  new Response(body, { headers: { 'Content-Type': 'text/event-stream' } })

async function collect<T>(stream: AsyncGenerator<StreamEvent<T>>) {
  const seen: StreamEvent<T>[] = []
  for await (const event of stream) seen.push(event)
  return seen
}

beforeEach(() => vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=t' }))

afterEach(() => vi.unstubAllGlobals())

describe('adminStream', () => {
  it('posts with the CSRF header and yields the text, then the result', async () => {
    answer(() =>
      events(
        ': open\n\nevent: text\ndata: {"text":"세 번"}\n\n: ping\n\nevent: text\ndata: {"text":" 악수"}\n\nevent: done\ndata: {"bodyMdx":"세 번 악수"}\n\n',
      ),
    )
    const abort = new AbortController()

    const seen = await collect(
      adminStream('/api/admin/posts/1/draft', { memo: 'TCP' }, abort.signal),
    )

    expect(seen).toEqual([
      { type: 'text', text: '세 번' },
      { type: 'text', text: ' 악수' },
      { type: 'done', result: { bodyMdx: '세 번 악수' } },
    ])
    const [path, init] = fetch.mock.calls[0] as [string, RequestInit]
    expect(path).toBe('/api/admin/posts/1/draft')
    expect(init).toMatchObject({
      method: 'POST',
      body: '{"memo":"TCP"}',
      credentials: 'same-origin',
      signal: abort.signal,
    })
    expect(init.headers).toEqual({
      'X-XSRF-TOKEN': 't',
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    })
  })

  it('sends no body and no content type when there is nothing to send', async () => {
    answer(() => events('event: done\ndata: {}\n\n'))

    await collect(adminStream('/api/admin/sections/1/note', undefined))

    const init = fetch.mock.calls[0]?.[1] as RequestInit
    expect(init.body).toBeUndefined()
    expect(init.headers).not.toHaveProperty('Content-Type')
  })

  it("throws the api's refusal before the stream opens", async () => {
    answer(() =>
      Response.json(
        { code: 'llm.monthly_cap_reached', message: '이번 달 AI 한도를 다 썼습니다' },
        { status: 429 },
      ),
    )

    const failure = collect(adminStream('/api/admin/sections/1/note', undefined))

    await expect(failure).rejects.toEqual(
      new AdminApiError(429, 'llm.monthly_cap_reached', '이번 달 AI 한도를 다 썼습니다'),
    )
    await expect(failure).rejects.toMatchObject({ status: 429, code: 'llm.monthly_cap_reached' })
  })

  it('throws an error event, after the text that came before it', async () => {
    answer(() =>
      events(
        'event: text\ndata: {"text":"반쯤"}\n\nevent: error\ndata: {"code":"llm.incomplete","message":"AI 가 글을 끝맺지 못했습니다"}\n\n',
      ),
    )
    const seen: StreamEvent<unknown>[] = []

    const failure = (async () => {
      for await (const event of adminStream('/api/admin/sections/1/note', undefined)) {
        seen.push(event)
      }
    })()

    await expect(failure).rejects.toMatchObject({
      code: 'llm.incomplete',
      message: 'AI 가 글을 끝맺지 못했습니다',
    })
    expect(seen).toEqual([{ type: 'text', text: '반쯤' }])
  })

  it('throws when the stream ends without done, as when the line drops', async () => {
    answer(() => events('event: text\ndata: {"text":"반쯤"}\n\n'))

    await expect(
      collect(adminStream('/api/admin/sections/1/note', undefined)),
    ).rejects.toMatchObject({ code: 'common.stream_cut' })
  })
})
