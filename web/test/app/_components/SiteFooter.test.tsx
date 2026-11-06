import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SiteFooter } from '@/app/_components/SiteFooter'

describe('SiteFooter', () => {
  it('is one copyright line for this year', () => {
    const out = renderToStaticMarkup(<SiteFooter />)

    expect(out).toBe(
      `<footer class="site-footer">Copyright © ${new Date().getFullYear()} Sinseong Lee</footer>`,
    )
  })
})
