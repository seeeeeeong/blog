import { describe, expect, it } from 'vitest'
import { WIDGETS } from '@/features/widgets/components/registry'

describe('WIDGETS', () => {
  it('registers the handshake, the links that drive it and the idea note, nothing more', () => {
    expect(Object.keys(WIDGETS).sort()).toEqual([
      'HandshakeWidget',
      'ScenarioLink',
      'Seek',
      'WidgetIdea',
    ])
  })
})
