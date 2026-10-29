'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/app/_components/ThemeToggle'
import { Logo } from '@/components/ui/Logo'
import { openCmd, useCmdOpen } from '@/features/cmd/hooks/useCmdOpen'
import { useArchiveView } from '@/features/posts/hooks/useArchiveView'

type Props = {
  /** The newest post's page; no Latest link when there is none. */
  latestHref?: string
}

const current = (on: boolean) => (on ? 'page' : undefined)

/**
 * The floating bar at the top of every page. Index and Topics are plain links: Next keeps a
 * fragment-only change to itself, and the archive follows the browser's `hashchange`. Cmd opens
 * the palette the layout mounts beside the dock.
 */
export function Dock({ latestHref }: Props) {
  const pathname = usePathname()
  const view = useArchiveView()
  const cmdOpen = useCmdOpen()
  const home = pathname === '/'
  return (
    <header className="dock">
      <nav className="dock__bar" aria-label="사이트">
        <a className="dock__logo" href="/" aria-label="홈">
          <Logo />
        </a>
        <span className="dock__divider" aria-hidden="true" />
        <div className="dock__links">
          <a className="dock__item" href="/" aria-current={current(home && view === 'date')}>
            Index
          </a>
          <a className="dock__item" href="/#topic" aria-current={current(home && view === 'topic')}>
            Topics
          </a>
          {latestHref && (
            <Link
              className="dock__item"
              href={latestHref}
              aria-current={current(pathname === latestHref)}
            >
              Latest
            </Link>
          )}
          <button
            className="dock__item"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={cmdOpen}
            onClick={openCmd}
          >
            Cmd
          </button>
        </div>
        <ThemeToggle />
      </nav>
    </header>
  )
}
