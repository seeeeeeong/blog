import type { MdastJsx } from '@mdxeditor/editor'
import { describe, expect, it } from 'vitest'
import {
  attributeOf,
  BLOCK_SPECS,
  isLinkable,
  listsStartingPastOne,
  SLASH_ITEMS,
  slashItems,
  tagSource,
  withAttribute,
} from '@/features/admin/utils/blocks'
import { PROSE_COMPONENTS } from '@/features/posts/components/registry'
import { WIDGETS } from '@/features/widgets/components/registry'

const node = (attributes: MdastJsx['attributes'], children: MdastJsx['children'] = []) =>
  ({ type: 'mdxJsxFlowElement', name: 'Diagram', attributes, children }) as MdastJsx

describe('BLOCK_SPECS', () => {
  it('knows every component a post may name, and no other', () => {
    const registered = [...Object.keys(PROSE_COMPONENTS), ...Object.keys(WIDGETS)].sort()

    expect(BLOCK_SPECS.map((spec) => spec.name).sort()).toEqual(registered)
  })
})

describe('slashItems', () => {
  it('offers everything for a bare slash', () => {
    expect(slashItems(null)).toEqual(SLASH_ITEMS)
    expect(slashItems('')).toEqual(SLASH_ITEMS)
  })

  it('finds an item by its name, its hint or another word, in Korean or English', () => {
    expect(slashItems('콜아웃').map((item) => item.key)).toEqual(['callout'])
    expect(slashItems('Callout').map((item) => item.key)).toEqual(['callout'])
    expect(slashItems('그림 아이디어').map((item) => item.key)).toEqual(['idea'])
    expect(slashItems('table').map((item) => item.key)).toEqual(['table'])
    expect(slashItems('없는 것')).toEqual([])
  })

  it('offers only lists and code inside a block', () => {
    expect(slashItems(null, true).map((item) => item.key)).toEqual(['ol', 'ul', 'code'])
    expect(slashItems('Callout', true)).toEqual([])
    expect(slashItems('코드', true).map((item) => item.key)).toEqual(['code'])
  })
})

describe('attributes', () => {
  it('reads a plain attribute, and nothing from an expression', () => {
    const diagram = node([
      { type: 'mdxJsxAttribute', name: 'src', value: '/b.png' },
      {
        type: 'mdxJsxAttribute',
        name: 'to',
        value: { type: 'mdxJsxAttributeValueExpression', value: '0.5' },
      },
    ])

    expect(attributeOf(diagram, 'src')).toBe('/b.png')
    expect(attributeOf(diagram, 'to')).toBeUndefined()
    expect(attributeOf(diagram, 'missing')).toBeUndefined()
  })

  it('sets one attribute in its place and keeps every other', () => {
    const diagram = node([
      { type: 'mdxJsxAttribute', name: 'src', value: '/a.png' },
      { type: 'mdxJsxAttribute', name: 'id', value: 'q' },
    ])

    expect(withAttribute(diagram, 'src', '/b.png')).toEqual([
      { type: 'mdxJsxAttribute', name: 'src', value: '/b.png' },
      { type: 'mdxJsxAttribute', name: 'id', value: 'q' },
    ])
    expect(withAttribute(diagram, 'label', '핵심').at(-1)).toEqual({
      type: 'mdxJsxAttribute',
      name: 'label',
      value: '핵심',
    })
  })

  it('writes a tag as it reads in the MDX, its content shortened', () => {
    expect(tagSource(node([{ type: 'mdxJsxAttribute', name: 'src', value: '/a.png' }]))).toBe(
      '<Diagram src="/a.png" />',
    )
    expect(
      tagSource(
        node(
          [
            {
              type: 'mdxJsxAttribute',
              name: 'to',
              value: { type: 'mdxJsxAttributeValueExpression', value: '0.5' },
            },
            { type: 'mdxJsxAttribute', name: 'open', value: null },
          ],
          [{ type: 'paragraph', children: [] }],
        ),
      ),
    ).toBe('<Diagram to={0.5} open>…</Diagram>')
  })
})

describe('listsStartingPastOne', () => {
  it('names the line where an ordered list starts past 1', () => {
    expect(listsStartingPastOne('문단\n\n3. 셋\n4. 넷')).toEqual([3])
  })

  it('leaves alone a list that starts at 1, however long or loose', () => {
    expect(listsStartingPastOne('1. 하나\n2. 둘\n\n3. 셋\n\n- 점')).toEqual([])
  })

  it('reads no list inside a code fence', () => {
    expect(listsStartingPastOne('```text\n5. 코드\n```')).toEqual([])
  })
})

describe('isLinkable', () => {
  it('takes a web or mail address, or a path or anchor on this site', () => {
    expect(isLinkable('https://example.com/a')).toBe(true)
    expect(isLinkable('http://example.com')).toBe(true)
    expect(isLinkable('mailto:me@example.com')).toBe(true)
    expect(isLinkable('/posts/tcp-handshake')).toBe(true)
    expect(isLinkable('#top')).toBe(true)
  })

  it('refuses a script, a bare word, or an address with spaces', () => {
    expect(isLinkable('javascript:alert(1)')).toBe(false)
    expect(isLinkable('example.com')).toBe(false)
    expect(isLinkable('https://exa mple.com')).toBe(false)
    expect(isLinkable('')).toBe(false)
  })
})
