'use client'

import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  const media = matchMedia(QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

const reduced = () => matchMedia(QUERY).matches
const serverReduced = () => false

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, reduced, serverReduced)
}
