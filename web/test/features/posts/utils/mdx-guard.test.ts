import type { Paragraph, Root } from 'mdast'
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx'
import { describe, expect, it } from 'vitest'
import { isLiteralAttribute, isSafeUrl, remarkGuard } from '@/features/posts/utils/mdx-guard'

const text = (value: string) => ({ type: 'text' as const, value })

function element(name: string | null, attributes: MdxJsxFlowElement['attributes'] = []) {
  return { type: 'mdxJsxFlowElement', name, attributes, children: [] } as MdxJsxFlowElement
}

function guarded(children: Root['children'], allowed: readonly string[] = ['Callout']): Root {
  const tree: Root = { type: 'root', children }
  remarkGuard(allowed)(tree)
  return tree
}

describe('isSafeUrl', () => {
  it.each([
    '/posts/a',
    '#why',
    'relative/path',
    'https://example.com',
    'http://a.b',
    'mailto:me@x.y',
  ])('lets %s through', (url) => {
    expect(isSafeUrl(url)).toBe(true)
  })

  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    ' java\tscript:x',
    'data:text/html,x',
    'vbscript:x',
  ])('stops %s', (url) => {
    expect(isSafeUrl(url)).toBe(false)
  })
})

describe('isLiteralAttribute', () => {
  const expression = (value: string) => ({ type: 'mdxJsxAttributeValueExpression' as const, value })

  it('takes a string, a bare flag, a number and a boolean', () => {
    expect(isLiteralAttribute({ type: 'mdxJsxAttribute', name: 'label', value: '핵심' })).toBe(true)
    expect(isLiteralAttribute({ type: 'mdxJsxAttribute', name: 'open', value: null })).toBe(true)
    expect(
      isLiteralAttribute({ type: 'mdxJsxAttribute', name: 'to', value: expression('0.95') }),
    ).toBe(true)
    expect(
      isLiteralAttribute({ type: 'mdxJsxAttribute', name: 'on', value: expression('-1') }),
    ).toBe(true)
    expect(
      isLiteralAttribute({ type: 'mdxJsxAttribute', name: 'on', value: expression('false') }),
    ).toBe(true)
  })

  it('refuses any other expression and a spread', () => {
    expect(
      isLiteralAttribute({ type: 'mdxJsxAttribute', name: 'to', value: expression('fetch(x)') }),
    ).toBe(false)
    expect(
      isLiteralAttribute({ type: 'mdxJsxAttribute', name: 'to', value: expression('1e9') }),
    ).toBe(false)
    expect(isLiteralAttribute({ type: 'mdxJsxExpressionAttribute', value: '...props' })).toBe(false)
  })
})

describe('remarkGuard', () => {
  it('keeps a registered element, its attributes trimmed to literals', () => {
    const callout = element('Callout', [
      { type: 'mdxJsxAttribute', name: 'label', value: '핵심' },
      { type: 'mdxJsxExpressionAttribute', value: '...props' },
    ])

    const tree = guarded([callout])

    expect(tree.children).toEqual([
      { ...callout, attributes: [{ type: 'mdxJsxAttribute', name: 'label', value: '핵심' }] },
    ])
  })

  it('drops an unregistered element, a fragment, an import and an expression', () => {
    const tree = guarded([
      element('script'),
      element('Widget'),
      element(null),
      { type: 'mdxjsEsm', value: "import x from 'y'" },
      { type: 'mdxFlowExpression', value: 'process.exit()' },
      { type: 'paragraph', children: [text('kept')] },
    ])

    expect(tree.children).toEqual([{ type: 'paragraph', children: [text('kept')] }])
  })

  it('drops what is not registered even deep inside one that is', () => {
    const callout = element('Callout')
    callout.children = [
      { type: 'paragraph', children: [text('a'), { type: 'mdxTextExpression', value: '1' }] },
    ]

    const tree = guarded([callout])

    expect((tree.children[0] as MdxJsxFlowElement).children).toEqual([
      { type: 'paragraph', children: [text('a')] },
    ])
  })

  it('keeps the text of an unsafe link, and drops an unsafe image', () => {
    const tree = guarded([
      {
        type: 'paragraph',
        children: [
          { type: 'link', url: 'javascript:alert(1)', children: [text('click')] },
          { type: 'image', url: 'javascript:alert(1)' },
          { type: 'link', url: '/posts/a', children: [text('safe')] },
        ],
      },
    ])

    expect((tree.children[0] as Paragraph).children).toEqual([
      text('click'),
      { type: 'link', url: '/posts/a', children: [text('safe')] },
    ])
  })
})
