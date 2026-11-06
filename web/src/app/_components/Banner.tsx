'use client'

import { usePathname } from 'next/navigation'
import { ASK_PANEL_ID } from '@/features/ask/components/AskPanel'
import { toggleAsk, useAskMode } from '@/features/ask/hooks/useAskMode'
import { FEED_PATH, GITHUB_URL, SITE_TITLE } from '@/lib/site'

const current = (on: boolean) => (on ? 'page' : undefined)

/** The band across the top of every page: the site's name, where to go, and where else to follow. */
export function Banner() {
  const pathname = usePathname()
  const askMode = useAskMode()
  return (
    <header className="banner">
      <div className="banner__wrapper">
        <div className="banner__title">
          <a href="/">{SITE_TITLE}</a>
        </div>
        <nav className="banner__nav" aria-label="사이트">
          <a href="/" aria-current={current(pathname === '/')}>
            Blog
          </a>
          <a href="/archives" aria-current={current(pathname === '/archives')}>
            Archives
          </a>
          <button
            type="button"
            aria-controls={ASK_PANEL_ID}
            aria-expanded={askMode === 'open'}
            onClick={toggleAsk}
          >
            Ask
          </button>
        </nav>
        <div className="banner__social">
          <a href={GITHUB_URL} title="GitHub">
            <span className="sr-only">GitHub</span>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.5.1.7-.2.7-.5v-1.7c-2.7.6-3.2-1.2-3.2-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8 0-.6.3-1.1.6-1.3-2.1-.2-4.3-1-4.3-4.7 0-1 .4-1.9 1-2.6-.1-.3-.4-1.2.1-2.5 0 0 .8-.3 2.6 1a9 9 0 0 1 4.8 0c1.8-1.3 2.6-1 2.6-1 .5 1.3.2 2.2.1 2.5.6.7 1 1.6 1 2.6 0 3.7-2.2 4.5-4.3 4.7.3.3.6.9.6 1.8v2.6c0 .3.2.6.7.5A9.5 9.5 0 0 0 12 2.5Z" />
            </svg>
          </a>
          <a href={FEED_PATH} title="RSS">
            <span className="sr-only">RSS</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M5 11a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14" />
              <circle cx="6" cy="18" r="1.2" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  )
}
