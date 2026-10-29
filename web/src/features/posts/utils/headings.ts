import type { Root } from 'mdast'
import { toString as textOf } from 'mdast-util-to-string'
import { visit } from 'unist-util-visit'

/** `왜 두 번이 아니라 세 번인가` to `왜-두-번이-아니라-세-번인가`: letters of any script stay. */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Ids for the `##` and `###` headings, unique on the page, so each can be linked to. */
export function remarkHeadingIds() {
  return (tree: Root) => {
    const seen = new Map<string, number>()
    visit(tree, 'heading', (node) => {
      if (node.depth < 2 || node.depth > 3) return
      const base = slugify(textOf(node)) || 'section'
      const count = seen.get(base) ?? 0
      seen.set(base, count + 1)
      const id = count === 0 ? base : `${base}-${count}`
      node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } }
    })
  }
}
