import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AdminBanner } from '@/app/admin/_components/AdminBanner'

describe('AdminBanner', () => {
  it('names the admin, links the posts and the site, and signs out', () => {
    const out = renderToStaticMarkup(<AdminBanner signedIn />)

    expect(out).toContain('<div class="banner__title"><a href="/admin">Admin</a></div>')
    expect(out).toContain('<nav class="banner__nav" aria-label="관리자">')
    expect(out).toContain('<a href="/admin">Posts</a>')
    expect(out).toContain('<a href="/">Site</a>')
    expect(out).toContain('Sign out</button>')
  })

  it('has neither Posts nor Sign out before signing in', () => {
    const out = renderToStaticMarkup(<AdminBanner />)

    expect(out).not.toContain('Posts')
    expect(out).not.toContain('Sign out')
    expect(out).toContain('>Site</a>')
  })
})
