import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AskForm } from '@/features/ask/components/AskForm'

const none = () => {}

describe('AskForm', () => {
  it('takes a question of 500 characters at most, with no placeholder, and sends none empty', () => {
    const out = renderToStaticMarkup(<AskForm asking={false} onAsk={none} onStop={none} />)

    expect(out).toContain('maxLength="500"')
    expect(out).toContain('aria-label="질문 입력"')
    expect(out).not.toContain('placeholder')
    expect(out).toContain('type="submit" aria-label="질문 보내기" disabled=""')
  })

  it('offers to stop the answer in flight instead of sending', () => {
    const out = renderToStaticMarkup(<AskForm asking onAsk={none} onStop={none} />)

    expect(out).toContain('type="button" aria-label="답변 멈추기"')
    expect(out).not.toContain('질문 보내기')
  })
})
