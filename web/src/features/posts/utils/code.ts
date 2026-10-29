import type { Element, ElementContent } from 'hast'

/** A piece of a highlighted line; [color] is what the theme gave it, if anything. */
export type Token = { content: string; color?: string }

// Shiki's css-variables theme names a category per token; the site's tokens color them.
const TOKEN_CLASSES: Record<string, string> = {
  'token-keyword': 'tk-k',
  'token-function': 'tk-f',
  'token-constant': 'tk-n',
  'token-string': 'tk-s',
  'token-string-expression': 'tk-s',
  'token-punctuation': 'tk-p',
  'token-comment': 'tk-c',
}

/** `var(--shiki-token-keyword)` to `tk-k`; text in the plain code color has no class. */
export function tokenClass(color: string | undefined): string | undefined {
  const name = color?.match(/^var\(--shiki-([a-z-]+)\)$/)?.[1]
  return name === undefined ? undefined : TOKEN_CLASSES[name]
}

/** The fence's `title="Server.kt"`, if it has one. */
export function titleOf(meta: string | null | undefined): string | undefined {
  return meta?.match(/(?:^|\s)title="([^"]*)"/)?.[1]
}

/** The `kotlin` of a `language-kotlin` class. */
export function languageOf(className: unknown): string | undefined {
  const classes = Array.isArray(className) ? className : []
  const language = classes.find((name) => String(name).startsWith('language-'))
  return language === undefined ? undefined : String(language).slice('language-'.length)
}

/** What the card's head says: the file's name, else its language. */
export function codeLabel(meta: string | null | undefined, language: string | undefined): string {
  return titleOf(meta) ?? language ?? ''
}

function tokenNode(token: Token): ElementContent {
  const text: ElementContent = { type: 'text', value: token.content }
  const className = tokenClass(token.color)
  if (className === undefined) return text
  return {
    type: 'element',
    tagName: 'span',
    properties: { className: [className] },
    children: [text],
  }
}

/** `<pre><code>` with a `.line` per line, numbered by the stylesheet. */
export function codeElement(lines: readonly (readonly Token[])[]): Element {
  const children: ElementContent[] = lines.flatMap((line, i) => {
    const node: Element = {
      type: 'element',
      tagName: 'span',
      properties: { className: ['line'] },
      children: line.map(tokenNode),
    }
    return i === 0 ? [node] : [{ type: 'text', value: '\n' }, node]
  })
  return {
    type: 'element',
    tagName: 'pre',
    properties: {},
    children: [{ type: 'element', tagName: 'code', properties: {}, children }],
  }
}
