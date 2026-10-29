export type Theme = 'light' | 'dark'

export const THEME_KEY = 'theme'

/** Runs in <head> before the first paint, so a saved light theme never flashes dark first. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}document.documentElement.dataset.theme??="dark"`

export function themeOf(value: string | null | undefined): Theme {
  return value === 'light' ? 'light' : 'dark'
}

export function currentTheme(): Theme {
  return themeOf(document.documentElement.dataset.theme)
}

/** Shows [theme] now and keeps it for the next visit; a browser that refuses storage still switches. */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {}
}
