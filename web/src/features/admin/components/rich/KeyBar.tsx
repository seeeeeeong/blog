'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { activeEditor$, useCellValue } from '@mdxeditor/editor'
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
} from 'lexical'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/features/admin/components/Icon'

const keep = (event: { preventDefault: () => void }) => event.preventDefault()

/** How far the on-screen keyboard reaches up from the bottom of the window. */
function useKeyboardHeight() {
  const [height, setHeight] = useState(0)
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const measure = () =>
      setHeight(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop))
    viewport.addEventListener('resize', measure)
    viewport.addEventListener('scroll', measure)
    return () => {
      viewport.removeEventListener('resize', measure)
      viewport.removeEventListener('scroll', measure)
    }
  }, [])
  return height
}

/**
 * On a phone, a row over the keyboard while writing in the page or in a block: the slash menu,
 * bold, italic, undo.
 */
export function KeyBar() {
  const [page] = useLexicalComposerContext()
  const editor = useCellValue(activeEditor$) ?? page
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [focused, setFocused] = useState(false)
  const keyboard = useKeyboardHeight()

  useEffect(
    () => page.registerRootListener((root) => setAnchor(root?.parentElement ?? null)),
    [page],
  )

  useEffect(() => {
    if (!anchor) return
    const follow = (event: FocusEvent) => {
      const next = event.type === 'focusin' ? event.target : event.relatedTarget
      setFocused(next instanceof HTMLElement && next.isContentEditable && anchor.contains(next))
    }
    anchor.addEventListener('focusin', follow)
    anchor.addEventListener('focusout', follow)
    return () => {
      anchor.removeEventListener('focusin', follow)
      anchor.removeEventListener('focusout', follow)
    }
  }, [anchor])

  if (!focused) return null

  const slash = () =>
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) selection.insertText('/')
    })

  return createPortal(
    <div className="rkeys" style={{ bottom: keyboard }} role="toolbar" aria-label="쓰기 도구">
      <button type="button" aria-label="블록 넣기" onPointerDown={keep} onClick={slash}>
        /
      </button>
      <button
        type="button"
        aria-label="굵게"
        onPointerDown={keep}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
      >
        <Icon name="bold" />
      </button>
      <button
        type="button"
        aria-label="기울임"
        onPointerDown={keep}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
      >
        <Icon name="italic" />
      </button>
      <button
        type="button"
        aria-label="코드"
        onPointerDown={keep}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
      >
        <Icon name="inline" />
      </button>
      <button
        type="button"
        aria-label="되돌리기"
        onPointerDown={keep}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
      >
        <Icon name="undo" />
      </button>
      <button
        type="button"
        aria-label="다시 하기"
        onPointerDown={keep}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
      >
        <Icon name="redo" />
      </button>
    </div>,
    document.body,
  )
}
