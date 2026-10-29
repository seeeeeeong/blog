import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SiteFooter } from '@/app/_components/SiteFooter'

describe('SiteFooter', () => {
  it('shows the build, the source and when the newest post came out', () => {
    const out = renderToStaticMarkup(<SiteFooter lastUpdated="2026-10-21T01:00:00Z" />)

    expect(out).toContain('Metadata')
    expect(out).toContain('href="https://github.com/seeeeeeong/blog-v2"')
    expect(out).toContain('>local</span>')
    expect(out).toContain('>OCT 21</span>')
    expect(out).toContain('Sinseong Lee</p>')
    expect(out).not.toContain('Links')
  })

  it('keeps a line for each value only the browser knows', () => {
    const out = renderToStaticMarkup(<SiteFooter />)

    for (const label of ['Browser', 'Current Time', 'Dimensions']) expect(out).toContain(label)
    expect(out).toContain('>N/A</span>')
  })
})
