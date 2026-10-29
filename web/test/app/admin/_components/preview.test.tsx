import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { previewMdx } from '@/app/admin/_components/preview'
import { API_URL } from '@/lib/api-url'

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'SESSION=admin' }),
}))

const BODY = [
  '<Callout label="핵심">',
  '세 번이다.',
  '</Callout>',
  '',
  '<HandshakeWidget />',
  '',
  '<Unknown />',
  '',
  'export const leak = 1',
  '',
  '[link](javascript:alert(1))',
].join('\n')

let fetch: ReturnType<typeof vi.fn>

function admin(ok: boolean) {
  fetch = vi.fn(async () =>
    ok ? Response.json({ login: 'seeeeeeong' }) : Response.json({}, { status: 401 }),
  )
  vi.stubGlobal('fetch', fetch)
}

beforeEach(() => admin(true))

afterEach(() => vi.unstubAllGlobals())

describe('previewMdx', () => {
  it("renders the body through the post page's allow list and widgets", async () => {
    const out = renderToStaticMarkup(await previewMdx(BODY))

    expect(out).toContain('<aside class="callout">')
    expect(out).toContain('<div class="widget" id="handshake">')
    expect(out).not.toContain('Unknown')
    expect(out).not.toContain('leak')
    expect(out).not.toContain('javascript:')
  })

  it("asks the api whether the browser's session is the admin's", async () => {
    await previewMdx('')

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/admin/me`,
      expect.objectContaining({ headers: { cookie: 'SESSION=admin' } }),
    )
  })

  it('renders nothing of the body for anyone else', async () => {
    admin(false)

    const out = renderToStaticMarkup(await previewMdx(BODY))

    expect(out).toBe('<p class="empty">로그인이 필요합니다.</p>')
  })
})
