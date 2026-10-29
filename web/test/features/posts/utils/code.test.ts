import { describe, expect, it } from 'vitest'
import {
  codeElement,
  codeLabel,
  languageOf,
  titleOf,
  tokenClass,
} from '@/features/posts/utils/code'

describe('tokenClass', () => {
  it("maps the theme's categories to the site's token classes", () => {
    expect(tokenClass('var(--shiki-token-keyword)')).toBe('tk-k')
    expect(tokenClass('var(--shiki-token-function)')).toBe('tk-f')
    expect(tokenClass('var(--shiki-token-constant)')).toBe('tk-n')
    expect(tokenClass('var(--shiki-token-string)')).toBe('tk-s')
    expect(tokenClass('var(--shiki-token-string-expression)')).toBe('tk-s')
    expect(tokenClass('var(--shiki-token-punctuation)')).toBe('tk-p')
    expect(tokenClass('var(--shiki-token-comment)')).toBe('tk-c')
  })

  it('leaves plain code and anything else unclassed', () => {
    expect(tokenClass('var(--shiki-foreground)')).toBeUndefined()
    expect(tokenClass('#ff0000')).toBeUndefined()
    expect(tokenClass(undefined)).toBeUndefined()
  })
})

describe('the fence', () => {
  it('reads the title from the meta string', () => {
    expect(titleOf('title="Server.kt"')).toBe('Server.kt')
    expect(titleOf('{1,3} title="a b.kt" other')).toBe('a b.kt')
    expect(titleOf('subtitle="x"')).toBeUndefined()
    expect(titleOf(null)).toBeUndefined()
  })

  it('reads the language from the class', () => {
    expect(languageOf(['language-kotlin'])).toBe('kotlin')
    expect(languageOf(['other'])).toBeUndefined()
    expect(languageOf(undefined)).toBeUndefined()
  })

  it('labels the card with the title, else the language, else nothing', () => {
    expect(codeLabel('title="Server.kt"', 'kotlin')).toBe('Server.kt')
    expect(codeLabel(undefined, 'kotlin')).toBe('kotlin')
    expect(codeLabel(undefined, undefined)).toBe('')
  })
})

describe('codeElement', () => {
  it('puts each line in a .line span, newline separated, with classed tokens', () => {
    const pre = codeElement([
      [{ content: 'val', color: 'var(--shiki-token-keyword)' }, { content: ' a' }],
      [],
    ])

    expect(pre).toEqual({
      type: 'element',
      tagName: 'pre',
      properties: {},
      children: [
        {
          type: 'element',
          tagName: 'code',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'span',
              properties: { className: ['line'] },
              children: [
                {
                  type: 'element',
                  tagName: 'span',
                  properties: { className: ['tk-k'] },
                  children: [{ type: 'text', value: 'val' }],
                },
                { type: 'text', value: ' a' },
              ],
            },
            { type: 'text', value: '\n' },
            { type: 'element', tagName: 'span', properties: { className: ['line'] }, children: [] },
          ],
        },
      ],
    })
  })
})
