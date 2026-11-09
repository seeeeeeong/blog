'use client'

import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { insertJsx$, rootEditor$, useCellValue, usePublisher } from '@mdxeditor/editor'
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  type LexicalEditor,
  type TextFormatType,
} from 'lexical'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/features/admin/components/Icon'
import { isLinkable, TONES } from '@/features/admin/utils/blocks'

type Active = { bold: boolean; italic: boolean; code: boolean; link: boolean; heading: boolean }

const NONE: Active = { bold: false, italic: false, code: false, link: false, heading: false }

type Place = { top: number; left: number }

const keep = (event: { preventDefault: () => void }) => event.preventDefault()

// A block's own editor sits inside the page's, so the page's must not take its selection.
function selects(editor: LexicalEditor, dom: Selection) {
  const node = dom.anchorNode
  const element = node instanceof Element ? node : node?.parentElement
  return element?.closest('[contenteditable="true"]') === editor.getRootElement()
}

/**
 * Over selected text: bold, italic, code, a link, `<Mark>`, a `<Tone>` color, and a section title
 * but inside a block.
 */
export function SelectionBar({ insideBlock = false }: { insideBlock?: boolean }) {
  const [editor] = useLexicalComposerContext()
  const page = useCellValue(rootEditor$)
  const insertJsx = usePublisher(insertJsx$)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [place, setPlace] = useState<Place | null>(null)
  const [active, setActive] = useState<Active>(NONE)
  const [linking, setLinking] = useState(false)
  const [url, setUrl] = useState('')
  const field = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (linking) field.current?.focus()
  }, [linking])

  useEffect(
    () => page?.registerRootListener((root) => setAnchor(root?.parentElement ?? null)),
    [page],
  )

  useEffect(
    () =>
      editor.registerUpdateListener(({ editorState }) =>
        editorState.read(() => {
          const selection = $getSelection()
          const dom = window.getSelection()
          if (
            !anchor ||
            !$isRangeSelection(selection) ||
            selection.isCollapsed() ||
            !dom?.rangeCount ||
            !selects(editor, dom)
          ) {
            if (!linking) setPlace(null)
            return
          }
          const rect = dom.getRangeAt(0).getBoundingClientRect()
          const base = anchor.getBoundingClientRect()
          setPlace({ top: rect.top - base.top, left: rect.left - base.left + rect.width / 2 })
          const node = selection.anchor.getNode()
          setActive({
            bold: selection.hasFormat('bold'),
            italic: selection.hasFormat('italic'),
            code: selection.hasFormat('code'),
            link: $isLinkNode(node) || $isLinkNode(node.getParent()),
            heading: $isHeadingNode(node.getTopLevelElement()),
          })
        }),
      ),
    [editor, anchor, linking],
  )

  if (!anchor || !place) return null

  const format = (type: TextFormatType) => editor.dispatchCommand(FORMAT_TEXT_COMMAND, type)

  // The selected words go inside the component; any formatting within them is dropped.
  const wrap = (name: 'Mark' | 'Tone', color?: string) => {
    const text = editor.getEditorState().read(() => $getSelection()?.getTextContent() ?? '')
    if (!text) return
    insertJsx({
      kind: 'text',
      name,
      props: color ? { color } : {},
      children: [{ type: 'text', value: text }],
    })
  }

  const heading = () =>
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      $setBlocksType(selection, () =>
        active.heading ? $createParagraphNode() : $createHeadingNode('h2'),
      )
    })

  const link = () => {
    if (active.link) editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    else setLinking(true)
  }

  const applyLink = (event: FormEvent) => {
    event.preventDefault()
    const target = url.trim()
    if (!isLinkable(target)) return
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, target)
    setLinking(false)
    setUrl('')
  }

  return createPortal(
    <div className="rbar" style={{ top: place.top, left: place.left }} role="toolbar">
      {linking ? (
        <form className="rbar__link" onSubmit={applyLink}>
          <input
            ref={field}
            aria-label="링크 주소"
            value={url}
            placeholder="https://"
            spellCheck={false}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => event.key === 'Escape' && setLinking(false)}
          />
          <button type="submit" aria-label="링크 걸기" disabled={!isLinkable(url.trim())}>
            <Icon name="check" />
          </button>
        </form>
      ) : (
        <>
          <button
            type="button"
            aria-label="굵게"
            aria-pressed={active.bold}
            onMouseDown={keep}
            onClick={() => format('bold')}
          >
            <Icon name="bold" />
          </button>
          <button
            type="button"
            aria-label="기울임"
            aria-pressed={active.italic}
            onMouseDown={keep}
            onClick={() => format('italic')}
          >
            <Icon name="italic" />
          </button>
          <button
            type="button"
            aria-label="코드"
            aria-pressed={active.code}
            onMouseDown={keep}
            onClick={() => format('code')}
          >
            <Icon name="inline" />
          </button>
          <button
            type="button"
            aria-label="링크"
            aria-pressed={active.link}
            onMouseDown={keep}
            onClick={link}
          >
            <Icon name="link" />
          </button>
          <span className="rbar__sep" />
          <button type="button" aria-label="강조" onMouseDown={keep} onClick={() => wrap('Mark')}>
            <Icon name="mark" />
          </button>
          {TONES.map(({ color, label }) => (
            <button
              key={color}
              type="button"
              className="rbar__tone"
              aria-label={label}
              onMouseDown={keep}
              onClick={() => wrap('Tone', color)}
            >
              <span className={`rbar__dot rbar__dot--${color}`} />
            </button>
          ))}
          {!insideBlock && <span className="rbar__sep" />}
          {!insideBlock && (
            <button
              type="button"
              aria-label="섹션 제목"
              aria-pressed={active.heading}
              onMouseDown={keep}
              onClick={heading}
            >
              H2
            </button>
          )}
        </>
      )}
    </div>,
    anchor,
  )
}
