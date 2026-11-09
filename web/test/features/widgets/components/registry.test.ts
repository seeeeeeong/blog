import { describe, expect, it } from 'vitest'
import { WIDGETS } from '@/features/widgets/components/registry'

describe('WIDGETS', () => {
  it('registers the handshake, the hash table, the links and the idea note, nothing more', () => {
    expect(Object.keys(WIDGETS).sort()).toEqual([
      'HandshakeWidget',
      'HashTableFigure',
      'ScenarioLink',
      'Seek',
      'WidgetIdea',
    ])
  })
})
