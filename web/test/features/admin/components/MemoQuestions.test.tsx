import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MemoQuestions } from '@/features/admin/components/MemoQuestions'

describe('MemoQuestions', () => {
  it('gives each question a place for its answer, in order', () => {
    const out = renderToStaticMarkup(
      <MemoQuestions
        questions={['몇 ms였나요?', '버전은요?']}
        answers={['300ms']}
        onAnswer={() => {}}
      />,
    )

    expect(out).toContain('<ol class="mquestions" aria-label="보충 질문">')
    expect(out).toContain('<span>몇 ms였나요?</span><textarea rows="2">300ms</textarea>')
    expect(out).toContain('<span>버전은요?</span><textarea rows="2"></textarea>')
  })

  it('shows nothing before there are questions', () => {
    expect(
      renderToStaticMarkup(<MemoQuestions questions={[]} answers={[]} onAnswer={() => {}} />),
    ).toBe('')
  })
})
