'use client'

import { type JsxEditorProps, NestedLexicalEditor, useMdastNodeUpdater } from '@mdxeditor/editor'
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx'
import { Icon } from '@/features/admin/components/Icon'
import { attributeOf, withAttribute } from '@/features/admin/utils/blocks'

/** `<Callout label>` as the reader sees it, its label and text edited in place. */
export function CalloutBlock({ mdastNode }: JsxEditorProps) {
  const update = useMdastNodeUpdater()
  return (
    <aside className="callout rcallout">
      <div className="callout__label">
        <Icon name="callout" />
        <input
          className="rcallout__label"
          aria-label="Callout 라벨"
          value={attributeOf(mdastNode, 'label') ?? ''}
          maxLength={20}
          onChange={(event) =>
            update({ attributes: withAttribute(mdastNode, 'label', event.target.value) })
          }
        />
      </div>
      <NestedLexicalEditor<MdxJsxFlowElement>
        block
        contentEditableProps={{ className: 'rnested' }}
        getContent={(node) => node.children}
        getUpdatedMdastNode={(node, children) => ({
          ...node,
          children: children as MdxJsxFlowElement['children'],
        })}
      />
    </aside>
  )
}
