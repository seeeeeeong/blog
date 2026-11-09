'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  BLUR_COMMAND,
  COMMAND_PRIORITY_LOW,
  FOCUS_COMMAND,
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

/** On a phone, a row over the keyboard while writing: the slash menu, bold, italic, undo. */
export function KeyBar() {
  const [editor] = useLexicalComposerContext()
  const [focused, setFocused] = useState(false)
  const keyboard = useKeyboardHeight()

  useEffect(() => {
    const focus = editor.registerCommand(
      FOCUS_COMMAND,
      () => {
        setFocused(true)
        return false
      },
      COMMAND_PRIORITY_LOW,
    )
    const blur = editor.registerCommand(
      BLUR_COMMAND,
      () => {
        setFocused(false)
        return false
      },
      COMMAND_PRIORITY_LOW,
    )
    return () => {
      focus()
      blur()
    }
  }, [editor])

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
