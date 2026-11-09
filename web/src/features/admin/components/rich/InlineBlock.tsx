'use client'

import { type JsxEditorProps, NestedLexicalEditor } from '@mdxeditor/editor'
import type { MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { attributeOf, tagSource } from '@/features/admin/utils/blocks'

function classOf(name: string | null, color: string | undefined) {
  if (name === 'Mark') return 'rinline mark'
  if (name === 'Tone') return `rinline tone--${color}`
  return 'rinline rlink'
}

/** `<Mark>`, `<Tone>`, `<Seek>` and `<ScenarioLink>`: their text in the look they give it. */
export function InlineBlock({ mdastNode }: JsxEditorProps) {
  return (
    <span
      className={classOf(mdastNode.name, attributeOf(mdastNode, 'color'))}
      title={tagSource(mdastNode)}
    >
      <NestedLexicalEditor<MdxJsxTextElement>
        contentEditableProps={{ className: 'rnested' }}
        getContent={(node) => node.children}
        getUpdatedMdastNode={(node, children) => ({
          ...node,
          children: children as MdxJsxTextElement['children'],
        })}
      />
    </span>
  )
}
