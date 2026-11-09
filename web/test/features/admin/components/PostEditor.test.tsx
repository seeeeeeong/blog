import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AdminPost } from '@/features/admin/api/types'
import { PostEditor } from '@/features/admin/components/PostEditor'

const network = { slug: 'network', title: '네트워크', position: 2 }
const os = { slug: 'os', title: '운영체제', position: 1 }

const DRAFT: AdminPost = {
  id: '0199-a',
  version: 3,
  slug: 'tcp-handshake',
  title: 'TCP 3-way handshake',
  status: 'DRAFT',
  topic: network,
  position: 1,
  number: '2.1',
  summary: '세 번의 교환',
  bodyMdx: '## 왜 세 번인가',
  createdAt: '2026-10-20T00:00:00Z',
  updatedAt: '2026-10-21T00:00:00Z',
  publishedAt: null,
}

const preview = async () => null

const render = (post: AdminPost) =>
  renderToStaticMarkup(<PostEditor post={post} topics={[os, network]} previewAction={preview} />)

describe('PostEditor', () => {
  it('fills the title, metadata and body from the post', () => {
    const out = render(DRAFT)

    expect(out).toContain(
      'aria-label="제목" maxLength="200" spellCheck="false" value="TCP 3-way handshake"',
    )
    expect(out).toContain('Draft / 2.1 network')
    expect(out).toContain('value="tcp-handshake"')
    expect(out).toContain('<option value="network" selected="">네트워크</option>')
    expect(out).toContain('value="1"')
    expect(out).toContain('>세 번의 교환</textarea>')
    expect(out).toContain(
      'aria-label="본문 MDX" spellCheck="false" hidden="">## 왜 세 번인가</textarea>',
    )
  })

  it('opens in Rich, with Save draft and Publish for a draft', () => {
    const out = render(DRAFT)

    expect(out).toContain('aria-pressed="true">Rich</button>')
    expect(out).toContain('aria-pressed="false">MDX</button>')
    expect(out).toContain('aria-pressed="false">Preview</button>')
    expect(out).toContain('<div class="rich rich--loading"></div>')
    expect(out).toContain('<span class="ebar__save" aria-live="polite">Saved</span>')
    expect(out).toContain('disabled="">Save draft</button>')
    expect(out).toMatch(
      /<button class="ebar__item ebar__item--accent" type="button">Publish<\/button>/,
    )
  })

  it('opens in MDX a body whose list starts past 1, which Rich would renumber', () => {
    const out = render({ ...DRAFT, bodyMdx: '글입니다.\n\n3. 셋째' })

    expect(out).toContain('aria-pressed="true">MDX</button>')
    expect(out).toContain('spellCheck="false">글입니다.\n\n3. 셋째</textarea>')
    expect(out).not.toContain('class="rich')
  })

  it('has no Save for a published post, which changes only by publishing again', () => {
    const out = render({ ...DRAFT, status: 'PUBLISHED', publishedAt: '2026-10-21T00:00:00Z' })

    expect(out).toContain('Published Oct 21 / 2.1 network')
    expect(out).not.toContain('Save draft')
    expect(out).toContain('disabled="">Republish</button>')
  })

  it('drafts a draft from a memo, behind a dialog that stays closed until asked', () => {
    const out = render(DRAFT)

    expect(out).toMatch(/<button class="ebar__item" type="button">.*From memo<\/button>/)
    expect(out).toContain('<dialog class="modal modal--wide" aria-label="From memo">')
    expect(out).not.toMatch(/<dialog[^>]* open/)
  })

  it('has no From memo for a published post', () => {
    const out = render({ ...DRAFT, status: 'PUBLISHED', publishedAt: '2026-10-21T00:00:00Z' })

    expect(out).not.toContain('From memo')
    expect(out).not.toContain('메모')
  })
})
