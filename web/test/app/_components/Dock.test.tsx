import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Dock } from '@/app/_components/Dock'

describe('Dock', () => {
  it('links the index, the topics, the books and the newest post', () => {
    const out = renderToStaticMarkup(<Dock latestHref="/posts/tcp-handshake" />)

    expect(out).toContain('aria-label="홈"')
    expect(out).toContain('href="/">Index</a>')
    expect(out).toContain('href="/#topic">Topics</a>')
    expect(out).toContain('href="/books">Books</a>')
    expect(out.indexOf('>Books<')).toBeLessThan(out.indexOf('>Latest<'))
    expect(out).toContain('href="/posts/tcp-handshake">Latest</a>')
    expect(out).toContain('aria-label="라이트 모드로 전환"')
  })

  it('opens the command palette from Cmd, after Latest and before the theme', () => {
    const out = renderToStaticMarkup(<Dock latestHref="/posts/tcp-handshake" />)

    expect(out).toContain(
      '<button class="dock__item" type="button" aria-haspopup="dialog" aria-expanded="false">Cmd</button>',
    )
    expect(out.indexOf('>Latest<')).toBeLessThan(out.indexOf('>Cmd<'))
    expect(out.indexOf('>Cmd<')).toBeLessThan(out.indexOf('theme-toggle'))
  })

  it('has no Latest link without a post, and no buttons that do nothing yet', () => {
    const out = renderToStaticMarkup(<Dock />)

    expect(out).not.toContain('Latest')
    expect(out).not.toContain('Ask')
    expect(out.match(/<button/g)).toHaveLength(2)
  })
})
