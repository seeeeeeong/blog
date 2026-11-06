import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Banner } from '@/app/_components/Banner'

describe('Banner', () => {
  it('names the site and links it home', () => {
    const out = renderToStaticMarkup(<Banner />)

    expect(out).toContain('<div class="banner__title"><a href="/">Sinseong Lee</a></div>')
  })

  it('links the blog and the archives, then opens the Ask panel', () => {
    const out = renderToStaticMarkup(<Banner />)

    expect(out).toContain('<nav class="banner__nav" aria-label="사이트">')
    expect(out).toContain('href="/">Blog</a>')
    expect(out).toContain('href="/archives">Archives</a>')
    expect(out).toContain(
      '<button type="button" aria-controls="ask-panel" aria-expanded="false">Ask</button>',
    )
    expect(out.indexOf('>Blog<')).toBeLessThan(out.indexOf('>Archives<'))
    expect(out.indexOf('>Archives<')).toBeLessThan(out.indexOf('>Ask<'))
  })

  it('links the source and the feed by icon, each with a name', () => {
    const out = renderToStaticMarkup(<Banner />)

    expect(out).toContain(
      '<a href="https://github.com/seeeeeeong" title="GitHub"><span class="sr-only">GitHub</span>',
    )
    expect(out).toContain('<a href="/rss.xml" title="RSS"><span class="sr-only">RSS</span>')
  })

  it('has no theme switch, as the site has one look', () => {
    expect(renderToStaticMarkup(<Banner />)).not.toContain('theme')
  })
})
