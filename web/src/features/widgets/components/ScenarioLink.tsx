'use client'

import './widget.css'
import type { MouseEvent, ReactNode } from 'react'
import { sendWidgetCommand } from '@/features/widgets/hooks/useWidgetCommands'
import { HANDSHAKE } from '@/features/widgets/utils/handshake'

type Props = {
  /** The scenario to switch to and play through, `loss`. */
  to?: string
  /** The widget's id; the handshake by default. */
  widget?: string
  children?: ReactNode
}

/** `<ScenarioLink to="loss">`: text that switches the widget's scenario and plays it through. */
export function ScenarioLink({ to = '', widget = HANDSHAKE, children }: Props) {
  const onClick = (event: MouseEvent) => {
    event.preventDefault()
    sendWidgetCommand({ target: widget, type: 'scenario', scenario: to })
  }
  return (
    <a href={`#${widget}`} className="action" onClick={onClick}>
      {children}
    </a>
  )
}
