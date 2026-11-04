import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DraftCompare } from '@/features/admin/components/DraftCompare'
import { compareBodies } from '@/features/admin/utils/compare'

const blocks = compareBodies('## 제목\n같음\n옛 문단', '## 제목\n같음\n새 문단')
const render = (taken: number[]) =>
  renderToStaticMarkup(<DraftCompare blocks={blocks} taken={new Set(taken)} onToggle={() => {}} />)

describe('DraftCompare', () => {
  it('shows each change on both sides and counts what stays', () => {
    const out = render([0])

    expect(out).toContain('같은 내용 2줄')
    expect(out).toContain('<figcaption>지금 본문</figcaption><pre>옛 문단</pre>')
    expect(out).toContain('<figcaption>다듬은 글</figcaption><pre>새 문단</pre>')
  })

  it('checks a change only while it is taken', () => {
    expect(render([0])).toContain('checked=""')
    expect(render([])).not.toContain('checked=""')
  })
})
