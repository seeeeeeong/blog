import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Tone } from '@/features/posts/components/Tone'

describe('Tone', () => {
  it('colors a term with one of the accents', () => {
    expect(renderToStaticMarkup(<Tone color="teal">SYN-ACK</Tone>)).toBe(
      '<span class="tone tone--teal">SYN-ACK</span>',
    )
  })

  it('takes no class from a color it does not know', () => {
    expect(renderToStaticMarkup(<Tone color="x onclick">SYN</Tone>)).toBe(
      '<span class="tone">SYN</span>',
    )
  })
})
