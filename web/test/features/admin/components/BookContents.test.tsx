import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AdminBookSection, AdminPostSummary } from '@/features/admin/api/types'
import { BookContents } from '@/features/admin/components/BookContents'

const network = { slug: 'network', title: '네트워크', position: 2 }

function post(id: string, publishedAt: string | null): AdminPostSummary {
  return {
    id,
    slug: id,
    title: id,
    status: publishedAt ? 'PUBLISHED' : 'DRAFT',
    topic: network,
    sectionId: null,
    number: '2.1',
    updatedAt: '2026-10-25T00:00:00Z',
    publishedAt,
  }
}

const node = (
  id: string,
  title: string,
  written: AdminPostSummary | null = null,
  sections: AdminBookSection[] = [],
): AdminBookSection => ({ id, number: id, title, post: written, sections })

const CHAPTERS = [
  node('1', '컴퓨터 네트워크와 인터넷', null, [
    node('1.1', '인터넷이란 무엇인가', post('0199-a', '2026-10-21T00:00:00Z')),
    node('1.2', '네트워크 가장자리', post('0199-b', null)),
    node('1.3', '네트워크 코어'),
  ]),
  node('A', '부록'),
]

const render = (writing: string | null = null) =>
  renderToStaticMarkup(<BookContents chapters={CHAPTERS} writing={writing} onWrite={() => {}} />)

describe('BookContents', () => {
  it('heads each chapter with its number and how many of its sections have a post', () => {
    const out = render()

    expect(out).toContain(
      '<span class="mono group__count">01</span>컴퓨터 네트워크와 인터넷<span class="mono group__count">(2/3)</span>',
    )
    expect(out).toContain('<span class="mono group__count">A</span>부록')
  })

  it("shows each section's post: the day it came out, Draft, or a dash", () => {
    const out = render()

    expect(out).toContain('<span class="row__meta mono">OCT 21</span>')
    expect(out).toContain('<span class="row__meta mono is-draft">Draft</span>')
    expect(out).toContain('<span class="row__meta mono">—</span>')
  })

  it('opens a written post and offers Write post for the rest, a chapter without sections too', () => {
    const out = render()

    expect(out).toContain('<a class="mono mlink" href="/admin/posts/0199-a">Open post</a>')
    expect(out).toContain('<a class="mono mlink" href="/admin/posts/0199-b">Open post</a>')
    expect(out.match(/>Write post</g)).toHaveLength(2)
    expect(out).toContain('<li id="section-1.3">')
    expect(out).toContain('<li id="section-A">')
    expect(out).not.toContain('id="section-1"')
  })

  it('holds every Write post back while one post is being made', () => {
    expect(render('1.3').match(/disabled="">Write post/g)).toHaveLength(2)
    expect(render()).not.toContain('disabled')
  })
})
