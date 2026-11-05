import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DraftCompare } from '@/features/admin/components/DraftCompare'
import { compareBodies } from '@/features/admin/utils/compare'

const render = (before: string, after: string, taken: number[] = [0]) =>
  renderToStaticMarkup(
    <DraftCompare
      blocks={compareBodies(before, after)}
      taken={new Set(taken)}
      onToggle={() => {}}
    />,
  )

describe('DraftCompare', () => {
  it('shows a change on both sides with the differing words marked, and counts what stays', () => {
    const out = render('## 제목\n같음\n옛 문단', '## 제목\n같음\n새 문단')

    expect(out).toContain('같은 내용 2줄')
    expect(out).toContain('<figcaption>지금 본문</figcaption>')
    expect(out).toContain('<mark>옛</mark>')
    expect(out).toContain('<figcaption>다듬은 글</figcaption>')
    expect(out).toContain('<mark>새</mark>')
  })

  it('checks a change only while it is taken', () => {
    expect(render('옛', '새', [0])).toContain('checked=""')
    expect(render('옛', '새', [])).not.toContain('checked=""')
  })

  it('shows one side only for a pure addition or removal, and says which', () => {
    const added = render('같음', '같음\n더한 줄')
    const removed = render('같음\n지운 줄', '같음')

    expect(added).toContain('<figcaption>추가되는 내용</figcaption>')
    expect(added).not.toContain('지금 본문')
    expect(removed).toContain('<figcaption>지워지는 내용</figcaption>')
    expect(removed).not.toContain('다듬은 글')
  })

  it('shows a draft for an empty body whole, with nothing to choose', () => {
    const out = render('', '## 제목\n\n첫 문단')

    expect(out).toContain('## 제목')
    expect(out).not.toContain('checkbox')
    expect(out).not.toContain('figcaption')
  })

  it('gives each unchanged stretch its own place, even when two read the same', () => {
    const out = render('가\n같음\n나\n같음', '다\n같음\n라\n같음')

    expect(out.match(/같은 내용 1줄/g)).toHaveLength(2)
  })
})
