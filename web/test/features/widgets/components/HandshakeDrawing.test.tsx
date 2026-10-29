import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HandshakeDrawing } from '@/features/widgets/components/HandshakeDrawing'
import { SCENARIOS } from '@/features/widgets/utils/handshake'

describe('HandshakeDrawing', () => {
  it('shows every packet named and both ends established at the end', () => {
    const out = renderToStaticMarkup(
      <HandshakeDrawing packets={SCENARIOS.normal} t={1} scale={1} />,
    )

    for (const label of ['SYN', 'SYN-ACK', 'ACK']) expect(out).toContain(`>${label}</text>`)
    expect(out.match(/>ESTABLISHED</g)).toHaveLength(2)
    expect(out).not.toContain('RTO')
  })

  it('marks the lost SYN and the timeout before the retry', () => {
    const out = renderToStaticMarkup(
      <HandshakeDrawing packets={SCENARIOS.loss} t={0.4} scale={1} />,
    )

    expect(out).toContain('>유실</text>')
    expect(out).toContain('>RTO</text>')
    expect(out).toContain('stroke-dasharray="3 4"')
  })

  it('grows its text on a narrow screen', () => {
    const out = renderToStaticMarkup(
      <HandshakeDrawing packets={SCENARIOS.normal} t={0} scale={1.5} />,
    )

    expect(out).toContain('style="--hs-scale:1.5"')
    expect(out).toContain('y="59"')
  })
})
