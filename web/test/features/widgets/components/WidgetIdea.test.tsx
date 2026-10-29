import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { WidgetIdea } from '@/features/widgets/components/WidgetIdea'

describe('WidgetIdea', () => {
  it('shows a reader nothing of the note', () => {
    expect(renderToStaticMarkup(<WidgetIdea note="큐가 차오르는 모습" />)).toBe('')
  })
})
