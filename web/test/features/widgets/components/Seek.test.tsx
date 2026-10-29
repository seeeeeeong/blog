import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Seek } from '@/features/widgets/components/Seek'

describe('Seek', () => {
  it('links to the widget, so it still jumps there without scripts', () => {
    const out = renderToStaticMarkup(<Seek to={0.95}>양쪽 모두</Seek>)

    expect(out).toBe('<a href="#handshake" class="action">양쪽 모두</a>')
  })

  it('can point at another widget', () => {
    const out = renderToStaticMarkup(<Seek widget="tls">x</Seek>)

    expect(out).toContain('href="#tls"')
  })
})
