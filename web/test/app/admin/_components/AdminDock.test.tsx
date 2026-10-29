import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AdminDock } from '@/app/admin/_components/AdminDock'

describe('AdminDock', () => {
  it('links the posts, the books and the site, and signs out, in the dock', () => {
    const out = renderToStaticMarkup(<AdminDock signedIn />)

    expect(out).toContain('<nav class="dock__bar" aria-label="관리자">')
    expect(out).toContain('<span class="dock__tag mono">Admin</span>')
    expect(out).toContain('<a class="dock__item" href="/admin">Posts</a>')
    expect(out).toContain('<a class="dock__item" href="/admin/books">Books</a>')
    expect(out).toContain('<a class="dock__item" href="/">Site</a>')
    expect(out).toContain('Sign out</button>')
    expect(out).toContain('theme-toggle')
  })

  it('has neither Posts, Books nor Sign out before signing in', () => {
    const out = renderToStaticMarkup(<AdminDock />)

    expect(out).not.toContain('Posts')
    expect(out).not.toContain('Books')
    expect(out).not.toContain('Sign out')
    expect(out).toContain('>Site</a>')
  })

  it('leaves out what is still to come', () => {
    const out = renderToStaticMarkup(<AdminDock signedIn />)

    for (const later of ['From memo', 'Notes']) expect(out).not.toContain(later)
  })
})
