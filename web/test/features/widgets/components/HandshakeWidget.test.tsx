import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HandshakeWidget } from '@/features/widgets/components/HandshakeWidget'

describe('HandshakeWidget', () => {
  it('renders the start of the normal handshake on the server', () => {
    const out = renderToStaticMarkup(<HandshakeWidget />)

    expect(out).toContain('<div class="widget" id="handshake">')
    expect(out).toContain('aria-label="TCP 연결 수립 타임라인"')
    expect(out).toContain('>CLOSED</text>')
    expect(out).toContain('>LISTEN</text>')
    expect(out).toContain('<button type="button" aria-pressed="true">정상 연결</button>')
    expect(out).toContain('<button type="button" aria-pressed="false">SYN 유실</button>')
    expect(out).toContain(
      '<button class="play" type="button" aria-pressed="false" aria-label="재생">',
    )
    expect(out).toContain('<input type="range" min="0" max="1000" aria-label="시간" value="0"/>')
  })

  it('draws no packet before time starts', () => {
    const out = renderToStaticMarkup(<HandshakeWidget />)

    expect(out).not.toContain('<circle')
    expect(out).not.toContain('SYN-ACK</text>')
  })
})
