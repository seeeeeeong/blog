import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AdminBook, AdminBookSection, StudyNote } from '@/features/admin/api/types'
import { SectionNote } from '@/features/admin/components/SectionNote'

const SECTION: AdminBookSection = {
  id: '0199-s',
  number: '3.5',
  title: '연결형 트랜스포트: TCP',
  post: null,
  noteCreatedAt: '2026-10-29T00:00:00Z',
  sections: [],
}

const BOOK: AdminBook = {
  id: '0199-book',
  title: '컴퓨터 네트워킹',
  authors: null,
  publisher: null,
  isbn13: '9791159773486',
  publishedOn: null,
  sourceRef: '108512345',
  sourceUrl: 'https://www.yes24.com/product/goods/108512345',
  coverUrl: null,
  topic: null,
  createdAt: '2026-10-20T00:00:00Z',
  chapters: [SECTION],
}

const NOTE: StudyNote = {
  id: '0199-n',
  sectionId: '0199-s',
  bodyMdx: '## 왜 세 번인가',
  model: 'deepseek-chat',
  inputTokens: 120,
  outputTokens: 2400,
  createdAt: '2026-10-29T00:00:00Z',
}

const preview = async () => null

const render = (note: StudyNote | null) =>
  renderToStaticMarkup(
    <SectionNote book={BOOK} section={SECTION} note={note} previewAction={preview} />,
  )

describe('SectionNote', () => {
  it('heads the page with the section, back to its row in the book', () => {
    const out = render(NOTE)

    expect(out).toContain(
      '<a class="mono bback" href="/admin/books/0199-book#section-0199-s">← 컴퓨터 네트워킹</a>',
    )
    expect(out).toContain('<h1>연결형 트랜스포트: TCP</h1>')
    expect(out).toContain('<p class="mono ahead__meta">3.5 / Study note / OCT 29</p>')
  })

  it('shows the note, to regenerate, with the section post to write', () => {
    const out = render(NOTE)

    expect(out).toContain('<pre class="mdx mstream">## 왜 세 번인가</pre>')
    expect(out).toContain('Regenerate')
    expect(out).toContain('>Write post</button>')
  })

  it('offers Generate before the section has a note', () => {
    const out = render(null)

    expect(out).toContain('<p class="mono ahead__meta">3.5 / Study note</p>')
    expect(out).toContain('<div class="nempty">')
    expect(out).not.toContain('Regenerate')
  })
})
