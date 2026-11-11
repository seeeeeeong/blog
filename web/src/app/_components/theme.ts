/** What the reader picked in the footer; `system` follows the operating system. */
export type Theme = 'light' | 'dark' | 'system'

const KEY = 'theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

export function storedTheme(): Theme {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

export function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {}
}

export function systemDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches
}

export function watchSystem(onChange: (dark: boolean) => void): () => void {
  const query = window.matchMedia(DARK_QUERY)
  const listener = (event: MediaQueryListEvent) => onChange(event.matches)
  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}

/** Switches the page without letting every color fade across. */
export function applyDark(dark: boolean) {
  const freeze = document.createElement('style')
  freeze.textContent = '* { transition: none !important; }'
  document.head.appendChild(freeze)
  document.documentElement.classList.toggle('dark', dark)
  window.getComputedStyle(freeze).opacity
  freeze.remove()
}

/**
 * Runs in the head before the first paint, so a dark page never flashes light. It also marks that
 * script runs, which is what lets `.animate` start hidden.
 */
export const THEME_SCRIPT = `(function(){var d=document.documentElement;try{var t=localStorage.getItem('${KEY}');d.classList.toggle('dark',t==='dark'||(t!=='light'&&matchMedia('${DARK_QUERY}').matches))}catch(e){}d.classList.add('js')})()`
