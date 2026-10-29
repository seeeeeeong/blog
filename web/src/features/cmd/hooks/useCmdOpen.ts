'use client'

import { useSyncExternalStore } from 'react'

// The dock's button and the palette sit apart in the layout, so they share this rather than a provider.
let open = false
let returnFocus: HTMLElement | null = null
const listeners = new Set<() => void>()

function set(next: boolean) {
  open = next
  for (const listener of listeners) listener()
}

/** Opens the palette, remembering what had focus so closing it can give focus back. */
export function openCmd() {
  if (open) return
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  set(true)
}

export function closeCmd() {
  if (!open) return
  set(false)
  returnFocus?.focus()
  returnFocus = null
}

export function toggleCmd() {
  if (open) closeCmd()
  else openCmd()
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

const isOpen = () => open
const serverOpen = () => false

/** Whether the palette is open. */
export function useCmdOpen(): boolean {
  return useSyncExternalStore(subscribe, isOpen, serverOpen)
}
