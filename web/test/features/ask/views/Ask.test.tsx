import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Ask } from '@/features/ask/views/Ask'

describe('Ask', () => {
  it('renders the panel and its tab hidden on the server, where it is always closed', () => {
    const out = renderToStaticMarkup(<Ask />)

    expect(out).toContain('<section id="ask-panel" class="ask"')
    expect(out).toContain('class="ask-tab"')
    expect(out.match(/hidden=""/g)).toHaveLength(2)
  })
})
