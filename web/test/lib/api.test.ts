import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiGet } from '@/lib/api'
import { API_URL } from '@/lib/api-url'

afterEach(() => vi.unstubAllGlobals())

describe('apiGet', () => {
  it('reads the api directly, never from a cache', async () => {
    const fetch = vi.fn(async () => Response.json([{ slug: 'os' }]))
    vi.stubGlobal('fetch', fetch)

    await expect(apiGet('/api/topics')).resolves.toEqual([{ slug: 'os' }])
    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/topics`,
      expect.objectContaining({ cache: 'no-store' }),
    )
  })

  it('fails on an error status', async () => {
    vi.stubGlobal('fetch', async () => new Response(null, { status: 503 }))

    await expect(apiGet('/api/posts')).rejects.toThrow('GET /api/posts answered 503')
  })

  it('tells the status of a failure, so a caller can tell a missing post from an outage', async () => {
    vi.stubGlobal('fetch', async () => new Response(null, { status: 404 }))

    const failure = await apiGet('/api/posts/missing').catch((error: unknown) => error)

    expect(failure).toBeInstanceOf(ApiError)
    expect(failure).toMatchObject({ path: '/api/posts/missing', status: 404 })
  })
})
