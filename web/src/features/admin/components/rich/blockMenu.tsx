'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  addComposerChild$,
  addNestedEditorChild$,
  realmPlugin,
  useNestedEditorContext,
} from '@mdxeditor/editor'
import { COMMAND_PRIORITY_CRITICAL, FORMAT_TEXT_COMMAND, type TextFormatType } from 'lexical'
import { useEffect } from 'react'
import { BlockHandle } from '@/features/admin/components/rich/BlockHandle'
import { KeyBar } from '@/features/admin/components/rich/KeyBar'
import { SelectionBar } from '@/features/admin/components/rich/SelectionBar'
import { SlashMenu } from '@/features/admin/components/rich/SlashMenu'

// The reader renders none of these: MDX keeps them as HTML, which the post drops.
const UNRENDERED = new Set<TextFormatType>([
  'underline',
  'strikethrough',
  'highlight',
  'subscript',
  'superscript',
])

function FormatGuard() {
  const [editor] = useLexicalComposerContext()
  useEffect(
    () =>
      editor.registerCommand(
        FORMAT_TEXT_COMMAND,
        (format) => UNRENDERED.has(format),
        COMMAND_PRIORITY_CRITICAL,
      ),
    [editor],
  )
  return null
}

function BlockMenu() {
  return (
    <>
      <SlashMenu />
      <BlockHandle />
      <SelectionBar />
      <KeyBar />
      <FormatGuard />
    </>
  )
}

// The text inside `<Mark>` and the like is a block's editor too, but a phrase, not a place for blocks.
function InsideBlockMenu() {
  const { mdastNode } = useNestedEditorContext()
  if (mdastNode.type !== 'mdxJsxFlowElement') return <FormatGuard />
  return (
    <>
      <SlashMenu insideBlock />
      <SelectionBar insideBlock />
      <FormatGuard />
    </>
  )
}

/**
 * The slash menu, the handle beside each block, the bar over selected text, the row over a
 * phone's keyboard, and no formats the post would drop; inside a block such as a Callout, the
 * slash menu and the bar too.
 */
export const blockMenuPlugin = realmPlugin({
  init(realm) {
    realm.pub(addComposerChild$, BlockMenu)
    realm.pub(addNestedEditorChild$, InsideBlockMenu)
  },
})
