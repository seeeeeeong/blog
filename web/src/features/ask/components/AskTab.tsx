import type { KeyboardEventHandler, MouseEventHandler, PointerEventHandler, Ref } from 'react'

type Handlers = {
  onPointerDown: PointerEventHandler<HTMLButtonElement>
  onPointerMove: PointerEventHandler<HTMLButtonElement>
  onPointerUp: PointerEventHandler<HTMLButtonElement>
  onClick: MouseEventHandler<HTMLButtonElement>
  onKeyDown: KeyboardEventHandler<HTMLButtonElement>
}

type Props = {
  shown: boolean
  /** Its top in the viewport, or none for the stylesheet's until it is first placed. */
  top: number | null
  tabRef?: Ref<HTMLButtonElement>
  handlers: Handlers
}

/** The minimized panel: a tab on the right edge that reopens it and can be dragged up and down. */
export function AskTab({ shown, top, tabRef, handlers }: Props) {
  return (
    <button
      ref={tabRef}
      className="ask-tab"
      type="button"
      hidden={!shown}
      style={top === null ? undefined : { top }}
      aria-label="Ask 다시 열기"
      aria-description="드래그하거나 위아래 방향키로 위치를 옮길 수 있습니다. Enter를 누르면 다시 열립니다."
      {...handlers}
    >
      <span className="ask__orb" aria-hidden="true" />
    </button>
  )
}
