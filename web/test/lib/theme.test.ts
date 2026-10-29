import { describe, expect, it } from 'vitest'
import { THEME_KEY, THEME_SCRIPT, themeOf } from '@/lib/theme'

/** Runs the head script against a page whose storage holds [saved], or throws when [blocked]. */
function themeAfterScript(saved: string | null, blocked = false): string | undefined {
  const documentElement = { dataset: {} as Record<string, string> }
  const localStorage = {
    getItem: (key: string) => {
      if (blocked) throw new Error('SecurityError')
      return key === THEME_KEY ? saved : null
    },
  }
  new Function('document', 'localStorage', THEME_SCRIPT)({ documentElement }, localStorage)
  return documentElement.dataset.theme
}

describe('THEME_SCRIPT', () => {
  it('starts dark', () => {
    expect(themeAfterScript(null)).toBe('dark')
  })

  it('keeps the theme the reader chose', () => {
    expect(themeAfterScript('light')).toBe('light')
    expect(themeAfterScript('dark')).toBe('dark')
  })

  it('ignores a value it does not know, and storage it may not read', () => {
    expect(themeAfterScript('sepia')).toBe('dark')
    expect(themeAfterScript('light', true)).toBe('dark')
  })
})

describe('themeOf', () => {
  it('reads anything but light as dark', () => {
    expect(themeOf('light')).toBe('light')
    expect(themeOf('dark')).toBe('dark')
    expect(themeOf(undefined)).toBe('dark')
  })
})
