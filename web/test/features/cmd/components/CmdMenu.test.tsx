import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CmdMenu } from '@/features/cmd/components/CmdMenu'
import { type CmdMode, type CmdPost, visibleItems } from '@/features/cmd/utils/items'

const POSTS: CmdPost[] = [
  {
    href: '/posts/tcp-handshake',
    title: 'TCP 3-way handshake',
    topic: '네트워크',
    summary: '세 번의 교환으로 연결을 연다.',
    publishedAt: '2026-10-21T01:00:00Z',
  },
  {
    href: '/posts/virtual-memory',
    title: 'Virtual Memory',
    topic: '운영체제',
    summary: '페이지 테이블로 주소를 옮긴다.',
    publishedAt: '2026-06-03T01:00:00Z',
  },
]

const nothing = () => {}

function render(mode: CmdMode, query: string, active = 0) {
  return renderToStaticMarkup(
    <CmdMenu
      mode={mode}
      query={query}
      items={visibleItems(mode, query, POSTS, '/posts/tcp-handshake')}
      active={active}
      onType={nothing}
      onKeyDown={nothing}
      onHover={nothing}
      onRun={nothing}
      onClose={nothing}
    />,
  )
}

describe('CmdMenu', () => {
  it('draws the commands as a combobox over a grouped listbox', () => {
    const out = render('root', '', 2)

    expect(out).toContain('role="dialog" aria-modal="true"')
    expect(out).toContain('role="combobox" aria-expanded="true" aria-controls="cmd-list"')
    expect(out).toContain('aria-activedescendant="cmd-option-2"')
    expect(out).toContain('placeholder="Type a command..."')
    expect(out).toContain('id="cmd-list" role="listbox"')
    for (const group of ['Tools', 'Navigation', 'Links'])
      expect(out).toContain(`role="group" aria-label="${group}"`)
    expect(out).toContain('id="cmd-option-2" role="option" aria-selected="true"')
    expect(out).toContain('id="cmd-option-0" role="option" aria-selected="false"')
    expect(out.match(/role="option"/g)).toHaveLength(7)
    expect(out).toContain('<span class="cmd__hint">github.com/seeeeeeong</span>')
    for (const later of ['Ask', 'theme']) expect(out).not.toContain(later)
  })

  it('lists only the posts, with their dates, when searching posts', () => {
    const out = render('posts', '')

    expect(out).toContain('placeholder="Search posts..."')
    expect(out).toContain('role="group" aria-label="Posts"')
    expect(out).toContain('<span class="cmd__label">TCP 3-way handshake</span>')
    expect(out).toContain('<span class="cmd__hint mono">OCT 21</span>')
    expect(out).not.toContain('Search posts...</span>')
    expect(out.match(/role="option"/g)).toHaveLength(2)
  })

  it('says when nothing matches, and names no active option', () => {
    const out = render('posts', 'kafka')

    expect(out).toContain('No results')
    expect(out).not.toContain('aria-activedescendant')
    expect(out).not.toContain('role="option"')
  })
})
