import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Scramble } from '@/components/ui/Scramble'

describe('Scramble', () => {
  it('renders the whole text, hidden until it plays', () => {
    expect(renderToStaticMarkup(<Scramble className="mono" text="2026" />)).toBe(
      '<span class="mono scramble-pending">2026</span>',
    )
  })
})
