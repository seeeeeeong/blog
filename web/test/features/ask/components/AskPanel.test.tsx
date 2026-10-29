import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AskPanel } from '@/features/ask/components/AskPanel'
import type { Exchange } from '@/features/ask/utils/conversation'

const none = () => {}
const grip = { onPointerDown: none, onPointerMove: none, onPointerUp: none }

function render(change: { shown?: boolean; height?: number | null; exchanges?: Exchange[] } = {}) {
  return renderToStaticMarkup(
    <AskPanel
      shown={change.shown ?? true}
      height={change.height ?? null}
      exchanges={change.exchanges ?? []}
      asking={false}
      grip={grip}
      onAsk={none}
      onStop={none}
      onMinimize={none}
      onClose={none}
    />,
  )
}

describe('AskPanel', () => {
  it('is a non-modal dialog with a grip, a minimize and a close button', () => {
    const out = render()

    expect(out).toContain('role="dialog" aria-modal="false" aria-label="Ask"')
    expect(out).toContain('aria-label="패널 높이 조절"')
    expect(out).toContain('aria-label="Ask 최소화"')
    expect(out).toContain('aria-label="Ask 닫기"')
    expect(out).not.toContain('hidden=""')
  })

  it('opens empty on the orb alone, without any copy', () => {
    const out = render()

    expect(out).toContain('<div class="ask__empty"><span class="ask__orb ask__orb--large"')
    expect(out).not.toContain('ask__thread')
    expect(out).not.toContain('placeholder')
  })

  it('shows the thread once a question is asked', () => {
    const out = render({
      exchanges: [{ id: 0, question: 'TCP?', answer: '', sources: [], status: 'waiting' }],
    })

    expect(out).toContain('ask__thread')
    expect(out).not.toContain('ask__empty')
  })

  it('stays in the page while hidden, so its thread survives', () => {
    expect(render({ shown: false })).toContain('hidden=""')
  })

  it('takes the height its grip set', () => {
    expect(render({ height: 600 })).toContain('style="--ask-height:600px"')
  })
})
