import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { BookContents } from '@/features/admin/api/types'
import { PastedContents } from '@/features/admin/components/PastedContents'

const OUTLINE: BookContents = {
  chapters: [
    { number: '1', title: '서론', sections: [{ number: '1.1', title: '하는 일' }] },
    { number: 'A', title: '부록', sections: [{ number: 'A.1', title: '부록' }] },
  ],
}

const render = (value: string, outline: BookContents | null = null, busy = false) =>
  renderToStaticMarkup(
    <PastedContents
      value={value}
      outline={outline}
      busy={busy}
      onChange={() => {}}
      onCheck={() => {}}
    />,
  )

describe('PastedContents', () => {
  it('cannot be checked while empty or busy', () => {
    expect(render('  ')).toMatch(/<button[^>]*disabled=""[^>]*>Check/)
    expect(render('1장 서론', null, true)).toMatch(/<button[^>]*disabled=""[^>]*>Check/)
    expect(render('1장 서론')).not.toMatch(/<button[^>]*disabled=""[^>]*>Check/)
  })

  it('shows no outline until the contents are checked', () => {
    const out = render('1장 서론')

    expect(out).not.toContain('boutline')
    expect(out).not.toContain('chapters')
  })

  it('shows how the contents read, with their count', () => {
    const out = render('1장 서론', OUTLINE)

    expect(out).toContain('2 chapters / 2 sections')
    expect(out).toContain('<span class="mono">1.1</span> 하는 일')
    expect(out).toContain('<span class="mono">A</span> 부록')
  })
})
