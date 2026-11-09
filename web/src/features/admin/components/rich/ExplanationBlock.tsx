'use client'

import { type JsxEditorProps, NestedLexicalEditor } from '@mdxeditor/editor'
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx'
import { useState } from 'react'
import { Icon } from '@/features/admin/components/Icon'

/** `<Explanation>` inside a quiz: the solution a reader opens, folded away when not wanted. */
export function ExplanationBlock(_: JsxEditorProps) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rsolution">
      <button
        type="button"
        className="rsolution__toggle"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Icon name="chevron" />
        풀이
      </button>
      <div hidden={!open}>
        <NestedLexicalEditor<MdxJsxFlowElement>
          block
          contentEditableProps={{ className: 'rnested' }}
          getContent={(node) => node.children}
          getUpdatedMdastNode={(node, children) => ({
            ...node,
            children: children as MdxJsxFlowElement['children'],
          })}
        />
      </div>
    </div>
  )
}
