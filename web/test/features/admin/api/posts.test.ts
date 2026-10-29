import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createPost,
  draftFromMemo,
  getPost,
  publishPost,
  savePost,
} from '@/features/admin/api/posts'

const REQUEST = {
  version: 3,
  title: 'TCP',
  slug: 'tcp',
  topicSlug: 'network',
  position: 1,
  summary: 's',
  bodyMdx: 'b',
}

let fetch: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=t' })
  fetch = vi.fn(async () => Response.json({}))
  vi.stubGlobal('fetch', fetch)
})

afterEach(() => vi.unstubAllGlobals())

const sent = () => fetch.mock.calls.map(([path, init]) => [path, (init as RequestInit).method])

describe('admin posts', () => {
  it('reads one post by its id', async () => {
    await getPost('0199-a')

    expect(sent()).toEqual([['/api/admin/posts/0199-a', 'GET']])
  })

  it('creates, saves in place and publishes at their own endpoints', async () => {
    await createPost({ title: 'TCP', topicSlug: 'network' })
    await savePost('0199-a', REQUEST)
    await publishPost('0199-a', REQUEST)

    expect(sent()).toEqual([
      ['/api/admin/posts', 'POST'],
      ['/api/admin/posts/0199-a', 'PUT'],
      ['/api/admin/posts/0199-a/publish', 'POST'],
    ])
    expect(JSON.parse(fetch.mock.calls[1]?.[1].body)).toEqual(REQUEST)
  })

  it("streams a draft from the memo at the post's draft endpoint", async () => {
    fetch.mockResolvedValueOnce(new Response('event: done\ndata: {"bodyMdx":"## TCP"}\n\n'))

    const events = []
    for await (const event of draftFromMemo('0199-a', '세 번 악수')) events.push(event)

    expect(sent()).toEqual([['/api/admin/posts/0199-a/draft', 'POST']])
    expect(JSON.parse(fetch.mock.calls[0]?.[1].body)).toEqual({ memo: '세 번 악수' })
    expect(events).toEqual([{ type: 'done', result: { bodyMdx: '## TCP' } }])
  })
})
