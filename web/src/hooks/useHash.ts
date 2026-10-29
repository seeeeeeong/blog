'use client'

import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  addEventListener('hashchange', onChange)
  return () => removeEventListener('hashchange', onChange)
}

const hash = () => location.hash
const serverHash = () => ''

/** The location's `#fragment`, which the server never sees. */
export function useHash(): string {
  return useSyncExternalStore(subscribe, hash, serverHash)
}
