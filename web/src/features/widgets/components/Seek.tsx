'use client'

import './widget.css'
import type { MouseEvent, ReactNode } from 'react'
import { sendWidgetCommand } from '@/features/widgets/hooks/useWidgetCommands'
import { HANDSHAKE, seekTarget } from '@/features/widgets/utils/handshake'

type Props = {
  /** The time to move to, 0 to 1. */
  to?: number | string
  /** The widget's id; the handshake by default. */
  widget?: string
  children?: ReactNode
}

/** `<Seek to={0.95}>`: text that moves the widget to a moment. Without scripts it jumps to it. */
export function Seek({ to, widget = HANDSHAKE, children }: Props) {
  const onClick = (event: MouseEvent) => {
    event.preventDefault()
    sendWidgetCommand({ target: widget, type: 'seek', to: seekTarget(to) })
  }
  return (
    <a href={`#${widget}`} className="action" onClick={onClick}>
      {children}
    </a>
  )
}
