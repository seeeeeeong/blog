import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { PostGeneration } from '@/features/admin/api/types'
import { KeptDrafts } from '@/features/admin/components/KeptDrafts'

const kept = (id: string, memo: string, revised: boolean): PostGeneration => ({
  id,
  memo,
  createdAt: '2026-11-09T06:05:00Z',
  draft: {
    bodyMdx: '본문',
    review: null,
    revised,
    checks: [],
    model: 'deepseek-flash',
    inputTokens: 1,
    outputTokens: 2,
  },
})

describe('KeptDrafts', () => {
  it('lists each draft by its time and the start of its memo, newest as given', () => {
    const out = renderToStaticMarkup(
      <KeptDrafts
        generations={[kept('b', 'SYN 세 번\n나머지', true), kept('a', '처음 메모', false)]}
        onOpen={() => {}}
      />,
    )

    expect(out).toContain('<section class="mkept" aria-label="지난 초안">')
    expect(out.indexOf('SYN 세 번')).toBeLessThan(out.indexOf('처음 메모'))
    expect(out).not.toContain('나머지')
    expect(out).toContain('<time dateTime="2026-11-09T06:05:00Z">')
    expect(out.match(/고쳐 씀/g)).toHaveLength(1)
  })

  it('shows nothing when no draft was kept', () => {
    expect(renderToStaticMarkup(<KeptDrafts generations={[]} onOpen={() => {}} />)).toBe('')
  })
})
