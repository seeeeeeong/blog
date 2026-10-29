'use client'

import { useEffect } from 'react'

/** Asks before the page is left while [dirty]; the admin's links are plain, so every leave asks. */
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      // Older Chrome and Safari ask only when this is set.
      event.returnValue = ''
    }
    addEventListener('beforeunload', warn)
    return () => removeEventListener('beforeunload', warn)
  }, [dirty])
}
