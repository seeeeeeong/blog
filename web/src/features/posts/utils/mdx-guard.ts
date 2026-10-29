import type { Nodes, Root } from 'mdast'
import type {
  MdxJsxAttribute,
  MdxJsxExpressionAttribute,
  MdxJsxFlowElement,
  MdxJsxTextElement,
} from 'mdast-util-mdx-jsx'
import { SKIP, visit } from 'unist-util-visit'

// A number or a boolean is all a registered component takes as an expression: `to={0.95}`.
const LITERAL = /^\s*(-?\d+(\.\d+)?|true|false)\s*$/

const SAFE_SCHEMES = ['http:', 'https:', 'mailto:']

const SCRIPT = new Set(['mdxjsEsm', 'mdxFlowExpression', 'mdxTextExpression'])

/** A link the reader may follow: relative, or http, https or mailto. */
export function isSafeUrl(url: string): boolean {
  // Browsers drop whitespace and control characters inside a scheme: `java\tscript:` runs.
  const bare = [...url]
    .filter((char) => char.charCodeAt(0) > 0x20)
    .join('')
    .toLowerCase()
  const scheme = bare.match(/^[a-z][a-z0-9+.-]*:/)?.[0]
  return scheme === undefined || SAFE_SCHEMES.includes(scheme)
}

/** A plain attribute, or one whose expression is a number or a boolean; never a spread. */
export function isLiteralAttribute(
  attribute: MdxJsxAttribute | MdxJsxExpressionAttribute,
): boolean {
  if (attribute.type !== 'mdxJsxAttribute') return false
  const { value } = attribute
  return value == null || typeof value === 'string' || LITERAL.test(value.value)
}

/** What becomes of a node: kept, dropped, or replaced by its children (a link gone bad). */
type Verdict = 'keep' | 'drop' | 'unwrap'

function elementVerdict(node: MdxJsxFlowElement | MdxJsxTextElement, allowed: readonly string[]) {
  if (!node.name || !allowed.includes(node.name)) return 'drop'
  node.attributes = node.attributes.filter(isLiteralAttribute)
  return 'keep'
}

function verdict(node: Nodes, allowed: readonly string[]): Verdict {
  if (SCRIPT.has(node.type)) return 'drop'
  if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
    return elementVerdict(node, allowed)
  }
  if (node.type === 'link') return isSafeUrl(node.url) ? 'keep' : 'unwrap'
  if (node.type === 'image' || node.type === 'definition') {
    return isSafeUrl(node.url) ? 'keep' : 'drop'
  }
  return 'keep'
}

/**
 * Stored MDX is not trusted: it keeps markdown, and JSX only for [allowed] components, each with
 * literal attributes. Imports, exports, `{expressions}`, any other element and unsafe links are
 * dropped before compiling, so none of them runs.
 */
export function remarkGuard(allowed: readonly string[]) {
  return (tree: Root) => {
    visit(tree, (node, index, parent) => {
      if (!parent || index === undefined) return
      const action = verdict(node, allowed)
      if (action === 'keep') return
      const children: Nodes[] = action === 'unwrap' && 'children' in node ? node.children : []
      ;(parent.children as Nodes[]).splice(index, 1, ...children)
      return [SKIP, index]
    })
  }
}
