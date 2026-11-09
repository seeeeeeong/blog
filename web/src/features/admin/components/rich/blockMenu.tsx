'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { addComposerChild$, realmPlugin } from '@mdxeditor/editor'
import { COMMAND_PRIORITY_CRITICAL, FORMAT_TEXT_COMMAND, type TextFormatType } from 'lexical'
import { useEffect } from 'react'
import { BlockHandle } from '@/features/admin/components/rich/BlockHandle'
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
      <FormatGuard />
    </>
  )
}

/** The slash menu, the handle beside each block, and no formats the post would drop. */
export const blockMenuPlugin = realmPlugin({
  init(realm) {
    realm.pub(addComposerChild$, BlockMenu)
  },
})
