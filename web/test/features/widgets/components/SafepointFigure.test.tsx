import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SafepointFigure } from '@/features/widgets/components/SafepointFigure'
import { PARTS, readoutOf, restState } from '@/features/widgets/utils/safepoint'

const readoutIn = (html: string) => html.match(/data-readout="">([^<]*)</)?.[1]

describe('SafepointFigure', () => {
  it('renders in the light theme with a Korean description', () => {
    const out = renderToStaticMarkup(<SafepointFigure part="why" />)

    expect(out).toContain(
      '<div class="iso safepoint-figure" data-theme="light" id="safepoint-why">',
    )
    expect(out).toMatch(/<svg class="iso-svg"[^>]*role="img" aria-label="JVM 세이프포인트를/)
    expect(out).toContain('>멈춰</button>')
  })

  it.each(PARTS)('says the model’s rest readout for %s', (part) => {
    const out = renderToStaticMarkup(<SafepointFigure part={part} />)

    expect(readoutIn(out)).toBe(readoutOf(restState(part)))
  })

  it('gives ttsp a slider for the operation and handshake a button per thread', () => {
    const ttsp = renderToStaticMarkup(<SafepointFigure part="ttsp" />)
    const handshake = renderToStaticMarkup(<SafepointFigure part="handshake" />)

    expect(ttsp).toContain('aria-label="VM 작업 길이"')
    expect(handshake.match(/aria-pressed=/g)).toHaveLength(4)
    expect(handshake).toContain('aria-pressed="true">3번</button>')
  })

  it('draws only the followed thread’s carriage in why', () => {
    const why = renderToStaticMarkup(<SafepointFigure part="why" />)
    const poll = renderToStaticMarkup(<SafepointFigure part="poll" />)

    expect(why.match(/class="sp-car"[^>]*display="none"/g)).toHaveLength(3)
    expect(poll).not.toMatch(/class="sp-car"[^>]*display="none"/)
  })

  it('opens on why for an unknown part', () => {
    const out = renderToStaticMarkup(<SafepointFigure part="bogus" />)

    expect(out).toContain('id="safepoint-why"')
    expect(readoutIn(out)).toBe('검사 지점에서 멈춤 · 지도 있음')
  })

  it('renders the same markup twice', () => {
    const once = renderToStaticMarkup(<SafepointFigure part="ttsp" />)
    const twice = renderToStaticMarkup(<SafepointFigure part="ttsp" />)

    expect(twice).toBe(once)
  })
})
