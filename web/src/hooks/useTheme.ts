'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { applyTheme, currentTheme, type Theme } from '@/lib/theme'

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

const serverTheme = (): Theme => 'dark'

/** The page's theme now, and a switch to the other. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, currentTheme, serverTheme)
  const toggle = useCallback(() => applyTheme(currentTheme() === 'dark' ? 'light' : 'dark'), [])
  return { theme, toggle }
}
