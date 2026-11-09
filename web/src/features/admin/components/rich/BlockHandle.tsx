'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin'
import { $createParagraphNode, $createTextNode, $getNearestNodeFromDOMNode } from 'lexical'
import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/features/admin/components/Icon'

const isOnHandle = (element: HTMLElement) => element.closest('.rhandle') !== null

/**
 * Beside the block under the pointer: + opens the slash menu on a new line below it, and the
 * grip drags the block somewhere else.
 */
export function BlockHandle() {
  const [editor] = useLexicalComposerContext()
  const handle = useRef<HTMLDivElement>(null)
  const line = useRef<HTMLDivElement>(null)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [target, setTarget] = useState<HTMLElement | null>(null)

  useEffect(
    () => editor.registerRootListener((root) => setAnchor(root?.parentElement ?? null)),
    [editor],
  )

  const insertBelow = () => {
    if (!target) return
    editor.update(() => {
      const block = $getNearestNodeFromDOMNode(target)
      if (!block) return
      const paragraph = $createParagraphNode().append($createTextNode('/'))
      block.insertAfter(paragraph)
      paragraph.selectEnd()
    })
    editor.focus()
  }

  if (!anchor) return null
  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchor}
      menuRef={handle}
      targetLineRef={line}
      isOnMenu={isOnHandle}
      onElementChanged={setTarget}
      menuComponent={
        <div ref={handle} className="rhandle">
          <button type="button" aria-label="아래에 블록 넣기" onClick={insertBelow}>
            <Icon name="plus" />
          </button>
          <span className="rhandle__grip" title="끌어서 옮기기">
            <Icon name="grip" />
          </span>
        </div>
      }
      targetLineComponent={<div ref={line} className="rhandle__line" />}
    />
  )
}
