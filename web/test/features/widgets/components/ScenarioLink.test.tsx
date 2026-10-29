import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ScenarioLink } from '@/features/widgets/components/ScenarioLink'

describe('ScenarioLink', () => {
  it('links to the widget it switches', () => {
    const out = renderToStaticMarkup(<ScenarioLink to="loss">SYN 유실</ScenarioLink>)

    expect(out).toBe('<a href="#handshake" class="action">SYN 유실</a>')
  })
})
