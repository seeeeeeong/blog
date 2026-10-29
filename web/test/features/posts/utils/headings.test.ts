import type { Heading, Root } from 'mdast'
import { describe, expect, it } from 'vitest'
import { remarkHeadingIds, slugify } from '@/features/posts/utils/headings'

function heading(depth: Heading['depth'], value: string): Heading {
  return { type: 'heading', depth, children: [{ type: 'text', value }] }
}

const idOf = (node: Root['children'][number] | undefined) => (node as Heading).data?.hProperties?.id

describe('slugify', () => {
  it('keeps the letters of any script and joins the words with hyphens', () => {
    expect(slugify('왜 두 번이 아니라 세 번인가')).toBe('왜-두-번이-아니라-세-번인가')
    expect(slugify('  HTTP/1.1 vs. HTTP/3  ')).toBe('http11-vs-http3')
    expect(slugify('accept() - backlog')).toBe('accept-backlog')
  })

  it('is empty for a heading of symbols alone', () => {
    expect(slugify('?!')).toBe('')
  })
})

describe('remarkHeadingIds', () => {
  it('gives section headings unique ids and leaves the others alone', () => {
    const tree: Root = {
      type: 'root',
      children: [
        heading(1, 'Title'),
        heading(2, '정리'),
        heading(3, '정리'),
        heading(4, 'Deep'),
        heading(2, '?!'),
      ],
    }

    remarkHeadingIds()(tree)

    expect(tree.children.map(idOf)).toEqual([undefined, '정리', '정리-1', undefined, 'section'])
  })
})
