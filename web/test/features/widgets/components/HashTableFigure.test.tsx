import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HashTableFigure } from '@/features/widgets/components/HashTableFigure'
import { REST_COUNT, readoutOf, stateOf } from '@/features/widgets/utils/hashTable'

const readoutIn = (html: string) => html.match(/data-readout="">([^<]*)</)?.[1]

describe('HashTableFigure', () => {
  it('renders in the light theme with a Korean description', () => {
    const out = renderToStaticMarkup(<HashTableFigure part="chaining" />)

    expect(out).toContain(
      '<div class="iso hash-figure" data-theme="light" id="hash-table-chaining">',
    )
    expect(out).toMatch(
      /<svg class="iso-svg"[^>]*role="img" aria-label="해시 테이블을 원반 정리대로/,
    )
    expect(out).toContain('aria-label="넣은 키 개수"')
  })

  it.each(['chaining', 'probing', 'load'] as const)(
    'says the model’s rest readout for %s',
    (part) => {
      const out = renderToStaticMarkup(<HashTableFigure part={part} />)

      expect(readoutIn(out)).toBe(readoutOf(stateOf(part, REST_COUNT[part])))
    },
  )

  it('opens on chaining for an unknown part', () => {
    const out = renderToStaticMarkup(<HashTableFigure part="bogus" />)

    expect(out).toContain('id="hash-table-chaining"')
    expect(readoutIn(out)).toBe('pear → 2번 칸 · 체인 3')
  })

  it('renders the same markup twice', () => {
    const once = renderToStaticMarkup(<HashTableFigure part="load" />)
    const twice = renderToStaticMarkup(<HashTableFigure part="load" />)

    expect(twice).toBe(once)
  })
})
