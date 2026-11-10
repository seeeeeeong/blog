import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { PostDraft } from '@/features/admin/api/types'
import { DraftReview } from '@/features/admin/components/DraftReview'

const CLEAN = { addedFacts: [], corrections: [], invented: [], dropped: [], critical: [] }
const draft = (over: Partial<PostDraft>): PostDraft => ({
  bodyMdx: '본문',
  review: CLEAN,
  revised: false,
  checks: [],
  model: 'm',
  inputTokens: 1,
  outputTokens: 1,
  ...over,
})
const render = (over: Partial<PostDraft>) =>
  renderToStaticMarkup(<DraftReview draft={draft(over)} />)

describe('DraftReview', () => {
  it('shows no group that has nothing in it', () => {
    expect(render({})).toBe('<div class="mreview"></div>')
  })

  it('says so when there is no review, which is not the same as nothing found', () => {
    expect(render({ review: null })).toContain('검토를 받지 못했습니다')
  })

  it('marks an added fact the review is not sure of', () => {
    const out = render({
      review: {
        ...CLEAN,
        addedFacts: [
          { claim: '확실한 사실', quote: 'q', confidence: 'HIGH' },
          { claim: '의심스러운 사실', quote: 'q', confidence: 'LOW' },
        ],
      },
    })

    expect(out).toContain('>확실한 사실<')
    expect(out).toContain('>[확실하지 않음] 의심스러운 사실<')
  })

  it('puts what must be fixed before what was added', () => {
    const out = render({
      review: {
        ...CLEAN,
        critical: [{ problem: '틀림', quote: '인용', fix: '고침' }],
        addedFacts: [{ claim: '사실', quote: 'q', confidence: 'HIGH' }],
      },
    })

    expect(out.indexOf('꼭 고칠 점')).toBeLessThan(out.indexOf('메모에 없이 추가된 사실'))
  })

  it('sets out a correction line by line, without the markup of the text it quotes', () => {
    const out = render({
      review: {
        ...CLEAN,
        corrections: [
          {
            memo: '같은 커넥션',
            draft: '커넥션을 **하나 더** `꺼내` 씁니다',
            reason: '새 커넥션을 잡습니다',
          },
        ],
      },
    })

    expect(out).toContain('>메모: 같은 커넥션<')
    expect(out).toContain('>글: 커넥션을 하나 더 꺼내 씁니다<')
    expect(out).toContain('>새 커넥션을 잡습니다<')
  })

  it('names a machine check and a rewrite', () => {
    const out = render({
      revised: true,
      checks: [{ kind: 'LINK_ADDED', detail: 'https://a.io', severity: 'INFO' }],
    })

    expect(out).toContain('한 번 다시 썼습니다')
    expect(out).toContain('메모에 없는 링크: https://a.io')
  })

  it('puts what broke rendering or the shape before what is only for the admin', () => {
    const out = render({
      checks: [
        { kind: 'MEMO_NUMBER_MISSING', detail: '900', severity: 'INFO' },
        { kind: 'NO_FIGURE', detail: '체이닝', severity: 'WARNING' },
        { kind: 'NOT_RENDERABLE', detail: '<div>', severity: 'ERROR' },
      ],
    })

    expect(out.indexOf('렌더링되지 않을 수 있음')).toBeLessThan(
      out.indexOf('그림이 없는 섹션: 체이닝'),
    )
    expect(out.indexOf('그림이 없는 섹션: 체이닝')).toBeLessThan(
      out.indexOf('메모의 숫자가 빠짐: 900'),
    )
  })
})
