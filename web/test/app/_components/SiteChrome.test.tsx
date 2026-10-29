import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SiteChrome } from '@/app/_components/SiteChrome'

const POST = {
  slug: 'tcp-handshake',
  title: 'TCP 3-way handshake',
  summary: '세 번의 교환으로 연결을 연다.',
  topic: { slug: 'network', title: '네트워크', position: 2 },
  number: '2.1',
  publishedAt: '2026-10-21T00:00:00Z',
}

afterEach(() => vi.unstubAllGlobals())

describe('SiteChrome', () => {
  it('puts the dock above the page and the footer below it, with the newest post as Latest', async () => {
    vi.stubGlobal('fetch', async (url: string) =>
      Response.json(url.endsWith('/api/posts') ? [POST] : []),
    )

    const out = renderToStaticMarkup(await SiteChrome({ children: <main>page</main> }))

    expect(out).toContain('href="/posts/tcp-handshake">Latest</a>')
    expect(out.indexOf('class="dock"')).toBeLessThan(out.indexOf('<main>page</main>'))
    expect(out.indexOf('<main>page</main>')).toBeLessThan(out.indexOf('class="site-footer"'))
  })

  it('still frames the page when the api is down', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('fetch failed')
    })

    const out = renderToStaticMarkup(await SiteChrome({ children: <main>page</main> }))

    expect(out).toContain('<main>page</main>')
    expect(out).not.toContain('Latest')
  })
})
