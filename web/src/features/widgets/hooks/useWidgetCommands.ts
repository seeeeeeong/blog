'use client'

import { useEffect, useRef } from 'react'

/** What a link in the text asks the widget [target] to do. */
export type WidgetCommand =
  | { target: string; type: 'seek'; to: number }
  | { target: string; type: 'scenario'; scenario: string }

// Links and widgets sit apart in a post's body, so they meet here rather than through a provider.
const commands = new EventTarget()

export function sendWidgetCommand(command: WidgetCommand) {
  commands.dispatchEvent(new CustomEvent<WidgetCommand>('command', { detail: command }))
}

/** Calls [onCommand] with each command sent to [target] while mounted. */
export function useWidgetCommands(target: string, onCommand: (command: WidgetCommand) => void) {
  const latest = useRef(onCommand)
  latest.current = onCommand
  useEffect(() => {
    const listener = (event: Event) => {
      const command = (event as CustomEvent<WidgetCommand>).detail
      if (command.target === target) latest.current(command)
    }
    commands.addEventListener('command', listener)
    return () => commands.removeEventListener('command', listener)
  }, [target])
}
