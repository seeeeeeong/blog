'use client'

import { type ReactNode, useEffect, useState } from 'react'
import {
  applyDark,
  storedTheme,
  storeTheme,
  systemDark,
  type Theme,
  watchSystem,
} from '@/app/_components/theme'

const ICON =
  'group-hover:stroke-black group-hover:dark:stroke-white transition-colors duration-300 ease-in-out'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={ICON}
    >
      {children}
    </svg>
  )
}

const BUTTONS: { theme: Theme; label: string; icon: ReactNode }[] = [
  {
    theme: 'light',
    label: 'Light theme',
    icon: (
      <>
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </>
    ),
  },
  {
    theme: 'dark',
    label: 'Dark theme',
    icon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  },
  {
    theme: 'system',
    label: 'System theme',
    icon: (
      <>
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </>
    ),
  },
]

/** Light, dark or the system's, kept in this browser. */
export function ThemeButtons() {
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => setTheme(storedTheme()), [])

  useEffect(() => {
    if (theme !== 'system') return
    return watchSystem(applyDark)
  }, [theme])

  const choose = (next: Theme) => {
    storeTheme(next)
    applyDark(next === 'system' ? systemDark() : next === 'dark')
    setTheme(next)
  }

  return (
    <fieldset className="flex flex-wrap gap-1 items-center" aria-label="Theme">
      {BUTTONS.map(({ theme: value, label, icon }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={theme === value}
          onClick={() => choose(value)}
          className="group size-8 flex items-center justify-center rounded-full"
        >
          <Icon>{icon}</Icon>
        </button>
      ))}
    </fieldset>
  )
}
