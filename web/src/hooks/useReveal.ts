'use client'

import { type RefObject, useEffect } from 'react'

const STAGGER_MS = 45

const reveals = new WeakMap<Element, () => void>()
let observer: IntersectionObserver | undefined

/** One observer for every element, so those entering together reveal one after another. */
function sharedObserver(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry, i) => {
          observer?.unobserve(entry.target)
          const reveal = reveals.get(entry.target)
          reveals.delete(entry.target)
          setTimeout(() => reveal?.(), i * STAGGER_MS)
        })
    },
    { rootMargin: '0px 0px -8% 0px' },
  )
  return observer
}

/** Calls [onReveal] once the element first scrolls into view, while [enabled]. */
export function useReveal(ref: RefObject<Element | null>, onReveal: () => void, enabled: boolean) {
  useEffect(() => {
    const element = ref.current
    if (!enabled || !element) return
    const shared = sharedObserver()
    reveals.set(element, onReveal)
    shared.observe(element)
    return () => {
      shared.unobserve(element)
      reveals.delete(element)
    }
  }, [ref, onReveal, enabled])
}
