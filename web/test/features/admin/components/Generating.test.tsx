import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Generating } from '@/features/admin/components/Generating'

describe('Generating', () => {
  it('tells a screen reader the step, and shows no words', () => {
    const out = renderToStaticMarkup(<Generating step={1} label="검토하는 중" />)

    expect(out).toContain('role="status"')
    expect(out).toContain('<span class="sr-only">검토하는 중</span>')
    expect(out.replace(/<span class="sr-only">[^<]*<\/span>/, '')).not.toMatch(/>[^<\s]+</)
  })

  it('fills the steps behind the current one', () => {
    const out = renderToStaticMarkup(<Generating step={1} label="검토하는 중" />)

    expect(out.match(/data-step="[a-z]+"/g)).toEqual([
      'data-step="done"',
      'data-step="current"',
      'data-step="next"',
    ])
  })

  it('leaves out the steps when it has none, as a short rewrite does', () => {
    const out = renderToStaticMarkup(<Generating label="다시 쓰는 중" />)

    expect(out).not.toContain('data-step')
    expect(out).toContain('<span class="sr-only">다시 쓰는 중</span>')
  })
})
