import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AskTab } from '@/features/ask/components/AskTab'

const none = () => {}
const handlers = {
  onPointerDown: none,
  onPointerMove: none,
  onPointerUp: none,
  onClick: none,
  onKeyDown: none,
}

describe('AskTab', () => {
  it('reopens the panel and says it can be moved', () => {
    const out = renderToStaticMarkup(<AskTab shown top={400} handlers={handlers} />)

    expect(out).toContain('aria-label="Ask 다시 열기"')
    expect(out).toContain('aria-description="드래그하거나 위아래 방향키로')
    expect(out).toContain('style="top:400px"')
    expect(out).not.toContain('hidden=""')
  })

  it('is hidden until the panel is minimized', () => {
    const out = renderToStaticMarkup(<AskTab shown={false} top={null} handlers={handlers} />)

    expect(out).toContain('hidden=""')
    expect(out).not.toContain('style=')
  })
})
