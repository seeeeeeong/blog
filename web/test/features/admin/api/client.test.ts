import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AdminApiError,
  adminGet,
  adminWrite,
  messageOf,
  readCookie,
} from '@/features/admin/api/client'

type Call = [string, RequestInit]

function stubFetch(answer: (path: string) => Response) {
  const fetch = vi.fn(async (path: string, _init: RequestInit) => answer(path))
  vi.stubGlobal('fetch', fetch)
  return fetch
}

const headersOf = (call: Call | undefined) => (call?.[1].headers ?? {}) as Record<string, string>

afterEach(() => vi.unstubAllGlobals())

describe('readCookie', () => {
  it('finds a cookie among others and decodes it', () => {
    expect(readCookie('theme=dark; XSRF-TOKEN=a%2Bb; x=1', 'XSRF-TOKEN')).toBe('a+b')
    expect(readCookie('theme=dark', 'XSRF-TOKEN')).toBeUndefined()
    expect(readCookie('NOT-XSRF-TOKEN=1', 'XSRF-TOKEN')).toBeUndefined()
  })
})

describe('adminGet', () => {
  it('reads its own origin with the session cookie, never from a cache', async () => {
    const fetch = stubFetch(() => Response.json([{ id: '1' }]))

    await expect(adminGet('/api/admin/posts')).resolves.toEqual([{ id: '1' }])

    const [path, init] = fetch.mock.calls[0] as Call
    expect(path).toBe('/api/admin/posts')
    expect(init).toMatchObject({ method: 'GET', credentials: 'same-origin', cache: 'no-store' })
    expect(headersOf(fetch.mock.calls[0] as Call)).not.toHaveProperty('X-XSRF-TOKEN')
  })
})

describe('adminWrite', () => {
  it('sends the XSRF-TOKEN cookie back as the X-XSRF-TOKEN header, with a JSON body', async () => {
    vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=from-cookie' })
    const fetch = stubFetch(() => Response.json({ id: '1' }, { status: 201 }))

    await adminWrite('POST', '/api/admin/posts', { title: 'TCP' })

    expect(fetch).toHaveBeenCalledTimes(1)
    const call = fetch.mock.calls[0] as Call
    expect(call[1]).toMatchObject({ method: 'POST', body: '{"title":"TCP"}' })
    expect(headersOf(call)).toEqual({
      'X-XSRF-TOKEN': 'from-cookie',
      'Content-Type': 'application/json',
    })
  })

  it('asks the api for a token first when the cookie is not set yet', async () => {
    vi.stubGlobal('document', { cookie: '' })
    const fetch = stubFetch((path) =>
      path === '/api/auth/csrf'
        ? Response.json({ headerName: 'X-XSRF-TOKEN', token: 'fresh' })
        : new Response(null, { status: 204 }),
    )

    await expect(adminWrite('POST', '/api/auth/logout')).resolves.toBeUndefined()

    expect(fetch.mock.calls.map(([path]) => path)).toEqual(['/api/auth/csrf', '/api/auth/logout'])
    expect(headersOf(fetch.mock.calls[1] as Call)).toEqual({ 'X-XSRF-TOKEN': 'fresh' })
  })
})

describe('errors', () => {
  it("carries the api's code and Korean message", async () => {
    vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=t' })
    stubFetch(() =>
      Response.json(
        { code: 'post.edit_conflict', message: '다른 곳에서 먼저 고친 글입니다.' },
        { status: 409 },
      ),
    )

    const failure = await adminWrite('PUT', '/api/admin/posts/1', {}).catch((e: unknown) => e)

    expect(failure).toBeInstanceOf(AdminApiError)
    expect(failure).toMatchObject({ status: 409, code: 'post.edit_conflict' })
    expect(messageOf(failure)).toBe('다른 곳에서 먼저 고친 글입니다.')
  })

  it('falls back to a message of its own when the answer is not the api error', async () => {
    stubFetch(() => new Response('<html>Bad gateway</html>', { status: 502 }))

    const failure = await adminGet('/api/admin/posts').catch((e: unknown) => e)

    expect(failure).toMatchObject({ status: 502, code: 'common.unknown' })
    expect(messageOf(failure)).toBe('요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요')
    expect(messageOf(new TypeError('fetch failed'))).toBe(
      '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요',
    )
  })
})
