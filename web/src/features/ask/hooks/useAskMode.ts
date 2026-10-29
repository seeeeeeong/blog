'use client'

import { useSyncExternalStore } from 'react'
import { type AskMode, toggled } from '@/features/ask/utils/motion'

// The dock's button and the panel sit apart in the layout, so they share this rather than a provider.
let mode: AskMode = 'closed'
let returnFocus: HTMLElement | null = null
const listeners = new Set<() => void>()

function set(next: AskMode) {
  if (next === mode) return
  if (mode === 'closed') {
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  }
  mode = next
  for (const listener of listeners) listener()
  if (next === 'closed') {
    returnFocus?.focus()
    returnFocus = null
  }
}

/** Opens the panel, or closes it when it is open; closing gives focus back to what opened it. */
export const toggleAsk = () => set(toggled(mode))

export const openAsk = () => set('open')

export const minimizeAsk = () => {
  if (mode === 'open') set('minimized')
}

export const closeAsk = () => set('closed')

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

const current = () => mode
const serverMode = (): AskMode => 'closed'

export function useAskMode(): AskMode {
  return useSyncExternalStore(subscribe, current, serverMode)
}
