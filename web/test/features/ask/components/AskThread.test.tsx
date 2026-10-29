import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AskThread } from '@/features/ask/components/AskThread'
import type { Exchange } from '@/features/ask/utils/conversation'

const exchange = (change: Partial<Exchange>): Exchange => ({
  id: 0,
  question: 'TCP?',
  answer: '',
  sources: [],
  status: 'done',
  ...change,
})

describe('AskThread', () => {
  it('shows the question, then the answer as text with its sources as links', () => {
    const out = renderToStaticMarkup(
      <AskThread
        exchanges={[
          exchange({
            answer: '세 번\n교환합니다',
            grounded: true,
            sources: [{ slug: 'tcp-handshake', title: 'TCP 3-way handshake' }],
          }),
        ]}
      />,
    )

    expect(out).toContain('<li class="ask__bubble ask__bubble--user">TCP?</li>')
    expect(out).toContain('<p class="ask__text">세 번\n교환합니다</p>')
    expect(out).toContain('<a href="/posts/tcp-handshake">TCP 3-way handshake</a>')
    expect(out).not.toContain('ask__bubble--general')
    expect(out.indexOf('ask__text')).toBeLessThan(out.indexOf('ask__sources'))
  })

  it('escapes what the model writes rather than rendering it', () => {
    const out = renderToStaticMarkup(
      <AskThread exchanges={[exchange({ answer: '<img src=x onerror=alert(1)>' })]} />,
    )

    expect(out).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(out).not.toContain('<img')
  })

  it('sets apart an answer that is not from the posts', () => {
    const out = renderToStaticMarkup(
      <AskThread exchanges={[exchange({ answer: '이 내용은 글에 없어요.', grounded: false })]} />,
    )

    expect(out).toContain('class="ask__bubble ask__bubble--bot ask__bubble--general"')
  })

  it('shows it is thinking until the first text, and busy while it streams', () => {
    const waiting = renderToStaticMarkup(
      <AskThread exchanges={[exchange({ status: 'waiting' })]} />,
    )
    expect(waiting).toContain('aria-label="답변 생성 중"')
    expect(waiting).toContain('aria-busy="true"')

    const streaming = renderToStaticMarkup(
      <AskThread exchanges={[exchange({ status: 'streaming', answer: '세' })]} />,
    )
    expect(streaming).not.toContain('답변 생성 중')
    expect(streaming).toContain('aria-busy="true"')
  })

  it('shows the message of a refused question as given', () => {
    const out = renderToStaticMarkup(
      <AskThread
        exchanges={[exchange({ status: 'failed', error: '오늘 질문을 모두 썼습니다' })]}
      />,
    )

    expect(out).toContain('<p class="ask__error">오늘 질문을 모두 썼습니다</p>')
    expect(out).toContain('aria-busy="false"')
  })
})
