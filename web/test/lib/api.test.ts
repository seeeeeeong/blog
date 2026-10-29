import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiGet } from '@/lib/api'
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
})
