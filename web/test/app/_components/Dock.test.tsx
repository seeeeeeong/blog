import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Dock } from '@/app/_components/Dock'

describe('Dock', () => {
  it('links the index, the topics and the newest post', () => {
    const out = renderToStaticMarkup(<Dock latestHref="/posts/tcp-handshake" />)

    expect(out).toContain('aria-label="홈"')
    expect(out).toContain('href="/">Index</a>')
    expect(out).toContain('href="/#topic">Topics</a>')
    expect(out).toContain('href="/posts/tcp-handshake">Latest</a>')
    expect(out).toContain('aria-label="라이트 모드로 전환"')
  })

  it('has no Latest link without a post, and no buttons that do nothing yet', () => {
    const out = renderToStaticMarkup(<Dock />)

    expect(out).not.toContain('Latest')
    for (const later of ['Books', 'Cmd', 'Ask']) expect(out).not.toContain(later)
    expect(out.match(/<button/g)).toHaveLength(1)
  })
})
