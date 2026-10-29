import type { Element, Root } from 'hast'
import type { MdxJsxFlowElementHast } from 'mdast-util-mdx-jsx'
import { createCssVariablesTheme, createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { SKIP, visit } from 'unist-util-visit'
import { codeElement, codeLabel, languageOf, type Token } from '@/features/posts/utils/code'

const THEME_NAME = 'site-tokens'
const THEME = createCssVariablesTheme({ name: THEME_NAME, variablePrefix: '--shiki-' })

/** The component that frames a highlighted block; it is the renderer's, never the author's. */
export const CODE_BLOCK = 'CodeBlock'

let highlighter: Promise<HighlighterCore> | undefined

// The JavaScript engine needs no WebAssembly, and only these grammars are bundled.
function loadHighlighter(): Promise<HighlighterCore> {
  highlighter ??= createHighlighterCore({
    themes: [THEME],
    langs: [
      import('shiki/langs/kotlin.mjs'),
      import('shiki/langs/java.mjs'),
      import('shiki/langs/typescript.mjs'),
      import('shiki/langs/tsx.mjs'),
      import('shiki/langs/javascript.mjs'),
      import('shiki/langs/sql.mjs'),
      import('shiki/langs/shellscript.mjs'),
      import('shiki/langs/json.mjs'),
      import('shiki/langs/yaml.mjs'),
    ],
    engine: createJavaScriptRegexEngine(),
  })
  return highlighter
}

/** The code split into lines of tokens; a language it does not know comes out plain. */
export async function tokenize(code: string, language: string | undefined): Promise<Token[][]> {
  const shiki = await loadHighlighter()
  if (language === undefined || !shiki.getLoadedLanguages().includes(language)) {
    return code.split('\n').map((content) => [{ content }])
  }
  const { tokens } = shiki.codeToTokens(code, { lang: language, theme: THEME_NAME })
  return tokens.map((line) => line.map(({ content, color }) => ({ content, color })))
}

function textOf(node: Element): string {
  return node.children.map((child) => (child.type === 'text' ? child.value : '')).join('')
}

async function codeBlock(code: Element, meta: string | null | undefined) {
  const language = languageOf(code.properties.className)
  const source = textOf(code).replace(/\n$/, '')
  const block: MdxJsxFlowElementHast = {
    type: 'mdxJsxFlowElement',
    name: CODE_BLOCK,
    attributes: [
      { type: 'mdxJsxAttribute', name: 'label', value: codeLabel(meta, language) },
      { type: 'mdxJsxAttribute', name: 'code', value: source },
    ],
    children: [codeElement(await tokenize(source, language))],
  }
  return block
}

/** Each fenced block, highlighted while compiling, framed by [CODE_BLOCK] with its source to copy. */
export function rehypeCodeBlocks() {
  return async (tree: Root) => {
    const blocks: { parent: { children: unknown[] }; index: number; code: Element }[] = []
    visit(tree, 'element', (node, index, parent) => {
      const code = node.children[0]
      if (node.tagName !== 'pre' || !parent || index === undefined) return
      if (code?.type === 'element' && code.tagName === 'code') blocks.push({ parent, index, code })
      return SKIP
    })
    const framed = await Promise.all(
      blocks.map(({ code }) => codeBlock(code, (code.data as { meta?: string } | undefined)?.meta)),
    )
    blocks.forEach(({ parent, index }, i) => {
      const block = framed[i]
      if (block) parent.children[index] = block
    })
  }
}
