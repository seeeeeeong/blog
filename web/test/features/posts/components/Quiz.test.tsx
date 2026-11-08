import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Explanation } from '@/features/posts/components/Explanation'
import { Quiz } from '@/features/posts/components/Quiz'

const QUIZ = (
  <Quiz answers="10|열">
    <p>0b1010은 십진수로 얼마일까요?</p>
    <Explanation>
      <p>8 + 2 = 10입니다.</p>
    </Explanation>
  </Quiz>
)

describe('Quiz', () => {
  it('asks the question with an answer field that waits for the page to hydrate', () => {
    const out = renderToStaticMarkup(QUIZ)

    expect(out).toContain(
      '도전 문제</div><p>0b1010은 십진수로 얼마일까요?</p><form class="quiz__form">',
    )
    expect(out).toMatch(/<label for="([^"]+)-answer">답<\/label><input id="\1-answer"/)
    expect(out).toMatch(/<input [^>]*disabled=""/)
    expect(out).toContain('role="status"></p>')
  })

  it('keeps the answer and the explanation behind a closed toggle', () => {
    const out = renderToStaticMarkup(QUIZ)

    expect(out).toContain(
      '<details class="quiz__solution"><summary>정답 보기</summary><p>정답: 10</p><p>8 + 2 = 10입니다.</p></details>',
    )
  })

  it('offers only the explanation when there is no answer to check', () => {
    const out = renderToStaticMarkup(
      <Quiz>
        <p>왜 세 번일까요?</p>
        <Explanation>
          <p>양쪽이 서로의 번호를 확인해야 합니다.</p>
        </Explanation>
      </Quiz>,
    )

    expect(out).not.toContain('<form')
    expect(out).toContain(
      '<summary>풀이 보기</summary><p>양쪽이 서로의 번호를 확인해야 합니다.</p>',
    )
  })

  it('shows nothing of an explanation outside a quiz', () => {
    expect(
      renderToStaticMarkup(
        <Explanation>
          <p>정답</p>
        </Explanation>,
      ),
    ).toBe('')
  })
})
