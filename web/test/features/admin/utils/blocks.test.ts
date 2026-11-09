import type { MdastJsx } from '@mdxeditor/editor'
import { describe, expect, it } from 'vitest'
import {
  attributeOf,
  BLOCK_SPECS,
  isLinkable,
  joinAnswers,
  listsStartingPastOne,
  SLASH_ITEMS,
  slashItems,
  splitAnswers,
  tagSource,
  withAttribute,
} from '@/features/admin/utils/blocks'
import { PROSE_COMPONENTS } from '@/features/posts/components/registry'
import { WIDGETS } from '@/features/widgets/components/registry'

const node = (attributes: MdastJsx['attributes'], children: MdastJsx['children'] = []) =>
  ({ type: 'mdxJsxFlowElement', name: 'Quiz', attributes, children }) as MdastJsx

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
    expect(slashItems('퀴즈').map((item) => item.key)).toEqual(['quiz'])
    expect(slashItems('Callout').map((item) => item.key)).toEqual(['callout'])
    expect(slashItems('도전 문제').map((item) => item.key)).toEqual(['quiz'])
    expect(slashItems('table').map((item) => item.key)).toEqual(['table'])
    expect(slashItems('없는 것')).toEqual([])
  })
})

describe('attributes', () => {
  it('reads a plain attribute, and nothing from an expression', () => {
    const quiz = node([
      { type: 'mdxJsxAttribute', name: 'answers', value: '3|셋' },
      {
        type: 'mdxJsxAttribute',
        name: 'to',
        value: { type: 'mdxJsxAttributeValueExpression', value: '0.5' },
      },
    ])

    expect(attributeOf(quiz, 'answers')).toBe('3|셋')
    expect(attributeOf(quiz, 'to')).toBeUndefined()
    expect(attributeOf(quiz, 'missing')).toBeUndefined()
  })

  it('sets one attribute in its place and keeps every other', () => {
    const quiz = node([
      { type: 'mdxJsxAttribute', name: 'answers', value: '3' },
      { type: 'mdxJsxAttribute', name: 'id', value: 'q' },
    ])

    expect(withAttribute(quiz, 'answers', '3|셋')).toEqual([
      { type: 'mdxJsxAttribute', name: 'answers', value: '3|셋' },
      { type: 'mdxJsxAttribute', name: 'id', value: 'q' },
    ])
    expect(withAttribute(quiz, 'label', '핵심').at(-1)).toEqual({
      type: 'mdxJsxAttribute',
      name: 'label',
      value: '핵심',
    })
  })

  it('splits answers on |, dropping blanks, and joins them back', () => {
    expect(splitAnswers(' 3 | 세 개 || ')).toEqual(['3', '세 개'])
    expect(splitAnswers(undefined)).toEqual([])
    expect(joinAnswers(['3', '세 개'])).toBe('3|세 개')
  })

  it('writes a tag as it reads in the MDX, its content shortened', () => {
    expect(tagSource(node([{ type: 'mdxJsxAttribute', name: 'src', value: '/a.png' }]))).toBe(
      '<Quiz src="/a.png" />',
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
    ).toBe('<Quiz to={0.5} open>…</Quiz>')
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
    expect(isLinkable('#quiz')).toBe(true)
  })

  it('refuses a script, a bare word, or an address with spaces', () => {
    expect(isLinkable('javascript:alert(1)')).toBe(false)
    expect(isLinkable('example.com')).toBe(false)
    expect(isLinkable('https://exa mple.com')).toBe(false)
    expect(isLinkable('')).toBe(false)
  })
})
