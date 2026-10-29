'use client'

import './ask.css'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { AskPanel } from '@/features/ask/components/AskPanel'
import { AskTab } from '@/features/ask/components/AskTab'
import { useAsk } from '@/features/ask/hooks/useAsk'
import { closeAsk, minimizeAsk, openAsk, useAskMode } from '@/features/ask/hooks/useAskMode'
import { useAskMotion } from '@/features/ask/hooks/useAskMotion'
import { usePanelHeight } from '@/features/ask/hooks/usePanelHeight'
import { useTabPosition } from '@/features/ask/hooks/useTabPosition'

/**
 * A reader's questions about the blog, answered from the post they are on or, elsewhere, from the
 * posts that cover them. Opened by the dock's Ask button; it keeps its thread while folded or
 * closed, and starts over on another page.
 */
export function Ask() {
  const pathname = usePathname() ?? '/'
  const mode = useAskMode()
  const { exchanges, asking, ask, stop } = useAsk(pathname)
  const panel = useRef<HTMLElement>(null)
  const tab = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const focusTab = useRef(false)
  const { panelShown, tabShown } = useAskMotion(mode, { panel, tab, input, focusTab })
  const position = useTabPosition(openAsk)
  const size = usePanelHeight(panel)

  useEffect(() => {
    const box = body.current
    if (box && exchanges.length > 0) box.scrollTop = box.scrollHeight
  }, [exchanges])

  const minimize = (byKeyboard: boolean) => {
    focusTab.current = byKeyboard
    position.place()
    minimizeAsk()
  }

  return (
    <>
      <AskPanel
        shown={panelShown}
        height={size.height}
        exchanges={exchanges}
        asking={asking}
        panelRef={panel}
        bodyRef={body}
        inputRef={input}
        grip={size.handlers}
        onAsk={ask}
        onStop={stop}
        onMinimize={minimize}
        onClose={closeAsk}
      />
      <AskTab shown={tabShown} top={position.top} tabRef={tab} handlers={position.handlers} />
    </>
  )
}
