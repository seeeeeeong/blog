import type { CSSProperties, KeyboardEvent, PointerEventHandler, Ref } from 'react'
import { AskForm } from '@/features/ask/components/AskForm'
import { AskIcon } from '@/features/ask/components/AskIcon'
import { AskThread } from '@/features/ask/components/AskThread'
import type { Exchange } from '@/features/ask/utils/conversation'

export const ASK_PANEL_ID = 'ask-panel'

type Grip = {
  onPointerDown: PointerEventHandler<HTMLDivElement>
  onPointerMove: PointerEventHandler<HTMLDivElement>
  onPointerUp: PointerEventHandler<HTMLDivElement>
}

type Props = {
  shown: boolean
  /** The height the grip set, or none for the stylesheet's. */
  height: number | null
  exchanges: readonly Exchange[]
  asking: boolean
  panelRef?: Ref<HTMLElement>
  bodyRef?: Ref<HTMLDivElement>
  inputRef?: Ref<HTMLTextAreaElement>
  grip: Grip
  onAsk: (question: string) => void
  onStop: () => void
  /** [byKeyboard] says whether focus should follow the panel into its tab. */
  onMinimize: (byKeyboard: boolean) => void
  onClose: () => void
}

/** The Ask panel at the bottom right: a grip to resize it, its thread, and the question box. */
export function AskPanel({
  shown,
  height,
  exchanges,
  asking,
  panelRef,
  bodyRef,
  inputRef,
  grip,
  onAsk,
  onStop,
  onMinimize,
  onClose,
}: Props) {
  const style = height === null ? undefined : ({ '--ask-height': `${height}px` } as CSSProperties)

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || event.nativeEvent.isComposing) return
    event.preventDefault()
    onMinimize(true)
  }

  return (
    <section
      ref={panelRef}
      id={ASK_PANEL_ID}
      className="ask"
      role="dialog"
      aria-modal="false"
      aria-label="Ask"
      hidden={!shown}
      style={style}
      onKeyDown={onKeyDown}
    >
      {/* biome-ignore lint/a11y/useSemanticElements: a drag handle, which an hr cannot hold */}
      <div
        className="ask__grip"
        role="separator"
        aria-orientation="horizontal"
        aria-label="패널 높이 조절"
        {...grip}
      />
      <header className="ask__head">
        <span>Ask</span>
        <div className="ask__actions">
          <button
            className="ask__button"
            type="button"
            aria-label="Ask 최소화"
            onClick={(event) => onMinimize(event.detail === 0)}
          >
            <AskIcon name="minimize" />
          </button>
          <button className="ask__button" type="button" aria-label="Ask 닫기" onClick={onClose}>
            <AskIcon name="close" />
          </button>
        </div>
      </header>
      <div ref={bodyRef} className="ask__body">
        {exchanges.length === 0 ? (
          <div className="ask__empty">
            <span className="ask__orb ask__orb--large" aria-hidden="true" />
          </div>
        ) : (
          <AskThread exchanges={exchanges} />
        )}
      </div>
      <AskForm asking={asking} inputRef={inputRef} onAsk={onAsk} onStop={onStop} />
    </section>
  )
}
